import React from 'react';
import { AxisControlData } from "../types/viewer";
import { LimbId } from "../types/viewer";
import { AxisControlsContext } from './Scene';



export function AxisControls() {
    const { controls } = React.useContext(AxisControlsContext);

    if (controls.length === 0) return null;

    const limbControls = (controls as AxisControlData[]).reduce<Record<LimbId, AxisControlData[]>>((acc, control) => {
        if (!acc[control.limbId]) {
            acc[control.limbId] = [];
        }
        acc[control.limbId].push(control);
        return acc;
    }, {} as Record<LimbId, AxisControlData[]>);

    return (
        <div
            style={{
                position: "absolute",
                top: "75%",
                right: "350px",
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                background: "rgba(0,0,0,0.7)",
                padding: "20px",
                borderRadius: "10px",
                maxHeight: "80vh",
                overflowY: "auto",
            }}
        >
            {Object.entries(limbControls).map(([limbId, limbAxisControls]) => (
                <div
                    key={limbId}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        padding: "10px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "5px",
                    }}
                >
                    <h3 style={{ color: "white", margin: "0 0 10px 0" }}>{limbId}</h3>
                    {limbAxisControls.map(control => (
                        <div
                            key={control.axis}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "5px",
                            }}
                        >
                            <label style={{ color: control.axis === "x" ? "red" : control.axis === "y" ? "green" : "blue" }}>
                                {control.axis.toUpperCase()} Rotation
                            </label>
                            <input
                                type='range'
                                min={control.min}
                                max={control.max}
                                step={0.01}
                                value={control.value}
                                onChange={e => control.onChange(parseFloat(e.target.value))}
                                style={{ width: "200px" }}
                            />
                            <span style={{ color: "white" }}>{((control.value * 180) / Math.PI).toFixed(0)}°</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
