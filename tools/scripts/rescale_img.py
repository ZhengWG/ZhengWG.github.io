"""
自动修改博客图片显示大小
NOTE： Not tested yet
"""
import os
import argparse
import requests
from PIL import Image
from io import BytesIO
from .utils.utils import read_lines, write_lines


def parse_arguments():
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('--input_dir', '-i', type=str, required=True)
    parser.add_argument('--output_dir', '-o', type=str, default=None)
    return parser.parse_args()


def get_md_files(input_dir):
    md_files = []
    for root, _, files in os.walk(input_dir):
        for file in files:
            if file.endswith('.md'):
                md_files.append(os.path.join(root, file))
    return md_files


def read_remote_image(image_url):
    try:
        response = requests.get(image_url)
        img = Image.open(BytesIO(response.content))
        width, height = img.size
        return width, height
    except Exception as e:
        print(f"Error reading image from {image_url}: {str(e)}")
        return None, None
    

def process(md_files, out_dir):
    for md_file in md_files:
        out_lines = []
        for line in read_lines(md_file):
            # Match image markdown syntax like ![alt](url)
            image_url = None
            if line.strip().startswith('![') and '](' in line and line.strip().endswith(')'):
                try:
                    # Extract URL between parentheses
                    url_start = line.index('](') + 2
                    url_end = line.rindex(')')
                    image_url = line[url_start:url_end].strip()
                    
                    # Skip if not a remote URL
                    if not image_url.startswith(('http://', 'https://')):
                        continue
                        
                    print(f"Found image URL: {image_url}")
                    
                except Exception as e:
                    print(f"Error parsing line '{line}': {str(e)}")
                    continue
            if image_url is not None:
                img_w, img_h = read_remote_image(image_url)
                if img_h > 1.2 * img_w:
                    # display as small img
                    line += '{: .img-small }'
                elif img_h > 0.7 * img_w:
                    # display as mid img
                    line += '{: .img-mid }'
            out_lines.append(line)
        out_name = os.path.basename(md_file)
        out_path = os.path.join(out_dir, out_name)
        write_lines(out_lines, out_path)


if __name__ == '__main__':
    args = parse_arguments()
    input_files = get_md_files(args.input_dir)
    process(input_files, args.output_dir)