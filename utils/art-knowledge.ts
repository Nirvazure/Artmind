export function findPainter<T extends { name: string; displayName: string }>(
  painters: readonly T[],
  name: string,
): T | null {
  const key = name.trim().toLowerCase()
  if (!key) return null
  return (
    painters.find(
      (painter) =>
        painter.name.trim().toLowerCase() === key ||
        painter.displayName.trim().toLowerCase() === key,
    ) ?? null
  )
}

export function findStyleKnowledge<T>(styles: Record<string, T>, style: string): T | null {
  const key = style.trim()
  return Object.hasOwn(styles, key) ? (styles[key] ?? null) : null
}
