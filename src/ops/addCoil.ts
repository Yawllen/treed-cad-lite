import * as THREE from 'three';

function createMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xb0b8c0,
    metalness: 0.1,
    roughness: 0.8,
  });
}

class CoilCurve extends THREE.Curve<THREE.Vector3> {
  radius: number;
  pitch: number;
  turns: number;
  constructor(radius: number, pitch: number, turns: number) {
    super();
    this.radius = radius;
    this.pitch = pitch;
    this.turns = turns;
  }

  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const angle = this.turns * Math.PI * 2 * t;
    const x = this.radius * Math.cos(angle);
    const z = this.radius * Math.sin(angle);
    const y = this.pitch * this.turns * t;
    return target.set(x, y, z);
  }
}

export function addCoil(
  diam = 20,
  pitch = 5,
  turns = 4,
  wire = 2,
): THREE.Mesh {
  const radius = diam / 2;
  const curve = new CoilCurve(radius, pitch, turns);
  const tubularSegments = Math.round(turns * 50);
  const radialSegments = 8;
  const geo = new THREE.TubeGeometry(
    curve,
    tubularSegments,
    wire / 2,
    radialSegments,
    false,
  );
  geo.translate(0, -(pitch * turns) / 2, 0);
  const mesh = new THREE.Mesh(geo, createMaterial());
  mesh.frustumCulled = false;
  return mesh;
}
