import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages требует базовый путь с именем репозитория
const BASE_PATH = process.env.GITHUB_PAGES === 'true' ? '/PentaQ/' : '/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': '/src',
      '@core': '/src/core',
      '@features': '/src/features',
      '@shared': '/src/shared',
      '@app': '/src/app',
    },
  },
  build: {
    outDir: 'dist',
  },
});
