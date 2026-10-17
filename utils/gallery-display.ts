export function galleryArtworkName(title: string): string {
  const name = title.trim()
  return /^未命名(?:作品|画作)?$/.test(name) ? '' : name
}

// Rebase into the middle copy while preserving the visible position in the ring.
export function normalizeGalleryLoopOffset(offset: number, cycleSize: number): number {
  if (cycleSize <= 0 || !Number.isFinite(cycleSize) || !Number.isFinite(offset)) return 0
  return cycleSize + ((((offset - cycleSize) % cycleSize) + cycleSize) % cycleSize)
}
