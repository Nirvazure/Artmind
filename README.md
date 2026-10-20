# ArtMind

最懂你的 AI 绘画分析引擎。上传画作，获取 27 种艺术流派分类、可能画家与多维度分析，并浏览、收藏画廊中的作品。

---

## 功能概览

| 模块                     | 说明                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| **首页** `/`             | 随机跳转至某件公开作品，沉浸式浏览（画作居中 + 背景模糊）                                 |
| **作品页** `/:id`        | 浏览态展示作品；`?analyse=true` 进入分析态：上传 → AI 分类 → 修正流派/画家 → 默认私密保存 |
| **画廊** `/gallery`      | 社区与收藏切换，支持流派缩略图循环筛选，统一展示作品信息与上传者头像                      |
| **个人主页** `/user/:id` | 全宽展示个人资料，可切换分析记录与上传画作，管理作品公开性；使用 GitHub 头像并查看收藏    |
| **认证**                 | Supabase Auth + GitHub OAuth；保存作品、收藏需登录                                        |

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
| 后端       | Nitro（AI 分类、图片压缩、Storage 写入）                    |
| 认证与数据 | YQYHub Supabase Auth + `artmind` schema Postgres（RLS）     |
| 图片存储   | Supabase Storage，公开桶 `Artmind`（temp / artworks）       |
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
│   ├── GalleryFilterPanel.vue     # 社区/收藏切换与流派筛选标签
│   ├── GalleryStyleRail.vue        # 流派缩略图循环导览，悬停显示流派信息
│   ├── RelatedArtworksStrip.vue
│   ├── ToastSnackbar.vue
│   └── UserProfileHeader.vue
├── composables/
│   ├── useAuth.ts                 # Supabase Auth + profiles
│   ├── useArtworkMapper.ts
│   ├── useUserArtworks.ts
│   ├── useClassifier.ts
│   └── useToast.ts
├── layouts/home.vue               # 全局 App Bar、导航与登录入口
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
└── server/
    ├── api/
    │   ├── classify.post.ts
    │   ├── upload.post.ts
    │   ├── artworks/
    │   │   ├── index.post.ts      # 保存作品（temp → artworks）
    │   │   └── [id]/analysis.put.ts
    │   ├── painters/
    │   ├── models/                # 27 流派列表
    │   └── style-covers/
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

- Node.js 22.18+（推荐 24；维护脚本及测试直接运行 TypeScript）
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
yarn build          # 生产构建
yarn preview        # 预览生产构建
yarn lint           # ESLint
yarn lint:fix       # 自动修复
yarn format         # Prettier 全项目格式化
yarn format:check   # Prettier 检查
yarn typecheck      # 类型检查
yarn test           # Node 单元测试
yarn storage:cleanup # 临时文件清理预览（不会删除）
```

### 提交前自动格式化

项目根目录的 `.prettierrc.json` 统一规定格式，`.prettierignore` 排除依赖、构建产物、环境文件、日志及运行时数据。执行 `yarn install` 时会通过 `prepare` 脚本安装 Husky 提交钩子。

每次 `git commit` 前，钩子先执行 `prettier --write .` 格式化全项目，再通过 `lint-staged` 检查并修复暂存文件。代码文件先运行 ESLint，再运行 Prettier；CSS、JSON、Markdown 和 YAML 文件运行 Prettier。任一步失败都会阻止提交。

全项目格式化也会更新未暂存文件，但不会自动将它们加入提交；如需一并提交，请先手动检查并暂存。部分暂存文件仍由 `lint-staged` 保留其未暂存改动。

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

```

也支持 `NUXT_PUBLIC_SUPABASE_*`、`NUXT_PAINTING_INFERENCE_URL` 等 Nuxt 前缀别名，详见 `nuxt.config.ts`。

---

## 数据与存储

### Supabase Postgres（`artmind` schema）

| 表                         | 用途                                       |
| -------------------------- | ------------------------------------------ |
| `profiles`                 | 用户资料（display_name、avatar_url、role） |
| `artworks`                 | 作品（含 analysis_result jsonb）           |
| `artwork_likes`            | 收藏关系                                   |
| `uploads`                  | 上传流水（temp 路径、过期时间）            |
| `analysis_logs`            | 分析流水                                   |
| `knowledge_styles`         | 流派知识卡（模型英文标识为主键）           |
| `knowledge_painters`       | 画家资料、目录关联及肖像元数据             |
| `knowledge_style_painters` | 知识卡代表画家关系与展示顺序               |

画廊列表、收藏、资料更新由**客户端直连 Supabase**（RLS 保护）。Nitro 负责 classify / upload / 保存作品 / 更新分析结果。头像使用 GitHub 提供的 HTTPS 地址，`profiles.avatar_url` 作为社区、收藏及他人主页的展示缓存；不再提供头像文件上传。

### Supabase Storage

```
Artmind/
├── temp/       # 临时文件（未保存到画廊）
├── artworks/   # 持久化作品
├── painters/   # 有来源与许可记录的画家肖像
└── vincent.jpg # 分析加载图
```

