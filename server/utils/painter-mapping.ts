import { paintersListData } from '../data/painters-list'

const list = paintersListData
const cache = new Map<string, string[]>()
for (const p of list) {
  const style = (p.style ?? '').trim()
  if (!style) continue
  const names = cache.get(style) ?? []
  if (!names.includes(p.name)) names.push(p.name)
  cache.set(style, names)
}

function loadCache(): Map<string, string[]> {
  return cache
}

export function getPaintersByStyle(style: string): string[] {
  const map = loadCache()
  const normalized = style.trim()
  return map.get(normalized) ?? map.get(style) ?? []
}

export function getTopPaintersByStyle(style: string, n: number): string[] {
  return getPaintersByStyle(style).slice(0, n)
}
