import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ViewerPosition, PosePosition, ViewerLibrary, PoseLibrary } from '../types/positions';
import { Keypoint } from '@tensorflow-models/pose-detection';

const VIEWER_STORAGE_KEY = 'positionLibrary';
const POSE_STORAGE_KEY = 'poseDetectionLibrary';

const DEFAULT_VIEWER_LIBRARY: ViewerLibrary = {
  positions: [],
  lastPositionNumber: 0
};

const DEFAULT_POSE_LIBRARY: PoseLibrary = {
  positions: [],
  lastPositionNumber: 0
};

export function usePositions() {
  const [viewerLibrary, setViewerLibrary] = useState<ViewerLibrary>(DEFAULT_VIEWER_LIBRARY);
  const [poseLibrary, setPoseLibrary] = useState<PoseLibrary>(DEFAULT_POSE_LIBRARY);

  // Load positions from localStorage on mount
  const loadPositionsFromStorage = useCallback(() => {
    try {
      // Load viewer positions
      const savedViewerLibrary = localStorage.getItem(VIEWER_STORAGE_KEY);
      console.log('Loading viewer positions from localStorage:', savedViewerLibrary?.length ?? 0);
      
      if (!savedViewerLibrary) {
        console.log('No saved viewer library found, using default');
        localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(DEFAULT_VIEWER_LIBRARY));
        setViewerLibrary(DEFAULT_VIEWER_LIBRARY);
      } else {
        const viewerData = JSON.parse(savedViewerLibrary);
        if (viewerData.positions && Array.isArray(viewerData.positions)) {
          setViewerLibrary(viewerData);
        }
      }

      // Load pose positions
      const savedPoseLibrary = localStorage.getItem(POSE_STORAGE_KEY);
      console.log('Loading pose positions from localStorage:', savedPoseLibrary?.length ?? 0);
      
      if (!savedPoseLibrary) {
        console.log('No saved pose library found, using default');
        localStorage.setItem(POSE_STORAGE_KEY, JSON.stringify(DEFAULT_POSE_LIBRARY));
        setPoseLibrary(DEFAULT_POSE_LIBRARY);
      } else {
        const poseData = JSON.parse(savedPoseLibrary);
        if (poseData.positions && Array.isArray(poseData.positions)) {
          setPoseLibrary(poseData);
        }
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      setViewerLibrary(DEFAULT_VIEWER_LIBRARY);
      setPoseLibrary(DEFAULT_POSE_LIBRARY);
    }
  }, []);

  useEffect(() => {
    loadPositionsFromStorage();
  }, [loadPositionsFromStorage]);

  const addViewerPosition = (limbs: ViewerPosition['limbs'], height: number) => {
    console.log('Adding new viewer position with limbs:', limbs);
    
    const filteredLimbs = Object.entries(limbs).reduce((acc, [id, data]) => {
      const rotation = data.rotation;
      if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
        acc[id as keyof ViewerPosition['limbs']] = data;
      }
      return acc;
    }, {} as ViewerPosition['limbs']);

    const newPosition: ViewerPosition = {
      id: uuidv4(),
      name: `Position ${viewerLibrary.positions.length + 1}`,
      timestamp: Date.now(),
      height,
      limbs: filteredLimbs
    };

    const updatedLibrary = {
      positions: [newPosition, ...viewerLibrary.positions],
      lastPositionNumber: viewerLibrary.positions.length + 1
    };

    try {
      localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(updatedLibrary));
      console.log('Successfully saved viewer position to localStorage:', updatedLibrary);
      setViewerLibrary(updatedLibrary);
    } catch (error) {
      console.error('Error saving viewer position:', error);
    }

    return newPosition;
  };

  const addPosePosition = (keypoints: Keypoint[]) => {
    console.log('Adding new pose position:', keypoints);
    
    const newPosition: PosePosition = {
      id: uuidv4(),
      name: `Pose ${poseLibrary.lastPositionNumber + 1}`,
      timestamp: Date.now(),
      keypoints
    };

    const updatedLibrary = {
      positions: [newPosition, ...poseLibrary.positions].sort((a, b) => b.timestamp - a.timestamp),
      lastPositionNumber: poseLibrary.lastPositionNumber + 1
    };

    try {
      localStorage.setItem(POSE_STORAGE_KEY, JSON.stringify(updatedLibrary));
      console.log('Successfully saved pose position to localStorage:', updatedLibrary);
      setPoseLibrary(updatedLibrary);
    } catch (error) {
      console.error('Error saving pose position:', error);
    }

    return newPosition;
  };

  const deletePosition = (id: string, type: 'viewer' | 'pose') => {
    if (type === 'viewer') {
      const updatedLibrary = {
        ...viewerLibrary,
        positions: viewerLibrary.positions.filter(p => p.id !== id)
      };
      localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(updatedLibrary));
      setViewerLibrary(updatedLibrary);
    } else {
      const updatedLibrary = {
        ...poseLibrary,
        positions: poseLibrary.positions.filter(p => p.id !== id)
      };
      localStorage.setItem(POSE_STORAGE_KEY, JSON.stringify(updatedLibrary));
      setPoseLibrary(updatedLibrary);
    }
  };

  return {
    viewerPositions: viewerLibrary.positions,
    posePositions: poseLibrary.positions,
    addViewerPosition,
    addPosePosition,
    deletePosition,
    refreshPositions: loadPositionsFromStorage
  };
} 