export interface ExportOptions {
  filename: string;
  width: number;
  height: number;
  background: "white"; // Always white background
  includeHiddenLayers: false; // Never include hidden layers
}
