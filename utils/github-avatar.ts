export function githubAvatarUrl(
  user:
    | {
        user_metadata?: Record<string, unknown>
        identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }>
      }
    | null
    | undefined,
): string | null {
  const githubIdentities =
    user?.identities?.filter((identity) => identity.provider === 'github') ?? []
  const candidates = [
    ...githubIdentities.flatMap((identity) => [
      identity.identity_data?.avatar_url,
      identity.identity_data?.picture,
    ]),
    user?.user_metadata?.avatar_url,
    user?.user_metadata?.picture,
  ]

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue
    try {
      const url = new URL(candidate)
      if (
        url.protocol === 'https:' &&
        url.hostname === 'avatars.githubusercontent.com' &&
        !url.username &&
        !url.password &&
        !url.port
      ) {
        return url.href
      }
    } catch {
      // Missing or invalid provider metadata must never restore a custom avatar.
    }
  }
  return null
}
