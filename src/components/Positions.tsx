import  { useEffect } from 'react';
import { Position } from '../types/positions';
import { usePositions } from '../hooks/usePositions';
import { PositionCard } from './PositionCard';

interface PositionsProps {
  onPositionSelect: (position: Position) => void;
}

export function Positions({ onPositionSelect }: PositionsProps) {
  const { positions, refreshPositions } = usePositions();
  
  // Refresh positions when component mounts
  useEffect(() => {
    console.log('Positions component mounted, refreshing positions');
    refreshPositions();
  }, [refreshPositions]);
  
  return (
    <div className="positions">
      {positions.length === 0 ? (
        <p>No saved positions yet. Create one by adjusting limbs and clicking "Save Position" button.</p>
      ) : (
        positions.map(position => (
          <PositionCard 
            key={position.id} 
            position={position} 
            onClick={() => onPositionSelect(position)} 
          />
        ))
      )}
    </div>
  );
} 