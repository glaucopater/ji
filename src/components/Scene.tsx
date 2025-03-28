import { Canvas,  useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState } from "react";
import React from "react";
import * as THREE from "three";
import "../types/global.d";
import { useHumanoidAnimation } from "../hooks/useHumanoidAnimation";
import { techniques } from "../data/techniques";
import { JudoTechnique } from "../types/techniques";
import { Tatami } from "./Tatami";

interface SceneProps {
  children?: React.ReactNode;
  selectedTechnique?: JudoTechnique;
  onAnimationComplete?: () => void;
}

// Add new interface for model position
interface ModelPosition {
  y: number;
}

// Add new interface for limb state
interface LimbState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

// Add type for limb IDs
export type LimbId = 'upperArmLeft' | 'upperArmRight' | 'lowerArmLeft' | 'lowerArmRight' | 
              'upperLegLeft' | 'upperLegRight' | 'lowerLegLeft' | 'lowerLegRight';

// Add type for constraints
interface LimbConstraints {
  rotation: {
    x: [min: number, max: number];
    y: [min: number, max: number];
    z: [min: number, max: number];
  };
}

// Update constraints with proper typing
const LIMB_CONSTRAINTS: Record<LimbId, LimbConstraints> = {
  upperArmLeft: { rotation: { x: [-Math.PI/2, Math.PI/2], y: [-Math.PI/4, Math.PI/4], z: [-Math.PI/2, Math.PI/2] }},
  upperArmRight: { rotation: { x: [-Math.PI/2, Math.PI/2], y: [-Math.PI/4, Math.PI/4], z: [-Math.PI/2, Math.PI/2] }},
  lowerArmLeft: { rotation: { x: [-Math.PI/2, 0], y: [-Math.PI/4, Math.PI/4], z: [-Math.PI/4, Math.PI/4] }},
  lowerArmRight: { rotation: { x: [-Math.PI/2, 0], y: [-Math.PI/4, Math.PI/4], z: [-Math.PI/4, Math.PI/4] }},
  upperLegLeft: { rotation: { x: [-Math.PI/2, Math.PI/2], y: [-Math.PI/4, Math.PI/4], z: [-Math.PI/4, Math.PI/4] }},
  upperLegRight: { rotation: { x: [-Math.PI/2, Math.PI/2], y: [-Math.PI/4, Math.PI/4], z: [-Math.PI/4, Math.PI/4] }},
  lowerLegLeft: { rotation: { x: [0, Math.PI/2], y: [-Math.PI/8, Math.PI/8], z: [-Math.PI/8, Math.PI/8] }},
  lowerLegRight: { rotation: { x: [0, Math.PI/2], y: [-Math.PI/8, Math.PI/8], z: [-Math.PI/8, Math.PI/8] }}
};

// Update default positions with proper typing
const DEFAULT_POSITIONS: Record<LimbId, LimbState> = {
  upperArmLeft: { position: new THREE.Vector3(0, -0.2, 0), rotation: new THREE.Euler(0, 0, 0) },
  upperArmRight: { position: new THREE.Vector3(0, -0.2, 0), rotation: new THREE.Euler(0, 0, 0) },
  lowerArmLeft: { position: new THREE.Vector3(0, -0.2, 0), rotation: new THREE.Euler(0, 0, 0) },
  lowerArmRight: { position: new THREE.Vector3(0, -0.2, 0), rotation: new THREE.Euler(0, 0, 0) },
  upperLegLeft: { position: new THREE.Vector3(0, -0.25, 0), rotation: new THREE.Euler(0, 0, 0) },
  upperLegRight: { position: new THREE.Vector3(0, -0.25, 0), rotation: new THREE.Euler(0, 0, 0) },
  lowerLegLeft: { position: new THREE.Vector3(0, -0.25, 0), rotation: new THREE.Euler(0, 0, 0) },
  lowerLegRight: { position: new THREE.Vector3(0, -0.25, 0), rotation: new THREE.Euler(0, 0, 0) }
};

