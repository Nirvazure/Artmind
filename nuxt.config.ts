export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  nitro: {
    vercel: {
      functions: {
        maxDuration: 180,
      },
    },
    // ali-oss 打包后会触发 debug 依赖的 ESM/CJS 兼容问题，改走 nitro externals 追踪依赖
    externals: {
      inline: ['lodash'],
      external: ['ali-oss', 'debug'],
    },
  },
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700&display=swap' },
      ],
    },
    defaultLayout: 'home',
  },
  css: ['~/assets/app.css'],
  runtimeConfig: {
    mongoUri: (process.env.MONGODB_URI || '').trim(),
    ossRegion: (process.env.OSS_REGION || '').trim(),
    ossBucket: (process.env.OSS_BUCKET || '').trim(),
    ossAccessKeyId: (process.env.OSS_ACCESS_KEY_ID || '').trim(),
    ossAccessKeySecret: (process.env.OSS_ACCESS_KEY_SECRET || '').trim(),
    paintingInferenceUrl: (process.env.PAINTING_INFERENCE_URL || process.env.NUXT_PAINTING_INFERENCE_URL || '').trim(),
    paintingPredictPath: (process.env.PAINTING_PREDICT_PATH || process.env.NUXT_PAINTING_PREDICT_PATH || '/predict').trim(),
  },
  experimental: {
    appManifest: false,
  },
  build: { transpile: ['vue-countup-v3'] },
  modules: ['@pinia/nuxt', 'vuetify-nuxt-module'],
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
