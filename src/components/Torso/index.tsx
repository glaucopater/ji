export const Torso = () => (
  <mesh position={[0, 1.2, 0]}>
    <cylinderGeometry args={[0.3, 0.25, 1.2, 32]} />
    <meshStandardMaterial color='lightblue' />
  </mesh>
);
