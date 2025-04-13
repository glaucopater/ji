import {
  useEffect
} from "react";
import * as THREE from "three";
import { techniques } from "../data/techniques";
import { useHumanoidAnimation } from "../hooks/useHumanoidAnimation";
import { JudoTechnique } from "../types/techniques";
import { Torso } from "./Torso";
import { LeftArm } from "./LeftArm";
import { RightArm } from "./RightArm";
import { LeftLeg } from "./LeftLeg";
import { RightLeg } from "./RightLeg";
import { Head } from "./Head";
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
  upperTorsoRef: React.RefObject<THREE.Group>;
  lowerTorsoRef: React.RefObject<THREE.Group>;
  headRef: React.RefObject<THREE.Group>;
  handLeftRef: React.RefObject<THREE.Group>;
  handRightRef: React.RefObject<THREE.Group>;
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
  upperTorsoRef,
  lowerTorsoRef,
  headRef,
  handLeftRef,
  handRightRef,
}: HumanoidProps) {
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
    upperTorsoRef,
    lowerTorsoRef,
    handLeftRef,
    handRightRef,
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
            upperTorso: { x: 0 },
            lowerTorso: { x: 0 },
            duration: 0.3,
          },
        ],
      });

      // After a brief delay, play the selected technique
      setTimeout(() => {
        playTechnique({
          ...selectedTechnique.animation,
          loop: selectedTechnique.isToggle // Ensure looping is enabled for toggleable techniques
        });
      }, 300);

      // Only set up completion timer for non-toggle techniques
      if (!selectedTechnique.isToggle) {
        const totalDuration = selectedTechnique.animation.keyframes.reduce((sum, keyframe) => sum + keyframe.duration, 0) + 0.3;
        console.log("Animation duration:", totalDuration, "seconds");

        const timer = setTimeout(() => {
          console.log("Animation complete for:", selectedTechnique.name);
          setIdle(false);
          onAnimationComplete?.();
        }, totalDuration * 1000);

        return () => {
          console.log("Cleaning up animation for:", selectedTechnique.name);
          clearTimeout(timer);
        };
      }
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
        <Torso
          upperTorsoRef={upperTorsoRef}
          lowerTorsoRef={lowerTorsoRef}
          upperChildren={
            <>
              {/* Head and arms are children of upper torso */}
              <Head headRef={headRef} />
              <LeftArm upperArmLeftRef={upperArmLeftRef} lowerArmLeftRef={lowerArmLeftRef} />
              <RightArm upperArmRightRef={upperArmRightRef} lowerArmRightRef={lowerArmRightRef} />
            </>
          }
          lowerChildren={
            <>
              {/* Legs are children of lower torso */}
              <LeftLeg upperLegLeftRef={upperLegLeftRef} lowerLegLeftRef={lowerLegLeftRef} />
              <RightLeg upperLegRightRef={upperLegRightRef} lowerLegRightRef={lowerLegRightRef} />
            </>
          }
        />
      </group>
    </group>
  );
}
