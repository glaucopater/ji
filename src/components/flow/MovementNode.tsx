import { Handle, Position } from 'reactflow';
import { MovementData } from '../../types/flow';
import './MovementNode.css';

interface MovementNodeProps {
  data: MovementData;
  selected: boolean;
}

export function MovementNode({ data }: MovementNodeProps) {
  return (
    <div className="movement-node">
      <Handle type="target" position={Position.Top} />
      
      <div className="movement-node-content">
        <div className="movement-node-header">
          <span className="movement-node-title">
            {data.limb.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <span className="movement-node-type">
            {data.movementType.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
} 