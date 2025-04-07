import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import React from "react";
import * as THREE from "three";
import "../types/global.d";
import { JudoTechnique } from "../types/techniques";
import { Tatami } from "./Tatami";
import { Humanoid } from "./Humanoid";
import {
  AxisControlData,
  DEFAULT_POSITIONS,
  InteractiveLimbProps,
  LIMB_CONSTRAINTS,
  LimbId,
  ModelPosition,
  RotationAxis,
  CustomSceneProps,
  StoredLimbPositions,
} from "../types/viewer";
import { ScreenshotButton } from './ScreenshotButton';
import { Position } from '../types/positions';
import { usePositions } from '../hooks/usePositions';
import { TabPanel } from './TabPanel';
import { Positions } from './Positions';
import './Scene.css';
import { DEFAULT_TECHNIQUES, techniques } from '../data/techniques';
import { toast } from 'react-hot-toast';

// Add new context for active limb
const ActiveLimbContext = React.createContext<{
  activeLimbId: LimbId | null;
  setActiveLimbId: (id: LimbId | null) => void;
}>({
  activeLimbId: null,
  setActiveLimbId: () => {},
});

// Add new context for axis controls
const AxisControlsContext = React.createContext<{
  controls: AxisControlData[];
  setControls: (controls: AxisControlData[]) => void;
}>({
  controls: [],
  setControls: () => {},
});

export function Joint({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color='yellow' opacity={0.7} transparent />
    </mesh>
  );
}

