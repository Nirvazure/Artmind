# ArtMind

最懂你的 AI 绘画分析引擎。上传画作图片，获取风格分类、可能画家与多维度分析，并浏览画廊中的艺术作品。

---

## 项目简介

ArtMind 是一个由 AI 驱动的 Nuxt 3 Web 应用。核心能力包括：作品页分析（`/:id?analyse=true`）、瀑布流画廊、GitHub 登录与个人主页。

当前使用 **keremberke/yolov8m-painting-classification**（Hugging Face Space）进行 27 种艺术流派分类，需配置 `PAINTING_INFERENCE_URL`。作品与用户数据存储在 **YQYHub Supabase** 的 `artmind` schema，图片与头像存储在 **阿里云 OSS**。

**近期更新（2026-06）**
- 认证迁移：Authing → Supabase Auth（GitHub OAuth）
- 数据迁移：MongoDB → Supabase Postgres（profiles / artworks / artwork_likes / uploads / analysis_logs）
- 画廊列表、收藏、资料更新改为客户端直连 Supabase（RLS）；Nitro 保留 classify / upload / avatar / 保存作品

功能现状与规划见下方「功能概览」与「路线图」。

---

## 功能概览

| 当前实现 | 规划中 |
|----------|--------|
| **首页**：`/` 随机重定向到 `/:id`，默认浏览态（画作居中、背景模糊） | — |
| **分析模式**：`/:id?analyse=true` 上传、分析、修正流派/画家并保存到画廊 | — |
| **画廊**：瀑布流作品展示、App Bar 流派/画家搜索筛选、登录后可收藏 | 作品编辑（标题/公开性等） |
| **个人主页**：`/user/:id` 分析记录、我的画廊、我的收藏；头像/昵称可编辑 | 他人主页可见性、分页聚合 API |
| **AI 分析**：27 种流派分类、环形图、画家卡片、润色/原始输出切换 | — |
| **认证**：Supabase Auth（GitHub OAuth）；保存作品、收藏、头像上传需鉴权 | 权限控制与审核员机制（`profiles.role` 已预留） |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、Nuxt 3、Vuetify 3、Pinia、@vueuse/motion |
| UI 组件 | @yeger/vue-masonry-wall（瀑布流）、vue-chartjs / Chart.js（环形图） |
| 后端 | Nitro（AI 分类、图片压缩、OSS 写入） |
| 认证与数据 | YQYHub Supabase Auth + `artmind` schema Postgres（RLS） |
| 图片存储 | 阿里云 OSS（temp / artworks / avatars） |
| 图片处理 | sharp（上传压缩）、服务端尺寸读取 |
| AI | Hugging Face Space（keremberke 艺术流派分类） |
| 部署 | Vercel（`nitro.vercel.functions.maxDuration: 180`） |

---

## 项目结构

```
Artmind/
├── app.vue
├── nuxt.config.ts
├── eslint.config.mjs
├── package.json
├── assets/
│   └── app.css
├── components/
│   ├── AnalysisResultPanel.vue   # 分析结果面板（加载态、流派图、画家卡片）
│   ├── GalleryArtworkCard.vue
│   ├── GalleryArtworkGrid.vue    # 瀑布流 + 无限滚动
│   ├── GalleryFilterBar.vue      # App Bar 流派/画家搜索
│   ├── PainterCards.vue
│   ├── StyleRingChart.vue
│   ├── ToastSnackbar.vue
│   └── UserProfileHeader.vue
├── composables/
│   ├── useAuth.ts                # Supabase Auth + profiles
│   ├── useArtworkMapper.ts
│   ├── useUserArtworks.ts
│   ├── useClassifier.ts
│   └── useToast.ts
├── layouts/
│   └── home.vue                  # 全局 App Bar、画廊筛选、登录入口
├── pages/
│   ├── index.vue                 # 随机跳转 /:id
│   ├── [id].vue                  # 作品页（浏览态 + analyse=true 分析态）
│   ├── gallery.vue               # 画廊瀑布流
│   ├── login.vue                 # GitHub 登录
│   ├── user/[id].vue             # 个人主页
│   └── auth/callback.vue         # Supabase OAuth 回调
├── plugins/
│   └── motion.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── stores/
│   ├── artwork.ts
│   └── galleryFilter.ts
├── scripts/
│   └── clear-oss-ts.mjs          # build 前清理 ali-oss 类型冲突
└── server/
    ├── api/
    │   ├── classify.post.ts
    │   ├── upload.post.ts
    │   ├── avatar.post.ts
    │   ├── artworks/index.post.ts  # 保存作品（temp → artworks）
    │   ├── painters/
    │   ├── models/               # 27 流派列表
    │   └── style-covers/
    ├── data/
    │   └── painters-list.ts      # 画家详情（内联 TS，serverless 唯一数据源）
    └── utils/
        ├── auth.ts
        ├── supabase-admin.ts
        ├── classifier.ts
        ├── painter-mapping.ts
        ├── storage.ts
        ├── artworks-data.ts
        ├── image-compress.ts
        ├── image-dimensions.ts
        ├── image-utils.ts
        ├── painting-client.ts
        └── styles-data.ts
```

