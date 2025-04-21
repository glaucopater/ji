import { render, screen, fireEvent } from '@testing-library/react';
import { PositionLibrary } from '../PositionLibrary';
import { usePositions } from '../../hooks/usePositions';

// Mock the usePositions hook
jest.mock('../../hooks/usePositions', () => ({
  usePositions: jest.fn()
}));

describe('PositionLibrary', () => {
  const mockPositions = [
    {
      id: '1',
      name: 'Position 1',
      timestamp: new Date().toISOString(),
      limbs: {
        upperArmLeft: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
        upperArmRight: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
        lowerArmLeft: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
        lowerArmRight: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
        upperLegLeft: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
        upperLegRight: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
        lowerLegLeft: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 },
        lowerLegRight: { rotation: { x: 0, y: 0, z: 0 }, height: 1.5 }
      }
    }
  ];

  const mockOnPositionSelect = jest.fn();

  beforeEach(() => {
    (usePositions as jest.Mock).mockImplementation(() => ({
      viewerPositions: mockPositions,
      deletePosition: jest.fn()
    }));
  });

  it('renders position cards', () => {
    render(<PositionLibrary onPositionSelect={mockOnPositionSelect} />);
    
    expect(screen.getByText('Position 1')).toBeInTheDocument();
  });

  it('calls onPositionSelect when a position card is clicked', () => {
    render(<PositionLibrary onPositionSelect={mockOnPositionSelect} />);
    
    const positionCard = screen.getByText('Position 1');
    fireEvent.click(positionCard);
    
    expect(mockOnPositionSelect).toHaveBeenCalledWith(mockPositions[0]);
  });
}); 