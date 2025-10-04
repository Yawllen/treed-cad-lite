import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const fromRoot = (relativePath: string) => new URL(relativePath, import.meta.url).pathname

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'three/examples/jsm/geometries/ExtrudeGeometry.js':
        fromRoot('./src/vendor/three/examples/jsm/geometries/ExtrudeGeometry.ts'),
      'three/examples/jsm/exporters/3MFExporter.js':
        fromRoot('./src/vendor/three/examples/jsm/exporters/3MFExporter.ts'),
    },
  },
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/controls/OrbitControls.js',
      'three/examples/jsm/controls/TransformControls.js',
      'three/examples/jsm/exporters/STLExporter.js',
      'three/examples/jsm/exporters/3MFExporter.js',
    ],
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