---

## 快速开始

### 环境要求

- Node.js 18+
- Yarn

### 安装与启动

```bash
yarn install
yarn dev
```

访问 http://localhost:3000

### 构建与检查

```bash
yarn build
yarn lint        # ESLint 校验
yarn lint:fix    # 自动修复
yarn preview     # 预览生产构建
```

`yarn build` 前会自动执行 `scripts/clear-oss-ts.mjs`，避免 ali-oss 依赖的 ESM/CJS 打包问题。

### 参考链接

- 在线推理 Space：https://huggingface.co/spaces/YQYDarkrai/artmind_gradio
- Supabase 项目 Dashboard（YQYHub）
- 多项目公用 Auth 规范：[docs/yqyhub-shared-auth.md](docs/yqyhub-shared-auth.md)

---

## Supabase 初始化（YQYHub · `artmind` schema）

ArtMind 使用 [YQYHub](docs/yqyhub-shared-auth.md) 公用 Supabase 项目，业务表在 **`artmind` schema**（非 `public`）。

**推荐上线顺序**（避免部署后报「表不存在」）：

1. YQYHub → **SQL Editor**：执行 [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
2. YQYHub → **Project Settings → API → Exposed schemas**：添加 `artmind`
3. 合并并部署本仓库代码到 Vercel
4. Vercel → **Environment Variables**：配置 `SUPABASE_URL` / `SUPABASE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`（见下方），然后 **Redeploy**
5. YQYHub → **Authentication → URL Configuration**：
   - Site URL：`https://artmind.nirvazure.cn`
   - Redirect URLs 追加：
     - `http://localhost:3000/**`
     - `https://artmind.nirvazure.cn/**`
     - `https://*.vercel.app/**`（Preview 部署）
6. YQYHub → **Authentication → Providers**：启用 **GitHub**，填入 OAuth App Client ID / Secret
7. GitHub OAuth App Callback URL：`https://tfvzcuksahcofooqqezx.supabase.co/auth/v1/callback`

本地开发：复制 [`.env.example`](.env.example) 为 `.env`，从 YQYHub Dashboard 填入 anon key 与 service_role key。

---

## 环境变量

在项目根目录创建 `.env`（勿提交到 Git）：

```env
# AI 推理（必填，否则 classify 不可用）
PAINTING_INFERENCE_URL=https://your-space.hf.space
# PAINTING_PREDICT_PATH=/predict          # 可选，默认 /predict

# Supabase · YQYHub（必填，业务 schema: artmind）
SUPABASE_URL=https://tfvzcuksahcofooqqezx.supabase.co
SUPABASE_KEY=eyJ...                         # YQYHub anon / publishable key
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # 仅服务端，保存作品等 Nitro API

# 阿里云 OSS（必填，否则 upload/avatar 返回 503）
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=artmind
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
```

也可使用 `NUXT_PUBLIC_SUPABASE_URL` / `NUXT_PUBLIC_SUPABASE_KEY` 别名。Nuxt `runtimeConfig` 亦支持 `NUXT_` 前缀（如 `NUXT_PAINTING_INFERENCE_URL`），详见 `nuxt.config.ts`。

---

## AI 风格分类

使用 **Hugging Face Space** 部署 keremberke/yolov8m-painting-classification，识别 27 种艺术流派。本地 Python 推理服务（`server/python`）已移除。

1. 部署或使用已有 HF Space URL
2. 设置 `PAINTING_INFERENCE_URL`
3. 启动 `yarn dev`，在作品页上传图片并点击「分析」

分类结果经 `styles-data.ts` 映射为中文流派名，并关联 `painters-list.ts` 推导可能画家。

---

## 存储

### Supabase Postgres（`artmind` schema）

- `profiles` — 用户资料（display_name、avatar_url、role）
- `artworks` — 作品（含 analysis_result jsonb）
- `artwork_likes` — 收藏关系
- `uploads` — 上传流水（temp 路径、过期时间）
- `analysis_logs` — 分析流水

画廊列表、收藏、资料更新由客户端直连 Supabase（RLS 保护）。

### 阿里云 OSS 目录

```
{BUCKET}/
├── temp/       # 分析/上传临时文件（未保存到画廊）
├── artworks/   # 持久化作品（「保存到画廊」后从 temp 复制）
└── avatars/    # 用户头像
```

**temp/ 生命周期**（需在 OSS 控制台配置）：前缀 `temp/`，过期 1 天自动删除，避免未保存图片持续占用存储。

**上传压缩**：JPEG/PNG/WebP 在服务端经 sharp 压缩至 1MB 以内；失败时原样存储。

---

## Vercel 部署

1. 关联 Git 仓库，Framework Preset 选 Nuxt
2. 在 Settings → Environment Variables 配置上述全部环境变量（Production + Preview）；Supabase 三项须指向 **YQYHub**（`tfvzcuksahcofooqqezx`）
3. 确认 OSS `temp/` 生命周期规则已启用
4. 修改 Supabase 环境变量后须 **Redeploy** 才生效
5. 部署命令默认 `yarn build`（或 `npm run build`）

**已处理的 serverless 兼容项**
- `nitro.externals` 外置 ali-oss / debug，inline lodash
- 画家数据内联为 `painters-list.ts`，不依赖运行时读文件
- classify 对相对图片路径转为绝对 URL 后 HTTP 拉取
- HF Space 冷启动约 2–3 分钟，`maxDuration` 已设为 180s

---

## 已移除模块：server/python

**移除日期**：2025-03-09。原因：改用 HF Space，无需本地 Python 服务。

原目录含 painting_inference（FastAPI + YOLO）、engine（ArtNet 训练）、spiders（爬虫）。

恢复方式：

```bash
git checkout <移除前的 commit> -- server/python
```

---

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/classify` | 图片风格分类（multipart 或 JSON `imageUrl`） |
| POST | `/api/upload` | 上传图片至 OSS temp/ |
| POST | `/api/artworks` | 新增作品（需鉴权，temp → artworks 复制） |
| POST | `/api/avatar` | 头像上传（需鉴权） |
| GET | `/api/painters` | 艺术家列表（含 verified） |
| GET | `/api/models` | 27 种流派名 |
| GET | `/api/style-covers` | 流派封面映射 |

画廊列表、单条作品、收藏、资料更新通过 **Supabase 客户端 + RLS** 完成，不再经 Nitro REST。

---

## 路线图

**已完成**
- [x] 首页随机作品 + 作品页浏览/分析双态（`/:id`、`?analyse=true`）
- [x] 画廊瀑布流、流派/画家 App Bar 筛选、收藏
- [x] AnalysisResultPanel（环形图、画家卡片、润色/原始输出、梵高加载态）
- [x] Supabase Auth（GitHub）、Postgres、uploads / analysis_logs 表
- [x] 阿里云 OSS、个人主页（分析记录/我的画廊/收藏）、头像昵称、收藏 RLS、Toast
- [x] Vercel 打包与运行时兼容修复
- [x] 移除 `server/python`，改用 HF Space

**待完成**（详见 [TODO.md](./TODO.md)）
- [ ] 生产环境环境变量与 OSS 生命周期验收
- [ ] 权限控制与审核员机制
- [ ] 用户主页聚合 API（分页/筛选/统计）
- [ ] 作品编辑（标题、公开性等）

**下一阶段**：权限审核（moderator role）、作品编辑、生产部署验收。
