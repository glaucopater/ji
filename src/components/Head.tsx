import * as THREE from "three";
import { InteractiveLimb } from "./Scene";

interface HeadProps {
  headRef: React.RefObject<THREE.Group>;
}

export const Head = ({ headRef }: HeadProps) => (
  <group ref={headRef}>
    <InteractiveLimb
      geometry={[0.3, 0.3, 0.3]}
      color="#4169E1"
      position={[0, 2, 0]}
      groupRef={headRef}
      limbId="head"
    />
    {/* Eyes to show front direction */}
    <mesh position={[0.15, 2, 0.20]} scale={0.1}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color='grey' />
    </mesh>
    <mesh position={[-0.15, 2, 0.20]} scale={0.1}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color='grey' />
    </mesh>
  </group>
);

