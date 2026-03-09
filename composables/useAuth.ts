/**
 * Mock 认证，后续可替换为 Auth0
 */
export function useAuth() {
  const user = ref({ id: 'demo', name: 'Demo User' })
  const isAuthenticated = computed(() => true)
  const login = () => {}
  const logout = () => {}
  return { user, isAuthenticated, login, logout }
}
