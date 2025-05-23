import { Group } from "three";
import { Joint } from "./Joint";
import { InteractiveLimb } from "./InteractiveLimb";

interface RightLegProps {
  upperLegRightRef: React.RefObject<Group>;
  lowerLegRightRef: React.RefObject<Group>;
}

export const RightLeg = ({
  upperLegRightRef,
  lowerLegRightRef,
}: RightLegProps) => {
  return (
    <group position={[0.2, 0.7, 0]}>
      {/* Hip Joint */}
      <Joint position={[0, 0, 0]} />
      {/* Upper Leg */}
      <group ref={upperLegRightRef}>
        <InteractiveLimb
          geometry={[0.09, 0.08, 0.5]}
          color='#98FB98'
          position={[0, -0.25, 0]}
          groupRef={upperLegRightRef}
          limbId='upperLegRight'
        />
        {/* Knee Joint */}
        <group position={[0, -0.5, 0]}>
          <Joint position={[0, 0, 0]} />
          {/* Lower Leg */}
          <group ref={lowerLegRightRef}>
            <InteractiveLimb
              geometry={[0.08, 0.07, 0.5]}
              color='#228B22'
              position={[0, -0.25, 0]}
              groupRef={lowerLegRightRef}
              limbId='lowerLegRight'
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
