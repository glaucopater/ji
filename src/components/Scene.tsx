import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState } from "react";
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
        top: "50%",
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
function CameraControlButtons({ onRotate }: { onRotate: (axis: "x" | "y" | "z", angle: number) => void }) {
  const handleReset = () => {
    // @ts-ignore
    window.__cameraReset?.();
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        background: "rgba(0,0,0,0.7)",
        padding: "10px",
        borderRadius: "5px",
      }}
    >
      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
        <button onClick={() => onRotate("x", Math.PI / 4)}>Rotate X +45°</button>
        <button onClick={() => onRotate("x", -Math.PI / 4)}>Rotate X -45°</button>
      </div>
      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
        <button onClick={() => onRotate("y", Math.PI / 4)}>Rotate Y +45°</button>
        <button onClick={() => onRotate("y", -Math.PI / 4)}>Rotate Y -45°</button>
      </div>
      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
        <button onClick={() => onRotate("z", Math.PI / 4)}>Rotate Z +45°</button>
        <button onClick={() => onRotate("z", -Math.PI / 4)}>Rotate Z -45°</button>
      </div>
      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
        <button
          onClick={handleReset}
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
    </div>
  );
}

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
function PositionControlButtons({ onMove }: { onMove: (axis: "y", amount: number) => void }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        background: "rgba(0,0,0,0.7)",
        padding: "10px",
        borderRadius: "5px",
      }}
    >
      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
        <button onClick={() => onMove("y", 0.1)} style={{ backgroundColor: "#4CAF50", color: "white", padding: "8px 16px" }}>
          Move Up
        </button>
        <button onClick={() => onMove("y", -0.1)} style={{ backgroundColor: "#f44336", color: "white", padding: "8px 16px" }}>
          Move Down
        </button>
      </div>
    </div>
  );
}

// Model position controller that lives inside the Canvas
function ModelPositionController({
  selectedTechnique,
  onAnimationComplete,
}: {
  selectedTechnique?: JudoTechnique;
  onAnimationComplete?: () => void;
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

    // Force reload to apply reset
    window.location.reload();
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "200px",
        background: "rgba(0,0,0,0.7)",
        padding: "10px",
        borderRadius: "5px",
      }}
    >
      <button
        onClick={handleReset}
        style={{
          backgroundColor: "#ff9800",
          color: "white",
          padding: "8px 16px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Reset Limbs
      </button>
    </div>
  );
}

export function Scene({ children, selectedTechnique, onAnimationComplete }: CustomSceneProps) {
  const [activeLimbId, setActiveLimbId] = useState<LimbId | null>(null);
  const [axisControls, setAxisControls] = useState<AxisControlData[]>([]);

  const handleRotate = React.useCallback((axis: "x" | "y" | "z", angle: number) => {
    // @ts-ignore
    window.__cameraRotate?.(axis, angle);
  }, []);

  const handleMove = React.useCallback((axis: "y", amount: number) => {
    // @ts-ignore
    window.__modelMove?.(axis, amount);
  }, []);

  return (
    <ActiveLimbContext.Provider value={{ activeLimbId, setActiveLimbId }}>
      <AxisControlsContext.Provider value={{ controls: axisControls, setControls: setAxisControls }}>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />

              <Tatami size={8} tilesPerSide={8} />
              <ModelPositionController selectedTechnique={selectedTechnique} onAnimationComplete={onAnimationComplete} />

              {children}

              <OrbitControls minDistance={2} maxDistance={8} target={[0, 1.5, 0]} enableDamping dampingFactor={0.05} />
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
