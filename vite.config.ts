import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'AgroPulse',
          short_name: 'AgroPulse',
          description: 'Offline-first crop disease diagnostic tool',
          theme_color: '#1B4332',
          background_color: '#F9FBF9',
          display: 'standalone',
          icons: [
            {
              src: '/download.jpg',
              sizes: '192x192',
              type: 'image/jpeg'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webmanifest}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB — allows .tflite model
          runtimeCaching: [
            {
              urlPattern: /.*\.tflite$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'agropulse-models',
                expiration: {
                  maxEntries: 12,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /.*_classes\.json$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'agropulse-classmaps',
                expiration: {
                  maxEntries: 12,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /.*\.wasm$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'agropulse-wasm',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
  };
});
