# ArtMind

最懂你的 AI 绘画分析引擎。上传画作，获取 27 种艺术流派分类、可能画家与多维度分析，并浏览、收藏画廊中的作品。

---

## 功能概览

| 模块                     | 说明                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| **首页** `/`             | 随机跳转至某件公开作品，沉浸式浏览（画作居中 + 背景模糊）                                 |
| **作品页** `/:id`        | 浏览态展示作品；`?analyse=true` 进入分析态：上传 → AI 分类 → 修正流派/画家 → 默认私密保存 |
| **画廊** `/gallery`      | 瀑布流展示公开作品，App Bar 支持流派/画家筛选，登录后可收藏                               |
| **个人主页** `/user/:id` | 分析记录、我的画廊（公开 switch）、我的收藏；可编辑头像与昵称                             |
| **认证**                 | Supabase Auth + GitHub OAuth；保存作品、收藏、头像上传需登录                              |

### 路线图

- 作品编辑（标题、公开性等）
- 他人主页可见性与分页
- 基于 `profiles.role` 的权限与审核机制

---

## 技术栈

| 层级       | 技术                                                        |
| ---------- | ----------------------------------------------------------- |
| 前端       | Vue 3、Nuxt 3、Vuetify 3、Pinia、@vueuse/motion             |
| UI         | @yeger/vue-masonry-wall（瀑布流）、vanilla-tilt（卡片动效） |
| 后端       | Nitro（AI 分类、图片压缩、OSS 写入）                        |
| 认证与数据 | YQYHub Supabase Auth + `artmind` schema Postgres（RLS）     |
| 图片存储   | 阿里云 OSS（temp / artworks / avatars）                     |
| 图片处理   | sharp（上传压缩、尺寸读取）                                 |
| AI         | Hugging Face Space（keremberke 艺术流派分类，27 类）        |
| 部署       | Vercel（`maxDuration: 180s`）                               |

---

## 项目结构

```
Artmind/
├── app.vue
├── nuxt.config.ts
├── assets/app.css
├── components/
│   ├── AnalysisConfirmCard.vue    # 保存入口
│   ├── AnalysisHeroLabel.vue      # 流派标题与润色切换
│   ├── AnalysisHeroPainters.vue   # 推荐画家
│   ├── AnalysisResultPanel.vue    # 分析结果面板
│   ├── AnalysisSaveDialog.vue     # 保存二次确认
│   ├── GalleryArtworkCard.vue
│   ├── GalleryArtworkGrid.vue     # 瀑布流
│   ├── GalleryFilterPanel.vue     # 流派/画家筛选
│   ├── GalleryPainterSearch.vue
│   ├── GalleryStyleTileStrip.vue
│   ├── RelatedArtworksStrip.vue
│   ├── ToastSnackbar.vue
│   ├── UserGalleryCard.vue        # 个人页画廊卡片
│   └── UserProfileHeader.vue
├── composables/
│   ├── useAuth.ts                 # Supabase Auth + profiles
│   ├── useArtworkMapper.ts
│   ├── useUserArtworks.ts
│   ├── useClassifier.ts
│   └── useToast.ts
├── layouts/home.vue               # 全局 App Bar、画廊筛选、登录入口
├── pages/
│   ├── index.vue                  # 随机跳转 /:id
│   ├── [id].vue                   # 作品页（浏览 + 分析）
│   ├── gallery.vue
│   ├── login.vue
│   ├── user/[id].vue
│   └── auth/callback.vue          # OAuth 回调
├── plugins/
│   ├── auth.client.ts             # 会话同步 + profiles 合并
│   └── motion.ts
├── stores/
│   ├── artwork.ts
│   └── galleryFilter.ts
├── supabase/migrations/
│   └── 001_initial_schema.sql
├── types/
│   └── database.types.ts          # Supabase 类型定义
├── scripts/
│   └── clear-oss-ts.mjs           # build 前清理 ali-oss 类型冲突
└── server/
    ├── api/
    │   ├── classify.post.ts
    │   ├── upload.post.ts
    │   ├── avatar.post.ts
    │   ├── artworks/
    │   │   ├── index.post.ts      # 保存作品（temp → artworks）
    │   │   └── [id]/analysis.put.ts
    │   ├── painters/
    │   ├── models/                # 27 流派列表
    │   └── style-covers/
    ├── data/painters-list.ts      # 画家详情（serverless 内联数据源）
    └── utils/
        ├── auth.ts
        ├── supabase-admin.ts
        ├── classifier.ts
        ├── storage.ts
        ├── artworks-data.ts
        ├── image-compress.ts
        └── ...
```

---

## 快速开始

### 环境要求

- Node.js 18+
- Yarn

### 安装与开发

```bash
yarn install
cp .env.example .env   # 填入真实配置
yarn dev
```

访问 http://localhost:3000

### 构建与检查

```bash
yarn build          # 自动执行 clear-oss-ts.mjs
yarn preview        # 预览生产构建
yarn lint           # ESLint
yarn lint:fix       # 自动修复
yarn format:check   # Prettier 检查
yarn typecheck      # 类型检查
```

