import { Position } from '../types/positions';

interface ScreenshotButtonProps {
  onCapture: () => Position['limbs'] | void;
}

export function ScreenshotButton({ onCapture }: ScreenshotButtonProps) {
  const handleClick = () => {
    onCapture();
  };

  return (
    <button
      onClick={handleClick}
      title="Take screenshot of current position"
      style={{
        backgroundColor: "#4CAF50",
        color: "white",
        padding: "8px 16px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        fontSize: "14px",
        width: "100%"
      }}
    >
      <span>Save Position</span>      
    </button>
  );
} 