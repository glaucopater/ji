import { Node, Edge } from 'reactflow';

export type LimbType = 
  | 'upperArmLeft'
  | 'upperArmRight'
  | 'lowerArmLeft'
  | 'lowerArmRight'
  | 'upperLegLeft'
  | 'kneeLeft'
  | 'lowerLegLeft'
  | 'upperLegRight'
  | 'kneeRight'
  | 'lowerLegRight'
  | 'torso'
  | 'head';

export type MovementType = 
  | 'moveForward'
  | 'moveBackward'
  | 'moveLeft'
  | 'moveRight'
  | 'moveUp'
  | 'moveDown'
  | 'rotateLeft'
  | 'rotateRight'
  | 'rotateUp'
  | 'rotateDown';

export interface MovementData {
  limb: LimbType;
  movementType: MovementType;
  position: {
    x: number;
    y: number;
    z: number;
  };
  duration: number;
  force: number;
}

export type FlowNode = Node<MovementData>;

export interface TechniqueFlow {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

export interface TechniqueLibrary {
  techniques: TechniqueFlow[];
} 