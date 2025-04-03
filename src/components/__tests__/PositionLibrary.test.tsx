import { render, screen, fireEvent } from '@testing-library/react';
import { PositionLibrary } from '../PositionLibrary';
import { usePositions } from '../../hooks/usePositions';

// Mock the usePositions hook
jest.mock('../../hooks/usePositions');

describe('PositionLibrary', () => {
  const mockPositions = [
    {
      id: '1',
      name: 'Position 1',
      timestamp: new Date().toISOString(),
      limbs: {
        upperArmLeft: { rotation: { x: 0, y: 0, z: 0 } },
        upperArmRight: { rotation: { x: 0, y: 0, z: 0 } },
        lowerArmLeft: { rotation: { x: 0, y: 0, z: 0 } },
        lowerArmRight: { rotation: { x: 0, y: 0, z: 0 } },
        upperLegLeft: { rotation: { x: 0, y: 0, z: 0 } },
        upperLegRight: { rotation: { x: 0, y: 0, z: 0 } },
        lowerLegLeft: { rotation: { x: 0, y: 0, z: 0 } },
        lowerLegRight: { rotation: { x: 0, y: 0, z: 0 } }
      }
    }
  ];

  const mockOnPositionSelect = jest.fn();

  beforeEach(() => {
    (usePositions as jest.Mock).mockReturnValue({
      positions: mockPositions,
      deletePosition: jest.fn()
    });
  });

  it('renders position cards', () => {
    render(<PositionLibrary onPositionSelect={mockOnPositionSelect} />);
    
    expect(screen.getByText('Position 1')).toBeInTheDocument();
  });

  it('calls onPositionSelect when a position card is clicked', () => {
    render(<PositionLibrary onPositionSelect={mockOnPositionSelect} />);
    
    fireEvent.click(screen.getByText('Position 1'));
    expect(mockOnPositionSelect).toHaveBeenCalledWith(mockPositions[0]);
  });
}); 