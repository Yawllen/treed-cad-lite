import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin as EsbuildPlugin } from 'esbuild';

const extrudeShim = () => ({
  name: 'three-extrude-shim',
  resolveId(source: string) {
    if (source === 'three/examples/jsm/geometries/ExtrudeGeometry.js') {
      return '\0three-extrude-geometry';
    }
    return null;
  },
  load(id: string) {
    if (id === '\0three-extrude-geometry') {
      return "import { ExtrudeGeometry } from 'three';\nexport { ExtrudeGeometry };\n";
    }
    return null;
  },
});

const extrudeEsbuildShim = (): EsbuildPlugin => ({
  name: 'three-extrude-shim',
  setup(build) {
    build.onResolve({ filter: /^three\/examples\/jsm\/geometries\/ExtrudeGeometry\.js$/ }, () => ({
      path: 'three/examples/jsm/geometries/ExtrudeGeometry.js',
      namespace: 'three-extrude-shim',
    }));
    build.onLoad({ filter: /.*/, namespace: 'three-extrude-shim' }, () => ({
      contents: "import { ExtrudeGeometry } from 'three';\nexport { ExtrudeGeometry };\n",
      loader: 'js',
    }));
  },
});

export default defineConfig({
  plugins: [react(), extrudeShim()],
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/controls/OrbitControls.js',
      'three/examples/jsm/controls/TransformControls.js',
      'three/examples/jsm/geometries/ExtrudeGeometry.js',
    ],
    esbuildOptions: {
      plugins: [extrudeEsbuildShim()],
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
