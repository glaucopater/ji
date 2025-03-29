import React from "react";
import { LimbId } from "../types/viewer";

export interface AxisControl {
  axis: "x" | "y" | "z";
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

interface ActiveLimbContextType {
  activeLimbId: LimbId | null;
  setActiveLimbId: (id: LimbId | null) => void;
}

interface AxisControlsContextType {
  controls: AxisControl[];
  setControls: (controls: AxisControl[]) => void;
}

export const ActiveLimbContext = React.createContext<ActiveLimbContextType>({
  activeLimbId: null,
  setActiveLimbId: () => {},
});

export const AxisControlsContext = React.createContext<AxisControlsContextType>({
  controls: [],
  setControls: () => {},
});
