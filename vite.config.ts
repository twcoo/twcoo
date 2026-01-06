import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'home',
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./home/src', import.meta.url)),
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 2002,
    allowedHosts: ['threewhitecatsoneorange.dev'],
  },
  test: {
    environment: 'jsdom',
  },
})
