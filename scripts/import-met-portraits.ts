import { parseArgs } from 'node:util'
import {
  compressPainterPortrait,
  painterNeedsPortrait,
  portraitObjectKey,
  readPortraitManifest,
  uploadPainterPortrait,
} from './lib/painter-portraits.ts'
import { storageAdmin } from './lib/storage-admin.ts'

interface MetObject {
  objectID: number
  title: string
  artistDisplayName: string
  artistRole: string
  objectDate: string
  objectURL: string
  primaryImageSmall: string
  isPublicDomain: boolean
  creditLine: string
}
const { values } = parseArgs({
  options: {
    apply: { type: 'boolean', default: false },
    manifest: { type: 'string' },
  },
})
const candidates = await readPortraitManifest(values.manifest)
const target = values.apply ? storageAdmin() : null

async function request(url: string) {
  const parsed = new URL(url)
  if (
    parsed.protocol !== 'https:' ||
    !['collectionapi.metmuseum.org', 'images.metmuseum.org'].includes(parsed.hostname)
  )
    throw new Error('Untrusted museum host')
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: 'error' })
  if (!response.ok) throw new Error(`Museum HTTP ${response.status}`)
  return response
}

let completed = 0
for (const candidate of candidates) {
  try {
    if (target && !(await painterNeedsPortrait(target, candidate.name))) {
      console.log(`Already recorded; skipped: ${candidate.name}`)
      completed++
      continue
    }
    const object = (await (
      await request(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${candidate.id}`,
      )
    ).json()) as MetObject
    if (object.objectID !== candidate.id || !object.isPublicDomain || !object.primaryImageSmall)
      throw new Error('No public-domain image confirmed')
    if (!object.title.startsWith(candidate.title) || object.artistDisplayName !== candidate.creator)
      throw new Error('Curated identity metadata changed; manual review required')
    const sourceUrl = new URL(object.objectURL)
    if (sourceUrl.protocol !== 'https:' || sourceUrl.hostname !== 'www.metmuseum.org')
      throw new Error('Unexpected museum source URL')
    const response = await request(object.primaryImageSmall)
    if (!response.headers.get('content-type')?.startsWith('image/'))
      throw new Error('Source is not an image')
    const raw = Buffer.from(await response.arrayBuffer())
    if (raw.length > 20000000) throw new Error('Source image exceeds 20 MB')
    const image = await compressPainterPortrait(raw)
    const outcome = target
      ? await uploadPainterPortrait(target, candidate, image, {
          source: {
            title: object.title,
            institution: 'The Metropolitan Museum of Art',
            url: object.objectURL,
          },
          license: 'CC0 / Public domain',
          credit: `${object.artistRole}: ${object.artistDisplayName}; ${object.objectDate}. ${object.artistRole === 'Sitter' ? 'Maker not identified in the API. ' : ''}The Metropolitan Museum of Art. ${object.creditLine}`,
        })
      : 'Dry run'
    completed++
    console.log(
      `${outcome}: ${candidate.name}, ${image.length} bytes, ${portraitObjectKey(candidate.slug, image)}`,
    )
  } catch (error) {
    console.error(`${candidate.name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
console.log(
  `${completed}/${candidates.length} portraits ${target ? 'processed' : 'validated; pass --apply to upload'}`,
)
if (completed !== candidates.length) process.exitCode = 1
