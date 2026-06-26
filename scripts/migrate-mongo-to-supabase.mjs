/**
 * MongoDB artworks → YQYHub artmind.artworks（系统预制账号）
 *
 * Usage:
 *   yarn migrate:mongo
 *   node scripts/migrate-mongo-to-supabase.mjs --from-json scripts/mongo-artworks.export.json
 *
 * Requires .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Mongo 模式还需: MONGODB_URI
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MongoClient } from 'mongodb'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const path = resolve(root, '.env')
  const text = readFileSync(path, 'utf8')
  const env = {}
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return env
}

const SYSTEM_EMAIL = 'gallery-system@artmind.internal'
const BATCH = 50

/** Node 部分环境 querySrv 失败时，将 Atlas SRV 转为标准 URI */
function resolveMongoUri(srvOrDirect) {
  if (!srvOrDirect?.startsWith('mongodb+srv://')) return srvOrDirect ?? ''

  const raw = srvOrDirect.replace('mongodb+srv://', '')
  const at = raw.lastIndexOf('@')
  if (at === -1) throw new Error('无效的 MONGODB_URI')
  const creds = raw.slice(0, at)
  const rest = raw.slice(at + 1)
  const slash = rest.indexOf('/')
  const pathAndQuery = slash === -1 ? '' : rest.slice(slash)
  const db = pathAndQuery.split('?')[0].replace(/^\//, '') || 'artmind'

  const hosts = [
    'ac-llndbjl-shard-00-00.dnoafrk.mongodb.net:27017',
    'ac-llndbjl-shard-00-01.dnoafrk.mongodb.net:27017',
    'ac-llndbjl-shard-00-02.dnoafrk.mongodb.net:27017',
  ].join(',')

  return `mongodb://${creds}@${hosts}/${db}?ssl=true&authSource=admin&replicaSet=atlas-llndbjl-shard-0`
}

function mapArtwork(doc, systemUserId) {
  const id = doc.id
  const title = doc.title?.trim()
  const style = doc.style?.trim()
  const imageUrl = doc.imageUrl?.trim()
  if (!id || !title || !style || !imageUrl) {
    return { skip: true, reason: 'missing required field', id: id ?? doc._id }
  }

  const row = {
    id,
    user_id: systemUserId,
    title,
    style,
    image_url: imageUrl,
    is_public: doc.isPublic !== false,
    status: 'published',
    created_at: doc.createdAt ?? new Date().toISOString(),
    updated_at: doc.createdAt ?? new Date().toISOString(),
  }
  if (doc.imageWidth != null) row.image_width = Number(doc.imageWidth)
  if (doc.imageHeight != null) row.image_height = Number(doc.imageHeight)
  if (doc.analysisResult && typeof doc.analysisResult === 'object') {
    row.analysis_result = doc.analysisResult
  }
  return { skip: false, row }
}

async function ensureSystemUser(supabase) {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) throw new Error(`listUsers: ${listErr.message}`)

  const existing = list.users.find((u) => u.email === SYSTEM_EMAIL)
  if (existing) {
    console.log(`系统用户已存在: ${existing.id}`)
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: SYSTEM_EMAIL,
    email_confirm: true,
    user_metadata: {
      full_name: 'ArtMind 画廊',
      name: 'ArtMind 画廊',
    },
  })
  if (error) throw new Error(`createUser: ${error.message}`)
  console.log(`已创建系统用户: ${data.user.id}`)
  return data.user.id
}

async function ensureProfile(supabase, userId) {
  const { data, error } = await supabase
    .schema('artmind')
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(`profiles select: ${error.message}`)
  if (data) return

  const { error: insErr } = await supabase.schema('artmind').from('profiles').insert({
    id: userId,
    display_name: 'ArtMind 画廊',
    role: 'user',
  })
  if (insErr) throw new Error(`profiles insert: ${insErr.message}`)
  console.log('已写入 artmind.profiles')
}

async function loadMongoDocs(env) {
  const jsonArg = process.argv.indexOf('--from-json')
  if (jsonArg !== -1) {
    const file = process.argv[jsonArg + 1]
    if (!file) throw new Error('请指定 JSON 路径: --from-json scripts/mongo-artworks.export.json')
    const path = resolve(root, file)
    if (!existsSync(path)) throw new Error(`文件不存在: ${path}`)
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    return Array.isArray(raw) ? raw : []
  }

  const mongoUri = resolveMongoUri(env.MONGODB_URI)
  if (!mongoUri) throw new Error('缺少 MONGODB_URI，或使用 --from-json')

  const mongo = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 20000 })
  await mongo.connect()
  try {
    return await mongo.db().collection('artworks').find({}).toArray()
  } finally {
    await mongo.close()
  }
}

async function main() {
  const env = loadEnv()
  const supabaseUrl = env.SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (process.argv.indexOf('--from-json') === -1 && !env.MONGODB_URI) {
    throw new Error('缺少 MONGODB_URI，或使用 --from-json')
  }
  if (!supabaseUrl || !serviceKey) throw new Error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  if (serviceKey.includes('your-yqyhub')) throw new Error('请填写真实的 SUPABASE_SERVICE_ROLE_KEY')

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'artmind' },
  })

  const systemUserId = await ensureSystemUser(supabase)
  await ensureProfile(supabase, systemUserId)

  const docs = await loadMongoDocs(env)
  console.log(`待迁移 artworks: ${docs.length} 条`)

  let inserted = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH)
    const rows = []
    for (const doc of batch) {
      const mapped = mapArtwork(doc, systemUserId)
      if (mapped.skip) {
        skipped++
        console.warn('跳过:', mapped.reason, mapped.id)
        continue
      }
      rows.push(mapped.row)
    }
    if (rows.length === 0) continue

    const { error } = await supabase.from('artworks').upsert(rows, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })
    if (error) {
      console.error('批次失败:', error.message)
      failed += rows.length
    } else {
      inserted += rows.length
      console.log(`进度: ${Math.min(i + BATCH, docs.length)}/${docs.length}`)
    }
  }

  const { count } = await supabase.from('artworks').select('*', { count: 'exact', head: true })
  console.log('\n完成')
  console.log(`  写入/更新: ${inserted}`)
  console.log(`  跳过: ${skipped}`)
  console.log(`  失败: ${failed}`)
  console.log(`  artmind.artworks 当前总数: ${count ?? '?'}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
