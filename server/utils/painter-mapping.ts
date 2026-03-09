import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

let cache: Map<string, string[]> | null = null

async function loadCache(): Promise<Map<string, string[]>> {
  if (cache) return cache
  const dataPath = join(process.cwd(), 'server', 'data', 'painters-list.json')
  const raw = await readFile(dataPath, 'utf-8')
  const list = JSON.parse(raw) as Array<{ name: string; style: string }>
  cache = new Map<string, string[]>()
  for (const p of list) {
    const style = (p.style ?? '').trim()
    if (!style) continue
    const names = cache.get(style) ?? []
    if (!names.includes(p.name)) names.push(p.name)
    cache.set(style, names)
  }
  return cache
}

export async function getPaintersByStyle(style: string): Promise<string[]> {
  const map = await loadCache()
  const normalized = style.trim()
  return map.get(normalized) ?? map.get(style) ?? []
}

export async function getTopPaintersByStyle(
  style: string,
  n: number
): Promise<string[]> {
  const list = await getPaintersByStyle(style)
  return list.slice(0, n)
}
