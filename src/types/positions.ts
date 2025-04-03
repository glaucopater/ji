import { LimbId } from './viewer';

export interface Position {
  id: string;
  name: string;
  timestamp: number;
  limbs: {
    [key in LimbId]: {
      rotation: {
        x: number;
        y: number;
        z: number;
      };
    };
  };
}

export interface PositionLibrary {
  positions: Position[];
  lastPositionNumber: number;
} 