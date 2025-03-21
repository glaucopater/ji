import { JudoTechnique } from '../types/techniques';
import { useEffect } from 'react';

interface TechniqueCardProps {
  technique: JudoTechnique;
  onClick: () => void;
  isSelected?: boolean;
  isToggle?: boolean;
}

export function TechniqueCard({ technique, onClick, isSelected, isToggle }: TechniqueCardProps) {
  // Debug mount and updates
  useEffect(() => {
    console.log(`TechniqueCard mounted/updated: ${technique.name} (selected: ${isSelected})`);
  }, [technique.name, isSelected]);

  const handleClick = () => {
    console.log('=== TechniqueCard Click Debug ===');
    console.log(`Card clicked: ${technique.name}`);
    console.log('Current selected state:', isSelected);
    onClick();
    console.log('Click handler completed');
  };

  return (
    <div
      className="technique-card"
      onClick={handleClick}
      style={{
        padding: '0.5rem',
        border: `2px solid ${isSelected ? '#4a90e2' : '#ccc'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: isSelected ? '#f0f7ff' : 'white',
        boxShadow: isSelected 
          ? '0 4px 8px rgba(74,144,226,0.2)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: '0', fontSize: '1rem' }}>{technique.name}</h3>
        {isToggle && (
          <span style={{
            padding: '0.2rem 0.4rem',
            borderRadius: '4px',
            backgroundColor: isSelected ? '#4CAF50' : '#ccc',
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            {isSelected ? 'ON' : 'OFF'}
          </span>
        )}
      </div>
      <p style={{ margin: '0.2rem 0', fontStyle: 'italic', fontSize: '0.8rem' }}>
        {technique.japaneseName}
      </p>
      <div style={{ fontSize: '0.7rem', color: '#666' }}>
        <span>{technique.category}</span>
        <span style={{ margin: '0 0.3rem' }}>•</span>
        <span>{technique.difficulty}</span>
      </div>
    </div>
  );
} 