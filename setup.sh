#!/bin/bash

if [ ! -f ".env.local" ]; then
    echo "创建 .env.local 文件中..."
    cp .env.dev .env.local
    echo "创建成功"
else
    echo ".env.local 文件已存在"
fi