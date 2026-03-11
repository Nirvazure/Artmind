export type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  show: boolean
  message: string
  type: ToastType
}

const defaultState = (): ToastState => ({
  show: false,
  message: '',
  type: 'info',
})

export function useToast() {
  const state = useState<ToastState>('toast', defaultState)

  function show(message: string, type: ToastType = 'info') {
    state.value = { show: true, message, type }
  }

  function success(message: string) {
    show(message, 'success')
  }

  function error(message: string) {
    show(message, 'error')
  }

  function info(message: string) {
    show(message, 'info')
  }

  function close() {
    state.value = { ...state.value, show: false }
  }

  return { state, show, success, error, info, close }
}
