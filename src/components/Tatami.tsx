interface TatamiProps {
  size?: number; // Size of the tatami in meters
  tilesPerSide?: number; // Number of tiles per side
}

export function Tatami({ size = 10, tilesPerSide = 10 }: TatamiProps) {
  const tileSize = size / tilesPerSide;
  const tiles = [];

  // Create tiles with double green perimeter and red interior
  for (let x = 0; x < tilesPerSide; x++) {
    for (let z = 0; z < tilesPerSide; z++) {
      // Check if the tile is on the outer perimeter or the inner perimeter
      const isOuterPerimeter = x === 0 || x === tilesPerSide - 1 || z === 0 || z === tilesPerSide - 1;
      const isInnerPerimeter = x === 1 || x === tilesPerSide - 2 || z === 1 || z === tilesPerSide - 2;
      const isPerimeter = isOuterPerimeter || isInnerPerimeter;
      
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
            color={isPerimeter ? '#006400' : '#8B0000'} 
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