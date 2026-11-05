/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Todo relativo (base './') para que la app funcione en cualquier subcarpeta
// del sitio de Design Rebels, p. ej. /projects/quartzsales-calendar/.
const buildDate = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const BUILD_LABEL = `${pad(buildDate.getDate())}/${pad(buildDate.getMonth() + 1)}/${buildDate.getFullYear()} ${pad(buildDate.getHours())}:${pad(buildDate.getMinutes())}`;

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
    __BUILD_LABEL__: JSON.stringify(BUILD_LABEL),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Se actualiza sola: al detectar una versión nueva la activa y recarga (los datos viven en IndexedDB).
      registerType: 'autoUpdate',
      injectRegister: false,
      filename: 'sw.js',
      manifestFilename: 'manifest.webmanifest',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'QuartzSales Calendar',
        short_name: 'QS Calendar',
        description: 'Planificación de comunicaciones internas de QuartzSales.',
        lang: 'es-AR',
        dir: 'ltr',
        // Relativos: la app vive en una subcarpeta del sitio de Design Rebels.
        start_url: './#/inicio',
        scope: './',
        display: 'standalone',
        theme_color: '#7025E0',
        background_color: '#F6F5FB',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cacheId: 'qs-calendar',
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        // El SW solo controla su carpeta (scope ./). Además, nunca responde por la carpeta del código fuente.
        navigateFallbackDenylist: [/\/source\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
    rolldownOptions: {
      output: {
        // Separa dependencias estables para que el navegador las cachee entre versiones.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
            { name: 'data', test: /node_modules[\\/](dexie|dexie-react-hooks|zod)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