- 沿用现有 Supabase 项目，桶名严格为 `Artmind`，设为公开。图片链接可公开访问，作品列表继续由数据库 RLS 控制。
- 上传通过 Nitro，服务端管理密钥不发给浏览器；检查共享项目的 Storage 策略，确保客户端无本桶写入权限。可在 SQL Editor 执行 [`003_storage_write_guard.sql`](supabase/migrations/003_storage_write_guard.sql)。
- 保存作品时从 `temp/` 复制到 `artworks/`，保留原临时对象。上传尝试压缩到 1MB；压缩失败时保留原文件，需相应设置桶大小限制。MIME 根据实际图片内容识别。
- 临时文件手动清理：先暂停上传和保存，运行 `yarn storage:cleanup` 预览；确认后运行 `yarn storage:cleanup --apply`。仅删除超过 24 小时的 `temp/` 对象，跳过作品、资料、流派修正的直接引用；流水记录保留。
- 迁移文件的原始时间从 `.storage-migration/manifest.json` 读取，也可通过 `--manifest <path>` 指定；新文件使用上传时间。迁移与回滚说明见 [`docs/storage-migration.md`](docs/storage-migration.md)。

---

## AI 风格分类

使用 Hugging Face Space 部署 [keremberke/yolov8m-painting-classification](https://huggingface.co/keremberke/yolov8m-painting-classification)，识别 27 种艺术流派。

1. 部署或使用已有 Space URL（参考：[artmind_gradio](https://huggingface.co/spaces/YQYDarkrai/artmind_gradio)）
2. 设置 `PAINTING_INFERENCE_URL`
3. 在作品页 `?analyse=true` 上传并分析

分类结果经代码中的模型标签映射为中文流派名，并按 Supabase 当前画家目录关联画家；这些关联不表示作品作者概率。目录服务故障时仍返回正常分类结果和空画家数组，保存流程不依赖知识资料。

### 流派知识与画家资料

分析结果下方和画廊选中流派后，可阅读流派背景知识卡。卡片默认收起，点击整行“流派背景知识”可展开全部简介、时期、典型特征、代表画家、来源及核验日期，再次点击可整体收起；点击目录中的画家可查看资料与肖像。画家列表依据流派目录关联，顺序不代表作品作者概率，背景知识也不等于对当前图片的具体观察。

知识资料使用 AnySearch 检索、阅读权威来源并概括整理，唯一持久数据源为 Supabase 的三张 `knowledge_*` 表；网站通过 Nitro 只读接口获取内容，不调用搜索或生成服务。维护者可在 Dashboard 修改资料，无需重新部署；更新前重新阅读来源正文，并同步修订来源、核验说明和日期。模型类别及中文标签映射继续由代码维护。

服务端实例共用一次完整资料读取，并合并并发请求；成功结果缓存 5 分钟，刷新失败时最多展示 30 分钟内的旧资料并通过响应头标明缓存状态。无可用缓存时接口返回 503，页面局部展示错误和重试，分析、保存与画廊主体继续可用。前端缓存 5 分钟，重新进入页面或手动重试时更新；已打开页面不实时订阅后台修改。迁移、后台编辑与验收说明见 [知识资料数据库维护](docs/art-knowledge-migration.md)。

“资料已核验”表示已核查资料和目录关联的来源，不能用于作品作者归属或真伪鉴定；存在未解决问题的记录明确显示待确认及原因。历史作品保存的画家名称保留兼容匹配，规范译名仅影响展示。核验记录见 [艺术资料审查](docs/art-knowledge-audit.md)，流派来源说明见 [流派资料来源](docs/style-knowledge-sources.md)。

画家肖像使用单独的 `Artmind/painters/` 存储前缀，压缩成不超过 **500,000 字节**的 WebP，保留来源、许可和署名。图片不可用时显示姓名首字。肖像导入和覆盖情况见 [画家头像](docs/painter-portraits.md)，馆藏代表作入口列于 [待办](docs/TODO.md)。

---

## API 概览

| 方法 | 路径                         | 说明                                     |
| ---- | ---------------------------- | ---------------------------------------- |
| POST | `/api/classify`              | 风格分类（multipart 或 JSON `imageUrl`） |
| POST | `/api/upload`                | 上传至 `Artmind/temp/`                   |
| POST | `/api/artworks`              | 新增作品（需鉴权，temp → artworks）      |
| PUT  | `/api/artworks/:id/analysis` | 更新作品分析结果                         |
| GET  | `/api/painters`              | 艺术家列表                               |
| GET  | `/api/style-knowledge`       | 按规范流派名索引的知识资料               |
| GET  | `/api/models`                | 27 种流派名                              |
| GET  | `/api/style-covers`          | 流派封面映射                             |

画廊 CRUD、收藏、资料更新走 **Supabase 客户端 + RLS**，不经 Nitro REST。

---

## Vercel 部署

1. 关联 Git 仓库，Framework Preset 选 **Nuxt**
2. 配置全部环境变量（Production + Preview）
3. 确认公开桶 `Artmind` 和客户端写入限制，按需手动清理 `temp/`
4. 修改 Supabase 变量后须 **Redeploy**
5. 构建命令：`yarn build`

**Serverless 兼容处理：**

- 知识数据由服务端使用服务密钥读取；新增表与内部函数不开放给匿名或普通登录用户，服务密钥不进入浏览器。
- HF Space 冷启动约 2–3 分钟，`maxDuration` 已设为 180s

---

## 参考链接

- 在线推理 Space：https://huggingface.co/spaces/YQYDarkrai/artmind_gradio
- YQYHub 公用 Auth 规范：[docs/yqyhub-shared-auth.md](docs/yqyhub-shared-auth.md)

---

## 历史说明

- **2025-03**：移除 `server/python` 本地推理，改走 Hugging Face Space
- **2026-06**：认证迁移 Authing → Supabase Auth；数据迁移 MongoDB → Supabase Postgres
