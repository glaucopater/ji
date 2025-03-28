import { Handle, Position } from 'reactflow';
import { MovementData, LimbType } from '../../types/flow';
import './MovementNode.css';

interface MovementNodeProps {
  data: MovementData;
}

function getLimbColor(limb: LimbType): string {
  const colors: Record<string, string> = {
    upperArmLeft: '#FFB6C1',    // Light pink
    upperArmRight: '#FFB6C1',   // Light pink
    lowerArmLeft: '#FF69B4',    // Hot pink
    lowerArmRight: '#FF69B4',   // Hot pink
    upperLegLeft: '#98FB98',    // Pale green
    upperLegRight: '#98FB98',   // Pale green
    kneeLeft: '#32CD32',        // Lime green
    kneeRight: '#32CD32',       // Lime green
    lowerLegLeft: '#228B22',    // Forest green
    lowerLegRight: '#228B22',   // Forest green
    torso: '#87CEEB',          // Sky blue
    head: '#4169E1',           // Royal blue
  };
  return colors[limb] || '#D3D3D3';
}

export function MovementNode({ data }: MovementNodeProps) {
  const limbColor = getLimbColor(data.limb);
  
  return (
    <div className="movement-node" style={{ borderColor: limbColor }}>
      <Handle type="target" position={Position.Top} />
      
      <div className="movement-node-content">
        <div className="movement-node-header" style={{ backgroundColor: limbColor }}>
          <span className="movement-node-title">
            {data.limb.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <span className="movement-node-type">
            {data.movementType.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        </div>
        <div className="movement-node-details">
          <div>Position: ({data.position.x.toFixed(1)}, {data.position.y.toFixed(1)}, {data.position.z.toFixed(1)})</div>
          <div>Duration: {data.duration}s</div>
          <div>Force: {data.force.toFixed(1)}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
} 