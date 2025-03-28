
interface TatamiProps {
  size?: number; // Size of the tatami in meters
  tilesPerSide?: number; // Number of tiles per side
}

export function Tatami({ size = 10, tilesPerSide = 10 }: TatamiProps) {
  const tileSize = size / tilesPerSide;
  const tiles = [];

  // Create alternating red and green tiles
  for (let x = 0; x < tilesPerSide; x++) {
    for (let z = 0; z < tilesPerSide; z++) {
      const isRed = (x + z) % 2 === 0;
      const position = [
        (x - tilesPerSide / 2) * tileSize + tileSize / 2,
        0,
        (z - tilesPerSide / 2) * tileSize + tileSize / 2
      ];

      tiles.push(
        <mesh
          key={`${x}-${z}`}
          position={[position[0], position[1], position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[tileSize * 0.95, tileSize * 0.95]} />
          <meshStandardMaterial 
            color={isRed ? '#8B0000' : '#006400'} 
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      );
    }
  }

  // Add base layer for the entire tatami
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.9} />
      </mesh>
      {tiles}
    </group>
  );
} 