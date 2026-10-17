import type { Artwork } from '~/stores/artwork'

export type GalleryScope = 'community' | 'personal'

export function resolveGalleryFilters(query: {
  scope?: unknown
  collected?: unknown
  view?: unknown
}): { scope: GalleryScope; onlyCollected: boolean } {
  return {
    scope:
      query.scope === 'personal' || (query.scope === undefined && query.view === 'mine')
        ? 'personal'
        : 'community',
    onlyCollected:
      query.collected === 'true' || (query.collected === undefined && query.view === 'collection'),
  }
}

export function selectGalleryArtworks(
  scope: GalleryScope,
  sources: {
    publicArtworks: Artwork[]
    myArtworks: Artwork[]
    collectedArtworks: Artwork[]
    userId: string | undefined
  },
  onlyCollected = false,
): Artwork[] {
  if ((scope === 'personal' || onlyCollected) && !sources.userId) return []
  const artworks =
    scope === 'personal'
      ? sources.myArtworks.filter((item) => item.userId === sources.userId)
      : sources.publicArtworks.filter((item) => item.isPublic)
  if (!onlyCollected) return artworks
  const collectedIds = new Set(sources.collectedArtworks.map((item) => item.id))
  return artworks.filter((item) => collectedIds.has(item.id))
}

export function filterGalleryArtworks(artworks: Artwork[], style: string | null): Artwork[] {
  return artworks.filter((item) => !style || item.style === style)
}
