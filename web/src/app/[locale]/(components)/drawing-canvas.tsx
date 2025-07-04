"use client";

import React, { FC, RefObject } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";
import { useAtomValue } from "jotai";
import { DrawingLine as DrawingLineComponent } from "./drawing-line";
import { CursorDisplay } from "./cursor-display";
import { BoundingBoxComponent } from "./bounding-box";
import { DrawingLine, Point } from "@/lib/drawing/types";
import { layersAtom } from "@/stores/layer-store";
import { transformStateAtom } from "@/stores/transform-store";
import { TransformHandle } from "@/lib/transform/types";
import { calculateBoundingBox } from "@/lib/transform/utils";

interface DrawingCanvasProps {
  dimensions: { width: number; height: number };
  lines: DrawingLine[];
  selectedLineId: string | null;
  selectedLineIds?: string[];
  hoveredLineIds: string[];
  cursorPosition: Point | null;
  stageRef: RefObject<Konva.Stage>;
  currentTool: "pen" | "eraser" | "select";
  brushSize: number;
  brushColor: string;
  onMouseDown: () => void;
  onMouseMove: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onHandleMouseDown?: (
    handle: TransformHandle,
    e: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
}

export const DrawingCanvas: FC<DrawingCanvasProps> = ({
  dimensions,
  lines,
  selectedLineId,
  selectedLineIds = [],
  hoveredLineIds,
  cursorPosition,
  stageRef,
  currentTool,
  brushSize,
  brushColor,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onHandleMouseDown,
}) => {
  const layers = useAtomValue(layersAtom);
  const transformState = useAtomValue(transformStateAtom);

  // Group lines by layer ID
  const linesByLayer = lines.reduce(
    (acc, line) => {
      const layerId = line.layerId;
      if (!acc[layerId]) {
        acc[layerId] = [];
      }
      acc[layerId].push(line);
      return acc;
    },
    {} as Record<string, DrawingLine[]>,
  );

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
      {[...layers].reverse().map((layer) => {
        const layerLines = linesByLayer[layer.id];
        if (!layer.visible || !layerLines || layerLines.length === 0) {
          return null;
        }
        return (
          <Layer key={layer.id} opacity={layer.opacity}>
            {layerLines.map((line) => (
              <DrawingLineComponent
                key={line.id}
                line={line}
                isSelected={
                  selectedLineId === line.id ||
                  selectedLineIds.includes(line.id)
                }
                isHovered={hoveredLineIds.includes(line.id)}
                layerOpacity={1}
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
      {/* Bounding box layer */}
      {selectedLineIds.length > 0 && currentTool === "select" && (
        <Layer>
          {(() => {
            const selectedLines = lines.filter((line) =>
              selectedLineIds.includes(line.id),
            );
            const boundingBox = calculateBoundingBox(selectedLines);
            if (boundingBox && onHandleMouseDown) {
              return (
                <BoundingBoxComponent
                  boundingBox={boundingBox}
                  onHandleMouseDown={onHandleMouseDown}
                  currentScale={transformState.currentScale}
                  isTransforming={transformState.isTransforming}
                />
              );
            }
            return null;
          })()}
        </Layer>
      )}
    </Stage>
  );
};
