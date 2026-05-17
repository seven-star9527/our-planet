# 🪐 我们的专属星球

> 一对情侣的私密数字空间 —— 记录恋爱点滴，AI 助力回忆。

## 项目简介

"我们的专属星球"是一款专为情侣设计的私密陪伴型 Web 应用。它集时光记录、恋爱清单、足迹地图、生理期关怀、好感度追踪和 AI 聊天助手于一体，帮助情侣记录和回顾共同的美好时光。

核心特色是内置的 **AI 恋爱助手"小七同学"**，基于 RAG（检索增强生成）技术，能够检索你们的聊天记录来回答关于过去的问题，比如"我们第一次约会去了哪里？"。

## 功能总览

### 💬 小七同学 — AI 恋爱助手
- 基于 DeepSeek 大模型的智能对话
- RAG 检索增强：自动检索历史聊天记录，回答关于过去的事实问题
- 意图识别：自动区分事实查询、情感支持、建议请求和日常聊天
- 查询扩展 + 混合检索（向量搜索 + 关键词搜索）+ AI 重排序
- 生理期感知：隐式感知女友身体状态，给出贴心回应
- 支持手动补充记忆（知识库录入）

### 🎆 开屏欢迎动画
- 多种动画模板可选：烟花、蛋糕、花朵、爱心、星星、气球、流星
- 支持自定义背景图片/视频
- 可配置倒计时进入或点击进入

### 🏠 主页
- 在一起天数计时
- 记忆盲盒：随机回忆过去的帖子
- 快捷功能入口：时光手账、恋爱清单、纪念日、足迹地图等
- 留言板弹幕
- 近期快照滚动展示

### 📒 时光手账
- 图文日记，每篇支持最多 3 张图片和视频
- 标签分类与筛选
- 点赞（表情反应）和评论互动
- 全屏图片预览

### ✅ 恋爱清单
- 情侣愿望清单（TODO / DOING / DONE）
- 完成后可关联创建纪念帖子

### 📅 纪念日
- 正计时 / 倒计时
- 重要日期管理与提醒

### 🗺️ 我们的足迹
- ECharts 中国地图展示已打卡城市
- Leaflet 街道级详细地图
- 城市数据库含 70+ 中国城市
- 打卡历史时间线

### 🌸 呵护日历
- 生理期追踪与预测（月经期 / 卵泡期 / 排卵期 / 黄体期）
- 当前阶段描述与关怀建议
- 支持仅女友可见的隐私设置

### ❤️ 好感度与亲密度
- 双向评分系统（0-100）
- 好感度 + 亲密度两个维度
- SVG 圆环可视化
- 带事由的分数变更日志

### 📝 留言板
- 主页浮动弹幕留言
- 可自定义颜色、字体大小、动画效果和持续时间

### ⚙️ 设置
- 情侣昵称自定义
- 纪念日日期
- 主页背景图片（透明度、深色叠加、适应模式）
- 开屏动画配置
- 深色模式（规划中）

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js 16 (App Router) | React 19, TypeScript |
| 样式 | Tailwind CSS v4 | 原子化 CSS |
| 数据库 | PostgreSQL + pgvector | 向量存储支持 |
| ORM | Prisma 6 | 数据库迁移与查询 |
| AI 对话 | DeepSeek API (`deepseek-chat`) | 对话生成、查询扩展、重排序 |
| AI 嵌入 | 智谱 AI (`embedding-2`) | 文本向量化（1536 维） |
| 地图 | ECharts + Leaflet | 中国地图 + 街道地图 |
| 云存储 | 腾讯云 COS | 图片/视频上传（可选，支持本地回退） |
| 容器化 | Docker + docker-compose | 生产环境部署 |
| 反向代理 | Nginx (Docker 容器) | SSL 终止、HTTPS 支持 |

## 项目结构

