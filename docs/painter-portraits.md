# 画家头像导入与维护

头像元数据由 Supabase 的 `artmind.knowledge_painters.portrait` 保存。应用从资料接口读取图片 URL、来源、许可与署名。仓库不保存具体人物候选、逐项头像映射、馆藏作品 ID 或外部清单；历史导入清单由维护者在仓库外保管。

## 外部候选清单

两个导入器均要求 `--manifest <外部 JSON 文件路径>`。清单根节点为数组，每项包含 `name`、`slug`、`id`、`title`、`creator`。其中 `name` 必须匹配已有画家记录，`slug` 是仅用于对象命名的英文标识，`id` 是正整数馆藏对象 ID。题名与创作者必须来自人工核对过的官方记录，不能使用搜索首条结果自动填充。清单不可提交到仓库。

```json
[
  {
    "name": "示例画家",
    "slug": "sample-painter",
    "id": 1,
    "title": "Example Portrait",
    "creator": "Example Maker"
  }
]
```

以上为虚构输入，不能直接用于导入。Met 使用题名前缀和创作者完全匹配，Cleveland 使用题名完全匹配和创作者描述包含匹配；前缀或包含值必须足够具体以识别人工核实的记录。Met 的角色可能为 `Sitter`，不能据此把画中人物当成作品作者。

## 验证与写入流程

```powershell
node --experimental-strip-types scripts/import-met-portraits.ts --manifest C:/private/met-portraits.json
node --experimental-strip-types scripts/import-cleveland-portraits.ts --manifest C:/private/cleveland-portraits.json
```

默认仅核验官方元数据、下载并压缩；不会创建数据库记录或写入存储。加 `--apply` 后使用既有环境中的 Supabase 管理凭证写入；凭证不写入清单或日志。

- 人工检查本人肖像身份、题名、作者角色与图像内容；人物作品、同名人物、画家名片均不能替代本人头像。
- 仅接受官方明确公开领域或 CC0 的图片，并检查对象身份和来源域名；拒绝非图像响应、非预期域名和源站重定向。
- WebP 压缩长边不超过 640 px，严格不超过 500,000 字节。不能达标即报错。
- `--apply` 在获取候选图像前查询 `knowledge_painters(name,portrait)`；记录不存在时报错，已有头像直接跳过。上传前再次确认头像仍为空。
- 存储路径使用 `painters/<slug>-<内容哈希>.webp`，上传 `upsert:false`。已存在对象也必须公开回读，核对完整 SHA-256 和实际字节数。
- 回读成功后仅按 `name` 且 `portrait IS NULL` 条件更新数据库。保存来源、许可、署名、`bytes`、`sha256`、`objectKey`。并发更新先完成时，保留现有头像并报告跳过。
- 工具不会覆盖已有头像、删除旧对象或创建画家。若上传后数据库并发竞争失败，可能留下未引用的哈希对象，需按存储维护流程另行审查，不能自动删除。

## 迁移说明

原有内联候选已从工具中移除；本轮现有候选已转存仓库外压缩备份，核对后清理本机临时目录。历史逐项表、完整元数据与本地头像映射不再在此文档维护。头像元数据迁移至数据库后无需重传既有图片，后续导入直接查询数据库判断是否已存在。

缺图或图片加载失败时，界面继续使用姓名首字回退。尚未找到合适来源不表示没有可用肖像，后续新增仍需逐图核验。
