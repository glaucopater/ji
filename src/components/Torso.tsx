import * as THREE from "three";
import { ReactNode } from "react";
import { InteractiveLimb } from "./Scene";

interface TorsoProps {
  upperTorsoRef: React.RefObject<THREE.Group>;
  lowerTorsoRef: React.RefObject<THREE.Group>;
  upperChildren?: ReactNode;
  lowerChildren?: ReactNode;
}

export function Torso({ upperTorsoRef, lowerTorsoRef, upperChildren, lowerChildren }: TorsoProps) {
  return (
    <group>
      {/* Lower Torso */}
      <group ref={lowerTorsoRef}>
        <InteractiveLimb
          geometry={[0.3, 0.3, 0.5]}
          color="#4a90e2"
          position={[0, 0.9, 0]}
          groupRef={lowerTorsoRef}
          limbId="lowerTorso"
        />
        {lowerChildren}
      </group>
      {/* Upper Torso */}
      <group ref={upperTorsoRef}>
        <InteractiveLimb
          geometry={[0.4, 0.4, 0.4]}
          color="#4a90e2"
          position={[0, 1.4, 0]}
          groupRef={upperTorsoRef}
          limbId="upperTorso"
        />
        {upperChildren}
      </group>
    </group>
  );
}
