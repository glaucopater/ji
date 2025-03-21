import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useRef, useEffect } from 'react';
import React from 'react';
import * as THREE from 'three';
import '../types/global.d';
import { useHumanoidAnimation } from '../hooks/useHumanoidAnimation';
import { techniques } from '../data/techniques';
import { JudoTechnique } from '../types/techniques';

interface SceneProps {
  children?: React.ReactNode;
  selectedTechnique?: JudoTechnique;
  onAnimationComplete?: () => void;
}

function Joint({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color="yellow" opacity={0.7} transparent />
    </mesh>
  );
}

function Hand({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.15, 0.08, 0.08]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>
      {/* Thumb */}
      <mesh position={[-0.08, 0.04, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>
    </group>
  );
}

function Humanoid({ selectedTechnique, onAnimationComplete }: { 
  selectedTechnique?: JudoTechnique;
  onAnimationComplete?: () => void;
}) {
  // Refs for animation
  const upperArmLeftRef = useRef<THREE.Group>(null);
  const lowerArmLeftRef = useRef<THREE.Group>(null);
  const upperArmRightRef = useRef<THREE.Group>(null);
  const lowerArmRightRef = useRef<THREE.Group>(null);
  const upperLegLeftRef = useRef<THREE.Group>(null);
  const lowerLegLeftRef = useRef<THREE.Group>(null);
  const upperLegRightRef = useRef<THREE.Group>(null);
  const lowerLegRightRef = useRef<THREE.Group>(null);

  // Use animation hook
  const { playTechnique, setIdle } = useHumanoidAnimation({
    upperArmLeftRef,
    lowerArmLeftRef,
    upperArmRightRef,
    lowerArmRightRef,
    upperLegLeftRef,
    lowerLegLeftRef,
    upperLegRightRef,
    lowerLegRightRef
  });

  // Handle technique selection
  useEffect(() => {
    if (selectedTechnique) {
      console.log('Starting animation for technique:', selectedTechnique.name);
      setIdle(false); // Ensure idle is off when playing technique
      playTechnique(selectedTechnique.animation);
      
      // Calculate total duration
      const totalDuration = selectedTechnique.animation.keyframes.reduce(
        (sum, keyframe) => sum + keyframe.duration,
        0
      );
      console.log('Animation duration:', totalDuration, 'seconds');

      // Notify when animation completes
      const timer = setTimeout(() => {
        console.log('Animation complete for:', selectedTechnique.name);
        if (!selectedTechnique.isToggle) {
          setIdle(false); // Keep idle off for toggle techniques
        }
        onAnimationComplete?.();
      }, totalDuration * 1000);

      return () => {
        console.log('Cleaning up animation for:', selectedTechnique.name);
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
      if (key === '1' || key === '2') {
        const index = parseInt(key) - 1;
        if (index < techniques.length) {
          const technique = techniques[index];
          console.log('Keyboard shortcut triggered for technique:', technique.name);
          playTechnique(technique.animation);
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [playTechnique]);

  return (
    <group>
      {/* Head */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.6, 1, 0.3]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>
      
      {/* Left Arm */}
      <group position={[-0.3, 1.7, 0]}>
        {/* Shoulder Joint */}
        <Joint position={[0, 0, 0]} />
        {/* Upper Arm */}
        <group ref={upperArmLeftRef}>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.07, 0.4, 32]} />
            <meshStandardMaterial color="lightblue" />
          </mesh>
          {/* Elbow Joint */}
          <Joint position={[0, -0.4, 0]} />
          {/* Lower Arm */}
          <group ref={lowerArmLeftRef} position={[0, -0.4, 0]}>
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.4, 32]} />
              <meshStandardMaterial color="lightblue" />
            </mesh>
            {/* Hand */}
            <Hand position={[0, -0.4, 0]} />
          </group>
        </group>
      </group>

      {/* Right Arm */}
      <group position={[0.3, 1.7, 0]}>
        {/* Shoulder Joint */}
        <Joint position={[0, 0, 0]} />
        {/* Upper Arm */}
        <group ref={upperArmRightRef}>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.07, 0.4, 32]} />
            <meshStandardMaterial color="lightblue" />
          </mesh>
          {/* Elbow Joint */}
          <Joint position={[0, -0.4, 0]} />
          {/* Lower Arm */}
          <group ref={lowerArmRightRef} position={[0, -0.4, 0]}>
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.4, 32]} />
              <meshStandardMaterial color="lightblue" />
            </mesh>
            {/* Hand */}
            <Hand position={[0, -0.4, 0]} />
          </group>
        </group>
      </group>

      {/* Left Leg */}
      <group position={[-0.2, 0.7, 0]}>
        {/* Hip Joint */}
        <Joint position={[0, 0, 0]} />
        {/* Upper Leg */}
        <group ref={upperLegLeftRef}>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.09, 0.08, 0.5, 32]} />
            <meshStandardMaterial color="lightblue" />
          </mesh>
          {/* Knee Joint */}
          <Joint position={[0, -0.5, 0]} />
          {/* Lower Leg */}
          <group ref={lowerLegLeftRef} position={[0, -0.5, 0]}>
            <mesh position={[0, -0.25, 0]}>
              <cylinderGeometry args={[0.08, 0.07, 0.5, 32]} />
              <meshStandardMaterial color="lightblue" />
            </mesh>
            {/* Ankle Joint */}
            <Joint position={[0, -0.5, 0]} />
            {/* Foot */}
            <mesh position={[0, -0.55, 0.1]}>
              <boxGeometry args={[0.12, 0.1, 0.25]} />
              <meshStandardMaterial color="lightblue" />
            </mesh>
          </group>
        </group>
      </group>

      {/* Right Leg */}
      <group position={[0.2, 0.7, 0]}>
        {/* Hip Joint */}
        <Joint position={[0, 0, 0]} />
        {/* Upper Leg */}
        <group ref={upperLegRightRef}>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.09, 0.08, 0.5, 32]} />
            <meshStandardMaterial color="lightblue" />
          </mesh>
          {/* Knee Joint */}
          <Joint position={[0, -0.5, 0]} />
          {/* Lower Leg */}
          <group ref={lowerLegRightRef} position={[0, -0.5, 0]}>
            <mesh position={[0, -0.25, 0]}>
              <cylinderGeometry args={[0.08, 0.07, 0.5, 32]} />
              <meshStandardMaterial color="lightblue" />
            </mesh>
            {/* Ankle Joint */}
            <Joint position={[0, -0.5, 0]} />
            {/* Foot */}
            <mesh position={[0, -0.55, 0.1]}>
              <boxGeometry args={[0.12, 0.1, 0.25]} />
              <meshStandardMaterial color="lightblue" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export function Scene({ children, selectedTechnique, onAnimationComplete }: SceneProps) {
  // Debug log when selectedTechnique changes
  useEffect(() => {
    console.log('Scene received new technique:', selectedTechnique?.name);
  }, [selectedTechnique]);

  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 75 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Humanoid 
          selectedTechnique={selectedTechnique} 
          onAnimationComplete={onAnimationComplete}
        />

        {children}
        
        <OrbitControls />
      </Suspense>
    </Canvas>
  );
} 