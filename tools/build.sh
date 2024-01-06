#!/usr/bin/env bash
#
# 基于_drafts下的文章build为正式发布文章_posts

set -eu
set -x

input_dir='_drafts'
post_dir='_posts'
cache_dir='_drafts/tmp'
mkdir -p $cache_dir
# 远程图片库
remote_url='https://github.com/ZhengWG/Imgs_blog/raw/master/'
# 本地图片库
local_repo='/Users/zhengwengang/Project/projects/blog/Imgs_blog'

use_math_jax='False'

while getopts ":m" opt
do
  echo "opt: "${opt}
  case ${opt} in
    m )
      use_math_jax='True'
      echo "use math, NOTE: need to set mathjax to true!!!"
      ;;
    : )
      use_math_jax='False'
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      ;;
  esac
done

# 修改文件名
function rename() {
  title=`cat $local_file | grep 'title' | head -n1 | sed 's#title: ##' | sed 's# #_#'`
  echo 'title: '$title
  time=`cat $local_file | grep 'date' | head -n1 | sed 's#date: ##' | sed 's# [0-9][0-9]:.*##'`
  echo 'time: '$time
  out_name=${time}-${title}.md
  out_path=${input_dir}/${out_name}

  if [ "$local_file" != "$out_path" ];
  then
    cp $local_file $out_path
    mv $local_file ${cache_dir}
    local_file=$out_path
  fi
}

# Table of Contents -> 目录
function fix_format() {
  sed -i '.tmp.back' 's#Table of Contents#目录#' $local_file
  sed -i '.tmp.back' 's#<sub>#_#g' $local_file
  sed -i '.tmp.back' 's#</sub>##g' $local_file
  sed -i '.tmp.back' 's#<sup>#^#g' $local_file
  sed -i '.tmp.back' 's#</sup>##g' $local_file
  mv ${local_file}.tmp.back $cache_dir
}

# fix mathjax
function fix_mathjax_format() {
  sed -i '.tmp.back' 's#\\(#$#g' $local_file
  sed -i '.tmp.back' 's#\\)#$#g' $local_file
  sed -i '.tmp.back' 's#\*#\\*#g' $local_file
  # sed -i '.tmp.back' 's#\\*\\*#\*\*#g' $local_file
  mv ${local_file}.tmp.back $cache_dir
}

# 上传本地图片到远程，并修改图片路径为远程路径
function upload_img() {
  chmod a+x tools/scripts/upload_img.py
  tools/scripts/upload_img.py -i $local_file -l $local_repo
}

# clean _drafs dir
function clean() {
  # 复制修改好的文件到发布目录
  refined_dir=${input_dir}/refined
  if [ -d $refined_dir ];
  then
    mv ${refined_dir}/* ${post_dir}
  fi
  # 删除_drafts文件夹下的文件
  rm -rf ${input_dir}/*
}

for f in `ls $input_dir | grep -E ".md$|.markdown$"`;
do
  local_file=${input_dir}/${f}
  if [ $use_math_jax == 'True' ];
  then
    fix_mathjax_format
  fi
  fix_format
  rename
  upload_img
done
clean
