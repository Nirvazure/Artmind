import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  validateKnowledgeManifest,
  generateKnowledgeImportSql,
  compareKnowledgeManifests,
  sqlJson,
  type KnowledgeManifest,
} from '../scripts/lib/knowledge-migration'

function fixture() {
  const source = {
    title: 'Test museum',
    institution: 'Museum',
    url: 'https://museum.example/article',
  }
  return {
    styles: [
      {
        id: 'Example_Style',
        english_name: 'Example',
        era: '19世纪',
        summary: '示例背景资料。'.repeat(20),
        characteristics: ['色彩', '结构', '笔触'],
        sources: [source],
        verified_at: '2026-10-20',
      },
    ],
    painters: [
      {
        name: '旧名字',
        display_name: '展示名',
        style_id: 'Example_Style',
        era: '19世纪',
        bio: '示例简介',
        verified: true,
        verification_note: '来源已核验',
        sources: [source],
        verified_at: '2026-10-20',
        sort_order: 0,
        portrait: null,
      },
    ],
    representatives: [{ style_id: 'Example_Style', painter_name: '旧名字', sort_order: 0 }],
  }
}

test('迁移manifest验证关联、日期、重复主键和证据元数据', () => {
  assert.equal(validateKnowledgeManifest(fixture()).painters.length, 1)
  const invalidReference = fixture()
  invalidReference.painters[0]!.style_id = 'Unknown'
  assert.throws(() => validateKnowledgeManifest(invalidReference), /unknown style/)
  const duplicate = fixture()
  duplicate.painters.push({ ...duplicate.painters[0]! })
  assert.throws(() => validateKnowledgeManifest(duplicate), /Duplicate painter/)
  const invalidDate = fixture()
  invalidDate.styles[0]!.verified_at = '2026-02-30'
  assert.throws(() => validateKnowledgeManifest(invalidDate), /date/)
  const missingSource = fixture()
  missingSource.painters[0]!.sources = []
  assert.throws(() => validateKnowledgeManifest(missingSource), /sources/)
  const blank = fixture()
  blank.styles[0]!.characteristics = ['色彩', ' ', '笔触']
  assert.throws(() => validateKnowledgeManifest(blank), /nonempty/)
})

test('SQL文字含引号、美元分隔符与伪SQL时仍只作为JSON数据', () => {
  const manifest = fixture()
  manifest.painters[0]!.bio =
    "O'Brien $knowledge$ $knowledge_$ $assert$ $assert_$; drop table users; --"
  const sql = generateKnowledgeImportSql(manifest)
  assert.ok(sql.includes('$knowledge__$'))
  assert.ok(sql.includes('do $assert__$'))
  assert.ok(sql.includes('begin;\nlock table'))
  assert.equal((sql.match(/on conflict /g) ?? []).length, 3)
  assert.equal((sql.match(/raise exception /g) ?? []).length, 3)
  assert.ok(sql.endsWith('commit;\n'))
  assert.equal(sqlJson({ text: "x'y" }), '$knowledge${"text":"x\'y"}$knowledge$::jsonb')
})

test('比对逐项字段并忽略时间戳、行顺序与JSON对象键顺序', () => {
  const manifest = fixture()
  const actual = structuredClone(manifest)
  Object.assign(actual.styles[0]!, { created_at: 'now', updated_at: 'now' })
  actual.painters[0]!.sources = [
    { url: 'https://museum.example/article', institution: 'Museum', title: 'Test museum' },
  ]
  assert.deepEqual(compareKnowledgeManifests(manifest, actual), [])
  actual.painters[0]!.bio = '被修改'
  assert.deepEqual(compareKnowledgeManifests(manifest, actual), ['painters.旧名字.bio: differs'])
  actual.painters = []
  assert.ok(compareKnowledgeManifests(manifest, actual).some((value) => value.includes('missing')))
})

test('头像必须保留上传字节数、hash及存储路径且受500KB约束', () => {
  const manifest: KnowledgeManifest = fixture()
  manifest.painters[0]!.portrait = {
    url: 'https://storage.example/Artmind/painters/example.webp',
    source: { title: 'Test museum', institution: 'Museum', url: 'https://museum.example/article' },
    license: 'CC0',
    credit: 'Museum',
    bytes: 500000,
    sha256: 'a'.repeat(64),
    objectKey: 'painters/example.webp',
  }
  assert.doesNotThrow(() => validateKnowledgeManifest(manifest))
  ;(manifest.painters[0]!.portrait as Record<string, unknown>).bytes = 500001
  assert.throws(() => validateKnowledgeManifest(manifest), /portrait/)
})

test('结构迁移声明受限表权限与单语句invoker快照RPC', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/004_art_knowledge.sql', import.meta.url),
    'utf8',
  )
  assert.equal((sql.match(/enable row level security/g) ?? []).length, 3)
  assert.ok(sql.includes('from public, anon, authenticated'))
  assert.ok(sql.includes('returns jsonb language sql stable security invoker'))
  assert.ok(sql.includes('on update restrict on delete restrict'))
  assert.ok(!sql.toLowerCase().includes('security definer'))
  assert.ok(!sql.includes('create trigger knowledge_representatives_guard'))
})

test('补充迁移收敛旧版本约束并允许编辑代表关系', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/005_art_knowledge_constraints.sql', import.meta.url),
    'utf8',
  )
  assert.ok(sql.includes('drop trigger if exists knowledge_representatives_guard'))
  assert.ok(sql.includes('create or replace function artmind.knowledge_guard_keys()'))
  assert.ok(!sql.includes('Representative keys are immutable'))
  assert.ok(sql.includes('drop constraint if exists knowledge_styles_characteristics_check'))
  assert.ok(sql.includes("item !~ '[^[:space:]]'"))
  assert.ok(!/\b(update|delete from|insert into) artmind\./i.test(sql))
})
