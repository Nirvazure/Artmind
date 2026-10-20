# 知识资料数据库维护

## 持久数据与权限

知识内容仅保存在现有 Supabase 的 `artmind` schema：`knowledge_styles` 为流派卡，`knowledge_painters` 为画家及肖像资料，`knowledge_style_painters` 为卡片代表画家关系。初次迁移共 27 张卡、53 条画家、15 条头像引用和 61 条代表关系；图片沿用 `Artmind/painters/` 对象。

仓库只保存结构迁移、类型、模型标签和通用工具，不保存完整知识正文、种子数据或静态回退。研究来源与重要修正保留在审计文档，逐条最新核验说明以数据库为准。本机 `.knowledge-migration/` 与 `.storage-migration/` 均被 Git 忽略；本轮真实清单、来源证据与肖像候选清单已转存仓库外压缩备份，逐文件 SHA-256 比对一致后清理临时目录。后续生成的真实数据和导入 SQL 也不得提交。

按顺序执行 `004_art_knowledge.sql`、`005_art_knowledge_constraints.sql`。005 用于收敛初次迁移审查期间完善的约束，可重复执行，不改内容。三表启用 RLS，明确撤销 `PUBLIC`、`anon`、`authenticated` 权限；内部 `get_art_knowledge()` 及验证函数仅服务角色可执行。规则仅作用于新增对象。公开接口由 Nitro 使用服务密钥读取，不向浏览器提供该密钥。

当前项目已完成 004、005 和全量资料导入，并通过逐字段核对。此次发布代码后无需重跑迁移、数据导入或头像上传。部署环境继续使用既有 `SUPABASE_URL`、`SUPABASE_KEY` 和仅服务端可用的 `SUPABASE_SERVICE_ROLE_KEY`，不新增环境变量。部署后检查两个知识接口及页面即可；新建其他 Supabase 环境时才需要另行初始化结构和恢复资料。

## 后台编辑

在 Supabase Dashboard 中选择 `artmind` schema 后编辑对应表。维护前阅读实际来源正文，不凭搜索摘要填写核验结论。

- 流派 `id` 是模型英文类别键，不可改名；中文规范名由代码映射。`summary` 为 100–180 字，`characteristics` 为 3–5 条非空文字，来源必须包含标题、机构与 HTTPS URL。
- 画家 `name` 是历史兼容键，不可修改；译名修订使用 `display_name`。`style_id` 是当前目录的主要关联，可调整，历史作品中的原姓名和保存结果不改写。`sort_order` 决定目录顺序。
- `knowledge_style_painters` 独立维护代表关系，允许跨流派。使用现有外键和非负排序号；关联对象删除受限。每张卡至少保留一个代表画家，服务端会拒绝不完整目录并触发缓存故障行为。
- 来源为 JSON 数组，每项 `{ "title": "…", "institution": "…", "url": "https://…" }`。更新事实时同步 `verification_note`、`verified_at` 与 `verified`；核验状态仅表示已有证据支持当前有限表述。数据库校验不能代替人工核验。
- `portrait` 可为空；非空时保存展示字段及上传校验元数据，不手写未经回读验证的图片引用。新增头像使用 [头像导入工具](painter-portraits.md)。

不新增网站管理页面、编辑 API、草稿或实时订阅。后台更改无需部署内容；新增模型类别仍需修改代码配置。

## 读取与故障行为

`/api/style-knowledge` 继续返回中文规范名索引，`/api/painters` 继续返回数组。两接口与分类目录共用完整快照读取：5 秒数据库超时，每实例成功缓存 5 分钟，并发合并。

刷新失败时，仅可使用最近成功读取后 30 分钟以内的快照。响应头 `X-Art-Knowledge-State` 为 `fresh` 或 `stale`，`X-Art-Knowledge-Fetched-At` 为原始读取时间；`Cache-Control: no-store` 防止代理延长缓存。无缓存或过期时知识接口返回 503，前端提供局部重试。分类仍能成功并返回空画家数组，保存和画廊主体不依赖知识加载。

前端按接口共享 5 分钟内存缓存，重新进入页面或手动重试可刷新；不会将服务端旧缓存的年龄清零。超过 30 分钟移除旧资料，不使用 localStorage、静态内容或其他持久副本。已打开页面不保证实时同步后台编辑。

## 导入、校验与恢复

通用工具只接收外部清单，默认预览。清单结构为 `styles`、`painters`、`representatives` 三个数组，字段与数据库行相同，不含时间戳。

```powershell
node --experimental-strip-types scripts/migrate-art-knowledge.ts --manifest C:/private/knowledge.json
node --experimental-strip-types scripts/migrate-art-knowledge.ts --manifest C:/private/knowledge.json --sql-out .storage-migration/import.sql
node --experimental-strip-types scripts/migrate-art-knowledge.ts --manifest C:/private/knowledge.json --verify
```

输出 SQL 限制在被忽略的 `.storage-migration/` 中，已有文件拒绝覆盖。人工审查后在 SQL Editor 执行整批事务：相同行可重跑，不同内容立即回滚，不覆盖后台编辑；`--verify` 读取内部快照逐字段比较，忽略创建/更新时间，并检查多余记录。日常维护完成后旧迁移清单不再代表最新内容，不要重新导入覆盖维护结果。

切换失败时保留数据库和 Storage，修复读取；必要时人工回退上一部署。回退不回写数据库，不在新代码重新加入静态副本。数据库备份不包含 Storage 文件本体，应分别备份。

## 验收记录

2026-10-20：迁移清单与数据库完整比较通过（27／53／15／61），旧匹配键、正文、顺序、核验信息与肖像上传元数据一致。临时修改一条简介和一个画家主要关联后，用真实数据库和注入时钟验证 5 分钟缓存边界刷新及分类目录更新；两项修改均已恢复，再次全量比较通过。匿名读取、更新及调用内部函数均返回权限拒绝。普通登录角色的限制已在结构 SQL 中声明，本次未使用真实登录会话进行直接访问验收。

78 项 Node 测试、全项目 ESLint、Nuxt 类型检查、生产构建和变更文件 Prettier 检查通过。当前机器没有全局 Yarn，使用 `package.json` 对应的 Node 命令执行。构建仍有 Browserslist 数据过期、包体积及上游包导出格式提示。

生产 HTTP 验证两个知识接口返回 27 张卡、53 条数组记录、15 条头像引用及缓存响应头，且不暴露肖像哈希等校验字段。浏览器通过画廊筛选、空作品流派阅读、整块展开收起、切换重置、资料弹窗、Escape 关闭、移动端 390px 头像与来源布局；来源链接具有新标签属性。故障实例的知识接口返回 503 时，作品列表仍可用，局部错误与重试入口正常。真实模型分析持续等待，本次未确认新分析完成态及登录后的实际保存；原有分析会话、保存权限和 Storage 保存测试通过。

代码检查使用虚构的小样本，真实目录核对仅使用本机清单和数据库。

日常可按以下步骤复验：修改一条简介及一个画家 `style_id`，等待实例缓存满 5 分钟后访问知识卡、资料弹窗和新分类；完成后恢复原值。匿名、普通登录用户均不应直接访问三张表或内部函数。首次失败、短期缓存、30 分钟过期、恢复和并发行为有 Node 测试覆盖。部署仍由维护者手动执行，数据库导入验收后再发布新代码。
