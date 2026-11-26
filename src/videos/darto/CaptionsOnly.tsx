import React from "react";
import { AbsoluteFill } from "remotion";
import { DartoCaptionOverlay } from "./DartoCaptionOverlay";

export const DartoCaptionsOnly: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    <DartoCaptionOverlay />
  </AbsoluteFill>
);
