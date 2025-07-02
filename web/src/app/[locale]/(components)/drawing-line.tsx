"use client";

import React, { FC } from "react";
import { Line } from "react-konva";
import { DrawingLine as DrawingLineType } from "@/lib/drawing/types";

interface DrawingLineProps {
  line: DrawingLineType;
  isSelected: boolean;
  isHovered: boolean;
  layerOpacity?: number;
}

export const DrawingLine: FC<DrawingLineProps> = ({
  line,
  isSelected,
  isHovered,
  layerOpacity = 1,
}) => {
  // Apply layer opacity only for pen tool, not for eraser
  const lineOpacity = line.tool === "eraser" ? 1 : layerOpacity;

  return (
    <React.Fragment>
      <Line
        points={line.points}
        stroke={line.color}
        strokeWidth={line.strokeWidth}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={
          line.tool === "eraser" ? "destination-out" : "source-over"
        }
        opacity={lineOpacity}
      />
      {isSelected && line.tool !== "eraser" && (
        <Line
          points={line.points}
          stroke="#0066ff"
          strokeWidth={line.strokeWidth + 4}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          opacity={0.3}
          listening={false}
        />
      )}
      {isHovered && !isSelected && line.tool !== "eraser" && (
        <Line
          points={line.points}
          stroke="#0066ff"
          strokeWidth={line.strokeWidth + 4}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          opacity={0.25}
          listening={false}
        />
      )}
    </React.Fragment>
  );
};
