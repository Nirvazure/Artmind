# ArtMind

最懂你的 AI 绘画分析引擎。上传画作图片，获取风格分类、可能画家与多维度分析，并浏览画廊中的艺术作品。



---

## 项目简介

ArtMind 是一个由 AI 驱动的 Web 应用。初版已实现首页分析、画廊展示与流派说明；当前使用 keremberke/yolov8m-painting-classification（HF Space）进行艺术流派分类，需配置 PAINTING_INFERENCE_URL。

当前使用 MongoDB Atlas 存储作品数据，阿里云 OSS 存储上传图片。2026-03 已完成组件精简（搜索框单横线、[id] 分析面板抽离、删除冗余组件）。功能现状与规划见下方双栏表。

---

## 功能概览

| 当前实现 | 规划中 |
|----------|--------|
| **首页路由**：`/` 自动重定向到随机作品 `/:id`，默认浏览态（画作居中） | — |
| **分析模式**：`/:id?analyse=true` 自动展示/补全 `analysisResult`，支持上传、手动分析、修正真实流派/画家并保存到画廊 | — |
| **画廊**：流派展区、艺术家名录（含认证标识）、作品收藏（登录后可见收藏按钮） | 作品编辑 |
| **个人主页**：`/user/:id` 分析记录、我的画廊、我的收藏；头像/昵称可编辑并持久化至 Authing | — |
| **流派说明**：AI 可识别的 27 种艺术流派列表 | — |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、Nuxt 3、Vuetify 3、Pinia |
| 后端 | Nitro（API 路由） |
| 认证 | Authing（OIDC，个人主页、保存作品、收藏需登录） |
| 存储 | MongoDB Atlas（作品数据）+ 阿里云 OSS（图片、头像） |
| AI | Hugging Face Space（keremberke/yolov8m-painting-classification 艺术流派），需配置 PAINTING_INFERENCE_URL |

---

## 项目结构

```
ArtMind/
├── app.vue
├── nuxt.config.ts
├── package.json
├── components/           # 可复用组件
│   ├── AnalysisResultPanel.vue
│   ├── GalleryArtworkCard.vue
│   ├── GalleryArtworkGrid.vue
│   ├── GalleryFilterBar.vue
│   ├── PainterCards.vue
│   ├── StyleRingChart.vue
│   ├── ToastSnackbar.vue
│   ├── UserProfileHeader.vue
│   └── ...
├── composables/
│   ├── useAuthing.ts
│   ├── useClassifier.ts
│   └── useToast.ts
├── layouts/
│   └── home.vue
├── pages/
│   ├── index.vue        # 入口页（重定向到随机 /:id）
│   ├── [id].vue         # 作品页（浏览态 + analyse=true 分析态）
│   ├── gallery.vue      # 画廊（含流派说明、艺术家名录）
│   ├── user/[id].vue    # 个人主页（分析记录、我的画廊、我的收藏）
│   └── auth/callback.vue # Authing 登录回调
├── server/
│   ├── api/             # API 路由
│   │   ├── classify.post.ts
│   │   ├── upload.post.ts
│   │   ├── artworks/    # GET/POST/PUT（MongoDB，POST/PUT likes 需鉴权）
│   │   ├── avatar.post.ts # 头像上传（OSS avatars/）
│   │   ├── user/profile.put.ts # 用户资料更新（Authing Management API）
│   │   ├── painters/
│   │   ├── models/      # GET（流派列表）
│   │   └── style-covers/ # GET（流派封面映射）
│   ├── data/            # 静态数据（画家）
│   │   └── painters-list.ts    # 画家详情（内联 TS，确保 serverless 可用的唯一数据源）
│   ├── utils/
│   │   ├── classifier.ts
│   │   ├── painter-mapping.ts
│   │   ├── storage.ts
│   │   ├── auth.ts      # getUserIdFromToken（OIDC introspection/validate_token）
│   │   ├── artworks-data.ts
│   │   ├── image-compress.ts    # 上传图片压缩
│   │   ├── image-utils.ts      # 图片 Buffer 获取
│   │   ├── painting-client.ts  # HF Space 推理调用
│   │   └── styles-data.ts       # 27 流派常量
├── stores/
│   └── artwork.ts
```

---

## 快速开始

### 环境要求

- Node.js 18+
- Yarn

### 启动

```bash
yarn install
yarn dev
```

访问 http://localhost:3000

在线推理地址 https://huggingface.co/spaces/YQYDarkrai/artmind_gradio

MongoDB Cluster地址 https://cloud.mongodb.com/v2/69af790af0f890256658c274#/clusters/detail/artmind

### 构建与检查

```bash
npm run build
```

运行 `npm run lint` 进行 ESLint 校验；`npm run build` 前会自动执行 `scripts/clear-oss-ts.mjs` 清理 ali-oss 依赖。

---

## AI 风格分类配置

当前使用 **Hugging Face Space** 部署 keremberke/yolov8m-painting-classification（27 种艺术流派）。本地 Python 推理服务（`server/python`）已移除，见下方「已移除模块」说明。

1. 部署 HF Space 或使用已有 Space URL
2. 在 `.env` 添加：
   ```
   PAINTING_INFERENCE_URL=https://your-space.hf.space
   ```
3. 运行 `yarn dev`，上传图片即可使用流派分类。

**可选环境变量**：`PAINTING_PREDICT_PATH` — 预测接口路径，默认 `/predict`

### 存储与部署

**MongoDB Atlas**：作品数据存储。环境变量 `MONGODB_URI`（或 `NUXT_MONGODB_URI`）。

