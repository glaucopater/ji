import { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { TechniqueCard } from './components/TechniqueCard';
import { techniques } from './data/techniques';
import { JudoTechnique } from './types/techniques';
import './App.css';

export function App() {
  const [selectedTechnique, setSelectedTechnique] = useState<JudoTechnique | undefined>();

  // Debug mount
  useEffect(() => {
    console.log('App component mounted');
    console.log('Available techniques:', techniques.map(t => t.name));
  }, []);

  const handleTechniqueClick = (technique: JudoTechnique) => {
    console.log('=== Technique Selection Debug ===');
    console.log('handleTechniqueClick called with:', technique.name);
    
    if (technique.isToggle) {
      // For toggle techniques (like walking), toggle the state
      if (selectedTechnique?.id === technique.id) {
        console.log('Turning off toggle technique:', technique.name);
        setSelectedTechnique(undefined);
        // Stop the animation immediately when toggled off
        const scene = document.querySelector('.scene-container');
        if (scene) {
          scene.dispatchEvent(new CustomEvent('animationComplete'));
        }
      } else {
        console.log('Turning on toggle technique:', technique.name);
        setSelectedTechnique(technique);
      }
    } else {
      // For regular techniques, just play once
      console.log('Playing regular technique:', technique.name);
      setSelectedTechnique(technique);
    }
  };

  const handleAnimationComplete = () => {
    console.log('=== Animation Complete Debug ===');
    console.log('Previous technique:', selectedTechnique?.name);
    
    // Only clear the selection if it's not a toggle technique
    if (selectedTechnique && !selectedTechnique.isToggle) {
      console.log('Clearing non-toggle technique');
      setSelectedTechnique(undefined);
    }
  };

  // Debug selected technique changes
  useEffect(() => {
    console.log('Selected technique changed to:', selectedTechnique?.name);
  }, [selectedTechnique]);

  // Separate regular techniques and toggle techniques
  const regularTechniques = techniques.filter(t => !t.isToggle);
  const toggleTechniques = techniques.filter(t => t.isToggle);

  return (
    <div className="app-container">
      <div className="techniques-grid">
        {/* Toggle techniques at the top */}
        {toggleTechniques.map((technique) => (
          <TechniqueCard
            key={technique.id}
            technique={technique}
            onClick={() => handleTechniqueClick(technique)}
            isSelected={selectedTechnique?.id === technique.id}
            isToggle={true}
          />
        ))}
        {/* Regular techniques below */}
        {regularTechniques.map((technique) => (
          <TechniqueCard
            key={technique.id}
            technique={technique}
            onClick={() => handleTechniqueClick(technique)}
            isSelected={selectedTechnique?.id === technique.id}
          />
        ))}
      </div>
      <div className="scene-container">
        <Scene 
          selectedTechnique={selectedTechnique}
          onAnimationComplete={handleAnimationComplete}
        />
      </div>
    </div>
  );
} 