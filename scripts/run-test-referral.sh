#!/bin/bash

# 安装 tsx 如果还没有安装
if ! command -v tsx &> /dev/null; then
    echo "📦 安装 tsx..."
    npm install -g tsx
fi

# 获取目标地址参数
TARGET_ADDRESS=$1

echo "🚀 运行推荐树测试脚本..."
echo ""

# 如果提供了地址参数，使用该地址；否则提示输入
if [ -z "$TARGET_ADDRESS" ]; then
    echo "请输入目标地址（或按回车使用默认地址）:"
    read TARGET_ADDRESS
fi

# 运行脚本
if [ -z "$TARGET_ADDRESS" ]; then
    tsx scripts/test-referral-tree.ts
else
    tsx scripts/test-referral-tree.ts "$TARGET_ADDRESS"
fi