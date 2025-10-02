import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const root = process.cwd();
  const target = path.join(
    root,
    'node_modules',
    'three',
    'examples',
    'jsm',
    'geometries',
    'ExtrudeGeometry.js',
  );

  if (await exists(target)) {
    return;
  }

  await mkdir(path.dirname(target), { recursive: true });
  const shim = "import { ExtrudeGeometry } from 'three';\nexport { ExtrudeGeometry };\n";
  await writeFile(target, shim, 'utf8');
  console.info('[ensure-three-extrude] Wrote shim for examples/jsm ExtrudeGeometry');
}

main().catch((err) => {
  console.error('[ensure-three-extrude] Failed to create ExtrudeGeometry shim:', err);
  process.exitCode = 1;
});