```
our-planet/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── api/chat/           # AI 聊天 API 端点
│   │   ├── api/upload/         # 文件上传 API
│   │   ├── chat/               # 小七同学聊天页
│   │   ├── knowledge/          # AI 知识库管理
│   │   ├── moments/            # 时光手账
│   │   ├── bucket-list/        # 恋爱清单
│   │   ├── milestones/         # 纪念日
│   │   ├── footprint/          # 足迹地图
│   │   ├── period/             # 呵护日历
│   │   ├── affinity/           # 好感度与亲密度
│   │   ├── messages/           # 留言板
│   │   ├── settings/           # 设置
│   │   ├── welcome/            # 开屏动画
│   │   ├── login/              # 登录/角色选择
│   │   └── page.tsx            # 主页
│   ├── actions/                # Next.js Server Actions
│   ├── lib/                    # 工具库
│   │   ├── ai.ts               # AI 模型封装（DeepSeek + 智谱）
│   │   └── prisma.ts           # Prisma 客户端
│   └── middleware.ts            # 认证中间件
├── prisma/
│   ├── schema.prisma           # 数据库模型定义
│   ├── .env                    # 环境变量（API Key 等，不入 Git）
│   └── migrations/             # 数据库迁移文件
├── scripts/
│   └── ingest-chat.ts          # 微信聊天记录导入脚本
├── public/                     # 静态资源
├── certs/                      # SSL 证书（服务器端，不入 Git）
├── nginx.conf                  # Nginx 反向代理配置
├── docker-compose.yml          # Docker 编排（db + web + nginx）
├── Dockerfile                  # 生产环境镜像
├── deploy.sh                   # 一键部署脚本
└── package.json
```

## 快速开始

### 环境要求

- Node.js 20+
- PostgreSQL 数据库（推荐使用 Docker 中的 pgvector 镜像）
- DeepSeek API Key
- 智谱 AI API Key

### 本地开发

```bash
# 1. 克隆项目
git clone <repo-url>
cd our-planet

# 2. 安装依赖
npm install

# 3. 配置环境变量
# 在 prisma/.env 文件中设置（注意：值不要加双引号）：
#   DATABASE_URL=postgresql://...
#   DEEPSEEK_API_KEY=sk-...
#   DEEPSEEK_BASE_URL=https://api.deepseek.com
#   ZHIPU_API_KEY=...
#   (可选) 腾讯云 COS 相关配置

# 4. 初始化数据库
npx prisma db push

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 导入微信聊天记录

```bash
# 1. 使用 WeFlow 工具导出微信聊天记录 JSON
# 2. 将 JSON 文件放入 scripts/ 目录
# 3. 修改 scripts/ingest-chat.ts 中的 CONFIG.jsonFile 为你的文件名
# 4. 运行导入脚本
npx tsx scripts/ingest-chat.ts
```

---

## 服务器部署指南（腾讯云 Ubuntu）

### 首次部署

#### 1. 服务器环境准备

```bash
# SSH 登录服务器
ssh ubuntu@<你的服务器IP>

# 安装 Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# 退出重新登录使权限生效
```

#### 2. 克隆项目并配置

```bash
cd ~
git clone https://github.com/seven-star9527/our-planet.git
cd our-planet
```

#### 3. 创建必需的环境配置文件

**根目录 `.env`**（供 docker-compose 读取数据库密码）：

```bash
cat > .env << 'EOF'
POSTGRES_USER=admin
POSTGRES_PASSWORD=wzhpxy2026
POSTGRES_DB=our_planet
EOF
```

**`prisma/.env`**（API Key 等，注意值不要加双引号）：

```bash
cat > prisma/.env << 'EOF'
POSTGRES_USER=admin
POSTGRES_PASSWORD=wzhpxy2026
POSTGRES_DB=our_planet
DATABASE_URL=postgresql://admin:wzhpxy2026@db:5432/our_planet?schema=public
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
ZHIPU_API_KEY=your-zhipu-key
TENCENT_COS_SECRET_ID=your-cos-id
TENCENT_COS_SECRET_KEY=your-cos-key
TENCENT_COS_BUCKET=your-bucket-name
TENCENT_COS_REGION=ap-shanghai
EOF
```

> ⚠️ **重要**：环境变量值**不要加双引号**。Docker `env_file` 不会自动剥离引号，会导致 API 认证失败。

#### 4. 配置 SSL 证书（HTTPS）

```bash
# 创建证书目录
mkdir -p ~/our-planet/certs

# 从腾讯云下载 SSL 证书后，上传到服务器
# 在本地 Windows PowerShell 中执行：
scp C:\path\to\your_bundle.crt ubuntu@<服务器IP>:~/our-planet/certs/
scp C:\path\to\your.key ubuntu@<服务器IP>:~/our-planet/certs/

# SSH 到服务器，重命名为 nginx 期望的文件名
cd ~/our-planet/certs
cp your_bundle.crt fullchain.pem
cp your.key privkey.pem
```

#### 5. 修改域名配置

```bash
cd ~/our-planet
# 把 nginx.conf 中的 your-domain.com 替换为你的实际域名
sed -i 's/your-domain.com/你的域名/g' nginx.conf
```

#### 6. 创建上传目录并设置权限

```bash
mkdir -p ~/our-planet/uploads_data
sudo chown -R 1001:1001 ~/our-planet/uploads_data
```

#### 7. 如果服务器已有 nginx 占用 80 端口，先停掉

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

#### 8. 构建并启动所有服务

```bash
cd ~/our-planet
docker compose up -d --build

