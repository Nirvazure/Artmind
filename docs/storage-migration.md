# OSS → Supabase Storage 迁移记录

## 已执行

- 现有 Supabase 项目中创建公开桶 **`Artmind`**，保留原对象 key。
- 盘点 OSS 共 48 个对象；迁移 45 个 `artworks/` 文件和 `vincent.jpg`，共 **46 个、9,893,076 字节**。盘点时无 `temp/` 文件，无缺失引用或范围外业务文件。
- 两个旧 `avatars/` 文件按确认范围排除，继续保留在 OSS；应用仅使用 GitHub 头像。两个用户资料中的头像原本都是 GitHub 地址，无需更新。
- 每个文件经下载、上传、公开读取，校验大小、SHA-256 和实际内容 MIME；原字节已另存于本机备份目录。文件名后缀与实际编码不一致时使用实际 MIME。
- 按主键和原 URL 匹配更新：`artworks.image_url` 46 条、`style_corrections.image_url` 27 条，共 **73 条**。`profiles.avatar_url`、`uploads.temp_path`、`analysis_logs.image_url` 更新数均为 0。原 URL 和每次更新状态保存于本机清单。
- 地址替换后再次通过公开 URL 下载全部 46 个文件，大小与 SHA-256 均一致；五个字段中剩余 OSS 地址为 **0**（2026-10-19 核验）。
- 真实存储冒烟检查通过：上传、`temp/` 复制到 `artworks/`、重复复制、原临时文件保留、公开读取、JPEG 字节使用 `image/jpeg`（即使扩展名为 PNG）、外部 URL 保持原样。两张生成的测试文件已删除，没有写入业务记录。
- 清理脚本只读预览结果为空；没有执行临时文件批量删除。匿名客户端上传被 RLS 拒绝。
- OSS 源文件均保留；共享 Supabase 项目中的其他桶未修改。
- 本地 ESLint、Prettier、类型检查、58 项测试和生产构建通过；独立代码复核无待修复项。构建保留现有 Browserslist 数据过旧、较大 chunk 及 Node 依赖弃用提示。

完整对象清单、哈希、核验时间、原 URL、原始字节和环境配置备份位于本机 **`.storage-migration/`**。该目录被 Git、ESLint 和 Prettier 忽略，含敏感备份，不要提交或公开。

## 部署前仍需操作

本次 Vercel 连接返回所属团队权限不足（403）；按确认，**线上部署和环境变量清理由你手动执行**。在切换结束前暂停使用，关闭旧页面，避免旧部署产生新的 OSS 文件或地址。

1. 在 Supabase SQL Editor 执行 [`003_storage_write_guard.sql`](../supabase/migrations/003_storage_write_guard.sql)。现有权限只能验证匿名写入被拒绝，无法读取共享项目全部 Storage 策略。此 SQL 用限制性策略拦截 `anon`、`authenticated` 对 `Artmind` 的新增、修改及删除，其他桶仍遵从原策略，服务端 `service_role` 可继续写入。
2. 部署本次代码。保留 `PAINTING_INFERENCE_URL`、`SUPABASE_URL`、`SUPABASE_KEY`、`SUPABASE_SERVICE_ROLE_KEY`。管理密钥仅在服务端使用；桶名在代码中固定为 `Artmind`，无需新增桶密钥。
3. 手动体验：新上传、分析、保存画廊、再次分析已保存作品；私人/社区/收藏图片展示；退出后重新通过 GitHub 登录并检查头像。尚未以浏览器验证这些完整用户流程。
4. 新部署验收成功后，从部署环境删除 `OSS_REGION`、`OSS_BUCKET`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`，再重新部署。**旧部署仍运行时不要先删除。** 应用源码、依赖、打包配置及示例环境文件已移除 OSS 逻辑。
5. 自验收成功起至少保留 OSS 永久文件、旧部署及本机备份 **7 天**；本次不删除源文件、不撤销阿里云凭据。旧 OSS 临时图仍可能受原生命周期影响。

## 手动清理临时文件

要求 Node.js 22.18+（推荐 24），从项目根目录运行。先暂停上传、分析和保存，避免引用检查与删除之间出现新引用。

```sh
yarn storage:cleanup
yarn storage:cleanup --apply
# 清单转移到其他安全位置后：
yarn storage:cleanup --manifest /secure/path/manifest.json
```

默认只预览，显式 `--apply` 才通过 Storage API 删除。仅处理本桶 `temp/` 中严格超过 24 小时的对象；迁移对象使用清单中的原始修改时间，新对象使用上传时间。作品、用户资料或流派修正直接引用的对象跳过；年龄未知的对象跳过。上传及分析流水不删，历史临时链接过期后可能失效。

## 本机核验与回滚

本次一次性搬运工具保留在忽略目录中，不作为应用依赖发布。数据库核验及回滚按清单限定项目和桶，不需要 OSS SDK 或 OSS 环境变量：

```sh
node --experimental-strip-types --loader ./tests/ts-extension-loader.mjs .storage-migration/migrate.mjs verify
# 仅在仍暂停使用、需要回退本次迁移时执行：
node --experimental-strip-types --loader ./tests/ts-extension-loader.mjs .storage-migration/migrate.mjs rollback --apply
```

回滚按主键和本次写入值逐条匹配，仅恢复清单记录的 URL 字段，遇到并发修改会停止；不会恢复整库或删除任何对象。恢复旧部署时，从安全备份恢复其 OSS 环境配置。

如果恢复使用后产生了新文件，必须先将新增文件复制回 OSS，并核对这些文件及其数据库地址，再回退部署；上述清单只覆盖本次迁移，不能替代新增数据的回迁。Supabase 数据库备份不包含 Storage 文件本体，需要单独保留对象备份。
