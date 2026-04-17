import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
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
