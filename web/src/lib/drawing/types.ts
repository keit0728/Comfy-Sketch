export interface DrawingLine {
  id: string;
  points: number[];
  color: string;
  strokeWidth: number;
  tool: "pen" | "eraser";
}

export interface Point {
  x: number;
  y: number;
}
