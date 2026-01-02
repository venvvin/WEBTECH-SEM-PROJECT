import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate', // Авто-обновление при изменениях
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'], // Файлы, которые кешируем
      manifest: {
        name: 'School Journey Game',
        short_name: 'SchoolJourney',
        description: 'A fun journey to school for kids',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Убирает интерфейс браузера (выглядит как приложение)
        orientation: 'landscape', // Просим горизонтальную ориентацию
        icons: [
          {
            src: 'pwa-192x192.png', // Эти картинки надо будет создать!
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})