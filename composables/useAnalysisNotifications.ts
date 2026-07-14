import {
  shouldSendBackgroundNotification,
  type BrowserNotificationPermission,
} from '~/utils/analysis-helpers'

function getNotificationPermission(): BrowserNotificationPermission {
  if (!import.meta.client || typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }

  return Notification.permission
}

export function useAnalysisNotifications() {
  const permission = ref<BrowserNotificationPermission>(getNotificationPermission())
  const supported = computed(() => permission.value !== 'unsupported')

  function syncPermission(): BrowserNotificationPermission {
    permission.value = getNotificationPermission()
    return permission.value
  }

  async function prepareForAnalysis(options?: { requestPermission?: boolean }) {
    const requestPermission = options?.requestPermission ?? false
    const currentPermission = syncPermission()

    if (!requestPermission || currentPermission !== 'default' || !supported.value) {
      return currentPermission
    }

    try {
      permission.value = await Notification.requestPermission()
    } catch {
      permission.value = syncPermission()
    }

    return permission.value
  }

  async function notifyIfHidden(title: string, options?: NotificationOptions): Promise<boolean> {
    const currentPermission = syncPermission()
    if (!import.meta.client || currentPermission === 'unsupported') return false

    const canNotify = shouldSendBackgroundNotification({
      permission: currentPermission,
      visibilityState: document.visibilityState,
    })
    if (!canNotify) return false

    const notification = new Notification(title, {
      icon: '/icon.png',
      tag: 'artmind-analysis',
      ...options,
    })
    window.setTimeout(() => notification.close(), 5000)
    return true
  }

  return {
    permission,
    supported,
    syncPermission,
    prepareForAnalysis,
    notifyIfHidden,
  }
}
