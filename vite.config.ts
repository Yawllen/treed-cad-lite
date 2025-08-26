import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@core': '/src/core',
      '@scene': '/src/scene',
      '@controls': '/src/controls',
      '@ops': '/src/ops',
      '@ui': '/src/ui',
      '@utils': '/src/utils',
    },
  },
});
