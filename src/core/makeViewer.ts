import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

export type Viewer = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  orbit: OrbitControls
  transform: TransformControls
  dom: HTMLDivElement
  selection: { current: THREE.Object3D | null }
  addMesh: (m: THREE.Mesh) => void
  remove: (o: THREE.Object3D) => void
  onChange: (cb: () => void) => () => void
  dispose: () => void
}

export function makeViewer(container: HTMLDivElement): Viewer {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f1020)

  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 2000)
  camera.position.set(160, 120, 160)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)
  renderer.domElement.id = 'three-canvas'

  const grid = new THREE.GridHelper(600, 60, 0x2d2f53, 0x2d2f53)
  ;(grid.material as any).opacity = 0.5; (grid.material as any).transparent = true
  grid.name = '__grid'
  grid.userData.__helper = true
  scene.add(grid)
  const axes = new THREE.AxesHelper(80)
  axes.name = '__axes'
  ;(axes as any).userData.__helper = true
  scene.add(axes)

  const amb = new THREE.AmbientLight(0xffffff, .6); scene.add(amb)
  const dir = new THREE.DirectionalLight(0xffffff, .8); dir.position.set(100,150,100); scene.add(dir)

  const orbit = new OrbitControls(camera, renderer.domElement)
  orbit.enableDamping = true

  const transform = new TransformControls(camera, renderer.domElement)
  transform.size = 0.9
  scene.add(transform)

  const selection = { current: null as THREE.Object3D | null }
  let outline: THREE.LineSegments | null = null

  function isInsideTransformControls(obj: THREE.Object3D): boolean {
    let p: any = obj
    while (p) {
      if (p.isTransformControls) return true
      p = p.parent
    }
    return false
  }

  function detachOutline() {
    if (!outline) return
    const parent = outline.parent as THREE.Object3D | null
    outline.geometry.dispose()
    ;(outline.material as THREE.Material).dispose()
    if (parent) parent.remove(outline)
    outline = null
  }

  function attachOutline(target: THREE.Mesh) {
    detachOutline()
    const geom = target.geometry as THREE.BufferGeometry
    const edges = new THREE.EdgesGeometry(geom)
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.85 })
    outline = new THREE.LineSegments(edges, mat)
    outline.name = '__outline'
    ;(outline as any).userData.__helper = true
    target.add(outline)
  }

  function setSelection(o: THREE.Object3D | null) {
    selection.current = o
    if (o) {
      transform.attach(o)
      if ((o as any).isMesh) attachOutline(o as THREE.Mesh)
      else detachOutline()
    } else {
      transform.detach()
      detachOutline()
    }
    fireChange()
  }

  renderer.domElement.addEventListener('pointerdown', (ev) => {
    const rect = renderer.domElement.getBoundingClientRect()
    const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
    const pointer = new THREE.Vector2(x, y)
    const ray = new THREE.Raycaster()
    ray.setFromCamera(pointer, camera)
    const hits = ray.intersectObjects(scene.children, true).filter(h => {
      const o: any = h.object
      if (!o.isMesh) return false
      if (o.userData?.__helper) return false
      if (isInsideTransformControls(o)) return false
      return true
    })
    setSelection(hits[0]?.object ?? null)
  })

  renderer.domElement.addEventListener('pointermove', (ev) => {
    const rect = renderer.domElement.getBoundingClientRect()
    const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
    const pointer = new THREE.Vector2(x, y)
    const ray = new THREE.Raycaster()
    ray.setFromCamera(pointer, camera)
    const overPickable = ray.intersectObjects(scene.children, true).some(h => {
      const o: any = h.object
      return o.isMesh && !o.userData?.__helper && !isInsideTransformControls(o)
    })
    renderer.domElement.style.cursor = overPickable ? 'pointer' : 'default'
  })

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'g') transform.setMode('translate')
    if (e.key.toLowerCase() === 'r') transform.setMode('rotate')
    if (e.key.toLowerCase() === 's') transform.setMode('scale')
  })

  transform.addEventListener('dragging-changed', (e:any) => {
    orbit.enabled = !e.value
    if (e.value) renderer.domElement.style.cursor = 'default'
  })

  const cbs = new Set<() => void>()
  function fireChange(){ for (const cb of cbs) cb() }
  function onChange(cb: () => void){ cbs.add(cb); return () => cbs.delete(cb) }

  function addMesh(m: THREE.Mesh){ m.castShadow = m.receiveShadow = true; scene.add(m); setSelection(m); fireChange() }
  function remove(o: THREE.Object3D){ scene.remove(o); fireChange() }

  function onResize(){
    const w = container.clientWidth, h = container.clientHeight
    camera.aspect = w/h; camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  const ro = new ResizeObserver(onResize); ro.observe(container)

  let alive = true
  function loop(){
    if (!alive) return
    orbit.update()
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()

  function dispose(){
    alive = false
    ro.disconnect()
    renderer.dispose()
    detachOutline()
    container.innerHTML = ''
  }

  return { scene, camera, renderer, orbit, transform, dom: container, selection, addMesh, remove, onChange, dispose }
}
