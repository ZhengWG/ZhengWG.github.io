"""Verify generated article routes and tool data that HTML link checks cannot see."""

import argparse
import json
from pathlib import Path
from urllib.parse import unquote


def check(destination):
    posts = json.loads((destination / 'assets/data/posts.json').read_text())
    if not posts or len({post['url'] for post in posts}) != len(posts):
        raise ValueError('Missing article index or duplicate article URLs')
    for post in posts:
        page = destination / unquote(post['url']).lstrip('/') / 'index.html'
        html = page.read_text()
        if 'data-native-post=' not in html or 'data-post-body' not in html:
            raise ValueError(f'Article body missing from generated HTML: {page}')
        if 'name="robots" content="noindex' in html:
            raise ValueError(f'Article is not indexable: {page}')
        image = post.get('image')
        if (isinstance(image, dict) and image.get('src', '').startswith('/')
                and not (destination / unquote(image['src']).lstrip('/')).is_file()):
            raise ValueError(f'Missing article cover: {image["src"]}')
    for route in ('research', 'projects', 'experiments', 'writing', 'about', 'tags', 'categories', 'archives', 'tool'):
        if not (destination / route / 'index.html').is_file():
            raise ValueError(f'Missing route: {route}')
    data_dir = destination / 'assets/data/ai_infra'
    manifest = json.loads((data_dir / 'index.json').read_text())
    for record in manifest['reports']:
        report = json.loads((data_dir / record['file']).read_text())
        if report['date'] != record['date'] or not report['sections']:
            raise ValueError(f'Invalid report: {record["file"]}')
    json.loads((destination / 'assets/data/house_price/hz.json').read_text())
    for asset in ('assets/js/site.js', 'assets/js/site-i18n.js', 'assets/css/lab.css'):
        if not (destination / asset).is_file():
            raise ValueError(f'Missing production asset: {asset}')
    home = (destination / 'index.html').read_text()
    if 'preview-badge' in home or 'UI Preview' in home or 'noindex,nofollow' in home:
        raise ValueError('Preview metadata remains in production HTML')
    print(f'Validated {len(posts)} native article pages, public routes, covers and {len(manifest["reports"])} reports.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path, nargs='?', default=Path('_site'))
    check(parser.parse_args().destination)
