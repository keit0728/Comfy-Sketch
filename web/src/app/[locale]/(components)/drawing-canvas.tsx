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
  selectedLineIds?: string[];
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
  selectedLineIds = [],
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
  // Group lines by layer ID and sort layers in reverse order (higher layer ID on top)
  const linesByLayer = lines.reduce(
    (acc, line) => {
      const layerId = (line.layerId || 1).toString();
      if (!acc[layerId]) {
        acc[layerId] = [];
      }
      acc[layerId].push(line);
      return acc;
    },
    {} as Record<string, DrawingLine[]>,
  );

  // Sort layer IDs so that higher layer numbers are rendered first (and thus appear below)
  const sortedLayerIds = Object.keys(linesByLayer).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    return numA - numB; // Sort ascending - layer 1 will be rendered last and appear on top
  });

  // If there are no lines, render empty canvas with just cursor
  if (sortedLayerIds.length === 0) {
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
          <CursorDisplay
            position={cursorPosition}
            currentTool={currentTool}
            brushSize={brushSize}
            brushColor={brushColor}
          />
        </Layer>
      </Stage>
    );
  }

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
      {sortedLayerIds.reverse().map((layerId) => {
        if (linesByLayer[layerId] === undefined) {
          return null;
        }
        return (
          <Layer key={layerId}>
            {linesByLayer[layerId].map((line) => (
              <DrawingLineComponent
                key={line.id}
                line={line}
                isSelected={
                  selectedLineId === line.id ||
                  selectedLineIds.includes(line.id)
                }
              />
            ))}
          </Layer>
        );
      })}
      <Layer>
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
