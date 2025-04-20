import { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
// Import only what we need from pose-detection
import { createDetector, SupportedModels, Keypoint, Pose, MoveNetModelConfig } from '@tensorflow-models/pose-detection';
// Import backends
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-webgpu';

interface PoseRecord {
  timestamp: number;
  keypoints: Keypoint[];
}

export function PoseTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<any>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const detectionLoopRef = useRef<number>();
  const [currentPose, setCurrentPose] = useState<Pose | null>(null);
  const [poseHistory, setPoseHistory] = useState<PoseRecord[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<PoseRecord | null>(null);
  const lastRecordTimeRef = useRef<number>(0);
  const [recordingInterval, setRecordingInterval] = useState<number>(5000); // 5 seconds default

  useEffect(() => {
    async function initializePoseDetection() {
      try {
        setIsLoading(true);
        
        // Initialize TensorFlow.js
        await tf.ready();
        
        // Try to use WebGL backend
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
        
        const detector = await createDetector(SupportedModels.MoveNet, modelConfig);
        setDetector(detector);
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
      // Cleanup TensorFlow resources
      tf.disposeVariables();
    };
  }, []);

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

      isDetecting = true;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
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

        // Detect poses
        const poses = await detector.estimatePoses(video, {
          flipHorizontal: false
        });

        if (poses.length > 0) {
          const pose = poses[0]; // Get the first detected pose
          setCurrentPose(pose);

          // Record pose based on recording interval
          const now = Date.now();
          if (now - lastRecordTimeRef.current >= recordingInterval) {
            setPoseHistory(prev => [...prev, {
              timestamp: now,
              keypoints: pose.keypoints
            }]);
            lastRecordTimeRef.current = now;
          }

          // Draw the poses
          pose.keypoints.forEach((keypoint: Keypoint) => {
            if (keypoint.score && keypoint.score > 0.3) {
              ctx.beginPath();
              ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = 'red';
              ctx.fill();
            }
          });

          // Draw connections between keypoints
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
  }, [detector, isWebcamActive, recordingInterval]);

  const selectPosition = useCallback((record: PoseRecord) => {
    setSelectedPosition(record);
    setCurrentPose({ keypoints: record.keypoints } as Pose);
  }, []);

  const clearHistory = useCallback(() => {
    setPoseHistory([]);
    setSelectedPosition(null);
    lastRecordTimeRef.current = 0;
  }, []);

  // Function to format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
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
        >
          {isWebcamActive ? 'Turn Off Camera' : 'Turn On Camera'}
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
        <div className="camera-container">
          <video
            ref={videoRef}
            playsInline
            style={{ display: 'none' }}
          />
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              maxHeight: '60vh',
              backgroundColor: '#000'
            }}
          />
        </div>
        <div className="tracking-panels">
          <div className="pose-details">
            <h3>Current Pose Details</h3>
            {currentPose && renderPoseDetails(currentPose.keypoints)}
            {!currentPose && !isWebcamActive && (
              <div className="no-data-message">
                No pose data available. Start camera or select a recorded position.
              </div>
            )}
          </div>
          <div className="pose-history-panel">
            <h3>Recorded Positions ({poseHistory.length})</h3>
            <div className="pose-history">
              {poseHistory.map((record, index) => (
                <button
                  key={index}
                  className={`history-item ${selectedPosition === record ? 'selected' : ''}`}
                  onClick={() => selectPosition(record)}
                >
                  <span className="history-time">{formatTime(record.timestamp)}</span>
                  <span className="history-count">Position {index + 1}</span>
                </button>
              ))}
              {poseHistory.length === 0 && (
                <div className="no-data-message">
                  No positions recorded yet.
                </div>
              )}
            </div>
          </div>
          {selectedPosition && (
            <div className="selected-position-details">
              <h3>Selected Position Details</h3>
              <div className="selected-position-time">
                Recorded at: {formatTime(selectedPosition.timestamp)}
              </div>
              {renderPoseDetails(selectedPosition.keypoints)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 