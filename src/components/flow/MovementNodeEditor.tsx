import { useCallback } from 'react';
import { MovementData, LimbType, MovementType } from '../../types/flow';
import './MovementNodeEditor.css';

interface MovementNodeEditorProps {
  data: MovementData;
  onChange: (data: MovementData) => void;
}

const LIMB_OPTIONS: { value: LimbType; label: string }[] = [
  { value: 'upperArmLeft', label: 'Upper Arm Left' },
  { value: 'upperArmRight', label: 'Upper Arm Right' },
  { value: 'lowerArmLeft', label: 'Lower Arm Left' },
  { value: 'lowerArmRight', label: 'Lower Arm Right' },
  { value: 'upperLegLeft', label: 'Upper Leg Left' },
  { value: 'upperLegRight', label: 'Upper Leg Right' },
  { value: 'lowerLegLeft', label: 'Lower Leg Left' },
  { value: 'lowerLegRight', label: 'Lower Leg Right' },
  { value: 'torso', label: 'Torso' },
  { value: 'head', label: 'Head' },
];

const MOVEMENT_OPTIONS: { value: MovementType; label: string }[] = [
  { value: 'moveForward', label: 'Move Forward' },
  { value: 'moveBackward', label: 'Move Backward' },
  { value: 'moveLeft', label: 'Move Left' },
  { value: 'moveRight', label: 'Move Right' },
  { value: 'moveUp', label: 'Move Up' },
  { value: 'moveDown', label: 'Move Down' },
  { value: 'rotateLeft', label: 'Rotate Left' },
  { value: 'rotateRight', label: 'Rotate Right' },
  { value: 'rotateUp', label: 'Rotate Up' },
  { value: 'rotateDown', label: 'Rotate Down' },
];

export function MovementNodeEditor({ data, onChange }: MovementNodeEditorProps) {
  const handleChange = useCallback(
    (field: keyof MovementData, value: any) => {
      onChange({
        ...data,
        [field]: value,
      });
    },
    [data, onChange]
  );

  const handlePositionChange = useCallback(
    (axis: 'x' | 'y' | 'z', value: number) => {
      onChange({
        ...data,
        position: {
          ...data.position,
          [axis]: value,
        },
      });
    },
    [data, onChange]
  );

  return (
    <div className="movement-node-editor">
      <div className="editor-field">
        <label>Limb:</label>
        <select
          value={data.limb}
          onChange={(e) => handleChange('limb', e.target.value as LimbType)}
        >
          {LIMB_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="editor-field">
        <label>Movement Type:</label>
        <select
          value={data.movementType}
          onChange={(e) => handleChange('movementType', e.target.value as MovementType)}
        >
          {MOVEMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="editor-field">
        <label>Position:</label>
        <div className="position-inputs">
          <input
            type="number"
            value={data.position.x}
            onChange={(e) => handlePositionChange('x', parseFloat(e.target.value))}
            placeholder="X"
          />
          <input
            type="number"
            value={data.position.y}
            onChange={(e) => handlePositionChange('y', parseFloat(e.target.value))}
            placeholder="Y"
          />
          <input
            type="number"
            value={data.position.z}
            onChange={(e) => handlePositionChange('z', parseFloat(e.target.value))}
            placeholder="Z"
          />
        </div>
      </div>

      <div className="editor-field">
        <label>Duration (seconds):</label>
        <input
          type="number"
          value={data.duration}
          onChange={(e) => handleChange('duration', parseFloat(e.target.value))}
          min="0"
          step="0.1"
        />
      </div>

      <div className="editor-field">
        <label>Force:</label>
        <input
          type="number"
          value={data.force}
          onChange={(e) => handleChange('force', parseFloat(e.target.value))}
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>
  );
} 