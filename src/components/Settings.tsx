import { useState, useEffect } from 'react';

export function Settings() {
  const [backgroundColor, setBackgroundColor] = useState(() => {
    const savedColor = localStorage.getItem("sceneBackgroundColor");
    return savedColor || "#e3f2fd";
  });
  const [backgroundImage, setBackgroundImage] = useState<string | null>(() => {
    const saved = localStorage.getItem("sceneBackgroundImage");
    return saved || null;
  });
  const [tatamiPerimeterColor, setTatamiPerimeterColor] = useState(() => {
    return localStorage.getItem("tatamiPerimeterColor") || '#006400';
  });
  const [tatamiInteriorColor, setTatamiInteriorColor] = useState(() => {
    return localStorage.getItem("tatamiInteriorColor") || '#8B0000';
  });
  const [tatamiBaseColor, setTatamiBaseColor] = useState(() => {
    return localStorage.getItem("tatamiBaseColor") || '#2b2b2b';
  });
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

  // Dynamically load all dojo_* images from the assets folder
  const [presetImages, setPresetImages] = useState<Array<{ name: string; value: string }>>([]);

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
    setBackgroundColor(color);
    localStorage.setItem('sceneBackgroundColor', color);
    if (backgroundType === 'color') {
      setBackgroundImage(null);
      localStorage.removeItem('sceneBackgroundImage');
    }
  };

  const handleImageChange = (imageUrl: string | null) => {
    console.log('handleImageChange called with:', imageUrl);
    setBackgroundImage(imageUrl);
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
      setBackgroundColor('#e3f2fd'); // Reset to default when switching to image
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      width: "100%",
      color: "#333",
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden"
    }}>
      <h1 style={{ marginBottom: "30px", color: "#333" }}>Settings</h1>
      
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Background Settings</h2>
        
        {/* Background type selector */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontSize: "16px", fontWeight: "bold", color: "#333" }}>
            Background Type:
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => handleTypeChange('color')}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: backgroundType === 'color' ? "#4CAF50" : "#e0e0e0",
                color: backgroundType === 'color' ? "white" : "#333",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              Color
            </button>
            <button
              onClick={() => handleTypeChange('image')}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: backgroundType === 'image' ? "#4CAF50" : "#e0e0e0",
                color: backgroundType === 'image' ? "white" : "#333",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              Image
            </button>
          </div>
        </div>

        {backgroundType === 'color' ? (
          <>
            {/* Preset colors */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", fontSize: "16px", fontWeight: "bold" }}>
                Preset Colors:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {presetColors.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleColorChange(preset.value)}
                    style={{
                      padding: "12px",
                      backgroundColor: preset.value,
                      border: backgroundColor === preset.value ? "3px solid #4CAF50" : "2px solid #ccc",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: preset.value === '#000000' ? 'white' : 'black',
                      fontSize: "14px",
                      fontWeight: "bold"
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom color picker */}
            <div>
              <label style={{ display: "block", marginBottom: "10px", fontSize: "16px", fontWeight: "bold" }}>
                Custom Color:
              </label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="color"
                  value={tempColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  style={{
                    width: "80px",
                    height: "50px",
                    border: "2px solid #ccc",
                    borderRadius: "6px",
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
                    padding: "12px",
                    borderRadius: "6px",
                    border: "2px solid #ccc",
                    fontSize: "16px"
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Preset images dropdown */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", fontSize: "16px", fontWeight: "bold", color: "#333" }}>
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
                  padding: "12px",
                  borderRadius: "6px",
                  border: "2px solid #ccc",
                  fontSize: "16px",
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
                <div style={{ marginTop: "15px" }}>
                  <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: "bold", color: "#333" }}>
                    Preview:
                  </label>
                  <div style={{
                    border: "2px solid #ccc",
                    borderRadius: "6px",
                    padding: "10px",
                    backgroundColor: "#f5f5f5",
                    display: "inline-block"
                  }}>
                    <img
                      src={backgroundImage}
                      alt="Background preview"
                      style={{
                        maxWidth: "400px",
                        maxHeight: "300px",
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
                    padding: "12px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginTop: "10px"
                  }}
                >
                  Remove Image
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Tatami Color Settings */}
      <div style={{ marginTop: "40px", paddingTop: "30px", borderTop: "2px solid #eee" }}>
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Tatami Colors</h2>
        
        {/* Perimeter Color */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontSize: "16px", fontWeight: "bold" }}>
            Perimeter Color:
          </label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="color"
              value={tatamiPerimeterColor}
              onChange={(e) => {
                setTatamiPerimeterColor(e.target.value);
                localStorage.setItem('tatamiPerimeterColor', e.target.value);
              }}
              style={{
                width: "80px",
                height: "50px",
                border: "2px solid #ccc",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            />
            <input
              type="text"
              value={tatamiPerimeterColor}
              onChange={(e) => {
                const color = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(color)) {
                  setTatamiPerimeterColor(color);
                  localStorage.setItem('tatamiPerimeterColor', color);
                }
              }}
              placeholder="#006400"
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "6px",
                border: "2px solid #ccc",
                fontSize: "16px"
              }}
            />
          </div>
        </div>

        {/* Interior Color */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontSize: "16px", fontWeight: "bold" }}>
            Interior Color:
          </label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="color"
              value={tatamiInteriorColor}
              onChange={(e) => {
                setTatamiInteriorColor(e.target.value);
                localStorage.setItem('tatamiInteriorColor', e.target.value);
              }}
              style={{
                width: "80px",
                height: "50px",
                border: "2px solid #ccc",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            />
            <input
              type="text"
              value={tatamiInteriorColor}
              onChange={(e) => {
                const color = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(color)) {
                  setTatamiInteriorColor(color);
                  localStorage.setItem('tatamiInteriorColor', color);
                }
              }}
              placeholder="#8B0000"
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "6px",
                border: "2px solid #ccc",
                fontSize: "16px"
              }}
            />
          </div>
        </div>

        {/* Base Color */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontSize: "16px", fontWeight: "bold" }}>
            Base Color:
          </label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="color"
              value={tatamiBaseColor}
              onChange={(e) => {
                setTatamiBaseColor(e.target.value);
                localStorage.setItem('tatamiBaseColor', e.target.value);
              }}
              style={{
                width: "80px",
                height: "50px",
                border: "2px solid #ccc",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            />
            <input
              type="text"
              value={tatamiBaseColor}
              onChange={(e) => {
                const color = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(color)) {
                  setTatamiBaseColor(color);
                  localStorage.setItem('tatamiBaseColor', color);
                }
              }}
              placeholder="#2b2b2b"
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "6px",
                border: "2px solid #ccc",
                fontSize: "16px"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
