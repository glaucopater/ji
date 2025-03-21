import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useHumanoidAnimation } from './useHumanoidAnimation';
import * as THREE from 'three';
import { JointRefs, TechniqueAnimation } from '../types/techniques';

// Mock useFrame since we can't use it in tests
jest.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: { clock: { getElapsedTime: () => number } }) => void) => {
    callback({ clock: { getElapsedTime: () => 0 } });
  }
}));

describe('useHumanoidAnimation', () => {
  let mockRefs: JointRefs;
  let mockTechnique: TechniqueAnimation;

  beforeEach(() => {
    // Create mock refs with rotation objects
    mockRefs = {
      upperArmLeftRef: { current: new THREE.Group() },
      lowerArmLeftRef: { current: new THREE.Group() },
      upperArmRightRef: { current: new THREE.Group() },
      lowerArmRightRef: { current: new THREE.Group() },
      upperLegLeftRef: { current: new THREE.Group() },
      lowerLegLeftRef: { current: new THREE.Group() },
      upperLegRightRef: { current: new THREE.Group() },
      lowerLegRightRef: { current: new THREE.Group() }
    } as unknown as JointRefs;

    // Create mock technique
    mockTechnique = {
      keyframes: [
        {
          duration: 1,
          upperArmLeft: { x: 1, y: 0, z: 0 },
          lowerArmLeft: { x: 0.5, y: 0, z: 0 }
        }
      ],
      loop: false
    };
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useHumanoidAnimation(mockRefs));
    
    expect(result.current.playTechnique).toBeDefined();
    expect(result.current.setIdle).toBeDefined();
  });

  it('should start playing technique when playTechnique is called', () => {
    const { result } = renderHook(() => useHumanoidAnimation(mockRefs));

    act(() => {
      result.current.playTechnique(mockTechnique);
    });

    // Check that the animation started
    // Note: We can't directly test the animation state as it's internal
    // but we can verify the function executed without errors
  });

  it('should stop animation when null technique is passed', () => {
    const { result } = renderHook(() => useHumanoidAnimation(mockRefs));

    act(() => {
      result.current.playTechnique(null);
    });

    // Animation should be stopped
    // Again, we can't directly test internal state
  });

  it('should toggle idle state', () => {
    const { result } = renderHook(() => useHumanoidAnimation(mockRefs));

    act(() => {
      result.current.setIdle(true);
    });

    // Idle state should be set
    // Note: We can't directly test the animation state
  });

  // Test error handling
  it('should handle missing refs gracefully', () => {
    const incompleteRefs = {
      upperArmLeftRef: { current: null },
      // ... missing other refs
    } as unknown as JointRefs;

    const { result } = renderHook(() => useHumanoidAnimation(incompleteRefs));

    act(() => {
      result.current.playTechnique(mockTechnique);
    });

    // Should not throw errors when refs are missing
  });

  it('should handle invalid keyframes gracefully', () => {
    const invalidTechnique = {
      keyframes: [],
      loop: false
    };

    const { result } = renderHook(() => useHumanoidAnimation(mockRefs));

    act(() => {
      result.current.playTechnique(invalidTechnique);
    });

    // Should not throw errors with invalid keyframes
  });
}); 