"use client";

import React, { FC } from "react";
import { Rect, Group, Text } from "react-konva";
import Konva from "konva";
import { BoundingBox, TransformHandle } from "@/lib/transform/types";
import { getTransformHandles } from "@/lib/transform/utils";

interface BoundingBoxComponentProps {
  boundingBox: BoundingBox;
  onHandleMouseDown: (
    handle: TransformHandle,
    e: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
  currentScale?: { x: number; y: number };
  isTransforming?: boolean;
}

export const BoundingBoxComponent: FC<BoundingBoxComponentProps> = ({
  boundingBox,
  onHandleMouseDown,
  currentScale = { x: 1, y: 1 },
  isTransforming = false,
}) => {
  const handles = getTransformHandles(boundingBox);
  const handleSize = 12;
  const handleHoverSize = 16;

  return (
    <Group>
      {/* Bounding box outline */}
      <Rect
        x={boundingBox.x}
        y={boundingBox.y}
        width={boundingBox.width}
        height={boundingBox.height}
        stroke="#0066ff"
        strokeWidth={1}
        dash={[5, 5]}
        fill="transparent"
        listening={false}
      />

      {/* Handles */}
      {handles.map((handle, index) => (
        <Rect
          key={index}
          x={handle.x}
          y={handle.y}
          width={handleSize}
          height={handleSize}
          fill="white"
          stroke="#0066ff"
          strokeWidth={2}
          cornerRadius={handle.type === "corner" ? 0 : 2}
          onMouseDown={(e) => onHandleMouseDown(handle, e)}
          onMouseEnter={(e) => {
            const target = e.target;
            target.width(handleHoverSize);
            target.height(handleHoverSize);
            target.x(handle.x - (handleHoverSize - handleSize) / 2);
            target.y(handle.y - (handleHoverSize - handleSize) / 2);
            document.body.style.cursor = handle.cursor;
          }}
          onMouseLeave={(e) => {
            const target = e.target;
            target.width(handleSize);
            target.height(handleSize);
            target.x(handle.x);
            target.y(handle.y);
            document.body.style.cursor = "default";
          }}
        />
      ))}

      {/* Scale percentage display */}
      {isTransforming && (
        <Group>
          <Rect
            x={boundingBox.x + boundingBox.width / 2 - 40}
            y={boundingBox.y - 30}
            width={80}
            height={20}
            fill="rgba(0, 0, 0, 0.7)"
            cornerRadius={4}
          />
          <Text
            x={boundingBox.x + boundingBox.width / 2 - 40}
            y={boundingBox.y - 30}
            width={80}
            height={20}
            text={`${Math.round(currentScale.x * 100)}%`}
            fontSize={12}
            fill="white"
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Group>
  );
};
