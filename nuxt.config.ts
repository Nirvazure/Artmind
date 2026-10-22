export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  // @supabase/ssr 在 Vite 客户端侧 import { parse } from 'cookie' 与 cookie@1.x CJS 不兼容
  alias: {
    cookie: 'cookie-es',
  },
  nitro: {
    vercel: {
      functions: {
        maxDuration: 180,
      },
    },
    alias: {
      cookie: 'cookie-es',
    },
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700&display=swap',
        },
      ],
    },
  },
  css: ['~/assets/app.css'],
  runtimeConfig: {
    supabaseSecretKey: (process.env.SUPABASE_SECRET_KEY || '').trim(),
    paintingInferenceUrl: (
      process.env.PAINTING_INFERENCE_URL ||
      process.env.NUXT_PAINTING_INFERENCE_URL ||
      ''
    ).trim(),
    paintingPredictPath: (
      process.env.PAINTING_PREDICT_PATH ||
      process.env.NUXT_PAINTING_PREDICT_PATH ||
      '/predict'
    ).trim(),
  },
  experimental: {
    appManifest: false,
  },
  modules: ['@nuxt/eslint', '@pinia/nuxt', 'vuetify-nuxt-module', '@nuxtjs/supabase'],
  supabase: {
    // 优先使用统一的公开 Key；未设置时由模块兼容原有 SUPABASE_KEY / Nuxt 别名。
    key: process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || undefined,
    // 作品页 /:id 为公开路由，禁用全局重定向；登录入口由 /login 与个人页自行控制
    redirect: false,
    clientOptions: {
      db: { schema: 'artmind' },
    },
  },
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            variables: {},
            colors: {
              primary: '#5c5046',
              'on-primary': '#faf9f7',
              background: '#faf9f7',
              'on-background': '#2e2c2a',
              surface: '#faf9f7',
              'on-surface': '#2e2c2a',
              'surface-variant': '#f0eeeb',
              'on-surface-variant': '#5c5752',
              outline: '#2e2c2a33',
              secondary: '#6b5b4f',
              'on-secondary': '#f5f3f0',
              error: '#ba1a1a',
              info: '#0061a4',
              success: '#2e7d32',
              warning: '#ed6c02',
            },
          },
        },
      },
    },
  },
})
