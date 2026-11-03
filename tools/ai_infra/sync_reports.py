"""Publish AI Infra report data using a dedicated checkout and explicit branch."""

import argparse
import fcntl
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from export_reports import export, parse_report

DATA_PATH = 'assets/data/ai_infra'
HOOK_START = '    # BEGIN AI INFRA WEBSITE SYNC'
HOOK_END = '    # END AI INFRA WEBSITE SYNC'
SUCCESS_LINE = '    echo "L1 正常完成（邮件由 claude 自己发出）"'


def git(checkout, *args):
    env = dict(os.environ, GIT_TERMINAL_PROMPT='0')
    env.setdefault('GIT_SSH_COMMAND', 'ssh -o BatchMode=yes -o ConnectTimeout=20')
    result = subprocess.run(
        ['git', '-C', str(checkout), *args], capture_output=True, text=True,
        timeout=180, env=env, check=False,
    )
    if result.returncode:
        raise RuntimeError(f"git {args[0]} failed: {result.stderr.strip()}")
    return result.stdout.strip()


def sync(agent_dir, state_dir, remote, branch, report_date=None, limit=14):
    git(agent_dir, 'check-ref-format', '--branch', branch)
    if report_date:
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', report_date):
            raise ValueError('Report date must be YYYY-MM-DD')
        parse_report((agent_dir / 'reports' / f'{report_date}.md').read_text(), report_date)

    state_dir.mkdir(parents=True, exist_ok=True)
    with (state_dir / 'sync.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError('Another report sync is running') from None

        # Validate all data before creating a checkout or contacting the remote.
        with tempfile.TemporaryDirectory(prefix='ai-infra-export-') as temporary:
            snapshot = Path(temporary)
            export(agent_dir, snapshot, limit)
            latest = json.loads((snapshot / 'index.json').read_text())['latest']
            if report_date and latest != report_date:
                raise ValueError(f'Expected report {report_date}; latest is {latest}')

            checkout = state_dir / 'checkout'
            if not checkout.exists():
                # Initialize first so a failed fetch can be retried in place.
                git(state_dir, 'init', str(checkout))
                git(checkout, 'remote', 'add', 'origin', remote)
                (checkout / '.git' / 'ai-infra-sync').write_text('Dedicated AI Infra data checkout\n')
            if not (checkout / '.git' / 'ai-infra-sync').is_file():
                raise RuntimeError('Refusing to use a checkout not created by AI Infra sync')
            if git(checkout, 'remote', 'get-url', 'origin') != remote:
                raise RuntimeError('Dedicated checkout remote differs from configured remote')
            if git(checkout, 'status', '--porcelain', '--untracked-files=all'):
                raise RuntimeError(f'Dedicated checkout has uncommitted changes: {checkout}')

            # A rejected push is retried on the new remote tip, never force-pushed.
            for attempt in range(3):
                git(checkout, 'fetch', '--no-tags', 'origin', f'refs/heads/{branch}')
                git(checkout, 'checkout', '--detach', 'FETCH_HEAD')
                output = checkout / DATA_PATH
                current_index = output / 'index.json'
                if current_index.exists():
                    previous = json.loads(current_index.read_text())['latest']
                    if previous > latest:
                        raise ValueError(f'Refusing to replace newer remote report {previous} with {latest}')
                output.mkdir(parents=True, exist_ok=True)
                expected = {p.name for p in snapshot.glob('*.json')}
                for target in output.glob('*.json'):
                    if re.fullmatch(r'\d{4}-\d{2}-\d{2}\.json', target.name) and target.name not in expected:
                        target.unlink()
                for source in snapshot.glob('*.json'):
                    shutil.copyfile(source, output / source.name)
                git(checkout, 'add', '--', DATA_PATH)
                if not git(checkout, 'diff', '--cached', '--name-only'):
                    print(f'No report changes through {latest}; nothing to push.')
                    return False
                git(checkout, '-c', 'user.name=AI Infra Sync', '-c',
                    'user.email=ai-infra-sync@users.noreply.github.com',
                    'commit', '-m', f'chore: sync AI infra reports {latest}', '--', DATA_PATH)
                try:
                    git(checkout, 'push', 'origin', f'HEAD:refs/heads/{branch}')
                except RuntimeError:
                    if attempt == 2:
                        raise
                    print(f'Push failed; retrying against remote tip ({attempt + 1}/2).', flush=True)
                    continue
                print(f'Published reports through {latest} to {branch}.')
                return True


def install_hook(agent_dir, state_dir, remote, branch):
    runner = agent_dir / 'run.sh'
    source = runner.read_text()
    if source.count(SUCCESS_LINE) != 1:
        raise ValueError('Expected exactly one L1 success branch in run.sh; no changes made')
    command = shlex.join([
        sys.executable, str(Path(__file__).resolve()), '--agent-dir', str(agent_dir),
        '--state-dir', str(state_dir), '--remote', remote, '--branch', branch,
    ])
    block = '\n'.join([
        HOOK_START,
        f'    if ! {command} --report-date "$TODAY"; then',
        '      echo "AI Infra website sync FAILED; rerun sync_reports.py to retry."',
        '    fi',
        HOOK_END,
    ])
    if HOOK_START in source:
        pattern = re.escape(HOOK_START) + r'.*?' + re.escape(HOOK_END)
        updated, count = re.subn(pattern, lambda _: block, source, flags=re.DOTALL)
        if count != 1:
            raise ValueError('Expected exactly one existing sync hook; no changes made')
    else:
        updated = source.replace(SUCCESS_LINE, SUCCESS_LINE + '\n' + block)
    if updated == source:
        print('Website sync hook is already installed.')
        return
    subprocess.run(['/bin/zsh', '-n'], input=updated, text=True, check=True)
    runner.write_text(updated)
    print(f'Installed website sync hook in {runner}, targeting {branch}.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--agent-dir', type=Path, required=True)
    parser.add_argument('--state-dir', type=Path, required=True)
    parser.add_argument('--remote', required=True)
    parser.add_argument('--branch', required=True)
    parser.add_argument('--report-date')
    parser.add_argument('--limit', type=int, default=14)
    parser.add_argument('--install-hook', action='store_true')
    args = parser.parse_args()
    if args.limit < 1:
        parser.error('--limit must be positive')
    args.agent_dir = args.agent_dir.expanduser().resolve()
    args.state_dir = args.state_dir.expanduser().resolve()
    try:
        if args.install_hook:
            install_hook(args.agent_dir, args.state_dir, args.remote, args.branch)
        else:
            sync(args.agent_dir, args.state_dir, args.remote, args.branch, args.report_date, args.limit)
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        print(f'AI Infra sync failed: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
