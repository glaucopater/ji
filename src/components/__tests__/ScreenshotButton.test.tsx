import { render, screen, fireEvent } from '@testing-library/react';
import { ScreenshotButton } from '../ScreenshotButton';

// Create a mock function that will be used consistently
const mockAddViewerPosition = jest.fn();

// Mock the usePositions hook
jest.mock('../../hooks/usePositions', () => ({
  usePositions: () => ({
    addViewerPosition: mockAddViewerPosition
  })
}));

describe('ScreenshotButton', () => {
  const mockLimbs = {
    upperArmLeft: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    upperArmRight: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    lowerArmLeft: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    lowerArmRight: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    upperLegLeft: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    upperLegRight: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    lowerLegLeft: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    lowerLegRight: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    upperTorso: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    lowerTorso: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    head: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    handLeft: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
    handRight: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 }
  };

  const mockOnCapture = jest.fn(() => mockLimbs);

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the button', () => {
    render(<ScreenshotButton onCapture={mockOnCapture} currentHeight={1.5} />);
    expect(screen.getByText('Save Position')).toBeInTheDocument();
  });

  it('calls onCapture and addViewerPosition when clicked', () => {
    render(<ScreenshotButton onCapture={mockOnCapture} currentHeight={1.5} />);
    
    fireEvent.click(screen.getByText('Save Position'));
    
    expect(mockOnCapture).toHaveBeenCalled();
    expect(mockAddViewerPosition).toHaveBeenCalledWith(mockLimbs, 1.5);
  });
}); 