**阿里云 OSS**：上传图片存储。环境变量：
- `OSS_REGION`（如 `oss-cn-hangzhou`）
- `OSS_BUCKET`（如 `artmind`）
- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`

OSS 目录结构（非根目录，按业务分前缀）：
```
{BUCKET}/
├── temp/               # 分析/上传临时文件（未保存到画廊），配置生命周期自动清理
│   └── {uuid}.{ext}
├── artworks/           # 持久化作品图片（仅「保存到画廊」后）
│   └── {uuid}.{ext}
└── avatars/            # 用户头像（Authing 登录后点击头像选择图片上传）
    └── {userId}.{ext}
```

**temp/ 生命周期规则**（需在 OSS 控制台配置，否则未保存图片会持续占用存储产生费用）：
1. 登录 [OSS 管理控制台](https://oss.console.aliyun.com/)
2. 选择 Bucket → 左侧 **数据管理** → **生命周期**
3. 点击 **创建规则**
4. 配置：**按前缀匹配** `temp/`；**过期天数** 1 天；**删除文件** 勾选；**启用**
5. 规则创建后约 24 小时内生效，此后每天北京时间 8:00 执行，自动删除 temp/ 下超过 1 天的对象

**上传图片自动压缩**：所有上传至 OSS 的图片（JPEG/PNG/WebP）会在服务端自动压缩至 1MB 以内，兼顾质量与存储成本。非图片或压缩失败时原样存储。

未配置 OSS 时，上传接口返回 503。

**Authing**：用户登录与个人资料。环境变量：
- `NUXT_PUBLIC_AUTHING_APP_ID`
- `NUXT_PUBLIC_AUTHING_DOMAIN`（如 `https://artmind.authing.cn`）
- `NUXT_PUBLIC_AUTHING_USER_POOL_ID`
- `AUTHING_SECRET`（Management API 更新头像/昵称，可选）

**Vercel 部署**：在 Vercel 项目 Settings → Environment Variables 中设置 `PAINTING_INFERENCE_URL`、`MONGODB_URI`、Authing 变量及上述 OSS 变量，作用环境勾选 Production、Preview。HF Space 冷启动约 2–3 分钟，已通过 maxDuration 配置适配。

---

## 已移除模块：server/python

**移除日期**：2025-03-09。原因：当前使用 HF Space 部署推理，无需本地 Python 服务。

原 `server/python/` 内含：
- **painting_inference**：本地艺术流派推理（FastAPI + YOLO），可替代 HF 调用
- **engine**：ArtNet/InceptionV4 训练与测试
- **spiders**：美术网、花瓣网爬虫

**恢复方式**：若需本地推理或训练，可从 git 历史还原：
```bash
git checkout <移除前的 commit> -- server/python
```

---

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/classify` | 图片风格分类（支持 multipart 或 JSON imageUrl） |
| POST | `/api/upload` | 上传图片 |
| GET | `/api/artworks` | 获取作品列表 |
| POST | `/api/artworks` | 新增作品（需鉴权） |
| PUT | `/api/artworks/:id` | 更新作品（likes 需鉴权，仅可修改自己的收藏） |
| POST | `/api/avatar` | 头像上传（需鉴权） |
| PUT | `/api/user/profile` | 用户资料（头像、昵称）更新（需鉴权） |
| GET | `/api/painters` | 艺术家列表（含 verified） |
| GET | `/api/models` | 流派列表（27 种艺术流派名） |
| GET | `/api/style-covers` | 流派封面映射 |

---

## 路线图 / 待接入

**前端与数据**
- [x] 画廊：流派展区、艺术家名录、搜索筛选（单横线样式）
- [x] 作品页：AnalysisResultPanel 分析面板抽离（2026-03）
- [ ] 作品展示

**后端与云**
- [x] MongoDB Atlas 接入
- [x] 阿里云 OSS 接入
- [x] Authing 认证接入（OIDC 登录、个人主页、保存作品、收藏）

**AI 与部署**
- [x] Hugging Face Space（keremberke 艺术流派），原始输出展示
- [x] `server/python` 已移除（改用 HF Space）
- [ ] 若需自建推理：可从 git 恢复 `server/python` 或拆出独立服务

---

## 迁移说明

- **`old/` 目录已删除**，旧版 Vue SPA + Flask 代码不再保留。
- **`server/python/` 已删除**（2025-03-09）：改用 HF Space，本地 Python 推理不再需要。恢复方式见上方「已移除模块」。
- **组件精简**（2026-03）：移除 GalleryStyleStrip、GalleryPainterMarquee、ArtworkImageViewer；抽离 AnalysisResultPanel、PainterCards；画廊搜索框改为单横线样式。
- **画家数据**：`painters-list.ts` 为唯一数据源，风格→画家映射由运行时推导。

---

## 开发历程（项目总结）

基于初版静态 UI 按阶段推进，各阶段均已完成核心功能。

**阶段一：交互与数据联通**  
画廊流派展区、艺术家名录与筛选、27 种流派说明（从 styles-data 推导）。

**阶段二：AI 能力接入**  
接入 keremberke/yolov8m-painting-classification（HF Space），分析结果含 rawLabels；server/python 已移除。

**阶段三：后端与云**  
MongoDB Atlas、阿里云 OSS、Authing 认证；个人主页（分析记录、我的画廊、我的收藏）、头像/昵称编辑、作品收藏（likes 鉴权）、Toast 提示。

**待规划**：权限与审核机制、uploads/analysis_logs 模型、用户主页聚合 API（分页/筛选）、作品编辑、生产部署细化。
