import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import React from "react";
import * as THREE from "three";
import "../types/global.d";
import { JudoTechnique } from "../types/techniques";
import { Tatami } from "./Tatami";
import { Humanoid } from "./Humanoid";
import {
  AxisControlData,
  DEFAULT_POSITIONS,
  LIMB_CONSTRAINTS,
  LimbId,
  ModelPosition,
  RotationAxis,
  CustomSceneProps,
  StoredLimbPositions,
} from "../types/viewer";
import { ScreenshotButton } from './ScreenshotButton';
import { ViewerPosition } from '../types/positions';
import { usePositions } from '../hooks/usePositions';
import { TabPanel } from './TabPanel';
import { Positions } from './Positions';
import './Scene.css';
import { DEFAULT_TECHNIQUES, techniques } from '../data/techniques';
import { toast } from 'react-hot-toast';
import { AxisControls } from "./AxisControls";

// Add new context for active limb
export const ActiveLimbContext = React.createContext<{
  activeLimbId: LimbId | null;
  setActiveLimbId: (id: LimbId | null) => void;
}>({
  activeLimbId: null,
  setActiveLimbId: () => { },
});

// Add new context for axis controls
export const AxisControlsContext = React.createContext<{
  controls: AxisControlData[];
  setControls: (controls: AxisControlData[]) => void;
}>({
  controls: [],
  setControls: () => { },
});





// Camera control buttons UI component

// Camera controls that live inside the Canvas
function CameraController() {
  const { camera } = useThree();
  const [, forceRender] = React.useState({});

  const handleRotate = React.useCallback(
    (axis: "x" | "y" | "z", angle: number) => {
      const position = camera.position.clone();
      const target = new THREE.Vector3(0, 1.5, 0);
      const matrix = new THREE.Matrix4();

      switch (axis) {
        case "x":
          matrix.makeRotationX(angle);
          break;
        case "y":
          matrix.makeRotationY(angle);
          break;
        case "z":
          matrix.makeRotationZ(angle);
          break;
      }

      position.sub(target);
      position.applyMatrix4(matrix);
      position.add(target);

      camera.position.copy(position);
      camera.lookAt(target);
      forceRender({}); // Force a re-render to update the view
    },
    [camera]
  );

  const handleReset = React.useCallback(() => {
    camera.position.set(0, 2, 5); // Slightly higher and further back for better view
    camera.lookAt(0, 1.5, 0);
    forceRender({});
  }, [camera]);

  // Expose the handlers to the buttons outside Canvas
  React.useEffect(() => {
    // @ts-ignore
    window.__cameraRotate = handleRotate;
    // @ts-ignore
    window.__cameraReset = handleReset;
  }, [handleRotate, handleReset]);

  return null;
}

// Position control buttons UI component

// Model position controller that lives inside the Canvas
function ModelPositionController({
  selectedTechnique,
  children,
}: {
  selectedTechnique?: JudoTechnique;
  children: React.ReactNode;
}) {
  // Load saved position or use default
  const [modelPosition, setModelPosition] = React.useState<ModelPosition>(() => {
    const savedPosition = localStorage.getItem("humanoidPosition");
    return savedPosition ? JSON.parse(savedPosition) : { y: 0 };
  });

  const handleMove = React.useCallback((_axis: "y", amount: number) => {
    setModelPosition((prev: ModelPosition) => {
      const newY = prev.y + amount;
      // Allow model to move all the way down to the tatami (Y=0)
      const position = { y: Math.max(0, newY) };
      // Save position to localStorage
      localStorage.setItem("humanoidPosition", JSON.stringify(position));
      return position;
    });
  }, []);

  // Expose the handler to the buttons outside Canvas
  React.useEffect(() => {
    // @ts-ignore
    window.__modelMove = handleMove;
    // @ts-ignore
    window.__modelReset = () => {
      setModelPosition({ y: 0 });
      localStorage.setItem("humanoidPosition", JSON.stringify({ y: 0 }));
    };
  }, [handleMove]);

  // Handle technique selection
  React.useEffect(() => {
    if (selectedTechnique) {
      console.log('Applying technique:', selectedTechnique.id);
      // Reset limbs to default position first
      Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
        const savedPositions = localStorage.getItem("limbPositions");
        const positions = savedPositions ? (JSON.parse(savedPositions) as StoredLimbPositions) : {};
        positions[limbId] = {
          rotation: {
            x: defaultState.rotation.x,
            y: defaultState.rotation.y,
            z: defaultState.rotation.z,
          },
          height: 0
        };
        localStorage.setItem("limbPositions", JSON.stringify(positions));
      });
    }
  }, [selectedTechnique]);

  return (
    <group position={[0, modelPosition.y, 0]}>
      {children}
    </group>
  );
}



