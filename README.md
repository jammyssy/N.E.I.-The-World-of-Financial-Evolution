# PEVC Skills Map + Community Platform V1.0

面向一级市场（VC / PE / FA）从业者的技能资产发现与分享社区。

## 产品定位

PEVC Skills Map 是一个围绕投资工作流的技能资产社区。用户可以发布、发现、评论、点赞、收藏和下载可复用的技能资产。

**核心概念：**
- **Post** — 通用内容壳：标题、正文、作者、状态、浏览/评论/点赞/收藏。所有 Skill Asset 都是一个 Post。
- **SkillAsset** — 扩展 Post 的资产元数据：类型（Prompt / Agent Skill / Workflow / Tool Stack / Template / API-Script / Case Study）、来源链接、安装说明、使用心得。
- **Skills Map** — 按工作场景 × 资产类型的矩阵发现界面，帮助用户从投资工作流出发快速定位可复用资产。
- **Normalized Tags** — 四维标签体系：工作场景（10）× 行业赛道（9）× 工作内容（11）× 资产类型（7）。

## 技术栈

- **Next.js 14** App Router + Server Components
- **React 18** + **Tailwind CSS**
- **Prisma 5** + **SQLite**（生产可换 PostgreSQL）
- **bcryptjs** 密码哈希、HMAC 签名 cookie 会话
- 本地 `uploads/` 目录存储附件

## 本地启动

```bash
npm install
npm run setup    # db:push + db:seed
npm run dev      # http://localhost:3000
```

### 重置命令

```bash
npm run db:reset  # 删除 dev.db → db:push → db:seed
```

## 测试账号

| 手机号 | 密码 | 身份 | 昵称 |
|--------|------|------|------|
| 13800138001 | password123 | VC | 清流VC合伙人 |
| 13800138002 | password123 | PE | PE研究员小李 |
| 13800138003 | password123 | FA | FA-王经理 |
| 13800138004 | password123 | VC | AI赛道分析师 |

短信验证码（开发模式）：`123456`

## 已实现功能

| 模块 | 状态 | 说明 |
|------|------|------|
| 注册 / 登录 | ✅ | 手机号 + SMS + 身份（VC/PE/FA） + 昵称 + 密码 |
| Skill Asset 发布 | ✅ | 7 种资产类型 + 类型专属提示 + 四维标签 + 附件 |
| Skills Map | ✅ | 工作场景 × 资产类型矩阵 + 统计 + 响应式 |
| Feed 流 | ✅ | 时间倒序 + 四维筛选 + 搜索 + 身份/时间范围 |
| 内容详情 | ✅ | 资产面板 + 正文 + 附件下载 + 评论 + 点赞/收藏 |
| 评论 | ✅ | 两级嵌套、删除、@提及 |
| 文件上传 / 下载 | ✅ | 拖拽上传、下载计数 |
| 个人主页 | ✅ | 发布 / 点赞 / 收藏 三 Tab |
| 内容状态 | ✅ | POST_STATUS 常量（draft / pending / published / rejected） |

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── page.tsx            # 首页（Skills Map 预览 + Feed）
│   ├── skills-map/         # Skills Map 全页矩阵
│   ├── publish/            # 发布 Skill Asset
│   ├── posts/[id]/         # 详情页（资产面板 + 互动）
│   ├── login/ register/    # 认证
│   ├── profile/[id]/       # 个人主页
│   └── api/                # REST API
├── components/             # 共享 UI 组件
├── features/               # 领域层
│   ├── posts/              # queries, service, schemas, mapper
│   ├── skills/             # skills map queries + stats
│   └── attachments/        # upload, download service
├── lib/                    # 业务层
│   ├── tags.ts             # 四维分类常量 + 资产类型辅助文本
│   ├── status.ts           # POST_STATUS 常量
│   ├── db.ts               # Prisma 客户端
│   ├── session.ts          # cookie 会话
│   ├── storage.ts          # 文件存储
│   ├── validate.ts         # 校验 / XSS 过滤
│   └── format.ts           # 格式化辅助
└── prisma/
    ├── schema.prisma       # Post → SkillAsset → PostTag 数据模型
    └── seed.ts             # 种子数据
```

## V1.0 简化（vs PRD）

| PRD 要求 | V1.0 实现 | 后续 |
|----------|-----------|------|
| 内容审核 | 直接 published，POST_STATUS 常量已就位 | 管理后台 + pending 流转 |
| 短信网关 | 固定验证码 `123456` | 接入短信服务商 |
| 文件存储 OSS | 本地 `uploads/` | OSS SDK + 签名 URL |
| 全文检索 | LIKE 查询 | Elasticsearch |
| 头像上传 | 色块占位 | 图片裁剪 + OSS |

## 关键命令

```bash
npm run dev          # 开发
npm run build        # 生产构建
npm run start        # 生产启动
npm run db:push      # 同步 schema
npm run db:seed      # 种子数据
npm run db:reset     # 完整重置
npx prisma studio    # 数据库可视化
```
