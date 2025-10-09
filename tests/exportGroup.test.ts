import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { buildExportGroupFromRoots, isHelperObject } from '../src/core/makeViewer'

describe('buildExportGroupFromRoots', () => {
  it('clones meshes with world transforms applied', () => {
    const scene = new THREE.Scene()
    const mat = new THREE.MeshBasicMaterial()

    const meshA = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat)
    meshA.position.set(5, 0, 0)
    scene.add(meshA)

    const meshB = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat)
    meshB.position.set(-1, 3, 0)
    meshB.scale.set(2, 3, 1)
    scene.add(meshB)

    const helper = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat)
    helper.userData.__helper = true
    scene.add(helper)

    scene.updateMatrixWorld(true)

    const group = buildExportGroupFromRoots([scene], { isHelper: isHelperObject })
    expect(group.children.length).toBe(2)

    const boxes = group.children.map(child => new THREE.Box3().setFromObject(child as THREE.Mesh))

    const meshBBox = boxes.find(box => Math.abs(box.min.x - 4) < 1e-6 && Math.abs(box.max.x - 6) < 1e-6)
    expect(meshBBox).toBeTruthy()

    const scaledBox = boxes.find(box => Math.abs(box.min.x + 2) < 1e-6 && Math.abs(box.max.x) < 1e-6)
    expect(scaledBox).toBeTruthy()
    expect(scaledBox?.min.y ?? 0).toBeCloseTo(1.5)
    expect(scaledBox?.max.y ?? 0).toBeCloseTo(4.5)
  })

  it('limits export to selection when requested', () => {
    const mat = new THREE.MeshBasicMaterial()
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat)
    mesh.position.set(2, 0, 0)
    mesh.updateMatrixWorld(true)

    const group = buildExportGroupFromRoots([mesh], { isHelper: isHelperObject })
    expect(group.children.length).toBe(1)

    const exported = group.children[0] as THREE.Mesh
    const box = new THREE.Box3().setFromObject(exported)
    expect(box.min.x).toBeCloseTo(1.5)
    expect(box.max.x).toBeCloseTo(2.5)
  })
})