# 查看服务状态（应有 3 个容器 Up）
docker compose ps
# 期望输出：
# our_planet_db      Up (healthy)
# our_planet_web     Up
# our_planet_nginx   Up
```

#### 9. 首次设置数据库密码

如果是全新部署且数据库密码为空：

```bash
docker compose exec db psql -U postgres -c "ALTER USER admin PASSWORD 'wzhpxy2026';"
```

#### 10. 验证部署

```bash
curl -I https://你的域名
# 期望返回 HTTP/2 200
```

浏览器访问 `https://你的域名`。

---

### 日常更新部署

每次在本地修改代码后，按以下步骤更新服务器：

#### 本地操作

```bash
# 提交修改到 GitHub
git add .
git commit -m "描述你的修改"
git push origin main
```

#### 服务器操作（SSH 登录后，二选一）

**方式 A：使用一键部署脚本（推荐）**

```bash
cd ~/our-planet
git pull origin main
chmod +x deploy.sh
./deploy.sh
```

**方式 B：手动步骤**

```bash
cd ~/our-planet
git pull origin main
docker compose build --no-cache web
docker compose up -d
docker compose ps
docker compose logs --tail=30 web
```

---

### SSL 证书续期

SSL 证书到期后**不需要修改 nginx 配置文件**，只需替换证书文件并重启 nginx 容器：

```bash
# 1. 在本地下载新的 SSL 证书，上传到服务器
scp C:\path\to\new_bundle.crt ubuntu@<服务器IP>:~/our-planet/certs/
scp C:\path\to\new.key ubuntu@<服务器IP>:~/our-planet/certs/

# 2. SSH 到服务器，替换证书文件
cd ~/our-planet/certs
cp new_bundle.crt fullchain.pem
cp new.key privkey.pem

# 3. 重启 nginx 容器即可（不影响 web 和 db）
cd ~/our-planet
docker compose restart nginx

# 4. 验证证书已更新
curl -I https://你的域名
```

> 📝 `nginx.conf` 配置文件中的证书路径 `/etc/nginx/certs/fullchain.pem` 和 `/etc/nginx/certs/privkey.pem` 是固定不变的，证书续期时只需替换 `certs/` 目录下的文件内容。

---

### 常见问题排查

| 问题 | 排查命令 | 解决方法 |
|------|---------|---------|
| 网站无法访问 (502) | `docker compose logs web` | 检查 `prisma/.env` 中 API Key 是否带引号 |
| 数据库认证失败 | `docker compose logs web \| grep P1000` | 确认根目录 `.env` 文件存在且密码正确 |
| 80/443 端口冲突 | `sudo lsof -i :80` | `sudo systemctl stop nginx` 停掉宿主机 nginx |
| 容器不断重启 | `docker compose logs nginx` | 确认 `certs/fullchain.pem` 和 `certs/privkey.pem` 存在 |
| 上传文件失败 | `docker compose logs web \| grep -iE 'COS\|upload'` | 确认 COS 环境变量无引号，`uploads_data/` 属主为 1001:1001 |
| 聊天无响应 | `docker compose logs web \| grep -iE 'DeepSeek\|embedding'` | 确认 DeepSeek/Zhipu API Key 无引号 |
| Git pull 失败 | `git remote -v` | 确认 remote 指向 `github.com` 而非 `ghproxy.com` |

---

### 部署架构

```
用户浏览器
    │
    ├── :443 (HTTPS) ──→ nginx 容器 (SSL 终止)
    └── :80  (HTTP)  ──→ nginx 容器 (自动跳转 HTTPS)
                              │
                              └──→ web 容器 (Next.js :3000, 仅内部网络)
                                       │
                                       └──→ db 容器 (PostgreSQL + pgvector :5432)
```

---

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接地址 | 是 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 是 |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址 | 是 |
| `ZHIPU_API_KEY` | 智谱 AI API 密钥 | 是 |
| `TENCENT_COS_SECRET_ID` | 腾讯云 COS SecretId | 否 |
| `TENCENT_COS_SECRET_KEY` | 腾讯云 COS SecretKey | 否 |
| `TENCENT_COS_BUCKET` | COS 存储桶名称 | 否 |
| `TENCENT_COS_REGION` | COS 地域 | 否 |

---

## License

Private — All rights reserved.