// Component to set the scene background color or texture
function SceneBackground({ 
  color, 
  imageUrl 
}: { 
  color?: string | THREE.Color; 
  imageUrl?: string | null;
}) {
  const { scene } = useThree();
  
  useEffect(() => {
    console.log('SceneBackground useEffect triggered, imageUrl:', imageUrl, 'color:', color);
    
    // Cleanup: dispose of previous texture if it exists
    if (scene.background && scene.background instanceof THREE.Texture) {
      console.log('Disposing previous background texture');
      scene.background.dispose();
    }
    
    if (imageUrl) {
      console.log('Loading background image from:', imageUrl);
      const loader = new THREE.TextureLoader();
      // Set crossOrigin to allow loading from same origin
      loader.setCrossOrigin('anonymous');
      loader.load(
        imageUrl,
        (texture) => {
          console.log('Background image loaded successfully', texture);
          // Ensure texture is properly configured
          texture.needsUpdate = true;
          // Set texture format for proper display
          texture.format = THREE.RGBAFormat;
          scene.background = texture;
          console.log('Background texture applied to scene');
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log('Loading progress:', percent + '%');
          }
        },
        (error) => {
          console.error('Error loading background image:', error);
          console.error('Failed URL:', imageUrl);
          console.error('Trying to verify URL accessibility...');
          // Try to verify the URL is accessible
          fetch(imageUrl)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              console.log('URL is accessible, but texture loading failed');
            })
            .catch(fetchError => {
              console.error('URL is not accessible:', fetchError);
            });
          // Fallback to color if image fails to load
          if (color) {
            scene.background = typeof color === 'string' ? new THREE.Color(color) : color;
          }
        }
      );
    } else if (color) {
      scene.background = typeof color === 'string' ? new THREE.Color(color) : color;
    }
    
    // Cleanup function
    return () => {
      if (scene.background && scene.background instanceof THREE.Texture) {
        scene.background.dispose();
      }
    };
  }, [scene, color, imageUrl]);
  
  return null;
}

