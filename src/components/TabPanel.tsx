import React, { useState } from 'react';
import { Position } from '../types/positions';
import { usePositions } from '../hooks/usePositions';

export interface TabPanelProps {
  children: React.ReactNode[];
  onPositionSelect?: (position: Position) => void;
}

export function TabPanel({ children }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { refreshPositions } = usePositions();
  
  // Handle tab change
  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    // If switching to positions tab (index 1), refresh positions
    if (tabIndex === 1) {
      console.log('Switched to positions tab, refreshing positions');
      refreshPositions();
    }
  };

  return (
    <div className="tab-panel">
      <div className="tab-buttons">
        <button
          className={`tab-button ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => handleTabChange(0)}
        >
          Techniques
        </button>
        <button
          className={`tab-button ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => handleTabChange(1)}
        >
          Positions
        </button>
      </div>
      <div className="tab-content">
        {children[activeTab]}
      </div>
    </div>
  );
} 