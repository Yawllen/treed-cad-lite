import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/controls/OrbitControls.js',
      'three/examples/jsm/controls/TransformControls.js',
      'three/examples/jsm/geometries/ExtrudeGeometry.js',
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
