# ArtMind 待办（仅保留未完成任务）

## 部署与运维

- [ ] **YQYHub 与生产验收**：在 YQYHub 执行 `artmind` migration、Exposed schemas 加 `artmind`、启用 GitHub OAuth 与 Redirect URLs；Vercel 配置 YQYHub 的 Supabase 三项 env 并 Redeploy；确认 OSS `temp/` 生命周期；冒烟测试 classify / upload / GitHub 登录 / 收藏

## 用户与权限

- [ ] **权限控制与审核员机制**：使用 `profiles.role`（user / moderator / admin）与 `artworks.status` 实现作品公开审核、违规处理流程

## 数据模型

- [x] **uploads 模型**：Postgres `uploads` 表 + Nitro upload 写入
- [x] **analysis_logs 模型**：Postgres `analysis_logs` 表 + classify 成功后写入
- [ ] **用户主页聚合 API**：分页、筛选、统计（当前为客户端 Supabase 分查询，可优化为单一 RPC/API）

## 功能

- [ ] **作品编辑**：已保存作品支持修改标题、公开性等

---

详细背景与配置说明见 [README.md](./README.md)。
