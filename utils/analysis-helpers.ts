export type BrowserNotificationPermission = NotificationPermission | 'unsupported'

export function normalizeArtworkTitle(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

export type AnalysisViewPhase = 'idle' | 'analyzing' | 'resolved'
export type AnalysisViewStatus = 'idle' | 'running' | 'error'

export function resolveAnalysisViewPhase(input: {
  analysisPhase: AnalysisViewStatus
  hasActiveResult: boolean
}): AnalysisViewPhase {
  if (input.analysisPhase === 'running') return 'analyzing'
  if (input.hasActiveResult) return 'resolved'
  return 'idle'
}

export function getPageItems<T>(items: T[], page: number, perPage: number): T[] {
  if (perPage <= 0) return []
  const safePage = Math.max(1, Math.floor(page))
  const start = (safePage - 1) * perPage
  return items.slice(start, start + perPage)
}

export function shouldSendBackgroundNotification(input: {
  permission: BrowserNotificationPermission
  visibilityState: DocumentVisibilityState | 'visible' | 'hidden'
}): boolean {
  return input.permission === 'granted' && input.visibilityState !== 'visible'
}
