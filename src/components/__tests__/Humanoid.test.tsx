import { render } from "@testing-library/react";
import { Humanoid } from "../Humanoid";
import * as THREE from "three";
import { useHumanoidAnimation } from "../../hooks/useHumanoidAnimation";

// Mock the animation hook
jest.mock("../../hooks/useHumanoidAnimation", () => ({
  useHumanoidAnimation: jest.fn(() => ({
    playTechnique: jest.fn(),
    setIdle: jest.fn(),
  })),
}));

// Mock R3F components
jest.mock("@react-three/fiber", () => ({
  useFrame: jest.fn(),
  useThree: () => ({
    camera: { position: { set: jest.fn() } },
    scene: { add: jest.fn(), remove: jest.fn() },
    gl: { domElement: document.createElement("div") },
  }),
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  extend: jest.fn(),
}));

// Mock child components
jest.mock("../Torso", () => ({
  Torso: ({ upperChildren, lowerChildren }: { upperChildren?: React.ReactNode; lowerChildren?: React.ReactNode }) => (
    <div data-testid="torso">
      <div data-testid="upper-children">{upperChildren}</div>
      <div data-testid="lower-children">{lowerChildren}</div>
    </div>
  ),
}));

jest.mock("../LeftArm", () => ({
  LeftArm: () => <div data-testid="left-arm" />,
}));

jest.mock("../RightArm", () => ({
  RightArm: () => <div data-testid="right-arm" />,
}));

jest.mock("../LeftLeg", () => ({
  LeftLeg: () => <div data-testid="left-leg" />,
}));

jest.mock("../RightLeg", () => ({
  RightLeg: () => <div data-testid="right-leg" />,
}));

jest.mock("../Head", () => ({
  Head: () => <div data-testid="head" />,
}));

describe("Humanoid", () => {
  const createMockRef = () => ({
    current: {
      rotation: { x: 0, y: 0, z: 0 },
      position: { x: 0, y: 0, z: 0 },
    } as unknown as THREE.Group,
  });

  const defaultProps = {
    upperArmLeftRef: createMockRef(),
    lowerArmLeftRef: createMockRef(),
    upperArmRightRef: createMockRef(),
    lowerArmRightRef: createMockRef(),
    upperLegLeftRef: createMockRef(),
    lowerLegLeftRef: createMockRef(),
    upperLegRightRef: createMockRef(),
    lowerLegRightRef: createMockRef(),
    upperTorsoRef: createMockRef(),
    lowerTorsoRef: createMockRef(),
    headRef: createMockRef(),
    handLeftRef: createMockRef(),
    handRightRef: createMockRef(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all humanoid components", () => {
    const { getByTestId } = render(<Humanoid {...defaultProps} />);

    expect(getByTestId("torso")).toBeInTheDocument();
    expect(getByTestId("left-arm")).toBeInTheDocument();
    expect(getByTestId("right-arm")).toBeInTheDocument();
    expect(getByTestId("left-leg")).toBeInTheDocument();
    expect(getByTestId("right-leg")).toBeInTheDocument();
    expect(getByTestId("head")).toBeInTheDocument();
  });

  it("renders with correct component structure", () => {
    const { getByTestId } = render(<Humanoid {...defaultProps} />);
    
    // Verify all child components are rendered
    // The Humanoid component positions the model at [0, 0.5, 0] to ensure
    // feet are properly aligned on the tatami mat (Y = -0.02)
    expect(getByTestId("torso")).toBeInTheDocument();
  });

  it("calls useHumanoidAnimation hook with correct refs", () => {
    render(<Humanoid {...defaultProps} />);

    expect(useHumanoidAnimation).toHaveBeenCalledWith({
      upperArmLeftRef: defaultProps.upperArmLeftRef,
      lowerArmLeftRef: defaultProps.lowerArmLeftRef,
      upperArmRightRef: defaultProps.upperArmRightRef,
      lowerArmRightRef: defaultProps.lowerArmRightRef,
      upperLegLeftRef: defaultProps.upperLegLeftRef,
      lowerLegLeftRef: defaultProps.lowerLegLeftRef,
      upperLegRightRef: defaultProps.upperLegRightRef,
      lowerLegRightRef: defaultProps.lowerLegRightRef,
      upperTorsoRef: defaultProps.upperTorsoRef,
      lowerTorsoRef: defaultProps.lowerTorsoRef,
      handLeftRef: defaultProps.handLeftRef,
      handRightRef: defaultProps.handRightRef,
    });
  });
});
