import { LimbId } from './viewer';

export interface ViewerPosition {
  id: string;
  name: string;
  timestamp: number;
  height: number;
  limbs: {
    [key in LimbId]?: {
      rotation: {
        x: number;
        y: number;
        z: number;
      };
      height: number;
    };
  };
}

export interface ViewerLibrary {
  positions: ViewerPosition[];
  lastPositionNumber: number;
} 