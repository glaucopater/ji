import { useFrame } from '@react-three/fiber';
import { RefObject, useCallback, useState } from 'react';
import * as THREE from 'three';
import { JointRefs, TechniqueAnimation, TechniqueKeyframe } from '../types/techniques';

interface AnimationState {
  isPlaying: boolean;
  currentTechnique: TechniqueAnimation | null;
  startTime: number;
  currentKeyframeIndex: number;
  isIdle: boolean;
}

type JointRotation = { x?: number; y?: number; z?: number };

// Map keyframe joint names to ref names
const jointToRefMap = {
  upperArmLeft: 'upperArmLeftRef',
  lowerArmLeft: 'lowerArmLeftRef',
  upperArmRight: 'upperArmRightRef',
  lowerArmRight: 'lowerArmRightRef',
  upperLegLeft: 'upperLegLeftRef',
  lowerLegLeft: 'lowerLegLeftRef',
  upperLegRight: 'upperLegRightRef',
  lowerLegRight: 'lowerLegRightRef',
  spine: 'spineRef'
} as const;

export function useHumanoidAnimation(refs: JointRefs) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    currentTechnique: null,
    startTime: 0,
    currentKeyframeIndex: 0,
    isIdle: false
  });

  const playTechnique = useCallback((technique: TechniqueAnimation | null) => {
    console.log('Playing technique:', technique ? `keyframes: ${technique.keyframes.length}, Loop: ${technique.loop}` : 'stopping animation');
    
    // If technique is null, stop the current animation
    if (!technique) {
      setAnimationState({
        isPlaying: false,
        currentTechnique: null,
        startTime: 0,
        currentKeyframeIndex: 0,
        isIdle: false
      });
      return;
    }

    setAnimationState({
      isPlaying: true,
      currentTechnique: technique,
      startTime: Date.now(),
      currentKeyframeIndex: 0,
      isIdle: false
    });
  }, []);

  const setIdle = useCallback((idle: boolean) => {
    setAnimationState(prev => ({
      ...prev,
      isIdle: idle
    }));
  }, []);

  const idleAnimation = useCallback((t: number) => {
    const speed = 1.5;
    const armSwing = 0.3;
    const legSwing = 0.2;

    // Safely apply rotations only if refs exist
    const safeRotate = (ref: RefObject<THREE.Group | null>, rotation: number) => {
      if (ref.current) {
        ref.current.rotation.x = rotation;
      }
    };

    // Arms
    safeRotate(refs.upperArmRightRef, Math.sin(t * speed) * armSwing);
    safeRotate(refs.lowerArmRightRef, Math.max(0, -Math.sin(t * speed) * 0.2));
    safeRotate(refs.upperArmLeftRef, -Math.sin(t * speed) * armSwing);
    safeRotate(refs.lowerArmLeftRef, Math.max(0, Math.sin(t * speed) * 0.2));

    // Legs
    safeRotate(refs.upperLegRightRef, Math.sin(t * speed) * legSwing);
    safeRotate(refs.lowerLegRightRef, Math.max(0, Math.sin(t * speed - 0.5) * 0.3));
    safeRotate(refs.upperLegLeftRef, -Math.sin(t * speed) * legSwing);
    safeRotate(refs.lowerLegLeftRef, Math.max(0, -Math.sin(t * speed - 0.5) * 0.3));
  }, [refs]);

  const applyKeyframe = useCallback((keyframe: TechniqueKeyframe, progress: number) => {
    Object.entries(keyframe).forEach(([joint, rotation]) => {
      if (joint === 'duration') return;
      
      // Get the corresponding ref name from the map
      const refName = jointToRefMap[joint as keyof typeof jointToRefMap];
      if (!refName) {
        console.warn(`No ref mapping found for joint: ${joint}`);
        return;
      }

      const ref = refs[refName];
      if (!ref?.current || !rotation) return;

      const rot = rotation as JointRotation;
      
      // Safely apply rotations
      if (rot.x !== undefined) ref.current.rotation.x = rot.x * progress;
      if (rot.y !== undefined) ref.current.rotation.y = rot.y * progress;
      if (rot.z !== undefined) ref.current.rotation.z = rot.z * progress;
    });
  }, [refs]);

  useFrame(({ clock }) => {
    if (!animationState.isPlaying || !animationState.currentTechnique) {
      // Only play idle animation if isIdle is true
      if (animationState.isIdle) {
        idleAnimation(clock.getElapsedTime());
      }
      return;
    }

    const { currentTechnique, startTime, currentKeyframeIndex } = animationState;
    const keyframes = currentTechnique.keyframes;
    
    // Safety check for keyframes
    if (!keyframes || currentKeyframeIndex >= keyframes.length) {
      console.warn('Invalid keyframe state, resetting animation');
      setAnimationState({
        isPlaying: false,
        currentTechnique: null,
        startTime: 0,
        currentKeyframeIndex: 0,
        isIdle: false
      });
      return;
    }

    const currentKeyframe = keyframes[currentKeyframeIndex];
    
    const elapsedTime = (Date.now() - startTime) / 1000;
    const keyframeDuration = currentKeyframe.duration;
    const keyframeProgress = Math.min(1, elapsedTime / keyframeDuration);

    if (keyframeProgress >= 1) {
      if (currentKeyframeIndex < keyframes.length - 1) {
        // Move to next keyframe
        setAnimationState({
          ...animationState,
          startTime: Date.now(),
          currentKeyframeIndex: currentKeyframeIndex + 1
        });
      } else if (currentTechnique.loop) {
        // If looping, start from the beginning
        console.log('Looping animation');
        setAnimationState({
          ...animationState,
          startTime: Date.now(),
          currentKeyframeIndex: 0
        });
      } else {
        // End the animation
        setAnimationState({
          isPlaying: false,
          currentTechnique: null,
          startTime: 0,
          currentKeyframeIndex: 0,
          isIdle: false
        });
      }
      return;
    }

    try {
      applyKeyframe(currentKeyframe, keyframeProgress);
    } catch (error) {
      console.error('Error applying keyframe:', error);
      // Reset animation state on error
      setAnimationState({
        isPlaying: false,
        currentTechnique: null,
        startTime: 0,
        currentKeyframeIndex: 0,
        isIdle: false
      });
    }
  });

  return { playTechnique, setIdle };
}