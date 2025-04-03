import { render, screen, fireEvent } from '@testing-library/react';
import { ScreenshotButton } from '../ScreenshotButton';
import { usePositions } from '../../hooks/usePositions';

// Mock the usePositions hook
jest.mock('../../hooks/usePositions');

describe('ScreenshotButton', () => {
  const mockOnCapture = jest.fn();
  const mockAddPosition = jest.fn();

  beforeEach(() => {
    (usePositions as jest.Mock).mockReturnValue({
      addPosition: mockAddPosition
    });
  });

  it('renders the camera button', () => {
    render(<ScreenshotButton onCapture={mockOnCapture} />);
    expect(screen.getByTitle('Take screenshot of current position')).toBeInTheDocument();
  });

  it('calls onCapture and addPosition when clicked', () => {
    const mockLimbs = {
      upperArmLeft: { rotation: { x: 0, y: 0, z: 0 } },
      upperArmRight: { rotation: { x: 0, y: 0, z: 0 } },
      lowerArmLeft: { rotation: { x: 0, y: 0, z: 0 } },
      lowerArmRight: { rotation: { x: 0, y: 0, z: 0 } },
      upperLegLeft: { rotation: { x: 0, y: 0, z: 0 } },
      upperLegRight: { rotation: { x: 0, y: 0, z: 0 } },
      lowerLegLeft: { rotation: { x: 0, y: 0, z: 0 } },
      lowerLegRight: { rotation: { x: 0, y: 0, z: 0 } }
    };

    mockOnCapture.mockReturnValue(mockLimbs);

    render(<ScreenshotButton onCapture={mockOnCapture} />);
    
    fireEvent.click(screen.getByTitle('Take screenshot of current position'));
    
    expect(mockOnCapture).toHaveBeenCalled();
    expect(mockAddPosition).toHaveBeenCalledWith(mockLimbs);
  });
}); 