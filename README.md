# PEVC 知识平台 MVP

面向一级市场（VC / PE / FA）的垂直知识分享社区，基于 [PEVC_知识平台_V1.1_PRD.docx](../PEVC_知识平台_V1.1_PRD.docx) 的 P0 范围实现。

## 技术栈

- **Next.js 14** App Router + Server Components
- **React 18** + **Tailwind CSS**
- **Prisma 5** + **SQLite**（生产可平滑换 PostgreSQL / MySQL）
- **bcryptjs** 密码哈希、HMAC 签名 cookie 会话
- 本地 `uploads/` 目录存储附件（生产应替换为阿里云 OSS / 腾讯云 COS）

## 已实现功能（PRD P0）

| 模块 | 状态 | 说明 |
|------|------|------|
| 注册 / 登录 | ✅ | 手机号 + 短信验证码 + 身份选择（VC / PE / FA） + 昵称 + 密码 |
| 内容发布 | ✅ | 富文本编辑器 + 四维标签 + 附件 |
| Feed 流 | ✅ | 时间倒序，支持四维筛选 + 搜索 + 发布者身份 + 时间范围 |
| 内容详情 | ✅ | 正文 + 标签 + 附件 + 评论 + 点赞 / 收藏 |
| 评论 | ✅ | 两级嵌套、删除、@提及输入 |
| 文件上传 / 下载 | ✅ | 拖拽上传、进度、下载计数 |
| 点赞 / 收藏 | ✅ | toggle，乐观更新 |
| 个人主页 | ✅ | 三 Tab：我的发布 / 我的点赞 / 我的收藏 |
| 全文搜索 | ✅ | 标题 / 正文 / 作者昵称（LIKE） |

## 本地启动

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库 + 种子数据
npm run setup

# 3. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 测试账号

| 手机号 | 密码 | 身份 | 昵称 |
|--------|------|------|------|
| 13800138001 | password123 | VC | 清流VC合伙人 |
| 13800138002 | password123 | PE | PE研究员小李 |
| 13800138003 | password123 | FA | FA-王经理 |
| 13800138004 | password123 | VC | AI赛道分析师 |

**短信验证码（开发模式）**：所有手机号通用 `123456`

## 项目结构

```
pevc-platform/
├── app/                        # Next.js App Router
│   ├── api/                    # REST API 路由
│   │   ├── auth/               # 注册 / 登录 / me / logout
│   │   ├── sms/send/           # 短信验证码（dev 模式返回固定值）
│   │   ├── posts/              # 内容 CRUD + 互动
│   │   ├── comments/           # 评论删除 / 点赞
│   │   ├── upload/             # 附件上传 / 删除
│   │   └── files/[id]/download # 附件下载
│   ├── (pages)/
│   │   ├── page.tsx            # 首页 Feed
│   │   ├── login/              # 登录
│   │   ├── register/           # 注册（两步）
│   │   ├── publish/            # 发布
│   │   ├── posts/[id]/         # 详情
│   │   └── profile/[id]/       # 个人主页（三 Tab）
│   ├── layout.tsx              # 全局布局 + 顶部导航
│   └── globals.css             # Tailwind 入口
├── components/                 # 通用组件
│   ├── TopNav.tsx
│   ├── PostCard.tsx
│   ├── FilterBar.tsx
│   ├── RichEditor.tsx          # 极简富文本编辑器
│   ├── AttachmentUploader.tsx
│   └── CommentSection.tsx
├── lib/                        # 业务层
│   ├── db.ts                   # Prisma 客户端
│   ├── session.ts              # cookie 会话
│   ├── storage.ts              # 文件存储
│   ├── tags.ts                 # 四维分类常量
│   ├── validate.ts             # 校验 / XSS 过滤
│   └── format.ts               # 格式化辅助
├── prisma/
│   ├── schema.prisma           # 数据模型
│   ├── seed.ts                 # 种子数据
│   └── dev.db                  # SQLite 文件（自动生成）
└── uploads/                    # 本地附件存储
```

## 数据模型

- `User` — 用户（手机号 / 昵称 / 角色 / 密码 hash）
- `Post` — 内容（标题 / 正文 / 四维标签 / 状态）
- `Attachment` — 附件元数据（指向本地 / OSS）
- `Comment` — 评论（含两级嵌套）
- `CommentLike` — 评论点赞
- `PostLike` — 内容点赞（联合唯一）
- `PostFavorite` — 内容收藏（联合唯一）
- `SmsCode` — 短信验证码

## 与 PRD 的差异 / MVP 简化

| PRD 要求 | 当前实现 | 后续 |
|----------|----------|------|
| 短信网关 | 固定验证码 `123456`，UI 展示便于调试 | 接入阿里云 / 腾讯云短信 |
| 文件存储 OSS 签名 URL | 本地 `uploads/`，登录后通过路由下载 | 切换 OSS 客户端 + 签名 URL |
| 内容审核（24h 内人工） | 直接发布 (`status=published`) | 增加管理员后台 + `pending` 流转 |
| 全文检索 | 数据库 LIKE | 数据量大后切 Elasticsearch |
| 头像上传 | 默认色块占位 | 接入图片裁剪 + OSS |
| 敏感词过滤 | 仅注册昵称基础名单 | 接入更全词库 |

## 推荐部署路径

1. 把 `DATABASE_URL` 切换到 PostgreSQL（如 Supabase / Neon）
2. `lib/storage.ts` 改为 OSS SDK，签名 URL 有效期 30 分钟
3. `app/api/sms/send/route.ts` 接入实际短信网关
4. 配置 `SESSION_SECRET` 为强随机字符串
5. `npm run build && npm start` 部署到 Vercel / 自托管

## 关键命令

```bash
npm run dev          # 开发模式
npm run build        # 生产构建
npm run start        # 生产启动
npm run db:push      # 同步 schema 到数据库
npm run db:seed      # 重新种子数据
npm run setup        # 上面两条合一
npx prisma studio    # 数据库可视化（http://localhost:5555）
```
