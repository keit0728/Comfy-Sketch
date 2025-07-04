export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformHandle {
  type: "corner" | "edge";
  position: "nw" | "ne" | "se" | "sw" | "n" | "e" | "s" | "w";
  x: number;
  y: number;
  cursor: string;
}

export interface TransformState {
  isTransforming: boolean;
  transformType: "scale" | "scaleX" | "scaleY" | null;
  startBounds: BoundingBox | null;
  currentScale: { x: number; y: number };
  anchorPoint: { x: number; y: number };
  startMousePos: { x: number; y: number } | null;
}
