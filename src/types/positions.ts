import { LimbId } from './viewer';
import { Keypoint } from '@tensorflow-models/pose-detection';

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

export interface PosePosition {
  id: string;
  name: string;
  timestamp: number;
  keypoints: Keypoint[];
}

export interface ViewerLibrary {
  positions: ViewerPosition[];
  lastPositionNumber: number;
}

export interface PoseLibrary {
  positions: PosePosition[];
  lastPositionNumber: number;
} 