// Settings tab content component
function SettingsTab({ 
  backgroundColor, 
  backgroundImage,
  onBackgroundColorChange,
  onBackgroundImageChange,
  tatamiPerimeterColor,
  tatamiInteriorColor,
  tatamiBaseColor,
  onTatamiPerimeterColorChange,
  onTatamiInteriorColorChange,
  onTatamiBaseColorChange
}: { 
  backgroundColor: string; 
  backgroundImage: string | null;
  onBackgroundColorChange: (color: string) => void;
  onBackgroundImageChange: (imageUrl: string | null) => void;
  tatamiPerimeterColor: string;
  tatamiInteriorColor: string;
  tatamiBaseColor: string;
  onTatamiPerimeterColorChange: (color: string) => void;
  onTatamiInteriorColorChange: (color: string) => void;
  onTatamiBaseColorChange: (color: string) => void;
}) {
  const [tempColor, setTempColor] = useState(backgroundColor);
  const [tempImageUrl, setTempImageUrl] = useState(backgroundImage || '');
  const [backgroundType, setBackgroundType] = useState<'color' | 'image'>(backgroundImage ? 'image' : 'color');

  const presetColors = [
    { name: 'Light Blue', value: '#e3f2fd' },
    { name: 'White', value: '#ffffff' },
    { name: 'Light Gray', value: '#f0f0f0' },
    { name: 'Off White', value: '#fafafa' },
    { name: 'Sky Blue', value: '#87ceeb' },
    { name: 'Black', value: '#000000' },
  ];

  const [presetImages, setPresetImages] = useState<Array<{ name: string; value: string }>>([
    { name: 'Dojo 1', value: '/assets/images/dojo_1.png' },
  ]);

  // Dynamically discover dojo_* images by checking if they exist
  useEffect(() => {
    const checkImages = async () => {
      const images: Array<{ name: string; value: string }> = [];
      const maxDojoImages = 20; // Check up to 20 dojo images
      
      const checkPromises = [];
      for (let i = 1; i <= maxDojoImages; i++) {
        const imagePath = `/assets/images/dojo_${i}.png`;
        checkPromises.push(
          new Promise<{ index: number; path: string } | null>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ index: i, path: imagePath });
            img.onerror = () => resolve(null);
            img.src = imagePath;
          })
        );
      }
      
      const results = await Promise.all(checkPromises);
      results.forEach(result => {
        if (result) {
          images.push({
            name: `Dojo ${result.index}`,
            value: result.path
          });
        }
      });
      
      setPresetImages(images);
    };
    
    checkImages();
  }, []);

  const handleColorChange = (color: string) => {
    setTempColor(color);
    onBackgroundColorChange(color);
    localStorage.setItem('sceneBackgroundColor', color);
    if (backgroundType === 'color') {
      onBackgroundImageChange(null);
      localStorage.removeItem('sceneBackgroundImage');
    }
  };

  const handleImageChange = (imageUrl: string | null) => {
    console.log('handleImageChange called with:', imageUrl);
    onBackgroundImageChange(imageUrl);
    if (imageUrl) {
      localStorage.setItem('sceneBackgroundImage', imageUrl);
      localStorage.removeItem('sceneBackgroundColor');
    } else {
      localStorage.removeItem('sceneBackgroundImage');
    }
  };

  const handleTypeChange = (type: 'color' | 'image') => {
    setBackgroundType(type);
    if (type === 'color') {
      handleImageChange(null);
      handleColorChange(backgroundColor);
    } else {
      onBackgroundColorChange('#e3f2fd'); // Reset to default when switching to image
    }
  };

  return (
    <div
      style={{
        padding: "15px",
        color: "#333",
        height: "100%",
        overflowY: "auto"
      }}
    >
          <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>Settings</h3>
          <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>Background Settings</h4>
          
          {/* Background type selector */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
              Background Type:
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleTypeChange('color')}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor: backgroundType === 'color' ? "#4CAF50" : "#555",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Color
              </button>
              <button
                onClick={() => handleTypeChange('image')}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor: backgroundType === 'image' ? "#4CAF50" : "#555",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Image
              </button>
            </div>
          </div>

          {backgroundType === 'color' ? (
            <>
              {/* Preset colors */}
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
                  Preset Colors:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {presetColors.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleColorChange(preset.value)}
                    style={{
                      padding: "8px",
                      backgroundColor: preset.value,
                      border: backgroundColor === preset.value ? "3px solid #4CAF50" : "1px solid #ccc",
                      borderRadius: "4px",
                      cursor: "pointer",
                      color: preset.value === '#000000' ? 'white' : 'black',
                      fontSize: "12px"
                    }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom color picker */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
                  Custom Color:
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="color"
                    value={tempColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    style={{
                      width: "60px",
                      height: "40px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  />
                  <input
                    type="text"
                    value={tempColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setTempColor(color);
                      if (/^#[0-9A-F]{6}$/i.test(color)) {
                        handleColorChange(color);
                      }
                    }}
                    placeholder="#e3f2fd"
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Preset images dropdown */}
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#333" }}>
                  Select Background Image:
                </label>
                <select
                  value={backgroundImage || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      handleImageChange(value);
                      setTempImageUrl(value);
                    } else {
                      handleImageChange(null);
                      setTempImageUrl('');
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    backgroundColor: "white",
                    color: "#333",
                    cursor: "pointer"
                  }}
                >
                  <option value="">-- Select an image --</option>
                  {presetImages.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                
                {/* Image preview */}
                {backgroundImage && (
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold", color: "#333" }}>
                      Preview:
                    </label>
                    <div style={{
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      padding: "5px",
                      backgroundColor: "#f5f5f5",
                      display: "inline-block"
                    }}>
                      <img
                        src={backgroundImage}
                        alt="Background preview"
                        style={{
                          maxWidth: "200px",
                          maxHeight: "150px",
                          width: "auto",
                          height: "auto",
                          borderRadius: "4px",
                          display: "block"
                        }}
                        onError={(e) => {
                          console.error('Failed to load preview image:', backgroundImage);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Remove image button */}
              {backgroundImage && (
                <div>
                  <button
                    onClick={() => {
                      handleImageChange(null);
                      setTempImageUrl('');
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      marginTop: "8px"
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Tatami Color Settings */}
          <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #eee" }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>Tatami Colors</h4>
            
            {/* Perimeter Color */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
                Perimeter Color:
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="color"
                  value={tatamiPerimeterColor}
                  onChange={(e) => {
                    onTatamiPerimeterColorChange(e.target.value);
                    localStorage.setItem('tatamiPerimeterColor', e.target.value);
                  }}
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                />
                <input
                  type="text"
                  value={tatamiPerimeterColor}
                  onChange={(e) => {
                    const color = e.target.value;
                    if (/^#[0-9A-F]{6}$/i.test(color)) {
                      onTatamiPerimeterColorChange(color);
                      localStorage.setItem('tatamiPerimeterColor', color);
                    }
                  }}
                  placeholder="#006400"
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>

            {/* Interior Color */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
                Interior Color:
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="color"
                  value={tatamiInteriorColor}
                  onChange={(e) => {
                    onTatamiInteriorColorChange(e.target.value);
                    localStorage.setItem('tatamiInteriorColor', e.target.value);
                  }}
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                />
                <input
                  type="text"
                  value={tatamiInteriorColor}
                  onChange={(e) => {
                    const color = e.target.value;
                    if (/^#[0-9A-F]{6}$/i.test(color)) {
                      onTatamiInteriorColorChange(color);
                      localStorage.setItem('tatamiInteriorColor', color);
                    }
                  }}
                  placeholder="#8B0000"
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>

            {/* Base Color */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
                Base Color:
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="color"
                  value={tatamiBaseColor}
                  onChange={(e) => {
                    onTatamiBaseColorChange(e.target.value);
                    localStorage.setItem('tatamiBaseColor', e.target.value);
                  }}
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                />
                <input
                  type="text"
                  value={tatamiBaseColor}
                  onChange={(e) => {
                    const color = e.target.value;
                    if (/^#[0-9A-F]{6}$/i.test(color)) {
                      onTatamiBaseColorChange(color);
                      localStorage.setItem('tatamiBaseColor', color);
                    }
                  }}
                  placeholder="#2b2b2b"
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>
          </div>
    </div>
  );
}

// Add ScreenshotTool component at the top level
function ScreenshotTool() {
  const { gl, scene, camera } = useThree();

  const captureScreenshot = useCallback(() => {
    // Render the scene
    gl.render(scene, camera);

    // Get the canvas element
    const canvas = gl.domElement;

    try {
      // Convert the canvas to a data URL
      const dataUrl = canvas.toDataURL('image/png');

      // Create a timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `judo-scene-${timestamp}.png`;

      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Screenshot saved successfully!');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast.error('Failed to capture screenshot');
    }
  }, [gl, scene, camera]);

  // Expose the capture function to the window
  useEffect(() => {
    // @ts-ignore
    window.__captureScreenshot = captureScreenshot;
  }, [captureScreenshot]);

  return null;
}

export function Scene({ children }: CustomSceneProps) {
  const [activeLimbId, setActiveLimbId] = useState<LimbId | null>(null);
  const [axisControls, setAxisControls] = useState<AxisControlData[]>([]);
  const [currentTechnique, setCurrentTechnique] = useState<JudoTechnique | undefined>(undefined);
  const [activeTechniqueId, setActiveTechniqueId] = useState<string | null>(null);
  const [currentHeight, setCurrentHeight] = useState(() => {
    const savedPosition = localStorage.getItem("humanoidPosition");
    return savedPosition ? JSON.parse(savedPosition).y : 0;
  });
  const [backgroundColor, setBackgroundColor] = useState(() => {
    const savedColor = localStorage.getItem("sceneBackgroundColor");
    return savedColor || "#e3f2fd";
  });
  const [backgroundImage, setBackgroundImage] = useState<string | null>(() => {
    const saved = localStorage.getItem("sceneBackgroundImage");
    console.log('Initial backgroundImage from localStorage:', saved);
    return saved || null;
  });

  // Debug: log when backgroundImage changes
  useEffect(() => {
    console.log('backgroundImage state changed to:', backgroundImage);
  }, [backgroundImage]);

  const [tatamiPerimeterColor, setTatamiPerimeterColor] = useState(() => {
    return localStorage.getItem("tatamiPerimeterColor") || '#006400';
  });

  const [tatamiInteriorColor, setTatamiInteriorColor] = useState(() => {
    return localStorage.getItem("tatamiInteriorColor") || '#8B0000';
  });

  const [tatamiBaseColor, setTatamiBaseColor] = useState(() => {
    return localStorage.getItem("tatamiBaseColor") || '#2b2b2b';
  });

  // Create refs for all limbs
  const upperArmLeftRef = useRef<THREE.Group>(null);
  const lowerArmLeftRef = useRef<THREE.Group>(null);
  const upperArmRightRef = useRef<THREE.Group>(null);
  const lowerArmRightRef = useRef<THREE.Group>(null);
  const upperLegLeftRef = useRef<THREE.Group>(null);
  const lowerLegLeftRef = useRef<THREE.Group>(null);
  const upperLegRightRef = useRef<THREE.Group>(null);
  const lowerLegRightRef = useRef<THREE.Group>(null);
  const upperTorsoRef = useRef<THREE.Group>(null);
  const lowerTorsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const handLeftRef = useRef<THREE.Group>(null);
  const handRightRef = useRef<THREE.Group>(null);

  // Store all refs in the limbsRef object
  const limbsRef = useRef<{ [key in LimbId]?: React.RefObject<THREE.Group> }>({
    upperArmLeft: upperArmLeftRef,
    lowerArmLeft: lowerArmLeftRef,
    upperArmRight: upperArmRightRef,
    lowerArmRight: lowerArmRightRef,
    upperLegLeft: upperLegLeftRef,
    lowerLegLeft: lowerLegLeftRef,
    upperLegRight: upperLegRightRef,
    lowerLegRight: lowerLegRightRef,
    upperTorso: upperTorsoRef,
    lowerTorso: lowerTorsoRef,
    head: headRef,
    handLeft: handLeftRef,
    handRight: handRightRef,
  });

  const [, setSavedTechniques] = useState<any[]>([]);
  const { addViewerPosition } = usePositions();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadTechniques = () => {
      const existingTechniques = localStorage.getItem('techniques');
      if (existingTechniques) {
        try {
          const parsed = JSON.parse(existingTechniques);
          setSavedTechniques(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.error('Error loading techniques:', error);
          setSavedTechniques([]);
        }
      } else {
        setSavedTechniques([]);
      }
    };
    loadTechniques();
  }, []);

  const handleRotate = React.useCallback((axis: "x" | "y" | "z", angle: number) => {
    // @ts-ignore
    window.__cameraRotate?.(axis, angle);
  }, []);

  const handleMove = React.useCallback((axis: "y", amount: number) => {
    // @ts-ignore
    window.__modelMove?.(axis, amount);
    setCurrentHeight((prev: number) => {
      const newHeight = Math.max(0, prev + amount);
      // Update localStorage immediately
      localStorage.setItem("humanoidPosition", JSON.stringify({ y: newHeight }));
      // Force update the model position
      // @ts-ignore
      window.__modelMove?.("y", newHeight - prev);
      return newHeight;
    });
  }, []);

  // Add a reset height function
  const handleResetHeight = React.useCallback(() => {
    setCurrentHeight(0);
    localStorage.setItem("humanoidPosition", JSON.stringify({ y: 0 }));
    // @ts-ignore
    window.__modelMove?.("y", -currentHeight);
  }, [currentHeight]);

  const handlePositionSelect = (position: ViewerPosition) => {
    console.log('Selected position:', position);

    // First reset to default positions
    Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
      const limbRef = limbsRef.current[limbId as LimbId];
      if (limbRef?.current) {
        limbRef.current.rotation.set(
          defaultState.rotation.x,
          defaultState.rotation.y,
          defaultState.rotation.z
        );
      }
    });

    // Then apply the selected position after a short delay
    setTimeout(() => {
      // Apply the position to the model
      Object.entries(position.limbs).forEach(([id, data]: [string, { rotation: { x: number; y: number; z: number }; height: number }]) => {
        const limbRef = limbsRef.current[id as LimbId];
        if (limbRef?.current) {
          const rotation = data.rotation;
          limbRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
        }
      });

      // Save to localStorage
      const positions = {} as StoredLimbPositions;
      Object.entries(position.limbs).forEach(([id, data]: [string, { rotation: { x: number; y: number; z: number }; height: number }]) => {
        positions[id as LimbId] = {
          rotation: data.rotation,
          height: data.height || 0
        };
      });
      localStorage.setItem("limbPositions", JSON.stringify(positions));

      // Set the height directly
      if (position.height !== undefined) {
        localStorage.setItem("humanoidPosition", JSON.stringify({ y: position.height }));
        setCurrentHeight(position.height);
        // @ts-ignore
        window.__modelMove?.("y", position.height - currentHeight);
      } else {
        localStorage.setItem("humanoidPosition", JSON.stringify({ y: 0 }));
        setCurrentHeight(0);
        // @ts-ignore
        window.__modelMove?.("y", -currentHeight);
      }

      // Update axis controls if a limb is active
      if (activeLimbId && position.limbs[activeLimbId]) {
        const rotation = position.limbs[activeLimbId].rotation;
        const axes: RotationAxis[] = ["x", "y", "z"];
        const newControls: AxisControlData[] = axes.map(axis => ({
          limbId: activeLimbId,
          axis,
          value: rotation[axis],
          min: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][0],
          max: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][1],
          onChange: value => {
            const limbRef = limbsRef.current[activeLimbId];
            if (limbRef?.current) {
              const constraints = LIMB_CONSTRAINTS[activeLimbId];
              const clampedValue = Math.max(
                constraints.rotation[axis][0],
                Math.min(constraints.rotation[axis][1], value)
              );
              limbRef.current.rotation[axis] = clampedValue;

              // Save to localStorage
              const savedPositions = localStorage.getItem("limbPositions");
              const positions = savedPositions ? (JSON.parse(savedPositions) as StoredLimbPositions) : {};
              if (!positions[activeLimbId]) {
                positions[activeLimbId] = { rotation: { x: 0, y: 0, z: 0 }, height: 0 };
              }
              positions[activeLimbId].rotation[axis] = clampedValue;
              localStorage.setItem("limbPositions", JSON.stringify(positions));
            }
          },
        }));
        setAxisControls(newControls);
      }
    }, 100); // Small delay to ensure reset is visible

    // Stop any ongoing technique animation
    setCurrentTechnique(undefined);
  };

  const handleCapture = () => {
    // Initialize with default positions
    const currentPositions: ViewerPosition['limbs'] = {
      upperArmLeft: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      lowerArmLeft: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      upperArmRight: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      lowerArmRight: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      handLeft: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      handRight: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      upperLegLeft: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      lowerLegLeft: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      upperLegRight: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      lowerLegRight: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      upperTorso: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      lowerTorso: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight },
      head: { rotation: { x: 0, y: 0, z: 0 }, height: currentHeight }
    };

    // Update with current positions
    Object.entries(limbsRef.current).forEach(([id, ref]) => {
      if (ref?.current) {
        currentPositions[id as LimbId] = {
          rotation: {
            x: ref.current.rotation.x,
            y: ref.current.rotation.y,
            z: ref.current.rotation.z
          },
          height: currentHeight
        };
      }
    });

    const newPosition = addViewerPosition(currentPositions, currentHeight);
    setCurrentHeight(newPosition.height);
    setRefreshTrigger(prev => prev + 1); // Force refresh of positions list
  };

  const handleExportPositions = () => {
    const savedPositions = localStorage.getItem("positionLibrary");
    if (savedPositions) {
      try {
        const positions = JSON.parse(savedPositions);
        const dataStr = JSON.stringify(positions, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `judo-positions-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } catch (error) {
        console.error('Error exporting positions:', error);
      }
    } else {
      console.log('No positions found to export');
    }
  };

  return (
    <ActiveLimbContext.Provider value={{ activeLimbId, setActiveLimbId }}>
      <AxisControlsContext.Provider value={{ controls: axisControls, setControls: setAxisControls }}>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
            <Suspense fallback={null}>
              <SceneBackground color={backgroundColor} imageUrl={backgroundImage} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />

              <Tatami 
                size={8} 
                tilesPerSide={8}
                perimeterColor={tatamiPerimeterColor}
                interiorColor={tatamiInteriorColor}
                baseColor={tatamiBaseColor}
              />
              <ModelPositionController selectedTechnique={currentTechnique}>
                <Humanoid
                  upperArmLeftRef={upperArmLeftRef}
                  lowerArmLeftRef={lowerArmLeftRef}
                  upperArmRightRef={upperArmRightRef}
                  lowerArmRightRef={lowerArmRightRef}
                  upperLegLeftRef={upperLegLeftRef}
                  lowerLegLeftRef={lowerLegLeftRef}
                  upperLegRightRef={upperLegRightRef}
                  lowerLegRightRef={lowerLegRightRef}
                  upperTorsoRef={upperTorsoRef}
                  lowerTorsoRef={lowerTorsoRef}
                  headRef={headRef}
                  handLeftRef={handLeftRef}
                  handRightRef={handRightRef}
                  selectedTechnique={currentTechnique}
                />
              </ModelPositionController>

              {children}

              <OrbitControls minDistance={2} maxDistance={8} target={[0, 1.5, 0]} enableDamping dampingFactor={0.05} />
              <CameraController />
              <ScreenshotTool />
            </Suspense>
          </Canvas>
          <AxisControls />

          {/* Right side controls */}
          <div className="right-controls">
            {/* Camera controls */}
            <div className="camera-controls">
              <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                <button onClick={() => handleRotate("x", Math.PI / 4)}>Rotate X +45°</button>
                <button onClick={() => handleRotate("x", -Math.PI / 4)}>Rotate X -45°</button>
              </div>
              <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                <button onClick={() => handleRotate("y", Math.PI / 4)}>Rotate Y +45°</button>
                <button onClick={() => handleRotate("y", -Math.PI / 4)}>Rotate Y -45°</button>
              </div>
              <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                <button onClick={() => handleRotate("z", Math.PI / 4)}>Rotate Z +45°</button>
                <button onClick={() => handleRotate("z", -Math.PI / 4)}>Rotate Z -45°</button>
              </div>
              <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                <button
                  onClick={() => {
                    // @ts-ignore
                    window.__cameraReset?.();
                  }}
                  style={{
                    width: "100%",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    padding: "8px 16px",
                  }}
                >
                  Reset Camera
                </button>
              </div>
              <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                <button
                  onClick={() => {
                    // @ts-ignore
                    window.__captureScreenshot?.();
                  }}
                  style={{
                    width: "100%",
                    backgroundColor: "#2196F3",
                    color: "white",
                    padding: "8px 16px",
                  }}
                >
                  Take Screenshot
                </button>
              </div>
            </div>

            {/* Model controls */}
            <div className="model-controls">
              <button
                onClick={() => {
                  console.log('Resetting limbs...');
                  // Apply default positions without reloading
                  Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
                    const limbRef = limbsRef.current[limbId as LimbId];
                    if (limbRef?.current) {
                      limbRef.current.rotation.set(
                        defaultState.rotation.x,
                        defaultState.rotation.y,
                        defaultState.rotation.z
                      );
                    }
                  });

                  // Reset height to 0
                  // @ts-ignore
                  window.__modelReset?.();
                  setCurrentHeight(0);

                  // Save to localStorage
                  const positions = {} as StoredLimbPositions;
                  Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
                    positions[limbId as LimbId] = {
                      rotation: {
                        x: defaultState.rotation.x,
                        y: defaultState.rotation.y,
                        z: defaultState.rotation.z,
                      },
                      height: 0
                    };
                  });
                  localStorage.setItem("limbPositions", JSON.stringify(positions));

                  // Update axis controls if a limb is active
                  if (activeLimbId) {
                    const defaultRotation = DEFAULT_POSITIONS[activeLimbId].rotation;
                    const axes: RotationAxis[] = ["x", "y", "z"];
                    const newControls: AxisControlData[] = axes.map(axis => ({
                      limbId: activeLimbId,
                      axis,
                      value: defaultRotation[axis],
                      min: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][0],
                      max: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][1],
                      onChange: value => {
                        const limbRef = limbsRef.current[activeLimbId];
                        if (limbRef?.current) {
                          const constraints = LIMB_CONSTRAINTS[activeLimbId];
                          const clampedValue = Math.max(
                            constraints.rotation[axis][0],
                            Math.min(constraints.rotation[axis][1], value)
                          );
                          limbRef.current.rotation[axis] = clampedValue;

                          // Save to localStorage
                          const savedPositions = localStorage.getItem("limbPositions");
                          const positions = savedPositions ? (JSON.parse(savedPositions) as StoredLimbPositions) : {};
                          if (!positions[activeLimbId]) {
                            positions[activeLimbId] = { rotation: { x: 0, y: 0, z: 0 }, height: 0 };
                          }
                          positions[activeLimbId].rotation[axis] = clampedValue;
                          localStorage.setItem("limbPositions", JSON.stringify(positions));
                        }
                      },
                    }));
                    setAxisControls(newControls);
                  }

                  // Stop any ongoing technique animation
                  setCurrentTechnique(undefined);
                }}
                style={{
                  backgroundColor: "#ff9800",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Reset Limbs
              </button>
              <button onClick={() => handleMove("y", 0.1)} style={{ backgroundColor: "#4CAF50", color: "white", padding: "8px 16px" }}>
                Move Up
              </button>
              <button onClick={() => handleMove("y", -0.1)} style={{ backgroundColor: "#f44336", color: "white", padding: "8px 16px" }}>
                Move Down
              </button>
              <ScreenshotButton
                onCapture={() => handleCapture()}
                currentHeight={currentHeight}
              />

              {/* Height display */}
              <div
                style={{
                  background: "rgba(0,0,0,0.7)",
                  padding: "10px",
                  borderRadius: "5px",
                  color: "white",
                  marginTop: "10px"
                }}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>Current Height</h4>
                <div style={{ marginLeft: "10px" }}>
                  {currentHeight.toFixed(2)} units
                </div>
              </div>

              {/* Reset height button */}
              <button 
                onClick={handleResetHeight}
                style={{ 
                  backgroundColor: "#ff9800", 
                  color: "white", 
                  padding: "8px 16px",
                  marginTop: "10px",
                  width: "100%"
                }}
              >
                Reset Height
              </button>


              {/* Limb details moved below Save Position button */}
              <div
                style={{
                  background: "rgba(0,0,0,0.7)",
                  padding: "10px",
                  borderRadius: "5px",
                  color: "white",
                  maxHeight: "250px",
                  overflowY: "auto",
                  marginTop: "10px"
                }}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>Current Limb Details</h4>
                {Object.entries(localStorage.getItem("limbPositions") ? JSON.parse(localStorage.getItem("limbPositions") || "{}") : {}).map(([limbId, data]: [string, any]) => (
                  <div key={limbId} style={{ marginBottom: "8px" }}>
                    <strong>{limbId}:</strong>
                    <div style={{ marginLeft: "10px" }}>
                      x: {(data.rotation.x * 180 / Math.PI).toFixed(1)}°
                      y: {(data.rotation.y * 180 / Math.PI).toFixed(1)}°
                      z: {(data.rotation.z * 180 / Math.PI).toFixed(1)}°
                      height: {data.height?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Left side panel */}
          <div className="techniques-grid">
            <TabPanel>
              {/* Positions tab */}
              <div className="positions-tab">
                <h3>Saved Positions</h3>
                <Positions onPositionSelect={handlePositionSelect} key={refreshTrigger} />

                {/* Default generic position as initial state */}
                <div
                  className="position-card"
                  onClick={() => {
                    // Apply default positions without reloading
                    Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
                      const limbRef = limbsRef.current[limbId as LimbId];
                      if (limbRef?.current) {
                        limbRef.current.rotation.set(
                          defaultState.rotation.x,
                          defaultState.rotation.y,
                          defaultState.rotation.z
                        );
                      }
                    });

                    // Save to localStorage
                    const positions = {} as StoredLimbPositions;
                    Object.entries(DEFAULT_POSITIONS).forEach(([limbId, defaultState]) => {
                      positions[limbId as LimbId] = {
                        rotation: {
                          x: defaultState.rotation.x,
                          y: defaultState.rotation.y,
                          z: defaultState.rotation.z,
                        },
                        height: 0
                      };
                    });
                    localStorage.setItem("limbPositions", JSON.stringify(positions));

                    // Update axis controls if a limb is active
                    if (activeLimbId) {
                      const defaultRotation = DEFAULT_POSITIONS[activeLimbId].rotation;
                      const axes: RotationAxis[] = ["x", "y", "z"];
                      const newControls: AxisControlData[] = axes.map(axis => ({
                        limbId: activeLimbId,
                        axis,
                        value: defaultRotation[axis],
                        min: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][0],
                        max: LIMB_CONSTRAINTS[activeLimbId].rotation[axis][1],
                        onChange: value => {
                          const limbRef = limbsRef.current[activeLimbId];
                          if (limbRef?.current) {
                            const constraints = LIMB_CONSTRAINTS[activeLimbId];
                            const clampedValue = Math.max(
                              constraints.rotation[axis][0],
                              Math.min(constraints.rotation[axis][1], value)
                            );
                            limbRef.current.rotation[axis] = clampedValue;

                            // Save to localStorage
                            const savedPositions = localStorage.getItem("limbPositions");
                            const positions = savedPositions ? (JSON.parse(savedPositions) as StoredLimbPositions) : {};
                            if (!positions[activeLimbId]) {
                              positions[activeLimbId] = { rotation: { x: 0, y: 0, z: 0 }, height: 0 };
                            }
                            positions[activeLimbId].rotation[axis] = clampedValue;
                            localStorage.setItem("limbPositions", JSON.stringify(positions));
                          }
                        },
                      }));
                      setAxisControls(newControls);
                    }

                    // Stop any ongoing technique animation
                    setCurrentTechnique(undefined);
                  }}
                >
                  <h4>Default Position</h4>
                  <p className="timestamp">Standard starting position</p>
                  <p>Click to load standard stance</p>
                </div>

                {/* Export button */}
                <button
                  onClick={handleExportPositions}
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Export All Positions
                </button>
              </div>

              <div className="saved-techniques">
                <h3>Techniques</h3>
                {DEFAULT_TECHNIQUES.map((technique) => (
                  <div
                    key={technique.id}
                    className={`technique-card ${activeTechniqueId === technique.id ? 'active' : ''}`}
                    onClick={() => {
                      console.log('Selected technique:', technique.id);
                      const techObj = techniques.find(t => t.id === technique.id);
                      if (techObj) {
                        if (activeTechniqueId === technique.id) {
                          // If clicking the active technique, deactivate it
                          setActiveTechniqueId(null);
                          setCurrentTechnique(undefined);
                        } else {
                          // If clicking a different technique, activate it
                          setActiveTechniqueId(technique.id);
                          setCurrentTechnique(techObj);
                        }
                      } else {
                        setActiveTechniqueId(null);
                        setCurrentTechnique(undefined);
                      }
                    }}
                  >
                    <h4>{technique.name}</h4>
                    <p className="japanese-name">{technique.nameJa}</p>
                    <p className="description">{technique.description}</p>
                    <div className="technique-tags">
                      {technique.tags.map((tag, index) => (
                        <span key={index} className="technique-tag">{tag}</span>
                      ))}
                    </div>
                    <div className="technique-status">
                      {activeTechniqueId === technique.id ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))}
              </div>
            </TabPanel>
          </div>
        </div>
      </AxisControlsContext.Provider>
    </ActiveLimbContext.Provider>
  );
}
