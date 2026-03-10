# ArtMind

最懂你的 AI 绘画分析引擎。上传画作图片，获取风格分类、可能画家与多维度分析，并浏览画廊中的艺术作品。

---

## 项目简介

ArtMind 是一个由 AI 驱动的 Web 应用。初版已实现首页分析、画廊展示与流派说明；当前使用 keremberke/yolov8m-painting-classification（HF Space）进行艺术流派分类，需配置 PAINTING_INFERENCE_URL。

当前为原型阶段，使用本地 JSON 存储。功能现状与规划见下方双栏表。

---

## 功能概览

| 当前实现 | 规划中 |
|----------|--------|
| **首页**：视差背景、分析/上传、换一张、流派说明 | — |
| **分析结果**：流派 + 置信度、StyleRingChart、可能画家卡片、**模型原始输出**、保存到画廊 | — |
| **画廊**：流派展区、艺术家名录（含认证标识） | 作品展示、作品编辑 |
| **流派说明**：AI 可识别的 27 种艺术流派列表 | — |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、Nuxt 3、Vuetify 3、Pinia |
| 后端 | Nitro（API 路由） |
| 存储 | 本地 JSON（`server/data/`） |
| AI | Hugging Face Space（keremberke/yolov8m-painting-classification 艺术流派），需配置 PAINTING_INFERENCE_URL |

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
│   └── home.vue
├── pages/
│   ├── index.vue        # 首页 + 分析
│   └── gallery.vue      # 画廊（含流派说明、艺术家名录）
├── server/
│   ├── api/             # API 路由
│   │   ├── classify.post.ts
│   │   ├── upload.post.ts
│   │   ├── artworks/    # GET/POST/PUT
│   │   ├── painters/
│   │   ├── models/      # GET（流派列表）
│   │   ├── style-covers/ # GET（流派封面映射）
│   │   └── classic-artworks/  # GET
│   ├── data/            # JSON 数据
│   │   ├── painters-list.json   # 画家详情（唯一画家数据源）
│   │   └── classic-artworks.json
│   ├── utils/
│   │   ├── classifier.ts
│   │   ├── painter-mapping.ts
│   │   ├── storage.ts
│   │   ├── artworks-data.ts
│   │   ├── classic-artworks-data.ts
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

---

## AI 风格分类配置

当前使用 **Hugging Face Space** 部署 keremberke/yolov8m-painting-classification（27 种艺术流派）。本地 Python 推理服务（`server/python`）已移除，见下方「已移除模块」说明。

1. 部署 HF Space 或使用已有 Space URL
2. 在 `.env` 添加：
   ```
   PAINTING_INFERENCE_URL=https://your-space.hf.space
   ```
3. 运行 `yarn dev`，上传图片即可使用流派分类。

**可选环境变量**（Gradio Space 兼容）：
- `PAINTING_PREDICT_PATH`：预测接口路径，默认 `/predict`
- `PAINTING_USE_GRADIO_API`：设为 `true` 时使用 Gradio upload + predict_ui 流程

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
| POST | `/api/artworks` | 新增作品 |
| PUT | `/api/artworks/:id` | 更新作品（如 likes） |
| GET | `/api/painters` | 艺术家列表（含 verified） |
| GET | `/api/models` | 流派列表（27 种艺术流派名） |
| GET | `/api/style-covers` | 流派封面映射 |
| GET | `/api/classic-artworks` | 经典作品列表 |

---

## 路线图 / 待接入

**前端与数据**
- [x] 画廊：流派展区、艺术家名录
- [ ] 作品展示

**后端与云**
- [ ] MongoDB Atlas 接入
- [ ] 阿里云 OSS 接入
- [ ] Auth0 认证接入

**AI 与部署**
- [x] Hugging Face Space（keremberke 艺术流派），原始输出展示
- [x] `server/python` 已移除（改用 HF Space）
- [ ] 若需自建推理：可从 git 恢复 `server/python` 或拆出独立服务

---

## 迁移说明

- **`old/` 目录已删除**，旧版 Vue SPA + Flask 代码不再保留。
- **`server/python/` 已删除**（2025-03-09）：改用 HF Space，本地 Python 推理不再需要。恢复方式见上方「已移除模块」。
- **画家数据**：`painters-list.json` 为唯一数据源，风格→画家映射由运行时推导。
