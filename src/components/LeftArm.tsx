import { Group } from "three";
import { InteractiveLimb } from "./InteractiveLimb";
import { Hand } from "./Hand";
import { Joint } from "./Joint";
import { useRef } from "react";

export const LeftArm = ({
  upperArmLeftRef,
  lowerArmLeftRef,
}: {
  upperArmLeftRef: React.RefObject<Group>;
  lowerArmLeftRef: React.RefObject<Group>;
}) => {
  const handLeftRef = useRef<Group>(null);
  
  return (
    <group position={[-0.4, 1.6, 0]}>
      {/* Shoulder Joint */}
      <Joint position={[0, 0, 0]} />
      {/* Upper Arm */}
      <group ref={upperArmLeftRef}>
        <InteractiveLimb
          geometry={[0.08, 0.07, 0.4]}
          color='lightgreen'
          position={[0, -0.2, 0]}
          groupRef={upperArmLeftRef}
          limbId='upperArmLeft'
        />
        {/* Elbow Joint */}
        <Joint position={[0, -0.45, 0]} />
        {/* Lower Arm */}
        <group ref={lowerArmLeftRef} position={[0, -0.6, 0]}>
          <InteractiveLimb
            geometry={[0.07, 0.06, 0.6]}
            color='lightblue'
            position={[0, -0.2, 0]}
            groupRef={lowerArmLeftRef}
            limbId='lowerArmLeft'
          />
          {/* Hand */}
          <Hand position={[0, -0.6, 0]} side='left' groupRef={handLeftRef} />
        </group>
      </group>
    </group>
  );
};
