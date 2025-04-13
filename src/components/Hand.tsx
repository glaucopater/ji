import { InteractiveLimb } from "./InteractiveLimb";

export function Hand({ position, side, groupRef }: { 
  position: [number, number, number]; 
  side: "left" | "right";
  groupRef: React.RefObject<THREE.Group>;
}) {
  const limbId = side === "left" ? "handLeft" : "handRight";
  
  return (
    <group ref={groupRef} position={position}>
      <InteractiveLimb
        geometry={[0.15, 0.1, 0.08]}
        color="lightblue"
        position={[0, 0, 0]}
        groupRef={groupRef}
        limbId={limbId}
      />
      {/* Thumb */}
      {side === "left" && (
        <mesh position={[0.08, 0.04, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color='cyan' />
        </mesh>
      )}
      {side === "right" && (
        <mesh position={[-0.08, 0.04, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color='cyan' />
        </mesh>
      )}
    </group>
  );
}
