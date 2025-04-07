import * as THREE from "three";
import { JudoTechnique } from "./techniques";

// Add new interface for stored limb positions
export interface StoredLimbPositions {
  [limbId: string]: {
    rotation: {
      x: number;
      y: number;
      z: number;
    };
  };
}

export interface InteractiveLimbProps {
  geometry: [radius1: number, radius2: number, height: number];
  color: string;
  position: [number, number, number];
  groupRef: React.RefObject<THREE.Group | null>;
  limbId: LimbId;
}

// Add type for rotation axes
export type RotationAxis = "x" | "y" | "z";

// Add new interface for axis control data
export interface AxisControlData {
  limbId: LimbId;
  axis: "x" | "y" | "z";
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

// Update constraints with proper typing
export const LIMB_CONSTRAINTS: Record<LimbId, LimbConstraints> = {
  upperArmLeft: {
    rotation: {
      x: [-Math.PI / 2, Math.PI / 2],
      y: [-Math.PI / 2, Math.PI / 2],
      z: [-Math.PI / 2, Math.PI / 2],
    },
  },
  lowerArmLeft: {
    rotation: {
      x: [0, Math.PI / 2],
      y: [-Math.PI / 4, Math.PI / 4],
      z: [-Math.PI / 4, Math.PI / 4],
    },
  },
  upperArmRight: {
    rotation: {
      x: [-Math.PI / 2, Math.PI / 2],
      y: [-Math.PI / 2, Math.PI / 2],
      z: [-Math.PI / 2, Math.PI / 2],
    },
  },
  lowerArmRight: {
    rotation: {
      x: [0, Math.PI / 2],
      y: [-Math.PI / 4, Math.PI / 4],
      z: [-Math.PI / 4, Math.PI / 4],
    },
  },
  upperLegLeft: {
    rotation: {
      x: [-Math.PI / 2, Math.PI / 2],
      y: [-Math.PI / 4, Math.PI / 4],
      z: [-Math.PI / 4, Math.PI / 4],
    },
  },
  lowerLegLeft: {
    rotation: {
      x: [0, Math.PI / 2],
      y: [-Math.PI / 4, Math.PI / 4],
      z: [-Math.PI / 4, Math.PI / 4],
    },
  },
  upperLegRight: {
    rotation: {
      x: [-Math.PI / 2, Math.PI / 2],
      y: [-Math.PI / 4, Math.PI / 4],
      z: [-Math.PI / 4, Math.PI / 4],
    },
  },
  lowerLegRight: {
    rotation: {
      x: [0, Math.PI / 2],
      y: [-Math.PI / 4, Math.PI / 4],
      z: [-Math.PI / 4, Math.PI / 4],
    },
  },
  upperTorso: {
    rotation: {
      x: [-Math.PI / 4, Math.PI / 4],
      y: [-Math.PI / 4, Math.PI / 4],
      z: [-Math.PI / 4, Math.PI / 4],
    },
  },
  lowerTorso: {
    rotation: {
      x: [-Math.PI / 4, Math.PI / 4],
      y: [-Math.PI / 4, Math.PI / 4],
      z: [-Math.PI / 4, Math.PI / 4],
    },
  },
};

// Update default positions with proper typing
export const DEFAULT_POSITIONS: Record<LimbId, LimbState> = {
  upperArmLeft: {
    position: new THREE.Vector3(-0.4, 1.2, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  lowerArmLeft: {
    position: new THREE.Vector3(-0.4, 0.8, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  upperArmRight: {
    position: new THREE.Vector3(0.4, 1.2, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  lowerArmRight: {
    position: new THREE.Vector3(0.4, 0.8, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  upperLegLeft: {
    position: new THREE.Vector3(-0.2, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  lowerLegLeft: {
    position: new THREE.Vector3(-0.2, -0.4, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  upperLegRight: {
    position: new THREE.Vector3(0.2, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  lowerLegRight: {
    position: new THREE.Vector3(0.2, -0.4, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  upperTorso: {
    position: new THREE.Vector3(0, 1.2, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  lowerTorso: {
    position: new THREE.Vector3(0, 0.4, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
};

export interface CustomSceneProps {
  children?: React.ReactNode;
  selectedTechnique?: JudoTechnique;
  onAnimationComplete?: () => void;
}

// Add new interface for model position
export interface ModelPosition {
  y: number;
}

// Add new interface for limb state
export interface LimbState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

// Add type for limb IDs
export type LimbId =
  | "upperArmLeft"
  | "lowerArmLeft"
  | "upperArmRight"
  | "lowerArmRight"
  | "upperLegLeft"
  | "lowerLegLeft"
  | "upperLegRight"
  | "lowerLegRight"
  | "upperTorso"
  | "lowerTorso";

// Add type for constraints
export interface LimbConstraints {
  rotation: {
    x: [min: number, max: number];
    y: [min: number, max: number];
    z: [min: number, max: number];
  };
}
