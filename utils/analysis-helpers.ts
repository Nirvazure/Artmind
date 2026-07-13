export type BrowserNotificationPermission = NotificationPermission | 'unsupported'

export function normalizeArtworkTitle(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

export function shouldSendBackgroundNotification(input: {
  permission: BrowserNotificationPermission
  visibilityState: DocumentVisibilityState | 'visible' | 'hidden'
}): boolean {
  return input.permission === 'granted' && input.visibilityState !== 'visible'
}
