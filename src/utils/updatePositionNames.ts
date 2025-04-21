import { ViewerPosition, PosePosition } from '../types/positions';

// Constants from usePositions.ts
const VIEWER_STORAGE_KEY = 'positionLibrary';
const POSE_STORAGE_KEY = 'poseDetectionLibrary';

export function updatePositionNames() {
  console.log('Running one-time position name update...');

  // Update viewer positions
  const savedViewerLibrary = localStorage.getItem(VIEWER_STORAGE_KEY);
  if (savedViewerLibrary) {
    try {
      const viewerData = JSON.parse(savedViewerLibrary);
      if (viewerData.positions && Array.isArray(viewerData.positions)) {
        // Sort by timestamp (newest first)
        const sortedPositions = viewerData.positions.sort((a: ViewerPosition, b: ViewerPosition) => 
          b.timestamp - a.timestamp
        );
        
        // Rename positions sequentially (newest is Position 1)
        const renamedPositions = sortedPositions.map((position: ViewerPosition, index: number) => ({
          ...position,
          name: `Position ${index + 1}`
        }));

        const updatedLibrary = {
          positions: renamedPositions,
          lastPositionNumber: renamedPositions.length
        };

        localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(updatedLibrary));
        console.log('Updated viewer positions:', updatedLibrary);
      }
    } catch (error) {
      console.error('Error updating viewer positions:', error);
    }
  }

  // Update pose positions
  const savedPoseLibrary = localStorage.getItem(POSE_STORAGE_KEY);
  if (savedPoseLibrary) {
    try {
      const poseData = JSON.parse(savedPoseLibrary);
      if (poseData.positions && Array.isArray(poseData.positions)) {
        // Sort by timestamp (newest first)
        const sortedPositions = poseData.positions.sort((a: PosePosition, b: PosePosition) => 
          b.timestamp - a.timestamp
        );
        
        // Rename positions sequentially (newest is Pose 1)
        const renamedPositions = sortedPositions.map((position: PosePosition, index: number) => ({
          ...position,
          name: `Pose ${index + 1}`
        }));

        const updatedLibrary = {
          positions: renamedPositions,
          lastPositionNumber: renamedPositions.length
        };

        localStorage.setItem(POSE_STORAGE_KEY, JSON.stringify(updatedLibrary));
        console.log('Updated pose positions:', updatedLibrary);
      }
    } catch (error) {
      console.error('Error updating pose positions:', error);
    }
  }

  console.log('Position name update complete');
} 