import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import type { PainterPortrait } from '../../types/art-knowledge.ts'
import { STORAGE_BUCKET, storagePublicUrl } from '../../utils/storage-assets.ts'
import type { storageAdmin } from './storage-admin.ts'

export interface PortraitCandidate {
  name: string
  slug: string
  id: number
  title: string
  creator: string
}

export async function readPortraitManifest(path: string | undefined): Promise<PortraitCandidate[]> {
  if (!path) throw new Error('Provide --manifest with an external JSON candidate array')
  const value: unknown = JSON.parse(await readFile(path, 'utf8'))
  if (!Array.isArray(value)) throw new Error('Portrait manifest must be an array')
  const seen = new Set<string>()
  return value.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid portrait candidate')
    const row = item as Record<string, unknown>
    for (const key of ['name', 'slug', 'title', 'creator']) {
      if (typeof row[key] !== 'string' || !(row[key] as string).trim())
        throw new Error(`Portrait candidate requires ${key}`)
    }
    if (!Number.isSafeInteger(row.id) || (row.id as number) < 1)
      throw new Error('Portrait candidate requires a positive museum object id')
    if (!/^[a-zA-Z][a-zA-Z0-9 _-]*$/.test(row.slug as string))
      throw new Error('Invalid portrait slug')
    const name = (row.name as string).trim()
    if (seen.has(name)) throw new Error('Duplicate painter name in manifest')
    seen.add(name)
    return {
      name,
      slug: row.slug as string,
      id: row.id as number,
      title: (row.title as string).trim(),
      creator: (row.creator as string).trim(),
    }
  })
}

type PortraitTarget = ReturnType<typeof storageAdmin>

/** Check before any upload; the manifest cannot create catalog rows. */
export async function painterNeedsPortrait(target: PortraitTarget, name: string): Promise<boolean> {
  const { data, error } = await target.client
    .from('knowledge_painters')
    .select('name,portrait')
    .eq('name', name)
    .maybeSingle()
  if (error) throw new Error(`Cannot read painter: ${error.message}`)
  if (!data) throw new Error('Painter does not exist in knowledge_painters')
  return data.portrait === null
}

export async function uploadPainterPortrait(
  target: PortraitTarget,
  candidate: PortraitCandidate,
  image: Buffer,
  evidence: Omit<PainterPortrait, 'url'>,
): Promise<'recorded' | 'concurrent update; skipped'> {
  if (!image.length || image.length > PORTRAIT_MAX_BYTES)
    throw new Error('Portrait must contain 1–500000 bytes')
  // Recheck immediately before upload as well as before source processing.
  if (!(await painterNeedsPortrait(target, candidate.name))) return 'concurrent update; skipped'
  const objectKey = portraitObjectKey(candidate.slug, image)
  const sha256 = createHash('sha256').update(image).digest('hex')
  const { error } = await target.client.storage.from(STORAGE_BUCKET).upload(objectKey, image, {
    contentType: 'image/webp',
    upsert: false,
    cacheControl: '31536000',
  })
  if (error && !['409', 'Duplicate'].includes(String(error.statusCode ?? error.name))) throw error
  const url = storagePublicUrl(target.url, objectKey)
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Public readback HTTP ${response.status}`)
  const readback = Buffer.from(await response.arrayBuffer())
  if (
    readback.length !== image.length ||
    readback.length > PORTRAIT_MAX_BYTES ||
    createHash('sha256').update(readback).digest('hex') !== sha256
  )
    throw new Error('Public readback hash/size mismatch')
  const portrait = { ...evidence, url, bytes: image.length, sha256, objectKey }
  const { data, error: updateError } = await target.client
    .from('knowledge_painters')
    .update({ portrait })
    .eq('name', candidate.name)
    .is('portrait', null)
    .select('name')
    .maybeSingle()
  if (updateError) throw new Error(`Cannot record portrait: ${updateError.message}`)
  return data ? 'recorded' : 'concurrent update; skipped'
}

export const PORTRAIT_MAX_BYTES = 500000

export async function compressPainterPortrait(input: Buffer): Promise<Buffer> {
  for (const size of [640, 480, 320]) {
    for (const quality of [82, 65, 45]) {
      const output = await sharp(input, { limitInputPixels: 80000000 })
        .rotate()
        .resize(size, size, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer()
      if (output.length <= PORTRAIT_MAX_BYTES) return output
    }
  }
  throw new Error('Portrait cannot be compressed below 500000 bytes')
}

export function portraitObjectKey(slug: string, bytes: Buffer): string {
  if (!/^[a-zA-Z][a-zA-Z0-9 _-]*$/.test(slug)) throw new Error('Invalid portrait slug')
  const normalized = slug.toLowerCase().replace(/[ _]+/g, '-')
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
  return `painters/${normalized}-${hash}.webp`
}
