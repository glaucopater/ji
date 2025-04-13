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
    mockOnCapture.mockClear();
    mockAddPosition.mockClear();
  });

  it('renders the button', () => {
    render(<ScreenshotButton onCapture={mockOnCapture} currentHeight={1.5} />);
    expect(screen.getByText('Save Position')).toBeInTheDocument();
  });

  it('calls onCapture and addPosition when clicked', () => {
    const mockLimbs = {
      upperArmLeft: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
      upperArmRight: { rotation: { x: 0, y: 0, z: 0 } },
      lowerArmLeft: { rotation: { x: 0, y: 0, z: 0 } },
      lowerArmRight: { rotation: { x: 0, y: 0, z: 0 } },
      upperLegLeft: { rotation: { x: 0, y: 0, z: 0 } },
      upperLegRight: { rotation: { x: 0, y: 0, z: 0 } },
      lowerLegLeft: { rotation: { x: 0, y: 0, z: 0 } },
      lowerLegRight: { rotation: { x: 0, y: 0, z: 0 } }
    };

    mockOnCapture.mockReturnValue(mockLimbs);

    render(<ScreenshotButton onCapture={mockOnCapture} currentHeight={1.5} />);
    
    fireEvent.click(screen.getByText('Save Position'));
    
    expect(mockOnCapture).toHaveBeenCalled();
    expect(mockAddPosition).toHaveBeenCalledWith(mockLimbs, 1.5);
  });
}); 