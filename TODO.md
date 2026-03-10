# ArtMind 开发任务

基于初版静态 UI，按阶段推进。每个阶段内按功能模块组织。

---

## 阶段一：交互与数据联通 ✅ 已完成

### 画廊

- [x] 在 gallery.vue 中接入 GalleryMasonry + GalleryArtworkCard，展示经典名画与用户作品（已移除，画廊页现为流派+艺术家）
- [x] 艺术家筛选（按艺术家过滤作品列表，含认证标识与仅认证筛选）
- [x] 流派展区、艺术家名录（编辑暂缓）

### 流派说明

- [x] models.json 已移除，GET /api/models 返回 27 流派名（从 styles-data 推导）
- [x] 流派说明已并入 gallery 流派展区，展示 AI 可识别的 27 种艺术流派

---

## 阶段二：AI 能力接入 ✅ 已完成

### AI 模型

- [x] **艺术流派专用模型**：已接入 keremberke/yolov8m-painting-classification（HF Space）
- [x] 分析结果增加「模型原始输出」展示（rawLabels）

### 部署（可选）

- [x] **server/python 已移除**（2025-03-09）：改用 HF Space，不再本地部署 Python 推理。恢复方式见 README「已移除模块」。
- [ ] 生产环境部署配置（Vercel / Docker 等）

---

## 阶段三：后端与云（暂缓）

### 存储

- [x] MongoDB Atlas 接入，替代 server/data/artworks.json
- [x] 阿里云 OSS 接入，替代本地图片存储

### 认证

- [ ] Auth0 接入，用户登录与作品归属

---

## 参考

- 当前 UI 与规划详见 [README.md](./README.md) 功能概览双栏表
