export interface PainterCatalogItem {
  name: string
  style: string
}

function normalizePainterKey(name: string): string {
  return name.trim().toLowerCase()
}

/** 展示用画家列表：保留 API 顺序，不足时从 catalog 按流派补全 */
export function buildDisplayPainters(
  painters: string[],
  styleName: string,
  catalog: PainterCatalogItem[],
  minTotal = 3,
  maxTotal = 5,
): string[] {
  const result: string[] = []
  const seen = new Set<string>()

  for (const name of painters) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const key = normalizePainterKey(trimmed)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }

  const style = styleName.trim()
  if (result.length < minTotal && style) {
    for (const item of catalog) {
      if (item.style !== style) continue
      const key = normalizePainterKey(item.name)
      if (seen.has(key)) continue
      seen.add(key)
      result.push(item.name)
      if (result.length >= minTotal) break
    }
  }

  return result.slice(0, maxTotal)
}

export function usePainterDisplay(
  painters: Ref<string[]>,
  styleName: Ref<string>,
  catalog: Ref<PainterCatalogItem[]>,
  minTotal = 3,
  maxTotal = 5,
) {
  return computed(() =>
    buildDisplayPainters(painters.value, styleName.value, catalog.value, minTotal, maxTotal),
  )
}
