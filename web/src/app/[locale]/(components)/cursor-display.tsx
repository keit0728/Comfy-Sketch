"use client";

import React, { FC } from "react";
import { Circle } from "react-konva";
import { Point } from "@/lib/drawing/types";

interface CursorDisplayProps {
  position: Point | null;
  currentTool: "pen" | "eraser" | "select";
  brushSize: number;
  brushColor: string;
}

export const CursorDisplay: FC<CursorDisplayProps> = ({
  position,
  currentTool,
  brushSize,
  brushColor,
}) => {
  if (!position || currentTool === "select") {
    return null;
  }

  return (
    <Circle
      x={position.x}
      y={position.y}
      radius={currentTool === "eraser" ? brushSize : brushSize / 2}
      stroke={currentTool === "eraser" ? "#FF0000" : brushColor}
      strokeWidth={2}
      fill="transparent"
      listening={false}
    />
  );
};
