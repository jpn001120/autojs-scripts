#!/bin/bash

# 检查并添加所有文件
git add .

# 提交修改，使用当前时间作为提交消息
git commit -m "自动提交: $(date '+%Y-%m-%d %H:%M:%S')"

# 拉取最新并变基整合
git pull --rebase

# 推送到当前分支
git push origin $(git rev-parse --abbrev-ref HEAD)