// Add new context for active limb
const ActiveLimbContext = React.createContext<{
  activeLimbId: LimbId | null;
  setActiveLimbId: (id: LimbId | null) => void;
}>({
  activeLimbId: null,
  setActiveLimbId: () => {},
});

// Add new interface for axis control data
interface AxisControlData {
  limbId: LimbId;
  axis: 'x' | 'y' | 'z';
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

// Add new context for axis controls
const AxisControlsContext = React.createContext<{
  controls: AxisControlData[];
  setControls: (controls: AxisControlData[]) => void;
}>({
  controls: [],
  setControls: () => {},
});

// Add type for rotation axes
type RotationAxis = 'x' | 'y' | 'z';

// Add new interface for stored limb positions
interface StoredLimbPositions {
  [limbId: string]: {
    rotation: {
      x: number;
      y: number;
      z: number;
    }
  }
}

interface InteractiveLimbProps {
  geometry: [radius1: number, radius2: number, height: number];
  color: string;
  position: [number, number, number];
  groupRef: React.RefObject<THREE.Group | null>;
  limbId: LimbId;
}

function Joint({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color='yellow' opacity={0.7} transparent />
    </mesh>
  );
}

function Hand({ position, side }: { position: [number, number, number]; side: "left" | "right" }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.15, 0.08, 0.08]} />
        <meshStandardMaterial color='lightblue' />
      </mesh>
      {/* Thumb */}
      {side === "left" && (
        <mesh position={[0.08, 0.04, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color='cyan' />
        </mesh>
      )}
      {side === "right" && (
        <mesh position={[-0.08, 0.04, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color='cyan' />
        </mesh>
      )}
    </group>
  );
}

function Humanoid({ selectedTechnique, onAnimationComplete }: { selectedTechnique?: JudoTechnique; onAnimationComplete?: () => void }) {
  // Refs for animation
  const upperArmLeftRef = useRef<THREE.Group>(null);
  const lowerArmLeftRef = useRef<THREE.Group>(null);
  const upperArmRightRef = useRef<THREE.Group>(null);
  const lowerArmRightRef = useRef<THREE.Group>(null);
  const upperLegLeftRef = useRef<THREE.Group>(null);
  const kneeLeftRef = useRef<THREE.Group>(null);
  const lowerLegLeftRef = useRef<THREE.Group>(null);
  const upperLegRightRef = useRef<THREE.Group>(null);
  const kneeRightRef = useRef<THREE.Group>(null);
  const lowerLegRightRef = useRef<THREE.Group>(null);
  const spineRef = useRef<THREE.Group>(null);

  // Use animation hook
  const { playTechnique, setIdle } = useHumanoidAnimation({
    upperArmLeftRef,
    lowerArmLeftRef,
    upperArmRightRef,
    lowerArmRightRef,
    upperLegLeftRef,
    kneeLeftRef,
    lowerLegLeftRef,
    upperLegRightRef,
    kneeRightRef,
    lowerLegRightRef,
    spineRef,
  });

  // Handle technique selection
  useEffect(() => {
    if (selectedTechnique) {
      console.log("Starting animation for technique:", selectedTechnique.name);
      setIdle(false); // Ensure idle is off when playing technique
      
      // Reset to default pose first
      playTechnique({
        keyframes: [{
          upperLegLeft: { x: 0 },
          upperLegRight: { x: 0 },
          kneeLeft: { x: 0 },
          kneeRight: { x: 0 },
          lowerLegLeft: { x: 0 },
          lowerLegRight: { x: 0 },
          upperArmLeft: { x: 0 },
          upperArmRight: { x: 0 },
          lowerArmLeft: { x: 0 },
          lowerArmRight: { x: 0 },
          spine: { x: 0 },
          duration: 0.3
        }]
      });

      // After a brief delay, play the selected technique
      setTimeout(() => {
        playTechnique(selectedTechnique.animation);
      }, 300);

      // Calculate total duration including reset time
      const totalDuration = selectedTechnique.animation.keyframes.reduce((sum, keyframe) => sum + keyframe.duration, 0) + 0.3;
      console.log("Animation duration:", totalDuration, "seconds");

      // Notify when animation completes
      const timer = setTimeout(() => {
        console.log("Animation complete for:", selectedTechnique.name);
        if (!selectedTechnique.isToggle) {
          setIdle(false); // Keep idle off for toggle techniques
        }
        onAnimationComplete?.();
      }, totalDuration * 1000);

      return () => {
        console.log("Cleaning up animation for:", selectedTechnique.name);
        clearTimeout(timer);
      };
    } else {
      // When no technique is selected, stop all animations
      playTechnique(null);
      setIdle(false);
    }
  }, [selectedTechnique, playTechnique, setIdle, onAnimationComplete]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;
      if (key === "1" || key === "2") {
        const index = parseInt(key) - 1;
        if (index < techniques.length) {
          const technique = techniques[index];
          console.log("Keyboard shortcut triggered for technique:", technique.name);
          playTechnique(technique.animation);
        }
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [playTechnique]);

  return (
    <group>
      <group position={[0, 0.1, 0]}>
        <group ref={spineRef}>
          {/* Head */}
          <mesh position={[0, 2, 0]} scale={[0.6, 1, 0.7]} castShadow>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial color='lightblue' />
            {/* Eyes to show front direction */}
            <mesh position={[0.15, 0, 0.25]} scale={0.1}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color='black' />
            </mesh>
            <mesh position={[-0.15, 0, 0.25]} scale={0.1}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color='black' />
            </mesh>
          </mesh>

          {/* Torso - unified structure */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.3, 0.25, 1.2, 32]} />
            <meshStandardMaterial color='lightblue' />
          </mesh>

          {/* Arms and legs are now children of the spine group */}
          {/* Left Arm */}
          <group position={[-0.4, 1.6, 0]}>
            {/* Shoulder Joint */}
            <Joint position={[0, 0, 0]} />
            {/* Upper Arm */}
            <group ref={upperArmLeftRef}>
              <InteractiveLimb
                geometry={[0.08, 0.07, 0.4]}
                color="lightgreen"
                position={[0, -0.2, 0]}
                groupRef={upperArmLeftRef}
                limbId="upperArmLeft"
              />
              {/* Elbow Joint */}
              <Joint position={[0, -0.45, 0]} />
              {/* Lower Arm */}
              <group ref={lowerArmLeftRef} position={[0, -0.6, 0]}>
                <InteractiveLimb
                  geometry={[0.07, 0.06, 0.6]}
                  color="lightblue"
                  position={[0, -0.2, 0]}
                  groupRef={lowerArmLeftRef}
                  limbId="lowerArmLeft"
                />
                {/* Hand */}
                <Hand position={[0, -0.6, 0]} side='left' />
              </group>
            </group>
          </group>

          {/* Right Arm */}
          <group position={[0.4, 1.6, 0]}>
            {/* Shoulder Joint */}
            <Joint position={[0, 0, 0]} />
            {/* Upper Arm */}
            <group ref={upperArmRightRef}>
              <InteractiveLimb
                geometry={[0.08, 0.06, 0.4]}
                color="lightgreen"
                position={[0, -0.2, 0]}
                groupRef={upperArmRightRef}
                limbId="upperArmRight"
              />
              {/* Elbow Joint */}
              <Joint position={[0, -0.45, 0]} />
              {/* Lower Arm */}
              <group ref={lowerArmRightRef} position={[0, -0.6, 0]}>
                <InteractiveLimb
                  geometry={[0.07, 0.06, 0.6]}
                  color="lightblue"
                  position={[0, -0.2, 0]}
                  groupRef={lowerArmRightRef}
                  limbId="lowerArmRight"
                />
                {/* Hand */}
                <Hand position={[0, -0.6, 0]} side='right' />
              </group>
            </group>
          </group>

          {/* Left Leg */}
          <group position={[-0.2, 0.7, 0]}>
            {/* Hip Joint */}
            <Joint position={[0, 0, 0]} />
            {/* Upper Leg */}
            <group ref={upperLegLeftRef}>
              <InteractiveLimb
                geometry={[0.09, 0.08, 0.5]}
                color="#98FB98"
                position={[0, -0.25, 0]}
                groupRef={upperLegLeftRef}
                limbId="upperLegLeft"
              />
              {/* Knee Joint */}
              <group ref={kneeLeftRef} position={[0, -0.5, 0]}>
                <Joint position={[0, 0, 0]} />
                {/* Lower Leg */}
                <group ref={lowerLegLeftRef}>
                  <InteractiveLimb
                    geometry={[0.08, 0.07, 0.5]}
                    color="#228B22"
                    position={[0, -0.25, 0]}
                    groupRef={lowerLegLeftRef}
                    limbId="lowerLegLeft"
                  />
                  {/* Ankle Joint */}
                  <Joint position={[0, -0.5, 0]} />
                  {/* Foot */}
                  <mesh position={[0, -0.55, 0.1]}>
                    <boxGeometry args={[0.12, 0.1, 0.25]} />
                    <meshStandardMaterial color='#228B22' />
                  </mesh>
                </group>
              </group>
            </group>
          </group>

          {/* Right Leg */}
          <group position={[0.2, 0.7, 0]}>
            {/* Hip Joint */}
            <Joint position={[0, 0, 0]} />
            {/* Upper Leg */}
            <group ref={upperLegRightRef}>
              <InteractiveLimb
                geometry={[0.09, 0.08, 0.5]}
                color="#98FB98"
                position={[0, -0.25, 0]}
                groupRef={upperLegRightRef}
                limbId="upperLegRight"
              />
              {/* Knee Joint */}
              <group ref={kneeRightRef} position={[0, -0.5, 0]}>
                <Joint position={[0, 0, 0]} />
                {/* Lower Leg */}
                <group ref={lowerLegRightRef}>
                  <InteractiveLimb
                    geometry={[0.08, 0.07, 0.5]}
                    color="#228B22"
                    position={[0, -0.25, 0]}
                    groupRef={lowerLegRightRef}
                    limbId="lowerLegRight"
                  />
                  {/* Ankle Joint */}
                  <Joint position={[0, -0.5, 0]} />
                  {/* Foot */}
                  <mesh position={[0, -0.55, 0.1]}>
                    <boxGeometry args={[0.12, 0.1, 0.25]} />
                    <meshStandardMaterial color='#228B22' />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
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
    <div style={{
      position: 'absolute',
      top: '50%',
      right: '20px',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      background: 'rgba(0,0,0,0.7)',
      padding: '20px',
      borderRadius: '10px',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {Object.entries(limbControls).map(([limbId, limbAxisControls]) => (
        <div key={limbId} style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '10px',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '5px'
        }}>
          <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>{limbId}</h3>
          {limbAxisControls.map((control) => (
            <div key={control.axis} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}>
              <label style={{ color: control.axis === 'x' ? 'red' : control.axis === 'y' ? 'green' : 'blue' }}>
                {control.axis.toUpperCase()} Rotation
              </label>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={0.01}
                value={control.value}
                onChange={(e) => control.onChange(parseFloat(e.target.value))}
                style={{ width: '200px' }}
              />
              <span style={{ color: 'white' }}>{(control.value * 180 / Math.PI).toFixed(0)}°</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Updated InteractiveLimb component
export const InteractiveLimb: React.FC<InteractiveLimbProps> = ({
  geometry,
  color,
  position,
  groupRef,
  limbId,
}) => {
  const { activeLimbId, setActiveLimbId } = React.useContext(ActiveLimbContext);
  const { setControls } = React.useContext(AxisControlsContext);
  const [isHovered, setIsHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationRef = useRef<{x: number, y: number, z: number}>({ x: 0, y: 0, z: 0 });

  const isActive = activeLimbId === limbId;

  // Load saved position on mount
  useEffect(() => {
    const savedPositions = localStorage.getItem('limbPositions');
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
      const axes: RotationAxis[] = ['x', 'y', 'z'];
      const controls: AxisControlData[] = axes.map(axis => ({
        limbId,
        axis,
        value: groupRef.current!.rotation[axis],
        min: LIMB_CONSTRAINTS[limbId].rotation[axis][0],
        max: LIMB_CONSTRAINTS[limbId].rotation[axis][1],
        onChange: (value) => {
          if (groupRef.current) {
            const constraints = LIMB_CONSTRAINTS[limbId];
            const clampedValue = Math.max(
              constraints.rotation[axis][0],
              Math.min(constraints.rotation[axis][1], value)
            );
            groupRef.current.rotation[axis] = clampedValue;
            rotationRef.current[axis] = clampedValue;

            // Save to localStorage
            const savedPositions = localStorage.getItem('limbPositions');
            const positions = savedPositions ? JSON.parse(savedPositions) as StoredLimbPositions : {};
            positions[limbId] = {
              rotation: rotationRef.current
            };
            localStorage.setItem('limbPositions', JSON.stringify(positions));

            // Force control update
            updateControls();
          }
        }
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
      <meshStandardMaterial 
        color={isActive ? '#ff0000' : isHovered ? '#ff8800' : color} 
        opacity={0.8} 
        transparent 
      />
    </mesh>
  );
}

// Camera control buttons UI component
function CameraControlButtons({ onRotate }: { onRotate: (axis: 'x' | 'y' | 'z', angle: number) => void }) {
  const handleReset = () => {
    // @ts-ignore
    window.__cameraReset?.();
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      background: 'rgba(0,0,0,0.7)',
      padding: '10px',
      borderRadius: '5px'
    }}>
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
        <button onClick={() => onRotate('x', Math.PI / 4)}>Rotate X +45°</button>
        <button onClick={() => onRotate('x', -Math.PI / 4)}>Rotate X -45°</button>
      </div>
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
        <button onClick={() => onRotate('y', Math.PI / 4)}>Rotate Y +45°</button>
        <button onClick={() => onRotate('y', -Math.PI / 4)}>Rotate Y -45°</button>
      </div>
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
        <button onClick={() => onRotate('z', Math.PI / 4)}>Rotate Z +45°</button>
        <button onClick={() => onRotate('z', -Math.PI / 4)}>Rotate Z -45°</button>
      </div>
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
        <button 
          onClick={handleReset}
          style={{ 
            width: '100%',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '8px 16px'
          }}
        >
          Reset Camera
        </button>
      </div>
    </div>
  );
}

// Camera controls that live inside the Canvas
function CameraController() {
  const { camera } = useThree();
  const [, forceRender] = React.useState({});

  const handleRotate = React.useCallback((axis: 'x' | 'y' | 'z', angle: number) => {
    const position = camera.position.clone();
    const target = new THREE.Vector3(0, 1.5, 0);
    const matrix = new THREE.Matrix4();
    
    switch (axis) {
      case 'x':
        matrix.makeRotationX(angle);
        break;
      case 'y':
        matrix.makeRotationY(angle);
        break;
      case 'z':
        matrix.makeRotationZ(angle);
        break;
    }
    
    position.sub(target);
    position.applyMatrix4(matrix);
    position.add(target);
    
    camera.position.copy(position);
    camera.lookAt(target);
    forceRender({}); // Force a re-render to update the view
  }, [camera]);

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
function PositionControlButtons({ onMove }: { onMove: (axis: 'y', amount: number) => void }) {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      background: 'rgba(0,0,0,0.7)',
      padding: '10px',
      borderRadius: '5px'
    }}>
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
        <button 
          onClick={() => onMove('y', 0.1)}
          style={{ backgroundColor: '#4CAF50', color: 'white', padding: '8px 16px' }}
        >
          Move Up
        </button>
        <button 
          onClick={() => onMove('y', -0.1)}
          style={{ backgroundColor: '#f44336', color: 'white', padding: '8px 16px' }}
        >
          Move Down
        </button>
      </div>
    </div>
  );
}

// Model position controller that lives inside the Canvas
function ModelPositionController({ selectedTechnique, onAnimationComplete }: { selectedTechnique?: JudoTechnique; onAnimationComplete?: () => void }) {
  // Load saved position or use default
  const [modelPosition, setModelPosition] = React.useState<ModelPosition>(() => {
    const savedPosition = localStorage.getItem('humanoidPosition');
    return savedPosition ? JSON.parse(savedPosition) : { y: 5 };
  });

  const handleMove = React.useCallback((_axis: 'y', amount: number) => {
    setModelPosition((prev: ModelPosition) => {
      const newY = prev.y + amount;
      // Allow model to get closer to the mat (0.1 units minimum)
      const position = { y: Math.max(0.1, newY) };
      // Save position to localStorage
      localStorage.setItem('humanoidPosition', JSON.stringify(position));
      return position;
    });
  }, []);

  // Expose the handler to the buttons outside Canvas
  React.useEffect(() => {
    // @ts-ignore
    window.__modelMove = handleMove;
  }, [handleMove]);

  return (
    <group position={[0, modelPosition.y, 0]}>
      <Humanoid selectedTechnique={selectedTechnique} onAnimationComplete={onAnimationComplete} />
    </group>
  );
}

// Reset limbs button component
function ResetLimbsButton() {
  const handleReset = () => {
    // Reset all limbs to default positions
    Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
      const savedPositions = localStorage.getItem('limbPositions');
      const positions = savedPositions ? JSON.parse(savedPositions) as StoredLimbPositions : {};
      positions[limbId] = {
        rotation: {
          x: defaultState.rotation.x,
          y: defaultState.rotation.y,
          z: defaultState.rotation.z
        }
      };
      localStorage.setItem('limbPositions', JSON.stringify(positions));
    });

    // Force reload to apply reset
    window.location.reload();
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '200px',
      background: 'rgba(0,0,0,0.7)',
      padding: '10px',
      borderRadius: '5px'
    }}>
      <button
        onClick={handleReset}
        style={{
          backgroundColor: '#ff9800',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reset Limbs
      </button>
    </div>
  );
}

export function Scene({ children, selectedTechnique, onAnimationComplete }: SceneProps) {
  const [activeLimbId, setActiveLimbId] = useState<LimbId | null>(null);
  const [axisControls, setAxisControls] = useState<AxisControlData[]>([]);

  const handleRotate = React.useCallback((axis: 'x' | 'y' | 'z', angle: number) => {
    // @ts-ignore
    window.__cameraRotate?.(axis, angle);
  }, []);

  const handleMove = React.useCallback((axis: 'y', amount: number) => {
    // @ts-ignore
    window.__modelMove?.(axis, amount);
  }, []);

  return (
    <ActiveLimbContext.Provider value={{ activeLimbId, setActiveLimbId }}>
      <AxisControlsContext.Provider value={{ controls: axisControls, setControls: setAxisControls }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              
              <Tatami size={8} tilesPerSide={8} />
              <ModelPositionController selectedTechnique={selectedTechnique} onAnimationComplete={onAnimationComplete} />
              
              {children}

              <OrbitControls 
                minDistance={2} 
                maxDistance={8} 
                target={[0, 1.5, 0]} 
                enableDamping 
                dampingFactor={0.05} 
              />
              <CameraController />
            </Suspense>
          </Canvas>
          <AxisControls />
          <CameraControlButtons onRotate={handleRotate} />
          <PositionControlButtons onMove={handleMove} />
          <ResetLimbsButton />
        </div>
      </AxisControlsContext.Provider>
    </ActiveLimbContext.Provider>
  );
}
