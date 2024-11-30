#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''
@author:    Wengang.Zheng
@email:     zwg0606@gmail.com
@fielName:  upload_img.py
@Time:      2021-07-01-22:57:45
@Des:
'''
import os
import re
import shutil
import argparse
import logging
from urllib.parse import quote
from git import Repo
from .utils.utils import read_lines


# 图片仓
# FIXME: Replaced by cloud

REMOTE_URL = 'https://github.com/ZhengWG/Imgs_blog/raw/master/'
CDN_URL = 'https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/'
IMAGE_FORMATS = ['jpg', 'png', 'jpeg', 'gif']


def build_logger():
    logger = logging.getLogger(__file__)
    # Create handlers
    c_handler = logging.StreamHandler()
    c_handler.setLevel(logging.WARNING)
    # Create formatters and add it to handlers
    c_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    c_handler.setFormatter(c_format)
    # Add handlers to the logger
    logger.addHandler(c_handler)
    return logger


class ImageUploader():
    def __init__(self, input_file, local_rep, image_format=None):
        self.input_file = input_file
        self.matched_lines = list()
        self.added_images = list()
        self.local_rep = local_rep
        input_name = os.path.splitext(
            os.path.basename(input_file))[0]
        input_name = ImageUploader.url_transfer(input_name)
        self.local_dir = os.path.join(local_rep, input_name)
        self.repo = Repo(local_rep)
        self.local_image_format = r'\(\/.*\w*gi?f?\)' if image_format is None \
            else image_format
        os.makedirs(self.local_dir, exist_ok=True)

    def _add(self, local_path):
        # copy local img to local rep dir
        local_name = os.path.basename(local_path)
        rep_path = os.path.join(self.local_dir, local_name)
        if os.path.exists(rep_path):
            logger.warning("{} exited, skiped!".format(rep_path))
            return rep_path
        shutil.copy(local_path, rep_path)
        return rep_path

    def _upload(self, remote_rep):
        if remote_rep[-1] == '/':
            remote_rep = remote_rep[:-1]
        # upload to remote rep using git
        if self.repo.untracked_files:
            index = self.repo.index
            index.add(['*'])
            upload_filename = os.path.basename(self.local_dir)
            mes_commit = 'add imgs for {}'.format(upload_filename)
            index.commit(mes_commit)
            remote = self.repo.remote()
            remote.push()
        assert len(self.repo.untracked_files) == 0, 'Upload imgs failed!'

        out_data = dict()
        # get remote url for every image
        for line_data in self.matched_lines:
            # get remote url for single image
            rep_path = line_data['rep_path']
            relative_path = rep_path.replace(self.local_rep, '', 1)
            remote_url = remote_rep + relative_path
            remote_url = ImageUploader.url_transfer(remote_url)
            # FIXME: Need to be restruncted
            remote_url = remote_url.replace(remote_rep, CDN_URL)
            ori_path = line_data['ori_path']
            ori_data = line_data['ori_data']
            rem_data = ori_data.replace(ori_path, remote_url, 1)
            line_data['out_data'] = rem_data
            out_data[line_data['ori_idx']] = rem_data
        return out_data

    def process(self, remote_rep, pattern):
        for idx, line in enumerate(read_lines(self.input_file)):
            if re.search(pattern, line, flags=re.I):
                image_path = self.get_image_path(line, )
                rep_path = self._add(image_path)
                line_data = {
                    'ori_idx': idx,
                    'ori_data': line,
                    'ori_path': image_path,
                    'rep_path': rep_path
                }
                self.matched_lines.append(line_data)

        # upload images to remote_url
        out_data = self._upload(remote_rep)
        return out_data

    def get_image_path(self, line):
        try:
            match_line = re.search(self.local_image_format, line).group()
        except Exception as e:
            raise ValueError("{}:{}".format(e, line))
        return match_line[1:-1]

    @staticmethod
    def url_transfer(url):
        return quote(url, safe=";/?:@&=+$,", encoding='utf-8')


def parse_arguments():
    parser = argparse.ArgumentParser(description='upload img to remote repo')
    parser.add_argument('--input', '-i', type=str, required=True, help='Input file for uploading img')
    parser.add_argument('--output', '-o', type=str, default=None, help='Output file for uploading img')
    parser.add_argument('--local_repo', '-l', type=str, default=None, help='Output file for uploading img')
    return parser.parse_args()


def main(args):
    pattern_list = ["\[.*\].*\.{}".format(fo) for fo in IMAGE_FORMATS]
    pattern = r""
    for p in pattern_list:
        pattern = pattern + p + '|'
    pattern = pattern[:-1]
    image_uploader = ImageUploader(args.input, local_rep=args.local_repo)
    match_lines = image_uploader.process(remote_rep=REMOTE_URL, pattern=pattern)

    with open(args.output, 'w') as f:
        for idx, line in enumerate(read_lines(args.input)):
            line = match_lines.get(idx, line)
            f.write("{}".format(line))


if __name__ == '__main__':
    args = parse_arguments()
    logger = build_logger()
    if args.output is None:
        input_dir = os.path.dirname(args.input)
        file_name = os.path.basename(args.input)
        args.output = os.path.join(input_dir, 'refined', file_name)
        os.makedirs(os.path.dirname(args.output), exist_ok=True)

    main(args)
