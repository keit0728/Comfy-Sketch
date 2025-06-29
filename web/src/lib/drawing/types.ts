export interface DrawingLine {
  id: string;
  points: number[];
  color: string;
  strokeWidth: number;
  tool: "pen" | "eraser";
  layerId: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface Point {
  x: number;
  y: number;
}
