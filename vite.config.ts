import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const resolveFromRoot = (relativePath: string) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'three/examples/jsm/geometries/ExtrudeGeometry.js': resolveFromRoot(
        './src/vendor/three/examples/jsm/geometries/ExtrudeGeometry.ts',
      ),
    },
  },
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/controls/OrbitControls.js',
      'three/examples/jsm/controls/TransformControls.js',
      'three/examples/jsm/geometries/ExtrudeGeometry.js',
    ],
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
