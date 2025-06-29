"use client";

import React, { FC, RefObject } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";
import { DrawingLine as DrawingLineComponent } from "./drawing-line";
import { CursorDisplay } from "./cursor-display";
import { DrawingLine, Point } from "@/lib/drawing/types";

interface DrawingCanvasProps {
  dimensions: { width: number; height: number };
  lines: DrawingLine[];
  selectedLineId: string | null;
  cursorPosition: Point | null;
  stageRef: RefObject<Konva.Stage>;
  currentTool: "pen" | "eraser" | "select";
  brushSize: number;
  brushColor: string;
  onMouseDown: () => void;
  onMouseMove: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

export const DrawingCanvas: FC<DrawingCanvasProps> = ({
  dimensions,
  lines,
  selectedLineId,
  cursorPosition,
  stageRef,
  currentTool,
  brushSize,
  brushColor,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
}) => {
  return (
    <Stage
      width={dimensions.width}
      height={dimensions.height}
      onMouseDown={onMouseDown}
      onMousemove={onMouseMove}
      onMouseup={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onMouseDown}
      onTouchmove={onMouseMove}
      onTouchend={onMouseUp}
      ref={stageRef}
      style={{
        cursor:
          currentTool === "pen" || currentTool === "eraser"
            ? "none"
            : "default",
      }}
    >
      <Layer>
        {lines.map((line) => (
          <DrawingLineComponent
            key={line.id}
            line={line}
            isSelected={selectedLineId === line.id}
          />
        ))}
        <CursorDisplay
          position={cursorPosition}
          currentTool={currentTool}
          brushSize={brushSize}
          brushColor={brushColor}
        />
      </Layer>
    </Stage>
  );
};
