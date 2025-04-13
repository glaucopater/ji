import React, { useState, useRef, useEffect } from "react";
import { InteractiveLimbProps, StoredLimbPositions, RotationAxis, AxisControlData, LIMB_CONSTRAINTS } from "../types/viewer";
import { ActiveLimbContext, AxisControlsContext } from "./Scene";


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
                            height: 0
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
