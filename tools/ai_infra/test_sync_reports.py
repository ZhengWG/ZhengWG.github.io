"""Exercise publication against disposable local Git remotes."""

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from export_reports import parse_report
from sync_reports import SUCCESS_LINE, install_hook, sync


def run_git(directory, *args):
    return subprocess.run(['git', '-C', str(directory), *args], check=True,
                          capture_output=True, text=True).stdout.strip()


class SyncTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.remote = self.root / 'remote.git'
        run_git(self.root, 'init', '--bare', str(self.remote))
        self.seed = self.root / 'seed'
        run_git(self.root, 'init', str(self.seed))
        run_git(self.seed, 'config', 'user.name', 'Test')
        run_git(self.seed, 'config', 'user.email', 'test@example.com')
        (self.seed / 'page.html').write_text('Original page\n')
        run_git(self.seed, 'add', '.')
        run_git(self.seed, 'commit', '-m', 'Initial page')
        run_git(self.seed, 'push', str(self.remote), 'HEAD:refs/heads/codex/test')
        # Uncommitted UI work must never be staged or copied by the publisher.
        (self.seed / 'page.html').write_text('Uncommitted page\n')
        self.agent = self.root / 'agent'
        for child in ('config', 'pipeline', 'reports'):
            (self.agent / child).mkdir(parents=True)
        (self.agent / 'config/repos.json').write_text(json.dumps({
            'tracked': [{'repo': 'public/project', 'prs': True, 'releases': False}],
        }))
        (self.agent / 'pipeline/fetch.py').write_text("BLOG_FEEDS = [('Public', 'https://example.com/rss')]\n")
        self.report = self.agent / 'reports/2026-11-03.md'
        self.report.write_text('Daily report\n📌 Overview\n' + '\n'.join(
            f'● [Item {i}](https://example.com/{i})' for i in range(5)
        ) + '\n📰 News\nA blog entry\n')
        self.state = self.root / 'state'

    def publish(self, **kwargs):
        return sync(self.agent, self.state, str(self.remote), 'codex/test', **kwargs)

    def tip(self):
        return run_git(self.remote, 'rev-parse', 'refs/heads/codex/test')

    def test_publish_is_data_only_and_idempotent(self):
        before = self.tip()
        self.assertTrue(self.publish(report_date='2026-11-03'))
        after = self.tip()
        self.assertNotEqual(before, after)
        paths = run_git(self.remote, 'diff-tree', '--no-commit-id', '--name-only', '-r', after).splitlines()
        self.assertTrue(paths)
        self.assertTrue(all(p.startswith('assets/data/ai_infra/') for p in paths))
        self.assertEqual((self.seed / 'page.html').read_text(), 'Uncommitted page\n')
        self.assertFalse(self.publish(report_date='2026-11-03'))
        self.assertEqual(self.tip(), after)
        data = json.loads(run_git(self.remote, 'show', after + ':assets/data/ai_infra/2026-11-03.json'))
        self.assertEqual(data['sections'][-1]['id'], 'blogs')

    def test_partial_report_never_changes_remote(self):
        self.publish()
        before = self.tip()
        self.report.write_text(self.report.read_text() + '\n📌 ⚠️ 本期为**未完成报告**\n')
        with self.assertRaisesRegex(ValueError, 'Incomplete'):
            self.publish()
        self.assertEqual(self.tip(), before)

    def test_old_incomplete_report_does_not_block_recovery(self):
        (self.agent / 'reports/2026-11-02.md').write_text('An interrupted report\n（生成中…）\n')
        (self.agent / 'reports/2026-11-01.md').write_text(self.report.read_text())
        self.assertTrue(self.publish(report_date='2026-11-03', limit=2))
        manifest = json.loads(run_git(self.remote, 'show', self.tip() + ':assets/data/ai_infra/index.json'))
        self.assertEqual([r['date'] for r in manifest['reports']], ['2026-11-03', '2026-11-01'])

    def test_failed_push_can_be_retried(self):
        hook = self.remote / 'hooks/pre-receive'
        hook.write_text('#!/bin/sh\nexit 1\n')
        hook.chmod(0o755)
        before = self.tip()
        with self.assertRaisesRegex(RuntimeError, 'push failed'):
            self.publish()
        self.assertEqual(self.tip(), before)
        hook.unlink()
        self.assertTrue(self.publish())
        self.assertFalse(self.publish())

    def test_concurrent_remote_edit_survives_retry(self):
        original_tip = self.tip()
        # Move the branch just before the first receive, forcing a non-FF retry.
        hook = self.remote / 'hooks/pre-receive'
        tree = run_git(self.remote, 'rev-parse', original_tip + '^{tree}')
        concurrent = subprocess.run(
            ['git', '-c', 'user.name=Test', '-c', 'user.email=test@example.com',
             '-C', str(self.remote), 'commit-tree', tree, '-p', original_tip, '-m', 'Concurrent change'],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        hook.write_text('#!/bin/sh\nunset GIT_QUARANTINE_PATH GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES\n' +
                        f'git update-ref refs/heads/codex/test {concurrent}\n' +
                        'rm -- "$0"\nexit 1\n')
        hook.chmod(0o755)
        self.assertTrue(self.publish())
        self.assertEqual(run_git(self.remote, 'rev-parse', self.tip() + '^'), concurrent)

    def test_never_overwrites_newer_remote_data(self):
        self.publish()
        previous = self.tip()
        self.report.rename(self.agent / 'reports/2026-11-02.md')
        with self.assertRaisesRegex(ValueError, 'newer remote report'):
            self.publish()
        self.assertEqual(self.tip(), previous)

    def test_rejects_unowned_checkout(self):
        checkout = self.state / 'checkout'
        checkout.mkdir(parents=True)
        run_git(checkout, 'init')
        with self.assertRaisesRegex(RuntimeError, 'not created by'):
            self.publish()

    @unittest.skipUnless(Path('/bin/zsh').is_file(), 'The launchd hook requires macOS zsh')
    def test_install_hook_is_idempotent_and_only_in_success_branch(self):
        runner = self.agent / 'run.sh'
        runner.write_text('#!/bin/zsh\nif true; then\n' + SUCCESS_LINE +
                          '\nelse\n  echo "Fallback"\nfi\n')
        runner.chmod(0o755)
        install_hook(self.agent, self.state, str(self.remote), 'codex/test')
        content = runner.read_text()
        self.assertEqual(content.count('BEGIN AI INFRA WEBSITE SYNC'), 1)
        self.assertIn('--report-date "$TODAY"', content.split('\nelse\n')[0])
        self.assertIn('if ! ', content)
        install_hook(self.agent, self.state, str(self.remote), 'codex/test')
        self.assertEqual(content, runner.read_text())
        self.assertEqual(runner.stat().st_mode & 0o777, 0o755)

    def test_rejects_unknown_runner_without_edit(self):
        runner = self.agent / 'run.sh'
        runner.write_text('echo changed-runner\n')
        with self.assertRaisesRegex(ValueError, 'no changes made'):
            install_hook(self.agent, self.state, str(self.remote), 'codex/test')
        self.assertEqual(runner.read_text(), 'echo changed-runner\n')

    def test_placeholder_is_rejected(self):
        with self.assertRaises(ValueError):
            parse_report(self.report.read_text() + '\n（生成中…）', '2026-11-03')


if __name__ == '__main__':
    unittest.main()
