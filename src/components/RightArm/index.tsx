import { Hand } from "../Hand";
import { Joint } from "../Joint";
import { InteractiveLimb } from "../Scene";

export const RightArm = ({
  upperArmRightRef,
  lowerArmRightRef,
}: {
  upperArmRightRef: React.RefObject<THREE.Group<THREE.Object3DEventMap>>;
  lowerArmRightRef: React.RefObject<THREE.Group<THREE.Object3DEventMap>>;
}) => (
  <group position={[0.4, 1.6, 0]}>
    {/* Shoulder Joint */}
    <Joint position={[0, 0, 0]} />
    {/* Upper Arm */}
    <group ref={upperArmRightRef}>
      <InteractiveLimb
        geometry={[0.08, 0.06, 0.4]}
        color='lightgreen'
        position={[0, -0.2, 0]}
        groupRef={upperArmRightRef}
        limbId='upperArmRight'
      />
      {/* Elbow Joint */}
      <Joint position={[0, -0.45, 0]} />
      {/* Lower Arm */}
      <group ref={lowerArmRightRef} position={[0, -0.6, 0]}>
        <InteractiveLimb
          geometry={[0.07, 0.06, 0.6]}
          color='lightblue'
          position={[0, -0.2, 0]}
          groupRef={lowerArmRightRef}
          limbId='lowerArmRight'
        />
        {/* Hand */}
        <Hand position={[0, -0.6, 0]} side='right' />
      </group>
    </group>
  </group>
);
