import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'IIML VMS Gate Console',
        short_name: 'VMS Gate',
        theme_color: '#1a365d',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [{ src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/sync\/gate-cache/,
            handler: 'NetworkFirst',
            options: { cacheName: 'gate-cache' },
          },
        ],
      },
    }),
  ],
  server: { port: 5174 },
});
