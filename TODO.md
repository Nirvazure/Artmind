# ArtMind 开发任务

基于初版静态 UI，按阶段推进。每个阶段内按功能模块组织。

---

## 阶段一：交互与数据联通 ✅ 已完成

### 画廊

- [x] 在 gallery.vue 中接入 GalleryMasonry + GalleryArtworkCard，展示经典名画与用户作品（已移除，画廊页现为流派+艺术家）
- [x] 艺术家筛选（按艺术家过滤作品列表，含认证标识与仅认证筛选）
- [x] 作品 CRUD：删除（DELETE API + 前端交互），编辑暂缓

### 流派说明

- [x] models.json 已移除，GET /api/models 返回 27 流派名（从 styles-data 推导）
- [x] engine.vue 改为流派说明页，展示 AI 可识别的 27 种艺术流派

---

## 阶段二：AI 能力接入 ✅ 已完成

### AI 模型

- [x] Hugging Face：旧端点 410 弃用 → 切换至 `router.huggingface.co/hf-inference/models`
- [x] Replicate：bfirsh/resnet 备用（需付费 Token）
- [x] 优先 HF，失败则 Replicate，皆失败则 Mock
- [x] 分析结果增加「模型原始输出」展示（rawLabels）
- [x] **艺术流派专用模型**：已接入 keremberke/yolov8m-painting-classification（HF Space）

### 部署（可选）

- [x] **server/python 已移除**（2025-03-09）：改用 HF Space，不再本地部署 Python 推理。恢复方式见 README「已移除模块」。
- [ ] 生产环境部署配置（Vercel / Docker 等）

---

## 阶段二续：艺术流派分析（下一步）

### 核心问题

当前模型（microsoft/resnet-50、google/vit-base-patch16-224、bfirsh/resnet）输出的是 **ImageNet 1000 类物体标签**（如 comic book、sandbar、tabby cat），不是艺术流派。经 `HF_TO_STYLE` 映射后大多落至 fallback「印象派」，结果不合理。

### 待选方案（需进入创新模式详议）

1. **HF Zero-Shot Image Classification**：CLIP 类模型 + 流派文本 prompt，无需专用训练
2. **HF/Replicate 艺术流派专用模型**：寻找 Artbench 或类似 fine-tuned 模型，确认其在 router/Replicate 上可用
3. **自训 ArtNet / InceptionV4**：可从 git 恢复 `server/python/engine` 后，在 Artbench 等数据集上训练，拆出推理服务
4. **第三方艺术分析 API**：如 Google Vision、Clarifai 等是否有流派能力

---

## 阶段三：后端与云（暂缓）

### 存储

- [ ] MongoDB Atlas 接入，替代 server/data/*.json
- [ ] 阿里云 OSS 接入，替代本地图片存储

### 认证

- [ ] Auth0 接入，用户登录与作品归属

---

## 参考

- 当前 UI 与规划详见 [README.md](./README.md) 功能概览双栏表
