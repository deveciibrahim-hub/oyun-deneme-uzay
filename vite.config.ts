import { defineConfig } from 'vite';

// base './' -> hem Capacitor (telefon) hem GitHub Pages alt klasöründe çalışsın
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000
  },
  server: { host: true, port: 5173 }
});
