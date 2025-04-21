import { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
// Import only what we need from pose-detection
import { createDetector, SupportedModels, Keypoint, Pose, MoveNetModelConfig } from '@tensorflow-models/pose-detection';
// Import backends
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-webgpu';
import { usePositions } from '../hooks/usePositions';
import { ViewerPosition } from '../types/positions';
import { LimbId } from '../types/viewer';

interface PoseRecord {
  timestamp: number;
  keypoints: Keypoint[];
}

// Add mapping for keypoint pairs to limb rotations
const KEYPOINT_TO_LIMB_MAPPING = {
  upperArmLeft: ['left_shoulder', 'left_elbow'],
  lowerArmLeft: ['left_elbow', 'left_wrist'],
  upperArmRight: ['right_shoulder', 'right_elbow'],
  lowerArmRight: ['right_elbow', 'right_wrist'],
  upperLegLeft: ['left_hip', 'left_knee'],
  lowerLegLeft: ['left_knee', 'left_ankle'],
  upperLegRight: ['right_hip', 'right_knee'],
  lowerLegRight: ['right_knee', 'right_ankle'],
  upperTorso: ['left_shoulder', 'right_shoulder'],
  lowerTorso: ['left_hip', 'right_hip']
} as const;

function calculateRotationFromKeypoints(point1: Keypoint, point2: Keypoint): { x: number; y: number; z: number } {
  if (!point1?.score || !point2?.score || point1.score < 0.3 || point2.score < 0.3) {
    return { x: 0, y: 0, z: 0 };
  }

  // Calculate angles based on the vector between points
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  
  // Calculate rotation around Z axis (in the camera plane)
  const zRotation = Math.atan2(dy, dx);
  
  // For now, we'll use simplified rotations
  // In a more advanced version, we could use the depth estimation
  return {
    x: 0, // We don't have depth information yet
    y: 0, // We don't have side view yet
    z: zRotation
  };
}

export function PoseTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<any>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const detectionLoopRef = useRef<number>();
  
  const [, setCurrentPose] = useState<Pose | null>(null);
  const [poseHistory, setPoseHistory] = useState<PoseRecord[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<PoseRecord | null>(null);
  const lastRecordTimeRef = useRef<number>(0);
  const [recordingInterval, setRecordingInterval] = useState<number>(5000);
  const { addViewerPosition, addPosePosition, posePositions, deletePosition } = usePositions();
  const [translatedPosition, setTranslatedPosition] = useState<ViewerPosition | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Initialize pose history from stored positions
  useEffect(() => {
    if (posePositions.length > 0) {
      setPoseHistory(posePositions.map(pose => ({
        timestamp: pose.timestamp,
        keypoints: pose.keypoints
      })));
    }
  }, [posePositions]);

  // Initialize detector separately from camera
  useEffect(() => {
    async function initializePoseDetection() {
      if (detector) return; // Skip if already initialized
      
      try {
        setIsLoading(true);
        await tf.ready();
        
        try {
          await tf.setBackend('webgl');
        } catch (err) {
          console.warn('WebGL backend failed, trying WebGPU:', err);
          try {
            await tf.setBackend('webgpu');
          } catch (err2) {
            console.error('Both WebGL and WebGPU failed:', err2);
            throw new Error('No suitable backend available');
          }
        }
        
        const modelConfig: MoveNetModelConfig = {
          modelType: 'SinglePose.Lightning',
          enableSmoothing: true,
          minPoseScore: 0.25
        };
        
        const newDetector = await createDetector(SupportedModels.MoveNet, modelConfig);
        setDetector(newDetector);
        setError(null);
      } catch (err) {
        setError('Failed to initialize pose detection. Please make sure your browser supports WebGL or WebGPU.');
        console.error('Error initializing pose detection:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initializePoseDetection();

    return () => {
      tf.disposeVariables();
    };
  }, [detector]);

  const startWebcam = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' // Use front camera
        }
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play(); // Ensure video starts playing
      setIsWebcamActive(true);
      setError(null);
    } catch (error) {
      setError('Error accessing webcam. Please make sure you have granted camera permissions.');
      console.error('Error accessing webcam:', error);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = undefined;
    }
    setIsWebcamActive(false);
  }, []);

  const toggleCamera = useCallback(() => {
    if (isWebcamActive) {
      stopWebcam();
    } else {
      startWebcam();
    }
  }, [isWebcamActive, startWebcam, stopWebcam]);

  const handleIntervalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 1) {
      setRecordingInterval(value * 1000); // Convert seconds to milliseconds
    }
  };

  useEffect(() => {
    let isDetecting = false;
    
    async function detectPose() {
      if (!detector || !videoRef.current || !canvasRef.current || !isWebcamActive || isDetecting) {
        detectionLoopRef.current = requestAnimationFrame(detectPose);
        return;
      }

      try {
        isDetecting = true;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Make sure the video is ready and has valid dimensions
        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
          detectionLoopRef.current = requestAnimationFrame(detectPose);
          return;
        }

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame first
        ctx.drawImage(video, 0, 0);

        const poses = await detector.estimatePoses(video, {
          flipHorizontal: false
        });

        if (poses.length > 0) {
          const pose = poses[0];
          setCurrentPose(pose);

          // Record pose based on recording interval
          const now = Date.now();
          if (now - lastRecordTimeRef.current >= recordingInterval) {
            const newPose = {
              timestamp: now,
              keypoints: pose.keypoints
            };
            
            // Add to local history
            setPoseHistory(prev => [newPose, ...prev]);
            
            // Add to storage
            addPosePosition(pose.keypoints);
            
            // Update last record time
            lastRecordTimeRef.current = now;
          }

          // Draw keypoints and connections
          pose.keypoints.forEach((keypoint: Keypoint) => {
            if (keypoint.score && keypoint.score > 0.3) {
              ctx.beginPath();
              ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = 'red';
              ctx.fill();
            }
          });

          // Draw connections
          const connections = [
            ['nose', 'left_eye'], ['nose', 'right_eye'],
            ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
            ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'],
            ['right_shoulder', 'right_elbow'], ['left_elbow', 'left_wrist'],
            ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
            ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'],
            ['left_hip', 'left_knee'], ['right_hip', 'right_knee'],
            ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']
          ] as const;

          connections.forEach(([from, to]) => {
            const fromPoint = pose.keypoints.find((kp: Keypoint) => kp.name === from);
            const toPoint = pose.keypoints.find((kp: Keypoint) => kp.name === to);

            if (fromPoint && toPoint && fromPoint.score && toPoint.score &&
                fromPoint.score > 0.3 && toPoint.score > 0.3) {
              ctx.beginPath();
              ctx.moveTo(fromPoint.x, fromPoint.y);
              ctx.lineTo(toPoint.x, toPoint.y);
              ctx.strokeStyle = 'blue';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });
        }
      } catch (err) {
        console.error('Error in pose detection:', err);
      } finally {
        isDetecting = false;
        detectionLoopRef.current = requestAnimationFrame(detectPose);
      }
    }

    if (detector && isWebcamActive) {
      detectPose();
    }

    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }
    };
  }, [detector, isWebcamActive, recordingInterval, addPosePosition]);

  const selectPosition = useCallback((record: PoseRecord) => {
    setSelectedPosition(record);
    setCurrentPose({ keypoints: record.keypoints } as Pose);
  }, []);

  const clearHistory = useCallback(() => {
    // Clear local state
    setPoseHistory([]);
    setSelectedPosition(null);
    lastRecordTimeRef.current = 0;

    // Clear all pose positions from storage
    posePositions.forEach(pose => {
      deletePosition(pose.id, 'pose');
    });
  }, [posePositions, deletePosition]);

  // Function to format timestamp
  const formatTime = (timestamp: string | number) => {
    // Handle both string and number timestamps
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(Number(timestamp));
    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp:', timestamp);
      return 'Invalid Date';
    }
    return date.toLocaleTimeString();
  };

  const renderPoseDetails = (keypoints: Keypoint[]) => (
    <div className="keypoints-grid">
      {keypoints.map((keypoint, index) => (
        keypoint.score && keypoint.score > 0.3 && (
          <div key={index} className="keypoint-item">
            <span className="keypoint-name">{keypoint.name}</span>
            <span className="keypoint-score">{Math.round(keypoint.score * 100)}%</span>
          </div>
        )
      ))}
    </div>
  );

  const translateToViewerPosition = (record: PoseRecord) => {
    setIsTranslating(true);
    const limbs: ViewerPosition['limbs'] = {} as ViewerPosition['limbs'];
    
    // Process each limb mapping
    Object.entries(KEYPOINT_TO_LIMB_MAPPING).forEach(([limbId, [startPoint, endPoint]]) => {
      const point1 = record.keypoints.find(kp => kp.name === startPoint);
      const point2 = record.keypoints.find(kp => kp.name === endPoint);
      
      if (point1?.score && point2?.score && point1.score > 0.3 && point2.score > 0.3) {
        const rotation = calculateRotationFromKeypoints(point1, point2);
        limbs[limbId as LimbId] = {
          rotation,
          height: 0.15 // Use the default height
        };
      }
    });

    // Create and add the new position
    const newPosition = addViewerPosition(limbs, 0.15);
    setTranslatedPosition(newPosition);
    
    // Add animation effect
    setTimeout(() => {
      setIsTranslating(false);
    }, 1000);
    
    return newPosition;
  };

  const renderPoseHistory = () => (
    <div className="pose-history">
      {[...poseHistory].sort((a, b) => b.timestamp - a.timestamp).map((record, index) => (
        <div key={index} className={`history-item ${selectedPosition === record ? 'selected' : ''}`}>
          <button
            onClick={() => selectPosition(record)}
            className="history-select-btn"
          >
            <span className="history-time">{formatTime(record.timestamp)}</span>
            <span className="history-count">Position {index + 1}</span>
          </button>
          <button
            onClick={() => translateToViewerPosition(record)}
            className="translate-btn"
          >
            Translate to Viewer Position
          </button>
        </div>
      ))}
      {poseHistory.length === 0 && (
        <div className="no-data-message">
          No positions recorded yet.
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="pose-tracker">
        <h2>Pose Tracker</h2>
        <div className="error-message">
          {error}
        </div>
        <button onClick={toggleCamera} className="camera-toggle">
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pose-tracker">
        <h2>Pose Tracker</h2>
        <div className="loading-message">
          Initializing pose detection...
        </div>
      </div>
    );
  }

  return (
    <div className="pose-tracker">
      <h2>Pose Tracker</h2>
      <div className="camera-controls">
        <button 
          onClick={toggleCamera}
          className={`camera-toggle ${isWebcamActive ? 'active' : ''}`}
          disabled={isLoading}
        >
          {isWebcamActive ? 'Stop Camera' : 'Start Camera'}
        </button>
        <div className="interval-control">
          <label htmlFor="interval">Record every:</label>
          <input
            id="interval"
            type="number"
            min="1"
            className="interval-input"
            value={recordingInterval / 1000}
            onChange={handleIntervalChange}
          />
          <span>seconds</span>
        </div>
        {poseHistory.length > 0 && (
          <button 
            onClick={clearHistory}
            className="clear-history"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="tracking-container">
        {/* Camera container with loading state */}
        <div className="camera-container">
          {isLoading ? (
            <div className="loading-message">Initializing camera...</div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                width="640"
                height="480"
                style={{ display: 'none' }}
              />
              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  backgroundColor: '#000'
                }}
              />
            </>
          )}
        </div>

        {/* Tracking panels that should render immediately */}
        <div className="tracking-panels">
          <div className="pose-history-panel">
            <h3>Recorded Positions ({poseHistory.length})</h3>
            {renderPoseHistory()}
          </div>
          {selectedPosition && (
            <div className="selected-position-details">
              <h3>Selected Position Details</h3>
              <div className="selected-position-time">
                Recorded at: {formatTime(selectedPosition.timestamp.toString())}
              </div>
              {renderPoseDetails(selectedPosition.keypoints)}
            </div>
          )}
        </div>
      </div>
      
      {/* Translation details panel */}
      {translatedPosition && (
        <div className={`translation-panel ${isTranslating ? 'translating' : ''}`}>
          <h3>Last Translated Position</h3>
          <div className="translation-details">
            <div className="translation-meta">
              <span>Name: {translatedPosition.name}</span>
              <span>Time: {formatTime(translatedPosition.timestamp)}</span>
              <span>Height: {translatedPosition.height.toFixed(2)} units</span>
            </div>
            <div className="translation-limbs">
              <h4>Limb Rotations</h4>
              {Object.entries(translatedPosition.limbs).map(([limbId, data]) => (
                <div key={limbId} className="limb-rotation">
                  <span className="limb-name">{limbId}</span>
                  <span className="rotation-values">
                    X: {data.rotation.x.toFixed(2)},
                    Y: {data.rotation.y.toFixed(2)},
                    Z: {data.rotation.z.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 