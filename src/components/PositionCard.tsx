import { Position } from '../types/positions';
import './PositionCard.css';

interface PositionCardProps {
  position: Position;
  onClick: () => void;
}

export function PositionCard({ position, onClick }: PositionCardProps) {
  const date = new Date(position.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      onClick={onClick}
      className="position-card"
      style={{
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        width: '100%',
        marginBottom: '15px'
      }}
    >

      <div style={{
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        marginBottom: '5px'
      }}>
        {position.name}
      </div>
      <div style={{
        fontSize: '0.7rem',
        color: '#666'
      }}>
        {formattedDate}
      </div>
    </div>
  );
} 