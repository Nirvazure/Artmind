import type { H3Event } from 'h3'

export async function getUserIdFromToken(event: H3Event): Promise<string | null> {
  const config = useRuntimeConfig()
  const domain = (config.public as { authingDomain?: string }).authingDomain
  if (!domain) return null

  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`
  const base = baseUrl.replace(/\/$/, '')
  const appId = (config.public as { authingAppId?: string }).authingAppId
  const secret = config.authingSecret as string | undefined

  const extractSub = (r: { sub?: string; userId?: string; id?: string } | null) =>
    r?.sub ?? r?.userId ?? r?.id ?? null

  // 1. 尝试 OIDC Token Introspection（需 client_id，可选 client_secret）
  if (appId) {
    try {
      const body = new URLSearchParams({
        token,
        token_type_hint: 'access_token',
        client_id: appId,
        ...(secret && { client_secret: secret }),
      })
      const res = await $fetch<{ active?: boolean; sub?: string }>(`${base}/oidc/token/introspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      if (res?.active && res?.sub) return res.sub
    } catch {
      // 继续尝试其他方式
    }
  }

  // 2. 尝试 validate_token（GET ?access_token=）
  try {
    const res = await $fetch<{ sub?: string; userId?: string; id?: string }>(
      `${base}/api/v2/oidc/validate_token`,
      { query: { access_token: token } }
    )
    return extractSub(res)
  } catch {
    // 继续
  }

  // 3. 回退：OIDC userinfo（Bearer）
  try {
    const res = await $fetch<{ sub?: string; userId?: string; id?: string }>(`${base}/oidc/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return extractSub(res)
  } catch {
    return null
  }
}
