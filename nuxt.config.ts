// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['ant-design-vue/dist/reset.css'],

  routeRules: {
    '/admin/**': { ssr: false },
  },

  runtimeConfig: {
    jwtSecret: process.env.NUXT_JWT_SECRET || 'leave-manager-dev-secret-2025',
  },
})
