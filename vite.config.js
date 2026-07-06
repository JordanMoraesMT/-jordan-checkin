import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'TeamCheck — Jordan Representações',
        short_name: 'TeamCheck',
        description: 'CRM + Força de Vendas — Jordan Representações Comerciais',
        lang: 'pt-BR',
        theme_color: '#0F1B2D',
        background_color: '#0F1B2D',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 4194304,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/router\.project-osrm\.org/,
            handler: 'CacheFirst',
            options: { cacheName: 'osrm-routes', expiration: { maxEntries: 200, maxAgeSeconds: 86400 } }
          },
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org/,
            handler: 'CacheFirst',
            options: { cacheName: 'osm-tiles', expiration: { maxEntries: 500, maxAgeSeconds: 604800 } }
          }
        ]
      }
    })
  ]
})
