export enum AppState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface OrnamentData {
  id: number;
  type: 'sphere' | 'box' | 'star';
  scale: number;
  color: string;
  scatterPos: [number, number, number];
  scatterRot: [number, number, number];
  treePos: [number, number, number];
  treeRot: [number, number, number];
}

export interface FrameData {
  id: number;
  scatterPos: [number, number, number];
  scatterRot: [number, number, number];
  treePos: [number, number, number];
  treeRot: [number, number, number];
}

export const TREE_CONFIG = {
  height: 12,
  radius: 5,
  foliageCount: 15000,
  ornamentCount: 250,
  scatterRadius: 25,
  frameCount: 6, 
};
