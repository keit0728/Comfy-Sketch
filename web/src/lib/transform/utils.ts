import { DrawingLine } from "@/lib/drawing/types";
import { BoundingBox, TransformHandle } from "./types";

export const calculateBoundingBox = (
  lines: DrawingLine[],
): BoundingBox | null => {
  if (lines.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxStrokeWidth = 0;

  lines.forEach((line) => {
    // Track the maximum stroke width
    maxStrokeWidth = Math.max(maxStrokeWidth, line.strokeWidth);

    for (let i = 0; i < line.points.length; i += 2) {
      const x = line.points[i];
      const y = line.points[i + 1];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  });

  // Add half of the stroke width as padding to ensure the entire line is contained
  const padding = maxStrokeWidth / 2;

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
};

export const getTransformHandles = (bbox: BoundingBox): TransformHandle[] => {
  const { x, y, width, height } = bbox;
  const handleSize = 12;
  const halfSize = handleSize / 2;

  return [
    // Corner handles only for aspect ratio maintained scaling
    {
      type: "corner",
      position: "nw",
      x: x - halfSize,
      y: y - halfSize,
      cursor: "nwse-resize",
    },
    {
      type: "corner",
      position: "ne",
      x: x + width - halfSize,
      y: y - halfSize,
      cursor: "nesw-resize",
    },
    {
      type: "corner",
      position: "se",
      x: x + width - halfSize,
      y: y + height - halfSize,
      cursor: "nwse-resize",
    },
    {
      type: "corner",
      position: "sw",
      x: x - halfSize,
      y: y + height - halfSize,
      cursor: "nesw-resize",
    },
  ] as TransformHandle[];
};

export const getAnchorPoint = (
  bbox: BoundingBox,
  handlePosition: string,
): { x: number; y: number } => {
  const { x, y, width, height } = bbox;

  switch (handlePosition) {
    case "nw":
      return { x: x + width, y: y + height };
    case "ne":
      return { x, y: y + height };
    case "se":
      return { x, y };
    case "sw":
      return { x: x + width, y };
    case "n":
      return { x: x + width / 2, y: y + height };
    case "e":
      return { x, y: y + height / 2 };
    case "s":
      return { x: x + width / 2, y };
    case "w":
      return { x: x + width, y: y + height / 2 };
    default:
      return { x: x + width / 2, y: y + height / 2 };
  }
};

export const calculateScaleFromDrag = (
  _startBounds: BoundingBox,
  anchorPoint: { x: number; y: number },
  startMousePos: { x: number; y: number },
  currentMousePos: { x: number; y: number },
): { x: number; y: number } => {
  // Always maintain aspect ratio
  // Calculate distance from anchor to start and current positions
  const startDistance = Math.sqrt(
    Math.pow(startMousePos.x - anchorPoint.x, 2) +
      Math.pow(startMousePos.y - anchorPoint.y, 2),
  );
  const currentDistance = Math.sqrt(
    Math.pow(currentMousePos.x - anchorPoint.x, 2) +
      Math.pow(currentMousePos.y - anchorPoint.y, 2),
  );

  const scale = startDistance > 0 ? currentDistance / startDistance : 1;

  // Clamp scale value
  const clampedScale = Math.max(0.1, Math.min(10, scale));

  return { x: clampedScale, y: clampedScale };
};

export const transformLine = (
  line: DrawingLine,
  scale: { x: number; y: number },
  anchorPoint: { x: number; y: number },
): DrawingLine => {
  const transformedPoints: number[] = [];

  for (let i = 0; i < line.points.length; i += 2) {
    const x = line.points[i];
    const y = line.points[i + 1];

    // Transform relative to anchor point
    const relativeX = x - anchorPoint.x;
    const relativeY = y - anchorPoint.y;

    // Apply scale
    const scaledX = relativeX * scale.x;
    const scaledY = relativeY * scale.y;

    // Convert back to absolute coordinates
    transformedPoints.push(anchorPoint.x + scaledX);
    transformedPoints.push(anchorPoint.y + scaledY);
  }

  return {
    ...line,
    points: transformedPoints,
  };
};

export const isPointInBoundingBox = (
  point: { x: number; y: number },
  bbox: BoundingBox,
): boolean => {
  return (
    point.x >= bbox.x &&
    point.x <= bbox.x + bbox.width &&
    point.y >= bbox.y &&
    point.y <= bbox.y + bbox.height
  );
};