// Move AxisControl component outside of Canvas
function AxisControls() {
  const { controls } = React.useContext(AxisControlsContext);
  
  if (controls.length === 0) return null;

  const limbControls = controls.reduce((acc, control) => {
    if (!acc[control.limbId]) {
      acc[control.limbId] = [];
    }
    acc[control.limbId].push(control);
    return acc;
  }, {} as Record<LimbId, AxisControlData[]>);

  return (
    <div
      style={{
        position: "absolute",
        top: "75%",
        right: "20px",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        background: "rgba(0,0,0,0.7)",
        padding: "20px",
        borderRadius: "10px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      {Object.entries(limbControls).map(([limbId, limbAxisControls]) => (
        <div
          key={limbId}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "10px",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "5px",
          }}
        >
          <h3 style={{ color: "white", margin: "0 0 10px 0" }}>{limbId}</h3>
          {limbAxisControls.map(control => (
            <div
              key={control.axis}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <label style={{ color: control.axis === "x" ? "red" : control.axis === "y" ? "green" : "blue" }}>
                {control.axis.toUpperCase()} Rotation
              </label>
              <input
                type='range'
                min={control.min}
                max={control.max}
                step={0.01}
                value={control.value}
                onChange={e => control.onChange(parseFloat(e.target.value))}
                style={{ width: "200px" }}
              />
              <span style={{ color: "white" }}>{((control.value * 180) / Math.PI).toFixed(0)}°</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Updated InteractiveLimb component
export const InteractiveLimb: React.FC<InteractiveLimbProps> = ({ geometry, color, position, groupRef, limbId }) => {
  const { activeLimbId, setActiveLimbId } = React.useContext(ActiveLimbContext);
  const { setControls } = React.useContext(AxisControlsContext);
  const [isHovered, setIsHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  const isActive = activeLimbId === limbId;

  // Load saved position on mount
  useEffect(() => {
    const savedPositions = localStorage.getItem("limbPositions");
    if (savedPositions) {
      const positions = JSON.parse(savedPositions) as StoredLimbPositions;
      if (positions[limbId] && groupRef.current) {
        const rotation = positions[limbId].rotation;
        groupRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
        rotationRef.current = rotation;
      }
    }
  }, [limbId]);

  // Update controls function
  const updateControls = React.useCallback(() => {
    if (groupRef.current) {
      const axes: RotationAxis[] = ["x", "y", "z"];
      const controls: AxisControlData[] = axes.map(axis => ({
        limbId,
        axis,
        value: groupRef.current!.rotation[axis],
        min: LIMB_CONSTRAINTS[limbId].rotation[axis][0],
        max: LIMB_CONSTRAINTS[limbId].rotation[axis][1],
        onChange: value => {
          if (groupRef.current) {
            const constraints = LIMB_CONSTRAINTS[limbId];
            const clampedValue = Math.max(constraints.rotation[axis][0], Math.min(constraints.rotation[axis][1], value));
            groupRef.current.rotation[axis] = clampedValue;
            rotationRef.current[axis] = clampedValue;

            // Save to localStorage
            const savedPositions = localStorage.getItem("limbPositions");
            const positions = savedPositions ? (JSON.parse(savedPositions) as StoredLimbPositions) : {};
            positions[limbId] = {
              rotation: rotationRef.current,
            };
            localStorage.setItem("limbPositions", JSON.stringify(positions));

            // Force control update
            updateControls();
          }
        },
      }));
      setControls(controls);
    }
  }, [limbId, groupRef, setControls]);

  // Update controls when active
  useEffect(() => {
    if (isActive && groupRef.current) {
      updateControls();
    } else if (!isActive) {
      setControls([]);
    }
  }, [isActive, updateControls]);

  const handleClick = () => {
    setActiveLimbId(isActive ? null : limbId);
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <cylinderGeometry args={[geometry[0], geometry[1], geometry[2], 32]} />
      <meshStandardMaterial color={isActive ? "#ff0000" : isHovered ? "#ff8800" : color} opacity={0.8} transparent />
    </mesh>
  );
};

// Camera control buttons UI component

// Camera controls that live inside the Canvas
function CameraController() {
  const { camera } = useThree();
  const [, forceRender] = React.useState({});

  const handleRotate = React.useCallback(
    (axis: "x" | "y" | "z", angle: number) => {
    const position = camera.position.clone();
    const target = new THREE.Vector3(0, 1.5, 0);
    const matrix = new THREE.Matrix4();
    
    switch (axis) {
        case "x":
        matrix.makeRotationX(angle);
        break;
        case "y":
        matrix.makeRotationY(angle);
        break;
        case "z":
        matrix.makeRotationZ(angle);
        break;
    }
    
    position.sub(target);
    position.applyMatrix4(matrix);
    position.add(target);
    
    camera.position.copy(position);
    camera.lookAt(target);
    forceRender({}); // Force a re-render to update the view
    },
    [camera]
  );

  const handleReset = React.useCallback(() => {
    camera.position.set(0, 2, 5); // Slightly higher and further back for better view
    camera.lookAt(0, 1.5, 0);
    forceRender({});
  }, [camera]);

  // Expose the handlers to the buttons outside Canvas
  React.useEffect(() => {
    // @ts-ignore
    window.__cameraRotate = handleRotate;
    // @ts-ignore
    window.__cameraReset = handleReset;
  }, [handleRotate, handleReset]);

  return null;
}

// Position control buttons UI component

// Model position controller that lives inside the Canvas
function ModelPositionController({
  selectedTechnique,
  children,
}: {
  selectedTechnique?: JudoTechnique;
  children: React.ReactNode;
}) {
  // Load saved position or use default
  const [modelPosition, setModelPosition] = React.useState<ModelPosition>(() => {
    const savedPosition = localStorage.getItem("humanoidPosition");
    return savedPosition ? JSON.parse(savedPosition) : { y: 5 };
  });

  const handleMove = React.useCallback((_axis: "y", amount: number) => {
    setModelPosition((prev: ModelPosition) => {
      const newY = prev.y + amount;
      // Allow model to get closer to the mat (0.1 units minimum)
      const position = { y: Math.max(0.1, newY) };
      // Save position to localStorage
      localStorage.setItem("humanoidPosition", JSON.stringify(position));
      return position;
    });
  }, []);

  // Expose the handler to the buttons outside Canvas
  React.useEffect(() => {
    // @ts-ignore
    window.__modelMove = handleMove;
  }, [handleMove]);

  // Handle technique selection
  React.useEffect(() => {
    if (selectedTechnique) {
      console.log('Applying technique:', selectedTechnique.id);
      // Reset limbs to default position first
    Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
        const savedPositions = localStorage.getItem("limbPositions");
        const positions = savedPositions ? (JSON.parse(savedPositions) as StoredLimbPositions) : {};
      positions[limbId] = {
        rotation: {
          x: defaultState.rotation.x,
          y: defaultState.rotation.y,
            z: defaultState.rotation.z,
          },
        };
        localStorage.setItem("limbPositions", JSON.stringify(positions));
      });
    }
  }, [selectedTechnique]);

  return (
    <group position={[0, modelPosition.y, 0]}>
      {children}
    </group>
  );
}



// Add ScreenshotTool component at the top level
function ScreenshotTool() {
  const { gl, scene, camera } = useThree();

  const captureScreenshot = useCallback(() => {
    // Render the scene
    gl.render(scene, camera);

    // Get the canvas element
    const canvas = gl.domElement;

    try {
      // Convert the canvas to a data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create a timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `judo-scene-${timestamp}.png`;

      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Screenshot saved successfully!');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast.error('Failed to capture screenshot');
    }
  }, [gl, scene, camera]);

  // Expose the capture function to the window
  useEffect(() => {
    // @ts-ignore
    window.__captureScreenshot = captureScreenshot;
  }, [captureScreenshot]);

  return null;
}

export function Scene({ children }: CustomSceneProps) {
  const [activeLimbId, setActiveLimbId] = useState<LimbId | null>(null);
  const [axisControls, setAxisControls] = useState<AxisControlData[]>([]);
  const [currentTechnique, setCurrentTechnique] = useState<JudoTechnique | undefined>(undefined);
  const [activeTechniqueId, setActiveTechniqueId] = useState<string | null>(null);

  // Create refs for all limbs
  const upperArmLeftRef = useRef<THREE.Group>(null);
  const lowerArmLeftRef = useRef<THREE.Group>(null);
  const upperArmRightRef = useRef<THREE.Group>(null);
  const lowerArmRightRef = useRef<THREE.Group>(null);
  const upperLegLeftRef = useRef<THREE.Group>(null);
  const lowerLegLeftRef = useRef<THREE.Group>(null);
  const upperLegRightRef = useRef<THREE.Group>(null);
  const lowerLegRightRef = useRef<THREE.Group>(null);
  const upperTorsoRef = useRef<THREE.Group>(null);
  const lowerTorsoRef = useRef<THREE.Group>(null);

  // Store all refs in the limbsRef object
  const limbsRef = useRef<{ [key in LimbId]?: React.RefObject<THREE.Group> }>({
    upperArmLeft: upperArmLeftRef,
    lowerArmLeft: lowerArmLeftRef,
    upperArmRight: upperArmRightRef,
    lowerArmRight: lowerArmRightRef,
    upperLegLeft: upperLegLeftRef,
    lowerLegLeft: lowerLegLeftRef,
    upperLegRight: upperLegRightRef,
    lowerLegRight: lowerLegRightRef,
    upperTorso: upperTorsoRef,
    lowerTorso: lowerTorsoRef,
  });

  const [, setSavedTechniques] = useState<any[]>([]);
  const { addPosition } = usePositions();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadTechniques = () => {
      const existingTechniques = localStorage.getItem('techniques');
      if (existingTechniques) {
        try {
          const parsed = JSON.parse(existingTechniques);
          setSavedTechniques(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.error('Error loading techniques:', error);
          setSavedTechniques([]);
        }
      } else {
        setSavedTechniques([]);
      }
    };
    loadTechniques();
  }, []);

  const handleRotate = React.useCallback((axis: "x" | "y" | "z", angle: number) => {
    // @ts-ignore
    window.__cameraRotate?.(axis, angle);
  }, []);

  const handleMove = React.useCallback((axis: "y", amount: number) => {
    // @ts-ignore
    window.__modelMove?.(axis, amount);
  }, []);

  const handlePositionSelect = (position: Position) => {
    console.log('Selected position:', position);

    // First reset to default positions
    Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
      const limbRef = limbsRef.current[limbId as LimbId];
      if (limbRef?.current) {
        limbRef.current.rotation.set(
          defaultState.rotation.x,
          defaultState.rotation.y,
          defaultState.rotation.z
        );
      }
    });

    // Then apply the selected position after a short delay
    setTimeout(() => {
      // Apply the position to the model
      Object.entries(position.limbs).forEach(([id, data]) => {
        const limbRef = limbsRef.current[id as LimbId];
        if (limbRef?.current) {
          const rotation = data.rotation;
          limbRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
        }
      });
      
      // Save to localStorage
      const positions = {} as StoredLimbPositions;
      Object.entries(position.limbs).forEach(([id, data]) => {
        positions[id as LimbId] = {
          rotation: data.rotation,
        };
      });
      localStorage.setItem("limbPositions", JSON.stringify(positions));
      
      // Update axis controls if a limb is active
      if (activeLimbId && position.limbs[activeLimbId]) {
        const rotation = position.limbs[activeLimbId].rotation;
        const axes: RotationAxis[] = ["x", "y", "z"];
        const newControls: AxisControlData[] = axes.map(axis => ({
          limbId: activeLimbId,
          axis,
          value: rotation[axis],
          min: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][0],
          max: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][1],
          onChange: value => {
            const limbRef = limbsRef.current[activeLimbId];
            if (limbRef?.current) {
              const constraints = LIMB_CONSTRAINTS[activeLimbId];
              const clampedValue = Math.max(
                constraints.rotation[axis][0],
                Math.min(constraints.rotation[axis][1], value)
              );
              limbRef.current.rotation[axis] = clampedValue;
              
              // Save to localStorage
              const savedPositions = localStorage.getItem("limbPositions");
              const positions = savedPositions ? (JSON.parse(savedPositions) as StoredLimbPositions) : {};
              if (!positions[activeLimbId]) {
                positions[activeLimbId] = { rotation: { x: 0, y: 0, z: 0 } };
              }
              positions[activeLimbId].rotation[axis] = clampedValue;
              localStorage.setItem("limbPositions", JSON.stringify(positions));
            }
          },
        }));
        setAxisControls(newControls);
      }
    }, 100); // Small delay to ensure reset is visible

    // Stop any ongoing technique animation
    setCurrentTechnique(undefined);
  };

  const handleCapture = () => {
    console.log('Taking screenshot...');
    const savedPositions = localStorage.getItem("limbPositions");
    const currentLimbs = savedPositions ? JSON.parse(savedPositions) : {};
    
    const limbs = Object.entries(currentLimbs).reduce((acc, [id, data]) => {
      const rotation = (data as any).rotation;
      if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
        acc[id as LimbId] = { rotation };
      }
      return acc;
    }, {} as Position['limbs']);

    // Add the new position
    const newPosition = addPosition(limbs);
    console.log('Added new position:', newPosition.name);
    
    // Force a refresh by updating state
    setRefreshTrigger(prev => prev + 1);
    
    // Switch to positions tab after a short delay
    setTimeout(() => {
      const positionsTab = document.querySelector('.tab-button:nth-child(2)');
      if (positionsTab) {
        (positionsTab as HTMLElement).click();
      }
    }, 100);
    
    return limbs;
  };

  const handleExportPositions = () => {
    const savedPositions = localStorage.getItem("positionLibrary");
    if (savedPositions) {
      try {
        const positions = JSON.parse(savedPositions);
        const dataStr = JSON.stringify(positions, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `judo-positions-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } catch (error) {
        console.error('Error exporting positions:', error);
      }
    } else {
      console.log('No positions found to export');
    }
  };

  return (
    <ActiveLimbContext.Provider value={{ activeLimbId, setActiveLimbId }}>
      <AxisControlsContext.Provider value={{ controls: axisControls, setControls: setAxisControls }}>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              
              <Tatami size={8} tilesPerSide={8} />
              <ModelPositionController selectedTechnique={currentTechnique}>
                <Humanoid
                  upperArmLeftRef={upperArmLeftRef}
                  lowerArmLeftRef={lowerArmLeftRef}
                  upperArmRightRef={upperArmRightRef}
                  lowerArmRightRef={lowerArmRightRef}
                  upperLegLeftRef={upperLegLeftRef}
                  lowerLegLeftRef={lowerLegLeftRef}
                  upperLegRightRef={upperLegRightRef}
                  lowerLegRightRef={lowerLegRightRef}
                  upperTorsoRef={upperTorsoRef}
                  lowerTorsoRef={lowerTorsoRef}
                  selectedTechnique={currentTechnique}
                />
              </ModelPositionController>
              
              {children}

              <OrbitControls minDistance={2} maxDistance={8} target={[0, 1.5, 0]} enableDamping dampingFactor={0.05} />
              <CameraController />
              <ScreenshotTool />
            </Suspense>
          </Canvas>
          <AxisControls />
          
          {/* Right side controls */}
          <div className="right-controls">
            {/* Camera controls */}
            <div className="camera-controls">
              <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                <button onClick={() => handleRotate("x", Math.PI / 4)}>Rotate X +45°</button>
                <button onClick={() => handleRotate("x", -Math.PI / 4)}>Rotate X -45°</button>
              </div>
              <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                <button onClick={() => handleRotate("y", Math.PI / 4)}>Rotate Y +45°</button>
                <button onClick={() => handleRotate("y", -Math.PI / 4)}>Rotate Y -45°</button>
              </div>
              <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                <button onClick={() => handleRotate("z", Math.PI / 4)}>Rotate Z +45°</button>
                <button onClick={() => handleRotate("z", -Math.PI / 4)}>Rotate Z -45°</button>
              </div>
              <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                <button
                  onClick={() => {
                    // @ts-ignore
                    window.__cameraReset?.();
                  }}
                  style={{
                    width: "100%",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    padding: "8px 16px",
                  }}
                >
                  Reset Camera
                </button>
              </div>
              <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                <button
                  onClick={() => {
                    // @ts-ignore
                    window.__captureScreenshot?.();
                  }}
                  style={{
                    width: "100%",
                    backgroundColor: "#2196F3",
                    color: "white",
                    padding: "8px 16px",
                  }}
                >
                  Take Screenshot
                </button>
              </div>
            </div>

            {/* Model controls */}
            <div className="model-controls">
              <button
                onClick={() => {
                  // Apply default positions without reloading
                  Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
                    const limbRef = limbsRef.current[limbId as LimbId];
                    if (limbRef?.current) {
                      limbRef.current.rotation.set(
                        defaultState.rotation.x,
                        defaultState.rotation.y,
                        defaultState.rotation.z
                      );
                    }
                  });
                  
                  // Save to localStorage
                  const positions = {} as StoredLimbPositions;
                  Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
                    positions[limbId as LimbId] = {
                      rotation: {
                        x: defaultState.rotation.x,
                        y: defaultState.rotation.y,
                        z: defaultState.rotation.z,
                      },
                    };
                  });
                  localStorage.setItem("limbPositions", JSON.stringify(positions));
                  
                  // Update axis controls if a limb is active
                  if (activeLimbId) {
                    const defaultRotation = DEFAULT_POSITIONS[activeLimbId].rotation;
                    const axes: RotationAxis[] = ["x", "y", "z"];
                    const newControls: AxisControlData[] = axes.map(axis => ({
                      limbId: activeLimbId,
                      axis,
                      value: defaultRotation[axis],
                      min: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][0],
                      max: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][1],
                      onChange: value => {
                        const limbRef = limbsRef.current[activeLimbId];
                        if (limbRef?.current) {
                          const constraints = LIMB_CONSTRAINTS[activeLimbId];
                          const clampedValue = Math.max(
                            constraints.rotation[axis][0],
                            Math.min(constraints.rotation[axis][1], value)
                          );
                          limbRef.current.rotation[axis] = clampedValue;
                          
                          // Save to localStorage
                          const savedPositions = localStorage.getItem("limbPositions");
                          const positions = savedPositions ? (JSON.parse(savedPositions) as StoredLimbPositions) : {};
                          if (!positions[activeLimbId]) {
                            positions[activeLimbId] = { rotation: { x: 0, y: 0, z: 0 } };
                          }
                          positions[activeLimbId].rotation[axis] = clampedValue;
                          localStorage.setItem("limbPositions", JSON.stringify(positions));
                        }
                      },
                    }));
                    setAxisControls(newControls);
                  }

                  // Stop any ongoing technique animation
                  setCurrentTechnique(undefined);
                }}
                style={{
                  backgroundColor: "#ff9800",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Reset Limbs
              </button>
              <button onClick={() => handleMove("y", 0.1)} style={{ backgroundColor: "#4CAF50", color: "white", padding: "8px 16px" }}>
                Move Up
              </button>
              <button onClick={() => handleMove("y", -0.1)} style={{ backgroundColor: "#f44336", color: "white", padding: "8px 16px" }}>
                Move Down
              </button>
              <ScreenshotButton 
                onCapture={() => handleCapture()} 
              />

              {/* Limb details moved below Save Position button */}
              <div
                style={{
                  background: "rgba(0,0,0,0.7)",
                  padding: "10px",
                  borderRadius: "5px",
                  color: "white",
                  maxHeight: "300px",
                  overflowY: "auto",
                  marginTop: "10px"
                }}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>Current Limb Details</h4>
                {Object.entries(localStorage.getItem("limbPositions") ? JSON.parse(localStorage.getItem("limbPositions") || "{}") : {}).map(([limbId, data]: [string, any]) => (
                  <div key={limbId} style={{ marginBottom: "8px" }}>
                    <strong>{limbId}:</strong>
                    <div style={{ marginLeft: "10px" }}>
                      x: {(data.rotation.x * 180 / Math.PI).toFixed(1)}°
                      y: {(data.rotation.y * 180 / Math.PI).toFixed(1)}°
                      z: {(data.rotation.z * 180 / Math.PI).toFixed(1)}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Left side panel */}
          <div className="techniques-grid">
            <TabPanel>
              <div className="saved-techniques">
                <h3>Techniques</h3>
                {DEFAULT_TECHNIQUES.map((technique) => (
                  <div 
                    key={technique.id} 
                    className={`technique-card ${activeTechniqueId === technique.id ? 'active' : ''}`}
                    onClick={() => {
                      console.log('Selected technique:', technique.id);
                      const techObj = techniques.find(t => t.id === technique.id);
                      if (techObj) {
                        if (activeTechniqueId === technique.id) {
                          // If clicking the active technique, deactivate it
                          setActiveTechniqueId(null);
                          setCurrentTechnique(undefined);
                        } else {
                          // If clicking a different technique, activate it
                          setActiveTechniqueId(technique.id);
                          setCurrentTechnique(techObj);
                        }
                      } else {
                        setActiveTechniqueId(null);
                        setCurrentTechnique(undefined);
                      }
                    }}
                  >
                    <h4>{technique.name}</h4>
                    <p className="japanese-name">{technique.nameJa}</p>
                    <p className="description">{technique.description}</p>
                    <div className="technique-tags">
                      {technique.tags.map((tag, index) => (
                        <span key={index} className="technique-tag">{tag}</span>
                      ))}
                    </div>
                    <div className="technique-status">
                      {activeTechniqueId === technique.id ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Positions tab as a SEPARATE tab */}
              <div className="positions-tab">
                <h3>Saved Positions</h3>
                <Positions onPositionSelect={handlePositionSelect} key={refreshTrigger} />
                
                {/* Default generic position as initial state */}
                <div 
                  className="position-card"
                  onClick={() => {
                    // Apply default positions without reloading
                    Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
                      const limbRef = limbsRef.current[limbId as LimbId];
                      if (limbRef?.current) {
                        limbRef.current.rotation.set(
                          defaultState.rotation.x,
                          defaultState.rotation.y,
                          defaultState.rotation.z
                        );
                      }
                    });
                    
                    // Save to localStorage
                    const positions = {} as StoredLimbPositions;
                    Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
                      positions[limbId as LimbId] = {
                        rotation: {
                          x: defaultState.rotation.x,
                          y: defaultState.rotation.y,
                          z: defaultState.rotation.z,
                        },
                      };
                    });
                    localStorage.setItem("limbPositions", JSON.stringify(positions));
                    
                    // Update axis controls if a limb is active
                    if (activeLimbId) {
                      const defaultRotation = DEFAULT_POSITIONS[activeLimbId].rotation;
                      const axes: RotationAxis[] = ["x", "y", "z"];
                      const newControls: AxisControlData[] = axes.map(axis => ({
                        limbId: activeLimbId,
                        axis,
                        value: defaultRotation[axis],
                        min: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][0],
                        max: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][1],
                        onChange: value => {
                          const limbRef = limbsRef.current[activeLimbId];
                          if (limbRef?.current) {
                            const constraints = LIMB_CONSTRAINTS[activeLimbId];
                            const clampedValue = Math.max(
                              constraints.rotation[axis][0],
                              Math.min(constraints.rotation[axis][1], value)
                            );
                            limbRef.current.rotation[axis] = clampedValue;
                            
                            // Save to localStorage
                            const savedPositions = localStorage.getItem("limbPositions");
                            const positions = savedPositions ? (JSON.parse(savedPositions) as StoredLimbPositions) : {};
                            if (!positions[activeLimbId]) {
                              positions[activeLimbId] = { rotation: { x: 0, y: 0, z: 0 } };
                            }
                            positions[activeLimbId].rotation[axis] = clampedValue;
                            localStorage.setItem("limbPositions", JSON.stringify(positions));
                          }
                        },
                      }));
                      setAxisControls(newControls);
                    }

                    // Stop any ongoing technique animation
                    setCurrentTechnique(undefined);
                  }}
                >
                  <h4>Default Position</h4>
                  <p className="timestamp">Standard starting position</p>
                  <p>Click to load standard stance</p>
                </div>

                {/* Export button */}
                <button
                  onClick={handleExportPositions}
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Export All Positions
                </button>
              </div>
            </TabPanel>
          </div>
        </div>
      </AxisControlsContext.Provider>
    </ActiveLimbContext.Provider>
  );
}
