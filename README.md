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
│   └── migrations/             # 数据库迁移文件
├── scripts/
│   └── ingest-chat.ts          # 微信聊天记录导入脚本
├── public/                     # 静态资源
├── docker-compose.yml          # Docker 编排
├── Dockerfile                  # 生产环境镜像
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
# 在 prisma/.env 文件中设置：
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

### Docker 部署

```bash
# 1. 确保 prisma/.env 中配置了正确的环境变量
# 2. 构建并启动
docker-compose up -d

# 3. 查看日志
docker-compose logs -f web
```

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接地址 | 是 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 是 |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址 | 是 |
| `ZHIPU_API_KEY` | 智谱 AI API 密钥 | 是 |
| `TENCEN_COS_SECRET_ID` | 腾讯云 COS SecretId | 否 |
| `TENCEN_COS_SECRET_KEY` | 腾讯云 COS SecretKey | 否 |
| `COS_BUCKET` | COS 存储桶名称 | 否 |
| `COS_REGION` | COS 地域 | 否 |

## License

Private — All rights reserved.
