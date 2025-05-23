import { ViewerPosition } from '../types/positions';
import { usePositions } from '../hooks/usePositions';

interface ScreenshotButtonProps {
  onCapture: () => ViewerPosition['limbs'] | void;
  currentHeight: number;
}

export function ScreenshotButton({ onCapture, currentHeight }: ScreenshotButtonProps) {
  const { addViewerPosition } = usePositions();

  const handleClick = () => {
    const limbs = onCapture();
    if (limbs) {
      addViewerPosition(limbs, currentHeight);
    }
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