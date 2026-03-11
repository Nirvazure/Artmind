import { Authing } from '@authing/web'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  const sdk = new Authing({
    domain: config.authingDomain as string,
    appId: config.authingAppId as string,
    redirectUri: `${origin}/auth/callback`,
    logoutRedirectUri: origin,
    userPoolId: (config.authingUserPoolId as string) || config.authingAppId,
    scope: 'openid profile',
    redirectResponseMode: 'query',
  })

  return {
    provide: {
      authing: sdk,
    },
  }
})
