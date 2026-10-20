import { parseArgs } from 'node:util'
import {
  compressPainterPortrait,
  painterNeedsPortrait,
  readPortraitManifest,
  uploadPainterPortrait,
} from './lib/painter-portraits.ts'
import { storageAdmin } from './lib/storage-admin.ts'

const { values } = parseArgs({
  options: {
    apply: { type: 'boolean', default: false },
    manifest: { type: 'string' },
  },
})
const candidates = await readPortraitManifest(values.manifest)
const target = values.apply ? storageAdmin() : null
for (const candidate of candidates) {
  try {
    if (target && !(await painterNeedsPortrait(target, candidate.name))) {
      console.log({ name: candidate.name, outcome: 'already recorded; skipped' })
      continue
    }
    const response = await fetch(
      `https://openaccess-api.clevelandart.org/api/artworks/${candidate.id}`,
      { signal: AbortSignal.timeout(20000), redirect: 'error' },
    )
    if (!response.ok) throw new Error(`Museum HTTP ${response.status}`)
    const { data } = await response.json()
    const creator =
      data.creators?.map((person: { description: string }) => person.description).join('; ') ?? ''
    if (
      data.id !== candidate.id ||
      data.share_license_status !== 'CC0' ||
      data.title !== candidate.title ||
      !creator.includes(candidate.creator)
    )
      throw new Error('Museum identity or CC0 status changed; review before importing')
    const sourceUrl = new URL(data.url)
    if (
      sourceUrl.protocol !== 'https:' ||
      !['clevelandart.org', 'www.clevelandart.org'].includes(sourceUrl.hostname)
    )
      throw new Error('Unexpected museum source URL')
    const imageUrl = new URL(data.images.web.url)
    if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'openaccess-cdn.clevelandart.org')
      throw new Error('Unexpected museum image host')
    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30000),
      redirect: 'error',
    })
    if (!imageResponse.ok) throw new Error(`Image HTTP ${imageResponse.status}`)
    if (!imageResponse.headers.get('content-type')?.startsWith('image/'))
      throw new Error('Source is not an image')
    const input = Buffer.from(await imageResponse.arrayBuffer())
    if (input.length > 20000000) throw new Error('Source image exceeds 20MB')
    const bytes = await compressPainterPortrait(input)
    const outcome = target
      ? await uploadPainterPortrait(target, candidate, bytes, {
          source: { title: data.title, institution: 'The Cleveland Museum of Art', url: data.url },
          license: 'CC0 / Public domain',
          credit: `${creator}; ${data.creation_date}. ${data.creditline}`,
        })
      : 'Dry run'
    console.log({ name: candidate.name, outcome: `${outcome}: ${bytes.length} bytes` })
  } catch (error) {
    console.error({
      name: candidate.name,
      outcome: error instanceof Error ? error.message : String(error),
    })
    process.exitCode = 1
  }
}
