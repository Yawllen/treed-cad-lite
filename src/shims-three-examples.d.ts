// Шим для корректной работы типов three/examples в TS/ESM окружении
declare module 'three/examples/jsm/controls/OrbitControls' {
  export * from 'three/examples/jsm/controls/OrbitControls.js';
  export { default } from 'three/examples/jsm/controls/OrbitControls.js';
}
declare module 'three/examples/jsm/controls/TransformControls' {
  export * from 'three/examples/jsm/controls/TransformControls.js';
  export { default } from 'three/examples/jsm/controls/TransformControls.js';
}
