import { Group } from 'three';
import { RefObject } from 'react';

export type JointRefs = {
  upperArmLeftRef: RefObject<Group | null>;
  lowerArmLeftRef: RefObject<Group | null>;
  upperArmRightRef: RefObject<Group | null>;
  lowerArmRightRef: RefObject<Group | null>;
  upperLegLeftRef: RefObject<Group | null>;
  kneeLeftRef: RefObject<Group | null>;
  lowerLegLeftRef: RefObject<Group | null>;
  upperLegRightRef: RefObject<Group | null>;
  kneeRightRef: RefObject<Group | null>;
  lowerLegRightRef: RefObject<Group | null>;
  spineRef: RefObject<Group | null>;
};

export type TechniqueKeyframe = {
  upperArmLeft?: { x?: number; y?: number; z?: number };
  lowerArmLeft?: { x?: number; y?: number; z?: number };
  upperArmRight?: { x?: number; y?: number; z?: number };
  lowerArmRight?: { x?: number; y?: number; z?: number };
  upperLegLeft?: { x?: number; y?: number; z?: number };
  kneeLeft?: { x?: number; y?: number; z?: number };
  lowerLegLeft?: { x?: number; y?: number; z?: number };
  upperLegRight?: { x?: number; y?: number; z?: number };
  kneeRight?: { x?: number; y?: number; z?: number };
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