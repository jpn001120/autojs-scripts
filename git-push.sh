#!/bin/bash

# 先判断是否有变更
if ! git diff-index --quiet HEAD --; then
    git add .
    git commit -m "自动提交: $(date '+%Y-%m-%d %H:%M:%S')"
    git pull --rebase
    git push origin $(git rev-parse --abbrev-ref HEAD)
else
    echo "No changes to commit."
fi
