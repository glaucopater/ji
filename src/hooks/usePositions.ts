import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Position, PositionLibrary } from '../types/positions';

const STORAGE_KEY = 'positionLibrary';

export function usePositions() {
  const [library, setLibrary] = useState<PositionLibrary>({
    positions: [],
    lastPositionNumber: 0
  });

  // Load positions from localStorage on mount
  const loadPositionsFromStorage = useCallback(() => {
    const savedLibrary = localStorage.getItem(STORAGE_KEY);
    if (savedLibrary) {
      try {
        const data = JSON.parse(savedLibrary);
        console.log('Successfully loaded positions library:', data);
        setLibrary(data);
      } catch (error) {
        console.error('Error loading positions:', error);
        // Initialize with empty library if there's an error
        setLibrary({ positions: [], lastPositionNumber: 0 });
      }
    }
  }, []);

  useEffect(() => {
    loadPositionsFromStorage();
  }, [loadPositionsFromStorage]);

  const addPosition = (limbs: Position['limbs']) => {
    // Filter out limbs with zero rotations
    const filteredLimbs = Object.entries(limbs).reduce((acc, [id, data]) => {
      const rotation = (data as any).rotation;
      if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
        acc[id as keyof Position['limbs']] = data;
      }
      return acc;
    }, {} as Position['limbs']);

    // Create the new position
    const newPosition: Position = {
      id: uuidv4(),
      name: `Position ${library.lastPositionNumber + 1}`,
      timestamp: Date.now(),
      limbs: filteredLimbs
    };

    // Update library with the new position
    const updatedLibrary = {
      positions: [...library.positions, newPosition],
      lastPositionNumber: library.lastPositionNumber + 1
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLibrary));
    
    // Update state
    setLibrary(updatedLibrary);

    return newPosition;
  };

  const deletePosition = (id: string) => {
    const updatedLibrary = {
      ...library,
      positions: library.positions.filter(p => p.id !== id)
    };
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLibrary));
    
    // Update state
    setLibrary(updatedLibrary);
  };

  const loadPosition = (position: Position) => {
    // For any limb not in the position, assume zero rotation
    const defaultLimbs: Position['limbs'] = {
      upperArmLeft: { rotation: { x: 0, y: 0, z: 0 } },
      upperArmRight: { rotation: { x: 0, y: 0, z: 0 } },
      lowerArmLeft: { rotation: { x: 0, y: 0, z: 0 } },
      lowerArmRight: { rotation: { x: 0, y: 0, z: 0 } },
      upperLegLeft: { rotation: { x: 0, y: 0, z: 0 } },
      upperLegRight: { rotation: { x: 0, y: 0, z: 0 } },
      lowerLegLeft: { rotation: { x: 0, y: 0, z: 0 } },
      lowerLegRight: { rotation: { x: 0, y: 0, z: 0 } }
    };

    return {
      ...defaultLimbs,
      ...position.limbs
    };
  };

  return {
    positions: library.positions,
    addPosition,
    loadPosition,
    deletePosition,
    refreshPositions: loadPositionsFromStorage
  };
} 