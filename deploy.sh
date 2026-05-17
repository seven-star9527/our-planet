#!/bin/bash
set -e

echo "🚀 开始部署 Our Planet..."

cd ~/our-planet

# 拉取最新代码
echo "📦 拉取最新代码..."
git pull origin main

# 重新构建
echo "🔨 重新构建 Docker 镜像..."
docker compose build --no-cache web

# 重启服务
echo "🔄 重启服务..."
docker compose up -d

# 等待启动
sleep 10

# 查看状态
echo "📊 服务状态："
docker compose ps

# 查看最新日志
echo "📋 最新日志："
docker compose logs --tail=30 web

echo "✅ 部署完成！"
