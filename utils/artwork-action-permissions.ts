export type ArtworkAction = 'save' | 'update'

function normalizeOptionalValue(value?: string | null): string {
  return value?.trim() ?? ''
}

export interface ArtworkActionPermissionInput {
  authLoading: boolean
  isAuthenticated: boolean
  hasResult: boolean
  isExistingOwned: boolean
  isSavedArtwork?: boolean
}

export interface ArtworkActionPermissions {
  showSaveToGallery: boolean
  showUpdateArtwork: boolean
  canOpenArtworkActionDialog: boolean
}

export function buildArtworkActionPermissions(
  input: ArtworkActionPermissionInput,
): ArtworkActionPermissions {
  if (input.authLoading || !input.isAuthenticated || !input.hasResult) {
    return {
      showSaveToGallery: false,
      showUpdateArtwork: false,
      canOpenArtworkActionDialog: false,
    }
  }

  const showUpdateArtwork = input.isExistingOwned
  const showSaveToGallery = !input.isExistingOwned && !input.isSavedArtwork

  return {
    showSaveToGallery,
    showUpdateArtwork,
    canOpenArtworkActionDialog: showSaveToGallery || showUpdateArtwork,
  }
}

export function resolveArtworkAction(permissions: ArtworkActionPermissions): ArtworkAction | null {
  if (permissions.showUpdateArtwork) return 'update'
  if (permissions.showSaveToGallery) return 'save'
  return null
}

export function resolveDefaultSelectedStyle(input: {
  action: ArtworkAction | null
  artworkStyle?: string | null
  aiTopStyle?: string | null
}): string {
  const artworkStyle = normalizeOptionalValue(input.artworkStyle)
  const aiTopStyle = normalizeOptionalValue(input.aiTopStyle)

  if (input.action === 'update') {
    return artworkStyle || aiTopStyle || ''
  }

  return aiTopStyle || artworkStyle || ''
}

export function canSubmitArtworkAction(
  action: ArtworkAction,
  permissions: ArtworkActionPermissions,
): boolean {
  if (action === 'save') return permissions.showSaveToGallery
  return permissions.showUpdateArtwork
}
