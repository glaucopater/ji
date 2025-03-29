export function Hand({ position, side }: { position: [number, number, number]; side: "left" | "right" }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.15, 0.08, 0.08]} />
        <meshStandardMaterial color='lightblue' />
      </mesh>
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
