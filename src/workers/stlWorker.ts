export type StlPacket = {
  positions: Float32Array;
  indices: Uint32Array;
  name?: string;
};

export interface StlWorkerData {
  geometries: StlPacket[];
  precision: number;
}

self.onmessage = (e: MessageEvent<StlWorkerData>) => {
  const { geometries, precision } = e.data;
  const buffer = serializeBinary(geometries, precision);
  (self as any).postMessage(buffer, [buffer]);
};

function serializeBinary(geoms: StlPacket[], precision: number): ArrayBuffer {
  let tris = 0;
  for (const g of geoms) tris += g.indices.length / 3;
  const buffer = new ArrayBuffer(84 + tris * 50);
  const dv = new DataView(buffer);
  dv.setUint32(80, tris, true);
  let offset = 84;

  for (const g of geoms) {
    const { positions, indices } = g;
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 3;
      const b = indices[i + 1] * 3;
      const c = indices[i + 2] * 3;

      const ax = positions[a], ay = positions[a + 1], az = positions[a + 2];
      const bx = positions[b], by = positions[b + 1], bz = positions[b + 2];
      const cx = positions[c], cy = positions[c + 1], cz = positions[c + 2];

      const abx = bx - ax, aby = by - ay, abz = bz - az;
      const acx = cx - ax, acy = cy - ay, acz = cz - az;
      let nx = aby * acz - abz * acy;
      let ny = abz * acx - abx * acz;
      let nz = abx * acy - aby * acx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;

      dv.setFloat32(offset, nx, true); offset += 4;
      dv.setFloat32(offset, ny, true); offset += 4;
      dv.setFloat32(offset, nz, true); offset += 4;

      offset = writeVertex(dv, offset, ax, ay, az, precision);
      offset = writeVertex(dv, offset, bx, by, bz, precision);
      offset = writeVertex(dv, offset, cx, cy, cz, precision);

      dv.setUint16(offset, 0, true);
      offset += 2;
    }
  }
  return buffer;
}

function writeVertex(dv: DataView, off: number, x: number, y: number, z: number, p: number) {
  dv.setFloat32(off, Math.round(x / p) * p, true); off += 4;
  dv.setFloat32(off, Math.round(y / p) * p, true); off += 4;
  dv.setFloat32(off, Math.round(z / p) * p, true); off += 4;
  return off;
}
