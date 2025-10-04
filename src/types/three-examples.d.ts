declare module 'three/examples/jsm/exporters/STLExporter.js' {
  import { Object3D } from 'three'

  export class STLExporter {
    parse(obj: Object3D, opts?: { binary?: boolean }): ArrayBuffer | string
  }
}

declare module 'three/examples/jsm/exporters/3MFExporter.js' {
  import { Object3D } from 'three'

  export class ThreeMFExporter {
    parse(obj: Object3D): Blob
  }
}
