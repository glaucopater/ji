import { render } from "@testing-library/react";
import { InteractiveLimb } from "../InteractiveLimb";
import { ActiveLimbContext, AxisControlsContext } from "../Scene";
import * as THREE from "three";
import { LimbId } from "../../types/viewer";

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Mock ref for the group
const mockGroupRef = {
  current: {
    rotation: {
      x: 0,
      y: 0,
      z: 0,
      set: jest.fn(),
    },
  } as unknown as THREE.Group,
};

// Mock context values
const mockSetActiveLimbId = jest.fn();
const mockSetControls = jest.fn();

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
  mesh: () => null,
  cylinderGeometry: () => null,
  meshStandardMaterial: () => null,
}));

// Mock @react-three/drei
jest.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
}));

// Helper function to render with context providers
function renderWithProviders(
  ui: React.ReactElement,
  contextValues = {
    activeLimbId: null as LimbId | null,
    setActiveLimbId: mockSetActiveLimbId,
    controls: [],
    setControls: mockSetControls,
  }
) {
  return render(
    <ActiveLimbContext.Provider value={{ activeLimbId: contextValues.activeLimbId, setActiveLimbId: contextValues.setActiveLimbId }}>
      <AxisControlsContext.Provider value={{ controls: contextValues.controls, setControls: contextValues.setControls }}>
        {ui}
      </AxisControlsContext.Provider>
    </ActiveLimbContext.Provider>
  );
}

describe("InteractiveLimb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    mockSetActiveLimbId.mockClear();
    mockSetControls.mockClear();
  });

  it("loads saved position from localStorage on mount", () => {
    const savedPosition = {
      upperArmLeft: {
        rotation: { x: 0.5, y: 0.3, z: 0.1 },
      },
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedPosition));

    renderWithProviders(
      <InteractiveLimb limbId='upperArmLeft' geometry={[0.5, 0.5, 2]} color='#ffffff' position={[0, 0, 0]} groupRef={mockGroupRef} />
    );

    expect(mockGroupRef.current.rotation.set).toHaveBeenCalledWith(0.5, 0.3, 0.1);
  });
});
