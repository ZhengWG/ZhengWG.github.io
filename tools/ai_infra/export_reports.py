"""Export public daily reports and source configuration for the static tracker."""

import argparse
import ast
import json
import re
from pathlib import Path

SECTIONS = {
    '📌': ('overview', '今日速览', 'Overview'),
    '⚡': ('highlights', '今日要点', 'Highlights'),
    '🔧': ('prs', 'GitHub PR 动态', 'GitHub pull requests'),
    '🚀': ('releases', '版本发布', 'Releases'),
    '📄': ('papers', '论文', 'Papers'),
    '📝': ('blogs', '技术博客', 'Engineering blogs'),
    '📰': ('blogs', '技术博客', 'Engineering blogs'),
    '💬': ('community', '社区讨论', 'Community'),
    '🆕': ('discovery', '新兴方向', 'Emerging directions'),
    '⭐': ('insights', '跨源洞察', 'Cross-source insights'),
}


def parse_report(source, date):
    sections = []
    current = None
    for line in source.splitlines()[1:]:
        heading = line.lstrip('# ').strip()
        match = next((value for icon, value in SECTIONS.items() if heading.startswith(icon)), None)
        if match and len(heading) < 85:
            current = {'id': match[0], 'title': {'zh': match[1], 'en': match[2]}, 'blocks': []}
            sections.append(current)
        elif current:
            if not line.strip():
                continue
            text = re.sub(r'^(?:[●•]|[-*]\s|\d+[.)])\s*', '', line.strip())
            if line[:1].isspace() and current['blocks']:
                current['blocks'][-1] += '\n' + text
            else:
                current['blocks'].append(text)
    if (not sections or len(re.findall(r'\]\(https?://', source)) < 5
            or any(marker in source for marker in ('生成中…', '未完成报告', '降级报告'))):
        raise ValueError(f'Incomplete report: {date}')
    return {'date': date, 'language': 'zh-Hans', 'sections': sections}


def export(agent_dir, output, limit):
    config = json.loads((agent_dir / 'config/repos.json').read_text())
    repos = [{'repo': r['repo'], 'prs': bool(r.get('prs')), 'releases': bool(r.get('releases'))}
             for r in config['tracked'] if re.fullmatch(r'[\w.-]+/[\w.-]+', r['repo'])]
    tree = ast.parse((agent_dir / 'pipeline/fetch.py').read_text())
    feeds = []
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'BLOG_FEEDS' for t in node.targets):
            feeds = [{'name': name, 'url': url} for name, url in ast.literal_eval(node.value)]
    files = sorted((p for p in (agent_dir / 'reports').glob('*.md')
                    if re.fullmatch(r'\d{4}-\d{2}-\d{2}', p.stem)), reverse=True)[:limit]
    if not files:
        raise ValueError('No dated reports found')
    reports = [parse_report(p.read_text(), p.stem) for p in files]
    manifest = {'schema_version': 1, 'latest': reports[0]['date'], 'language': 'zh-Hans',
                'reports': [{'date': r['date'], 'file': r['date'] + '.json',
                             'items': sum(len(s['blocks']) for s in r['sections'])} for r in reports],
                'repos': repos, 'feeds': feeds}
    output.mkdir(parents=True, exist_ok=True)
    for name, data in [*((r['date'], r) for r in reports), ('index', manifest)]:
        target = output / (name + '.json')
        temporary = target.with_suffix('.tmp')
        temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        temporary.replace(target)
    print(f"Exported {len(reports)} reports through {manifest['latest']}, {len(repos)} repositories and {len(feeds)} feeds.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--agent-dir', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('assets/data/ai_infra'))
    parser.add_argument('--limit', type=int, default=14)
    args = parser.parse_args()
    if args.limit < 1:
        parser.error('--limit must be positive')
    export(args.agent_dir, args.output, args.limit)
