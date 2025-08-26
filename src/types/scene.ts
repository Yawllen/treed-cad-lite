export type NodeType =
  | 'куб'
  | 'сфера'
  | 'цилиндр'
  | 'конус'
  | 'тор'
  | 'эскиз'
  | 'свет'
  | 'камера'
  | 'прочее';

export type SceneNode = {
  id: string; // uuid Object3D
  name: string; // «Куб 1»
  type: NodeType;
  visible: boolean;
  locked: boolean; // запретить TransformControls
  children?: SceneNode[];
};
