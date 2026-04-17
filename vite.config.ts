import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
