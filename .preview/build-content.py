from pathlib import Path
import json
import re
from urllib.parse import quote

import markdown
import yaml

root = Path(__file__).resolve().parent.parent
output = root / '.preview/lab/content'
output.mkdir(exist_ok=True)
posts = []
for path in sorted(path for path in (root / '_posts').iterdir() if path.suffix in {'.md', '.markdown'}):
    source = path.read_text()
    parts = source.split('---', 2)
    if len(parts) < 3:
        continue
    meta = yaml.safe_load(parts[1])
    if meta.get('published') is False:
        continue
    slug = re.sub(r'^\d{4}-\d{1,2}-\d{1,2}-', '', path.stem)
    date = str(meta.get('date') or path.name[:10])[:10]
    def terms(value):
        return [str(item) for item in value] if isinstance(value, list) else str(value or '').split()
    post = {
        'slug': slug,
        'title': str(meta.get('title') or slug),
        'date': date,
        'description': str(meta.get('description') or ''),
        'tags': terms(meta.get('tags')),
        'categories': terms(meta.get('categories')),
        'math': bool(meta.get('mathjax')),
        'image': meta.get('image'),
        'language': 'zh-Hans' if re.search('[\u4e00-\u9fff]', parts[2]) else 'en',
    }
    body = re.sub(r'{%\s*post_url\s+(.*?)\s*%}', lambda m: '?page=article&post=' + quote(re.sub(r'^\d{4}-\d{1,2}-\d{1,2}-', '', m[1].strip()), safe=''), parts[2])
    body = body.replace('{% raw %}', '').replace('{% endraw %}', '')
    renderer = markdown.Markdown(extensions=['extra', 'toc'], extension_configs={'toc': {'permalink': False}})
    post_body = renderer.convert(body)
    post_body = post_body.replace('src="/assets/', 'src="assets/').replace('href="/assets/', 'href="assets/')
    filename = f'{len(posts):03d}.json'
    (output / filename).write_text(json.dumps({'html': post_body, 'toc': renderer.toc}, ensure_ascii=False))
    post['file'] = filename
    posts.append(post)
posts.sort(key=lambda p: p['date'], reverse=True)
(output / 'index.json').write_text(json.dumps(posts, ensure_ascii=False))
assets = root / '.preview/lab/assets'
if not assets.exists():
    assets.symlink_to(root / 'assets', target_is_directory=True)
print(f'Prepared {len(posts)} original articles for the local preview.')
print('Categories:', sorted({term for p in posts for term in p['categories']}))
print('Tags:', sorted({term for p in posts for term in p['tags']}))
