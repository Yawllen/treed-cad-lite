import { describe, it, expect } from 'vitest'
import { useFeatureTree } from '../src/core/featureTree'

describe('featureTree', () => {
  it('adds and serializes nodes', () => {
    const tree = useFeatureTree.getState()
    tree.load({ nodes: [] })
    tree.add({ type:'cube', params:{ size: 10 }, uuid: 'a' } as any)
    tree.add({ type:'sphere', params:{ radius: 5 }, uuid: 'b' } as any)
    const s = tree.serialize()
    expect(s.nodes.length).toBe(2)
    expect(s.nodes[0].type).toBe('cube')
    expect(s.nodes[1].type).toBe('sphere')
  })
})
