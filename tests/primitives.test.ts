import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { createCube, createExtruded } from '../src/core/primitives'

describe('primitives', () => {
  it('createCube has expected bbox', () => {
    const mesh = createCube({ size: 20 })
    const box = new THREE.Box3().setFromObject(mesh)
    const size = new THREE.Vector3()
    box.getSize(size)
    // из-за позиционирования по Y (size/2) высота равна size
    expect(Math.round(size.x)).toBe(20)
    expect(Math.round(size.y)).toBe(20)
    expect(Math.round(size.z)).toBe(20)
  })

  it('createExtruded depth equals bbox height (within tolerance)', () => {
    const mesh = createExtruded({ shape:'rect', w:20, h:10, depth:15 })
    const box = new THREE.Box3().setFromObject(mesh)
    const size = new THREE.Vector3()
    box.getSize(size)
    expect(Math.round(size.y)).toBe(15) // после поворота X: глубина ложится по Y
  })
})
