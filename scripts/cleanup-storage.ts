import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { STORAGE_BUCKET } from '../utils/storage-assets.ts'
import { listTempObjects, protectedStorageKeys, storageAdmin } from './lib/storage-admin.ts'
import { planTempCleanup } from './lib/storage-maintenance.ts'

const { values } = parseArgs({
  options: {
    apply: { type: 'boolean', default: false },
    manifest: { type: 'string', default: '.storage-migration/manifest.json' },
  },
})

try {
  const { client, url } = storageAdmin()
  let originalTimes: Record<string, string> = {}
  try {
    const manifest = JSON.parse(await readFile(values.manifest!, 'utf8'))
    if (manifest.targetUrl !== url || manifest.bucket !== STORAGE_BUCKET)
      throw new Error('Manifest project/bucket does not match')
    originalTimes = Object.fromEntries(
      manifest.objects
        .filter((item: { status: string }) => item.status === 'verified')
        .map((item: { key: string; lastModified: string }) => [item.key, item.lastModified]),
    )
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
    console.warn('No migration manifest found; object upload timestamps will be used.')
  }
  const now = Date.now()
  const objects = await listTempObjects(client)
  const plan = planTempCleanup(objects, await protectedStorageKeys(client, url), originalTimes, now)
  console.log(
    JSON.stringify(
      { mode: values.apply ? 'apply' : 'preview', bucket: STORAGE_BUCKET, ...plan },
      null,
      2,
    ),
  )
  if (values.apply) {
    let removed = 0
    for (let offset = 0; offset < plan.remove.length; offset += 100) {
      // Recheck long-lived references immediately before deletion; run while uploads/saves are paused.
      const protectedKeys = await protectedStorageKeys(client, url)
      const batch = plan.remove.slice(offset, offset + 100).filter((key) => !protectedKeys.has(key))
      if (!batch.length) continue
      const { error } = await client.storage.from(STORAGE_BUCKET).remove(batch)
      if (error) throw new Error(`Cleanup failed: ${error.message}`)
      removed += batch.length
    }
    console.log(`Removed ${removed} expired temporary objects; database records were retained.`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Storage cleanup failed')
  process.exitCode = 1
}
