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
import { AxisControls } from "./AxisControls";

// Add new context for active limb
export const ActiveLimbContext = React.createContext<{
  activeLimbId: LimbId | null;
  setActiveLimbId: (id: LimbId | null) => void;
}>({
  activeLimbId: null,
  setActiveLimbId: () => { },
});

// Add new context for axis controls
export const AxisControlsContext = React.createContext<{
  controls: AxisControlData[];
  setControls: (controls: AxisControlData[]) => void;
}>({
  controls: [],
  setControls: () => { },
});





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
    return savedPosition ? JSON.parse(savedPosition) : { y: 0 };
  });

  const handleMove = React.useCallback((_axis: "y", amount: number) => {
    setModelPosition((prev: ModelPosition) => {
      const newY = prev.y + amount;
      // Allow model to move all the way down to the tatami (Y=0)
      const position = { y: Math.max(0, newY) };
      // Save position to localStorage
      localStorage.setItem("humanoidPosition", JSON.stringify(position));
      return position;
    });
  }, []);

  // Expose the handler to the buttons outside Canvas
  React.useEffect(() => {
    // @ts-ignore
    window.__modelMove = handleMove;
    // @ts-ignore
    window.__modelReset = () => {
      setModelPosition({ y: 0 });
      localStorage.setItem("humanoidPosition", JSON.stringify({ y: 0 }));
    };
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
          height: 0
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
  const [currentHeight, setCurrentHeight] = useState(() => {
    const savedPosition = localStorage.getItem("humanoidPosition");
    return savedPosition ? JSON.parse(savedPosition).y : 0;
  });

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
  const headRef = useRef<THREE.Group>(null);
  const handLeftRef = useRef<THREE.Group>(null);
  const handRightRef = useRef<THREE.Group>(null);

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
    head: headRef,
    handLeft: handLeftRef,
    handRight: handRightRef,
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
    setCurrentHeight((prev: number) => {
      const newHeight = Math.max(0, prev + amount);
      // Update localStorage immediately
      localStorage.setItem("humanoidPosition", JSON.stringify({ y: newHeight }));
      // Force update the model position
      // @ts-ignore
      window.__modelMove?.("y", newHeight - prev);
      return newHeight;
    });
  }, []);

  // Add a reset height function
  const handleResetHeight = React.useCallback(() => {
    setCurrentHeight(0);
    localStorage.setItem("humanoidPosition", JSON.stringify({ y: 0 }));
    // @ts-ignore
    window.__modelMove?.("y", -currentHeight);
  }, [currentHeight]);

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
          height: data.height || 0
        };
      });
      localStorage.setItem("limbPositions", JSON.stringify(positions));

      // Set the height directly
      if (position.height !== undefined) {
        localStorage.setItem("humanoidPosition", JSON.stringify({ y: position.height }));
        setCurrentHeight(position.height);
        // @ts-ignore
        window.__modelMove?.("y", position.height - currentHeight);
      } else {
        localStorage.setItem("humanoidPosition", JSON.stringify({ y: 0 }));
        setCurrentHeight(0);
        // @ts-ignore
        window.__modelMove?.("y", -currentHeight);
      }

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
                positions[activeLimbId] = { rotation: { x: 0, y: 0, z: 0 }, height: 0 };
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
    // Initialize with default positions
    const currentPositions: Position['limbs'] = {
      upperArmLeft: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      lowerArmLeft: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      upperArmRight: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      lowerArmRight: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      handLeft: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      handRight: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      upperLegLeft: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      lowerLegLeft: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      upperLegRight: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      lowerLegRight: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      upperTorso: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      lowerTorso: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      head: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight }
    };

    // Update with current positions
    Object.entries(limbsRef.current).forEach(([id, ref]) => {
      if (ref?.current) {
        currentPositions[id as LimbId] = {
          rotation: {
            x: ref.current.rotation.x,
            y: ref.current.rotation.y,
            z: ref.current.rotation.z
          },
          height: currentHeight
        };
      }
    });

    const newPosition = addPosition(currentPositions, currentHeight);
    setCurrentHeight(newPosition.height);
    setRefreshTrigger(prev => prev + 1); // Force refresh of positions list
  };

  const handleExportPositions = () => {
    const savedPositions = localStorage.getItem("positionLibrary");
    if (savedPositions) {
      try {
        const positions = JSON.parse(savedPositions);
        const dataStr = JSON.stringify(positions, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
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
                  headRef={headRef}
                  handLeftRef={handLeftRef}
                  handRightRef={handRightRef}
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
                  console.log('Resetting limbs...');
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

                  // Reset height to 0
                  // @ts-ignore
                  window.__modelReset?.();
                  setCurrentHeight(0);

                  // Save to localStorage
                  const positions = {} as StoredLimbPositions;
                  Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
                    positions[limbId as LimbId] = {
                      rotation: {
                        x: defaultState.rotation.x,
                        y: defaultState.rotation.y,
                        z: defaultState.rotation.z,
                      },
                      height: 0
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
                            positions[activeLimbId] = { rotation: { x: 0, y: 0, z: 0 }, height: 0 };
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
                currentHeight={currentHeight}
              />

              {/* Height display */}
              <div
                style={{
                  background: "rgba(0,0,0,0.7)",
                  padding: "10px",
                  borderRadius: "5px",
                  color: "white",
                  marginTop: "10px"
                }}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>Current Height</h4>
                <div style={{ marginLeft: "10px" }}>
                  {currentHeight.toFixed(2)} units
                </div>
              </div>

              {/* Reset height button */}
              <button 
                onClick={handleResetHeight}
                style={{ 
                  backgroundColor: "#ff9800", 
                  color: "white", 
                  padding: "8px 16px",
                  marginTop: "10px",
                  width: "100%"
                }}
              >
                Reset Height
              </button>

              {/* Limb details moved below Save Position button */}
              <div
                style={{
                  background: "rgba(0,0,0,0.7)",
                  padding: "10px",
                  borderRadius: "5px",
                  color: "white",
                  maxHeight: "250px",
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
                      height: {data.height?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Left side panel */}
          <div className="techniques-grid">
            <TabPanel>


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
                        height: 0
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
                              positions[activeLimbId] = { rotation: { x: 0, y: 0, z: 0 }, height: 0 };
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
            </TabPanel>
          </div>
        </div>
      </AxisControlsContext.Provider>
    </ActiveLimbContext.Provider>
  );
}
