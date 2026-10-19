import { createHash } from 'node:crypto'

/** Only map plain URLs on the configured source; transformed URLs need manual review. */
export function sourceObjectKey(value: string, sourceOrigin: string): string | null {
  try {
    const source = new URL(sourceOrigin)
    const url = new URL(value)
    if (
      url.origin !== source.origin ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !['https:', 'http:'].includes(url.protocol)
    )
      return null
    const segments = url.pathname.slice(1).split('/').map(decodeURIComponent)
    if (
      segments.some(
        (part) =>
          !part ||
          part === '.' ||
          part === '..' ||
          part.includes('/') ||
          part.includes('\\') ||
          [...part].some((character) => character.charCodeAt(0) < 32),
      )
    )
      return null
    return segments.join('/')
  } catch {
    return null
  }
}

export function objectHash(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

export function verifyObjectBytes(source: Uint8Array, target: Uint8Array): string {
  if (source.byteLength !== target.byteLength) throw new Error('Object size mismatch')
  const hash = objectHash(source)
  if (hash !== objectHash(target)) throw new Error('Object content mismatch')
  return hash
}

export function planTempCleanup(
  objects: Array<{ key: string; createdAt: string | null }>,
  protectedKeys: Set<string>,
  originalTimes: Record<string, string>,
  now = Date.now(),
): { remove: string[]; protected: string[]; unknownAge: string[] } {
  const plan: { remove: string[]; protected: string[]; unknownAge: string[] } = {
    remove: [],
    protected: [],
    unknownAge: [],
  }
  for (const object of objects) {
    if (!object.key.startsWith('temp/')) continue
    if (protectedKeys.has(object.key)) {
      plan.protected.push(object.key)
      continue
    }
    const createdAt = originalTimes[object.key] ?? object.createdAt
    const timestamp = createdAt ? Date.parse(createdAt) : NaN
    if (!Number.isFinite(timestamp)) plan.unknownAge.push(object.key)
    else if (now - timestamp > 24 * 60 * 60 * 1000) plan.remove.push(object.key)
  }
  return plan
}
