import { JudoTechnique } from '../types/techniques';

// Convert degrees to radians for easier angle specification
const rad = (deg: number) => (deg * Math.PI) / 180;

export const techniques: JudoTechnique[] = [
  {
    id: 'ippon-seoi-nage',
    name: 'Ippon Seoi Nage',
    japaneseName: '一本背負投',
    description: 'One-shoulder throw',
    category: 'Throwing Technique',
    difficulty: 'Intermediate',
    animation: {
      keyframes: [
        {
          // Initial stance
          upperLegRight: { x: 0 },
          upperLegLeft: { x: 0 },
          upperArmRight: { x: 0, y: 0, z: 0 },
          upperArmLeft: { x: 0, y: 0, z: 0 },
          duration: 0.5
        },
        {
          // Turn and lower body
          upperLegRight: { x: rad(-45) },
          upperLegLeft: { x: rad(-45) },
          upperArmRight: { x: rad(90), y: rad(-45) },
          upperArmLeft: { x: rad(90), y: rad(-45) },
          duration: 0.5
        },
        {
          // Pull and throw
          upperLegRight: { x: rad(-90) },
          upperLegLeft: { x: rad(-90) },
          upperArmRight: { x: rad(180), y: rad(-90) },
          upperArmLeft: { x: rad(180), y: rad(-90) },
          lowerArmRight: { x: rad(45) },
          lowerArmLeft: { x: rad(45) },
          duration: 0.5
        },
        {
          // Return to stance
          upperLegRight: { x: 0 },
          upperLegLeft: { x: 0 },
          upperArmRight: { x: 0, y: 0, z: 0 },
          upperArmLeft: { x: 0, y: 0, z: 0 },
          lowerArmRight: { x: 0 },
          lowerArmLeft: { x: 0 },
          duration: 0.5
        }
      ]
    }
  },
  {
    id: 'o-soto-gari',
    name: 'O Soto Gari',
    japaneseName: '大外刈',
    description: 'Major outer reap',
    category: 'Throwing Technique',
    difficulty: 'Advanced',
    animation: {
      keyframes: [
        {
          // Initial stance
          upperLegRight: { x: 0 },
          upperLegLeft: { x: 0 },
          upperArmRight: { x: 0 },
          upperArmLeft: { x: 0 },
          duration: 0.5
        },
        {
          // Step and grip
          upperLegRight: { x: rad(45) },
          upperArmRight: { x: rad(90), y: rad(45) },
          upperArmLeft: { x: rad(90), y: rad(-45) },
          duration: 0.5
        },
        {
          // Reaping motion
          upperLegRight: { x: rad(135) },
          lowerLegRight: { x: rad(45) },
          upperArmRight: { x: rad(135), y: rad(90) },
          upperArmLeft: { x: rad(135), y: rad(-90) },
          duration: 0.5
        },
        {
          // Return to stance
          upperLegRight: { x: 0 },
          lowerLegRight: { x: 0 },
          upperArmRight: { x: 0, y: 0 },
          upperArmLeft: { x: 0, y: 0 },
          duration: 0.5
        }
      ]
    }
  },
  {
    id: 'walking',
    name: 'Walking',
    japaneseName: '歩く',
    description: 'Basic walking motion',
    category: 'Movement',
    difficulty: 'Basic',
    isToggle: true,
    animation: {
      keyframes: [
        {
          // Right step forward, left step back
          upperLegRight: { x: rad(30) },
          lowerLegRight: { x: rad(-10) },
          upperLegLeft: { x: rad(-30) },
          lowerLegLeft: { x: rad(10) },
          upperArmLeft: { x: rad(30) },
          lowerArmLeft: { x: rad(10) },
          upperArmRight: { x: rad(-30) },
          lowerArmRight: { x: rad(-10) },
          duration: 0.5
        },
        {
          // Left step forward, right step back
          upperLegRight: { x: rad(-30) },
          lowerLegRight: { x: rad(10) },
          upperLegLeft: { x: rad(30) },
          lowerLegLeft: { x: rad(-10) },
          upperArmLeft: { x: rad(-30) },
          lowerArmLeft: { x: rad(-10) },
          upperArmRight: { x: rad(30) },
          lowerArmRight: { x: rad(10) },
          duration: 0.5
        }
      ],
      loop: true
    }
  }
]; 