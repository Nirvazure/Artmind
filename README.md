# ArtMind

最懂你的 AI 绘画分析引擎。上传画作图片，获取风格分类、可能画家与多维度分析，并浏览画廊中的艺术作品。

---

## 项目简介

ArtMind 是一个由 AI 驱动的 Web 应用。初版已实现首页分析、画廊展示与模型管理界面；阶段一已完成瀑布流、艺术家筛选、作品删除及模型持久化。

当前为原型阶段，使用本地 JSON 存储；AI 分类已接入 Hugging Face（router 新端点）与 Replicate，未配置 Token 时回退 Mock。**注意**：当前使用的 HF/Replicate 模型为通用 ImageNet 物体分类（如 comic book、sandbar），非艺术流派分类，映射到流派后结果仅供参考。功能现状与规划见下方双栏表。

---

## 功能概览

| 当前实现 | 规划中 |
|----------|--------|
| **首页**：视差背景、分析/上传、换一张、流派说明 | — |
| **分析结果**：流派 + 置信度、StyleRingChart、可能画家卡片、**模型原始输出**、保存到画廊 | — |
| **画廊**：Hero 轮播、艺术家名录（Marquee，含认证标识）、瀑布流、艺术家筛选、作品删除 | 作品编辑 |
| **流派说明**：AI 可识别的 27 种艺术流派列表 | — |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、Nuxt 3、Vuetify 3、Pinia |
| 后端 | Nitro（API 路由） |
| 存储 | 本地 JSON（`server/data/`） |
| AI | Hugging Face Space（keremberke/yolov8m-painting-classification 艺术流派）或 Replicate；未配置时 Mock |

---

## 项目结构

```
ArtMind/
├── app.vue
├── nuxt.config.ts
├── package.json
├── components/           # 可复用组件
│   ├── GalleryPainterMarquee.vue
│   ├── GalleryStyleStrip.vue
│   └── StyleRingChart.vue
├── composables/
│   └── useClassifier.ts
├── layouts/
│   ├── default.vue
│   └── home.vue
├── pages/
│   ├── index.vue        # 首页 + 分析
│   ├── gallery.vue      # 画廊
│   └── engine.vue       # 流派说明
├── server/
│   ├── api/             # API 路由
│   │   ├── classify.post.ts
│   │   ├── upload.post.ts
│   │   ├── artworks/    # GET/POST/PUT/DELETE
│   │   ├── painters/
│   │   ├── models/      # GET（流派列表）
│   │   └── classic-artworks/  # GET/DELETE
│   ├── data/            # JSON 数据
│   │   ├── painters-list.json   # 画家详情（唯一画家数据源）
│   │   └── classic-artworks.json
│   ├── utils/
│   │   ├── classifier.ts
│   │   ├── painter-mapping.ts
│   │   ├── storage.ts
│   │   ├── artworks-data.ts
│   │   ├── classic-artworks-data.ts
│   │   ├── hf-client.ts
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

---

## AI 风格分类配置（可选）

当前使用 **Hugging Face Space** 部署 keremberke/yolov8m-painting-classification（27 种艺术流派）。本地 Python 推理服务（`server/python`）已移除，见下方「已移除模块」说明。

### 方案 0：Hugging Face Space（推荐）

1. 部署 HF Space 或使用已有 Space URL
2. 在 `.env` 添加：
   ```
   PAINTING_INFERENCE_URL=https://your-space.hf.space
   ```
3. 运行 `yarn dev`，上传图片即可使用流派分类。

### 方案 A：Replicate（ImageNet 物体识别，非流派）

1. 在 [Replicate](https://replicate.com/account/api-tokens) 创建 API Token
2. 在项目根目录 `.env` 添加：
   ```
   REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxx
   ```
3. 使用模型：`bfirsh/resnet`（ResNet-50 ImageNet，约 $0.002/次）

### 方案 B：Hugging Face（免费额度）

**旧端点** `api-inference.huggingface.co` 已 410 弃用，需使用 **router** 新端点。

1. [Hugging Face Tokens](https://huggingface.co/settings/tokens)，勾选 **Inference Providers**
2. `.env` 添加：`HUGGINGFACE_TOKEN=hf_xxx`
3. （可选）`HF_MODEL_ID=其他模型ID`，默认 `microsoft/resnet-50`

**当前限制**：HF 上可用的图像分类模型多为 ImageNet 通用物体识别，非艺术流派。输出需经 `HF_TO_STYLE` 映射，结果仅供参考。未配置 Painting 服务或 HF/Replicate Token 时，分析接口将返回 Mock 结果。

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
并恢复 `package.json` 中的 `painting:serve` 脚本。

---

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/classify` | 图片风格分类（支持 multipart 或 JSON imageUrl） |
| POST | `/api/upload` | 上传图片 |
| GET | `/api/artworks` | 获取作品列表 |
| POST | `/api/artworks` | 新增作品 |
| PUT | `/api/artworks/:id` | 更新作品（如 likes） |
| DELETE | `/api/artworks/:id` | 删除用户作品 |
| GET | `/api/painters` | 艺术家列表（含 verified） |
| GET | `/api/models` | 流派列表（27 种艺术流派名） |
| GET | `/api/classic-artworks` | 经典作品列表 |
| DELETE | `/api/classic-artworks/:id` | 删除经典作品 |

---

## 路线图 / 待接入

**前端与数据**
- [x] 画廊：瀑布流、艺术家筛选、作品删除
- [x] 流派说明页（27 流派，替代原模型管理）

**后端与云**
- [ ] MongoDB Atlas 接入
- [ ] 阿里云 OSS 接入
- [ ] Auth0 认证接入

**AI 与部署**
- [x] Hugging Face Space（keremberke 艺术流派）+ Replicate 接入，原始输出展示
- [x] `server/python` 已移除（改用 HF，见 TODO）
- [ ] 若需自建推理：可从 git 恢复 `server/python` 或拆出独立服务

---

## 迁移说明

- **`old/` 目录已删除**，旧版 Vue SPA + Flask 代码不再保留。
- **`server/python/` 已删除**（2025-03-09）：改用 HF Space，本地 Python 推理不再需要。恢复方式见上方「已移除模块」。
- **画家数据**：`painters-list.json` 为唯一数据源，风格→画家映射由运行时推导。
