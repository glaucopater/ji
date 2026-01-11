import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Scene } from './components/Scene';
import { TechniqueEditor } from './components/flow/TechniqueEditor';
import { PoseTracker } from './components/PoseTracker';
import { Settings } from './components/Settings';
import { techniques } from './data/techniques';
import { useState } from 'react';
import { JudoTechnique } from './types/techniques';
import './App.css';

function Viewer() {
  const [selectedTechnique, setSelectedTechnique] = useState<JudoTechnique | undefined>(undefined);
  const [isWalking, setIsWalking] = useState(false);

  const handleTechniqueClick = (technique: JudoTechnique) => {
    if (technique.isToggle) {
      setIsWalking(!isWalking);
      setSelectedTechnique(isWalking ? undefined : technique);
    } else {
      setSelectedTechnique(technique);
    }
  };

  const handleAnimationComplete = () => {
    if (!selectedTechnique?.isToggle) {
      setSelectedTechnique(undefined);
    }
  };

  // Separate toggle techniques from regular techniques
  const toggleTechniques = techniques.filter(t => t.isToggle);
  const regularTechniques = techniques.filter(t => !t.isToggle);

  return (
    <div className="app">
      <div className="techniques-grid">
        {/* Toggle techniques at the top */}
        {toggleTechniques.map((technique) => (
          <div
            key={technique.id}
            className={`technique-card ${selectedTechnique?.id === technique.id ? 'selected' : ''}`}
            onClick={() => handleTechniqueClick(technique)}
          >
            <h3>{technique.name}</h3>
            <p>{technique.japaneseName}</p>
            <p>{technique.description}</p>
            <div className="technique-meta">
              <span className="category">{technique.category}</span>
              <span className="difficulty">{technique.difficulty}</span>
              <span className="toggle-status">{isWalking ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        ))}

        {/* Regular techniques below */}
        {regularTechniques.map((technique) => (
          <div
            key={technique.id}
            className={`technique-card ${selectedTechnique?.id === technique.id ? 'selected' : ''}`}
            onClick={() => handleTechniqueClick(technique)}
          >
            <h3>{technique.name}</h3>
            <p>{technique.japaneseName}</p>
            <p>{technique.description}</p>
            <div className="technique-meta">
              <span className="category">{technique.category}</span>
              <span className="difficulty">{technique.difficulty}</span>
            </div>
          </div>
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

function Navigation() {
  return (
    <nav className="navigation">
      <NavLink to="/" end>Viewer</NavLink>
      <NavLink to="/editor">Editor</NavLink>
      <NavLink to="/pose-tracker">Pose Tracker</NavLink>
      <NavLink to="/settings">⚙️ Settings</NavLink>
    </nav>
  );
}

export function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <div className="app">
          <Routes>
            <Route path="/" element={<Viewer />} />
            <Route path="/editor" element={<TechniqueEditor />} />
            <Route path="/pose-tracker" element={<PoseTracker />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
} 