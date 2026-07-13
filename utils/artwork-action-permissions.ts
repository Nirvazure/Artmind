export type ArtworkAction = 'save' | 'update'

export interface ArtworkActionPermissionInput {
  authLoading: boolean
  isAuthenticated: boolean
  hasResult: boolean
  isExistingOwned: boolean
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
  const showSaveToGallery = !input.isExistingOwned

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

export function canSubmitArtworkAction(
  action: ArtworkAction,
  permissions: ArtworkActionPermissions,
): boolean {
  if (action === 'save') return permissions.showSaveToGallery
  return permissions.showUpdateArtwork
}
