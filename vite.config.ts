import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// GitHub Pages требует базовый путь с именем репозитория
const BASE_PATH = process.env.GITHUB_PAGES === 'true' ? '/PentaQ/' : '/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@app': path.resolve(__dirname, './src/app'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
