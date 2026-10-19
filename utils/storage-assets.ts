export const STORAGE_BUCKET = 'Artmind'

function projectBaseUrl(supabaseUrl: string): string {
  const url = new URL(supabaseUrl)
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error('Invalid Supabase project URL')
  return url.origin
}

function validKey(key: string): boolean {
  for (const char of key) {
    const code = char.charCodeAt(0)
    if (char === '\\' || code < 32 || code === 127) return false
  }
  return (
    !/%(?:2e|2f|5c|25)/i.test(key) &&
    key.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..')
  )
}

/** Public assets are shared by the browser, server uploads and migration tooling. */
export function storagePublicUrl(supabaseUrl: string, key: string): string {
  if (!validKey(key)) throw new Error('Invalid storage object key')
  const encodedKey = key.split('/').map(encodeURIComponent).join('/')
  return `${projectBaseUrl(supabaseUrl)}/storage/v1/object/public/${STORAGE_BUCKET}/${encodedKey}`
}

/** Only recognize this project's exact public bucket route, without URL path normalization. */
export function storageObjectKey(url: string, supabaseUrl: string): string | null {
  try {
    const prefix = `${projectBaseUrl(supabaseUrl)}/storage/v1/object/public/${STORAGE_BUCKET}/`
    if (!url.startsWith(prefix) || /[?#]/.test(url)) return null
    const segments = url
      .slice(prefix.length)
      .split('/')
      .map((segment) => decodeURIComponent(segment))
    if (segments.some((segment) => segment.includes('/'))) return null
    const key = segments.join('/')
    return validKey(key) ? key : null
  } catch {
    return null
  }
}
