export const Head = () => (
  <mesh position={[0, 2, 0]} scale={[0.6, 1, 0.7]} castShadow>
    <sphereGeometry args={[0.3, 32, 32]} />
    <meshStandardMaterial color='lightblue' />
    {/* Eyes to show front direction */}
    <mesh position={[0.15, 0, 0.25]} scale={0.1}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color='black' />
    </mesh>
    <mesh position={[-0.15, 0, 0.25]} scale={0.1}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color='black' />
    </mesh>
  </mesh>
);
