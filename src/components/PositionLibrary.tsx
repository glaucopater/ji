import { usePositions } from '../hooks/usePositions';
import { ViewerPosition } from '../types/positions';
import { PositionCard } from './PositionCard';

interface PositionLibraryProps {
  onPositionSelect: (position: ViewerPosition) => void;
}

export function PositionLibrary({ onPositionSelect }: PositionLibraryProps) {
  const { viewerPositions } = usePositions();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
      padding: '10px',
      maxHeight: '100%',
      overflowY: 'auto'
    }}>
      {viewerPositions.map((position: ViewerPosition) => (
        <PositionCard
          key={position.id}
          position={position}
          onClick={() => onPositionSelect(position)}
        />
      ))}
    </div>
  );
} 