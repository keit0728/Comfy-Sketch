import { DrawingLine, Layer } from "../drawing/types";

export interface DrawingData {
  lines: DrawingLine[];
  layers: Layer[];
  currentLayerId: string;
  version: string;
  timestamp: number;
}

export interface ToolSettings {
  currentTool: "pen" | "eraser" | "select";
  brushSize: number;
  brushColor: string;
}

export interface StorageData extends DrawingData {
  toolSettings?: ToolSettings;
}
