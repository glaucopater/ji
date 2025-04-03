import { useRef, useEffect } from "react";
import * as THREE from "three";
import { techniques } from "../data/techniques";
import { useHumanoidAnimation } from "../hooks/useHumanoidAnimation";
import { JudoTechnique } from "../types/techniques";
import { Torso } from "./Torso";
import { LeftArm } from "./LeftArm";
import { RightArm } from "./RightArm";
import { LeftLeg } from "./LeftLeg";
import { RightLeg } from "./RightLeg";

interface HumanoidProps {
  selectedTechnique?: JudoTechnique;
  onAnimationComplete?: () => void;
  upperArmLeftRef: React.RefObject<THREE.Group>;
  lowerArmLeftRef: React.RefObject<THREE.Group>;
  upperArmRightRef: React.RefObject<THREE.Group>;
  lowerArmRightRef: React.RefObject<THREE.Group>;
  upperLegLeftRef: React.RefObject<THREE.Group>;
  lowerLegLeftRef: React.RefObject<THREE.Group>;
  upperLegRightRef: React.RefObject<THREE.Group>;
  lowerLegRightRef: React.RefObject<THREE.Group>;
}

export function Humanoid({
  selectedTechnique,
  onAnimationComplete,
  upperArmLeftRef,
  lowerArmLeftRef,
  upperArmRightRef,
  lowerArmRightRef,
  upperLegLeftRef,
  lowerLegLeftRef,
  upperLegRightRef,
  lowerLegRightRef,
}: HumanoidProps) {
  // Refs for animation
  const spineRef = useRef<THREE.Group>(null);

  // Use animation hook
  const { playTechnique, setIdle } = useHumanoidAnimation({
    upperArmLeftRef,
    lowerArmLeftRef,
    upperArmRightRef,
    lowerArmRightRef,
    upperLegLeftRef,
    lowerLegLeftRef,
    upperLegRightRef,
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
        keyframes: [
          {
            upperLegLeft: { x: 0 },
            upperLegRight: { x: 0 },
            lowerLegLeft: { x: 0 },
            lowerLegRight: { x: 0 },
            upperArmLeft: { x: 0 },
            upperArmRight: { x: 0 },
            lowerArmLeft: { x: 0 },
            lowerArmRight: { x: 0 },
            spine: { x: 0 },
            duration: 0.3,
          },
        ],
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
          <Torso />

          {/* Arms and legs are now children of the spine group */}
          {/* Left Arm */}
          <LeftArm upperArmLeftRef={upperArmLeftRef} lowerArmLeftRef={lowerArmLeftRef} />

          {/* Right Arm */}
          <RightArm upperArmRightRef={upperArmRightRef} lowerArmRightRef={lowerArmRightRef} />

          {/* Left Leg */}
          <LeftLeg upperLegLeftRef={upperLegLeftRef} lowerLegLeftRef={lowerLegLeftRef} />

          {/* Right Leg */}
          <RightLeg upperLegRightRef={upperLegRightRef} lowerLegRightRef={lowerLegRightRef} />
        </group>
      </group>
    </group>
  );
}
