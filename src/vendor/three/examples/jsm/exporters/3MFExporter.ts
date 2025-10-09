import { zipSync, strToU8 } from 'fflate'
import { BufferGeometry, Mesh, Object3D } from 'three'

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  const fixed = Number(value.toFixed(6))
  const str = fixed.toString()
  return str === '-0' ? '0' : str
}

function geometryToXml(mesh: Mesh, id: number): string | null {
  const geometry = mesh.geometry as BufferGeometry
  const position = geometry.getAttribute('position')
  if (!position) return null

  const vertexLines: string[] = []
  for (let i = 0; i < position.count; i += 1) {
    vertexLines.push(
      `          <vertex x="${formatNumber(position.getX(i))}" y="${formatNumber(position.getY(i))}" z="${formatNumber(position.getZ(i))}" />`
    )
  }

  const index = geometry.getIndex()
  const triangleLines: string[] = []
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      triangleLines.push(
        `          <triangle v1="${index.getX(i)}" v2="${index.getX(i + 1)}" v3="${index.getX(i + 2)}" />`
      )
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      triangleLines.push(`          <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}" />`)
    }
  }

  return [
    `    <object id="${id}" type="model">`,
    '      <mesh>',
    '        <vertices>',
    ...vertexLines,
    '        </vertices>',
    '        <triangles>',
    ...triangleLines,
    '        </triangles>',
    '      </mesh>',
    '    </object>',
  ].join('\n')
}

export class ThreeMFExporter {
  parse(object: Object3D): Blob {
    const meshes: Mesh[] = []
    object.traverse(obj => {
      if ((obj as Mesh).isMesh) meshes.push(obj as Mesh)
    })

    if (meshes.length === 0) {
      return new Blob([], { type: 'model/3mf' })
    }

    const objectXml: string[] = []
    const buildItems: string[] = []
    let idCounter = 1

    for (const mesh of meshes) {
      const xml = geometryToXml(mesh, idCounter)
      if (!xml) {
        idCounter += 1
        continue
      }
      objectXml.push(xml)
      buildItems.push(`    <item objectid="${idCounter}" />`)
      idCounter += 1
    }

    const modelXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">',
      '  <resources>',
      ...objectXml,
      '  </resources>',
      '  <build>',
      ...buildItems,
      '  </build>',
      '</model>',
    ].join('\n')

    const relsXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>',
      '</Relationships>',
    ].join('\n')

    const contentTypesXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>',
      '</Types>',
    ].join('\n')

    const zipData = zipSync(
      {
        '[Content_Types].xml': strToU8(contentTypesXml),
        '_rels/.rels': strToU8(relsXml),
        '3D/3dmodel.model': strToU8(modelXml),
      },
      { level: 0 }
    )

    return new Blob([zipData], { type: 'model/3mf' })
  }
}
