#!/bin/bash

# 检查是否有变更（包括已暂存和未暂存）
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "发现本地变更，开始自动提交..."

    # 添加所有变更
    git add .

    # 提交
    git commit -m "自动提交: $(date '+%Y-%m-%d %H:%M:%S')"

    # 贮藏未提交变更（防止 rebase 冲突）
    git stash push -m "auto-stash-before-pull"

    # 拉取最新代码并 rebase
    git pull --rebase

    # 恢复贮藏的改动（如果有）
    git stash pop

    # 推送
    git push origin $(git rev-parse --abbrev-ref HEAD)
else
    echo "No changes to commit."
fi
