import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { STORAGE_BUCKET, storageObjectKey } from '../../utils/storage-assets.ts'

export function storageAdmin() {
  if (existsSync('.env')) process.loadEnvFile('.env')
  const url = (process.env.SUPABASE_URL ?? process.env.NUXT_PUBLIC_SUPABASE_URL)?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  return {
    url,
    client: createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'artmind' },
    }),
  }
}

type AdminClient = ReturnType<typeof storageAdmin>['client']

export async function readRows(client: AdminClient, table: string, columns: string) {
  const rows: Array<Record<string, unknown>> = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .order('id')
      .range(offset, offset + 999)
    if (error) throw new Error(`Cannot read artmind.${table}: ${error.message}`)
    rows.push(...(data as unknown as Array<Record<string, unknown>>))
    if (data.length < 1000) return rows
  }
}

export async function protectedStorageKeys(client: AdminClient, url: string) {
  const keys = new Set<string>()
  for (const [table, column] of [
    ['artworks', 'image_url'],
    ['style_corrections', 'image_url'],
    ['profiles', 'avatar_url'],
  ]) {
    const rows = await readRows(client, table!, `id,${column}`)
    for (const row of rows) {
      const key =
        typeof row[column!] === 'string' ? storageObjectKey(row[column!] as string, url) : null
      if (key) keys.add(key)
    }
  }
  return keys
}

export async function listTempObjects(client: AdminClient, prefix = 'temp') {
  const objects: Array<{ key: string; createdAt: string | null }> = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.storage.from(STORAGE_BUCKET).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw new Error(`Cannot list ${STORAGE_BUCKET}/${prefix}: ${error.message}`)
    for (const object of data) {
      const key = `${prefix}/${object.name}`
      if (!object.id) objects.push(...(await listTempObjects(client, key)))
      else objects.push({ key, createdAt: object.created_at ?? null })
    }
    if (data.length < 1000) return objects
  }
}
