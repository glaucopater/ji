import { Group } from "three";
import { Joint } from "./Joint";
import { InteractiveLimb } from "./Scene";

interface LeftLegProps {
  upperLegLeftRef: React.RefObject<Group>;
  lowerLegLeftRef: React.RefObject<Group>;
}

export const LeftLeg = ({
  upperLegLeftRef,
  lowerLegLeftRef,
}: LeftLegProps) => {
  return (
    <group position={[-0.2, 0.7, 0]}>
      {/* Hip Joint */}
      <Joint position={[0, 0, 0]} />
      {/* Upper Leg */}
      <group ref={upperLegLeftRef}>
        <InteractiveLimb
          geometry={[0.09, 0.08, 0.5]}
          color='#98FB98'
          position={[0, -0.25, 0]}
          groupRef={upperLegLeftRef}
          limbId='upperLegLeft'
        />
        {/* Knee Joint */}
        <group position={[0, -0.5, 0]}>
          <Joint position={[0, 0, 0]} />
          {/* Lower Leg */}
          <group ref={lowerLegLeftRef}>
            <InteractiveLimb
              geometry={[0.08, 0.07, 0.5]}
              color='#228B22'
              position={[0, -0.25, 0]}
              groupRef={lowerLegLeftRef}
              limbId='lowerLegLeft'
            />
            {/* Ankle Joint */}
            <Joint position={[0, -0.5, 0]} />
            {/* Foot */}
            <mesh position={[0, -0.55, 0.1]}>
              <boxGeometry args={[0.12, 0.1, 0.25]} />
              <meshStandardMaterial color='#228B22' />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
