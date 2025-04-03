import { Group } from 'three';
import { RefObject } from 'react';

export interface JointRefs {
  upperArmLeftRef: RefObject<Group>;
  lowerArmLeftRef: RefObject<Group>;
  upperArmRightRef: RefObject<Group>;
  lowerArmRightRef: RefObject<Group>;
  upperLegLeftRef: RefObject<Group>;
  lowerLegLeftRef: RefObject<Group>;
  upperLegRightRef: RefObject<Group>;
  lowerLegRightRef: RefObject<Group>;
  spineRef: RefObject<Group>;
}

export type TechniqueKeyframe = {
  upperArmLeft?: { x?: number; y?: number; z?: number };
  lowerArmLeft?: { x?: number; y?: number; z?: number };
  upperArmRight?: { x?: number; y?: number; z?: number };
  lowerArmRight?: { x?: number; y?: number; z?: number };
  upperLegLeft?: { x?: number; y?: number; z?: number };
  lowerLegLeft?: { x?: number; y?: number; z?: number };
  upperLegRight?: { x?: number; y?: number; z?: number };
  lowerLegRight?: { x?: number; y?: number; z?: number };
  spine?: { x?: number; y?: number; z?: number };
  duration: number; // Duration in seconds
};

export type TechniqueAnimation = {
  keyframes: TechniqueKeyframe[];
  loop?: boolean;
};

export type JudoTechnique = {
  id: string;
  name: string;
  japaneseName: string;
  description: string;
  category: string;
  difficulty: string;
  isToggle?: boolean;
  animation: TechniqueAnimation;
}; 