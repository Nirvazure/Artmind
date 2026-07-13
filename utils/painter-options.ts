export interface PainterCatalogItemLike {
  name: string
  style: string
}

export function normalizePaintersInput(values: string[]): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const item = value.trim()
    if (!item) continue

    const key = item.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    normalized.push(item)
  }

  return normalized
}

export function getPainterOptionsByStyle(
  style: string,
  catalog: PainterCatalogItemLike[],
): string[] {
  const normalizedStyle = style.trim()
  if (!normalizedStyle) return []

  return normalizePaintersInput(
    catalog.filter((item) => item.style === normalizedStyle).map((item) => item.name),
  )
}

export function getDefaultPaintersForStyle(
  style: string,
  catalog: PainterCatalogItemLike[],
  limit = 3,
): string[] {
  return getPainterOptionsByStyle(style, catalog).slice(0, limit)
}
