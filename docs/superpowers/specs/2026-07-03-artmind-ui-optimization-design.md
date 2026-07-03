# ArtMind UI 优化设计 Spec

> 日期：2026-07-03  
> 状态：已批准，进入实施

## 已锁定决策

| 项         | 决策                                                       |
| ---------- | ---------------------------------------------------------- |
| 分析面板   | C 方案：Hero 分区 + 双语展签 + 确认纸卡                    |
| Hero 排版  | 中文主标题 + italic 英文副标 + 右对齐置信度 + 金渐变进度条 |
| 保存可见性 | 默认私密（`isPublic: false`），用户主动公开                |
| 画廊筛选   | Sticky 馆藏索引：封面 tile 横滑 + 画家 pill 搜索           |
| 暂缓       | 评论、他人主页                                             |
| 赛道 B     | B1：style_corrections + analysis_logs                      |

## Phase 1 — UI

- AnalysisResultPanel 拆分为 Hero / PainterStrip / ConfirmCard
- 画廊 GalleryFilterPanel + StyleTileStrip + PainterSearch
- RelatedArtworksStrip（分析完成 resolved 态）
- 关闭昵称编辑

## Phase 2 — 轻量闭环

- 默认私密保存 + 公开 switch
- 已保存作品改标题 / 公开 toggle
- 个人页私密角标

## Phase 3 — 数据飞轮 B1

- `artmind.style_corrections` 表
- 保存 / 更新分析时写入 correction
- `analysis.put` 补 auth