---

## Supabase 初始化（YQYHub · `artmind` schema）

ArtMind 使用 [YQYHub 公用 Supabase](docs/yqyhub-shared-auth.md)，业务表在 **`artmind` schema**。

**推荐上线顺序：**

1. SQL Editor 执行 [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
2. **Project Settings → API → Exposed schemas**：添加 `artmind`
3. 配置 Vercel 环境变量并部署
4. **Authentication → URL Configuration**：
   - Site URL：`https://artmind.nirvazure.cn`
   - Redirect URLs：`http://localhost:3000/**`、`https://artmind.nirvazure.cn/**`、`https://*.vercel.app/**`
5. **Authentication → Providers**：启用 GitHub OAuth
6. GitHub OAuth App Callback：`https://tfvzcuksahcofooqqezx.supabase.co/auth/v1/callback`

---

## 环境变量

复制 [`.env.example`](.env.example) 为 `.env`（勿提交 Git）：

```env
# AI 推理（必填）
PAINTING_INFERENCE_URL=https://your-space.hf.space

# Supabase · YQYHub（必填，schema: artmind）
SUPABASE_URL=https://tfvzcuksahcofooqqezx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 阿里云 OSS（必填）
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=your-bucket
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
```

也支持 `NUXT_PUBLIC_SUPABASE_*`、`NUXT_PAINTING_INFERENCE_URL` 等 Nuxt 前缀别名，详见 `nuxt.config.ts`。

---

## 数据与存储

### Supabase Postgres（`artmind` schema）

| 表              | 用途                                       |
| --------------- | ------------------------------------------ |
| `profiles`      | 用户资料（display_name、avatar_url、role） |
| `artworks`      | 作品（含 analysis_result jsonb）           |
| `artwork_likes` | 收藏关系                                   |
| `uploads`       | 上传流水（temp 路径、过期时间）            |
| `analysis_logs` | 分析流水                                   |

画廊列表、收藏、资料更新由**客户端直连 Supabase**（RLS 保护）。Nitro 负责 classify / upload / avatar / 保存作品 / 更新分析结果。

### 阿里云 OSS

```
{BUCKET}/
├── temp/       # 临时文件（未保存到画廊）
├── artworks/   # 持久化作品
└── avatars/    # 用户头像
```

- **temp/** 需在 OSS 控制台配置生命周期：前缀 `temp/`，1 天过期
- 上传经 sharp 压缩至 1MB 以内（失败则原样存储）

---

## AI 风格分类

使用 Hugging Face Space 部署 [keremberke/yolov8m-painting-classification](https://huggingface.co/keremberke/yolov8m-painting-classification)，识别 27 种艺术流派。

1. 部署或使用已有 Space URL（参考：[artmind_gradio](https://huggingface.co/spaces/YQYDarkrai/artmind_gradio)）
2. 设置 `PAINTING_INFERENCE_URL`
3. 在作品页 `?analyse=true` 上传并分析

分类结果经 `styles-data.ts` 映射为中文流派名，并关联 `painters-list.ts` 推导可能画家。

---

## API 概览

| 方法 | 路径                         | 说明                                     |
| ---- | ---------------------------- | ---------------------------------------- |
| POST | `/api/classify`              | 风格分类（multipart 或 JSON `imageUrl`） |
| POST | `/api/upload`                | 上传至 OSS temp/                         |
| POST | `/api/artworks`              | 新增作品（需鉴权，temp → artworks）      |
| PUT  | `/api/artworks/:id/analysis` | 更新作品分析结果                         |
| POST | `/api/avatar`                | 头像上传（需鉴权）                       |
| GET  | `/api/painters`              | 艺术家列表                               |
| GET  | `/api/models`                | 27 种流派名                              |
| GET  | `/api/style-covers`          | 流派封面映射                             |

画廊 CRUD、收藏、资料更新走 **Supabase 客户端 + RLS**，不经 Nitro REST。

---

## Vercel 部署

1. 关联 Git 仓库，Framework Preset 选 **Nuxt**
2. 配置全部环境变量（Production + Preview）
3. 确认 OSS `temp/` 生命周期规则
4. 修改 Supabase 变量后须 **Redeploy**
5. 构建命令：`yarn build`

**Serverless 兼容处理：**

- `nitro.externals` 外置 ali-oss / debug
- `scripts/clear-oss-ts.mjs` 构建前清理 ali-oss 类型文件
- 画家数据内联为 `painters-list.ts`
- HF Space 冷启动约 2–3 分钟，`maxDuration` 已设为 180s

---

## 参考链接

- 在线推理 Space：https://huggingface.co/spaces/YQYDarkrai/artmind_gradio
- YQYHub 公用 Auth 规范：[docs/yqyhub-shared-auth.md](docs/yqyhub-shared-auth.md)

---

## 历史说明

- **2025-03**：移除 `server/python` 本地推理，改走 Hugging Face Space
- **2026-06**：认证迁移 Authing → Supabase Auth；数据迁移 MongoDB → Supabase Postgres
