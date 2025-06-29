import { DrawingLine, Point } from "@/lib/drawing/types";

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const DEFAULT_LAYER_ID = "default-layer";

export const isPointNearLine = (point: Point, line: DrawingLine) => {
  // Use half of the line thickness plus additional margin as threshold
  const threshold = line.strokeWidth / 2 + 5;

  for (let i = 0; i < line.points.length - 2; i += 2) {
    const x1 = line.points[i];
    const y1 = line.points[i + 1];
    const x2 = line.points[i + 2];
    const y2 = line.points[i + 3];

    // Calculate distance from point to line segment
    const A = point.x - x1;
    const B = point.y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= threshold) {
      return true;
    }
  }
  return false;
};

export const findRelatedEraserLines = (
  selectedLine: DrawingLine,
  allLines: DrawingLine[],
): string[] => {
  const relatedIds: string[] = [];

  // Find all eraser lines that intersect with the selected line
  for (const line of allLines) {
    if (line.tool === "eraser" && line.id !== selectedLine.id) {
      // Check if any eraser points overlap with the selected line
      for (let i = 0; i < line.points.length - 1; i += 2) {
        const point = { x: line.points[i], y: line.points[i + 1] };
        if (isPointNearLine(point, selectedLine)) {
          relatedIds.push(line.id);
          break;
        }
      }
    }
  }

  return relatedIds;
};

export const findRelatedDrawingLines = (
  eraserLine: DrawingLine,
  allLines: DrawingLine[],
): string[] => {
  const relatedIds: string[] = [];

  // Find all drawing lines that the eraser line intersects with
  for (const line of allLines) {
    if (line.tool !== "eraser" && line.id !== eraserLine.id) {
      // Check if any eraser points overlap with the drawing line
      for (let i = 0; i < eraserLine.points.length - 1; i += 2) {
        const point = { x: eraserLine.points[i], y: eraserLine.points[i + 1] };
        if (isPointNearLine(point, line)) {
          relatedIds.push(line.id);
          break;
        }
      }
    }
  }

  return relatedIds;
};
