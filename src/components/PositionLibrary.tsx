import { usePositions } from '../hooks/usePositions';
import { Position } from '../types/positions';
import { PositionCard } from './PositionCard';

interface PositionLibraryProps {
  onPositionSelect: (position: Position) => void;
}

export function PositionLibrary({ onPositionSelect }: PositionLibraryProps) {
  const { positions } = usePositions();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
      padding: '10px',
      maxHeight: '100%',
      overflowY: 'auto'
    }}>
      {positions.map((position) => (
        <PositionCard
          key={position.id}
          position={position}
          onClick={() => onPositionSelect(position)}
        />
      ))}
    </div>
  );
} 