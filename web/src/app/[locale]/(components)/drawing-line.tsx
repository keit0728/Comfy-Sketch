"use client";

import React, { FC } from "react";
import { Line } from "react-konva";
import { DrawingLine as DrawingLineType } from "@/lib/drawing/types";

interface DrawingLineProps {
  line: DrawingLineType;
  isSelected: boolean;
  isHovered: boolean;
}

export const DrawingLine: FC<DrawingLineProps> = ({
  line,
  isSelected,
  isHovered,
}) => {
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
