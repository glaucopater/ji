import { useEffect } from 'react';
import { ViewerPosition } from '../types/positions';
import { usePositions } from '../hooks/usePositions';
import { PositionCard } from './PositionCard';

interface PositionsProps {
  onPositionSelect: (position: ViewerPosition) => void;
}

export function Positions({ onPositionSelect }: PositionsProps) {
  const { viewerPositions, refreshPositions } = usePositions();
  
  // Refresh positions when component mounts
  useEffect(() => {
    console.log('Positions component mounted, refreshing positions');
    refreshPositions();
  }, [refreshPositions]);

  const handleDelete = () => {
    console.log('Position deleted, refreshing positions');
    refreshPositions();
  };
  
  return (
    <div className="positions">
      {viewerPositions.length === 0 ? (
        <p>No saved positions yet. Create one by adjusting limbs and clicking "Save Position" button.</p>
      ) : (
        viewerPositions.map(position => (
          <PositionCard 
            key={position.id} 
            position={position} 
            onClick={() => onPositionSelect(position)}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );
} 