import { ViewerPosition } from '../types/positions';
import { usePositions } from '../hooks/usePositions';
import './PositionCard.css';

interface PositionCardProps {
  position: ViewerPosition;
  onClick: () => void;
  onDelete?: () => void;
}

export function PositionCard({ position, onClick, onDelete }: PositionCardProps) {
  const { deletePosition } = usePositions();
  const date = new Date(position.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    deletePosition(position.id, 'viewer');
    onDelete?.(); // Call onDelete callback if provided
  };

  return (
    <div className="position-card">
      <div className="position-content" onClick={onClick}>
        <div className="position-name">
          {position.name}
        </div>
        <div className="position-date">
          {formattedDate}
        </div>
      </div>
      <button 
        className="delete-button"
        onClick={handleDelete}
        title="Delete position"
      >
        ×
      </button>
    </div>
  );
} 