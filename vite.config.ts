import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'r3f-image-distortion',
        short_name: 'img-particles',
        description: 'Particles image technique with threeJs',
        theme_color: '#FFFFFF',
        background_color: '#E8EBF2',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }          
        ],
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait"
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        // Ensure service-worker.js is in the build output
        sw: './public/service-worker.js',
      },
    },
  },
})
