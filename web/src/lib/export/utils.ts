import { Layer, DrawingLine } from "../drawing/types";

export const getDefaultFilename = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `sketch-${year}${month}${day}-${hours}${minutes}${seconds}.png`;
};

export const exportCanvasAsPNG = async (
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create PNG blob"));
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      resolve();
    }, "image/png");
  });
};

export const renderLayersToCanvas = (
  layers: Layer[],
  lines: DrawingLine[],
  targetCanvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    background: string;
    includeHiddenLayers: boolean;
    sourceWidth: number;
    sourceHeight: number;
  },
): void => {
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;

  targetCanvas.width = options.width;
  targetCanvas.height = options.height;

  // Calculate scale factor
  const scaleX = options.width / options.sourceWidth;
  const scaleY = options.height / options.sourceHeight;

  // Clear canvas
  ctx.clearRect(0, 0, options.width, options.height);

  // Apply white background (always white for layer export)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, options.width, options.height);

  // Sort layers by order and render
  const sortedLayers = [...layers].sort((a, b) => a.order - b.order);

  sortedLayers.forEach((layer) => {
    if (!layer.visible && !options.includeHiddenLayers) return;

    ctx.save();

    // Apply layer opacity
    ctx.globalAlpha = layer.opacity;

    // Apply blend mode if supported
    if (layer.blendMode && layer.blendMode !== "normal") {
      ctx.globalCompositeOperation =
        layer.blendMode as GlobalCompositeOperation;
    }

    // Draw lines for this layer
    const layerLines = lines.filter((line) => line.layerId === layer.id);

    layerLines.forEach((line) => {
      ctx.save();

      if (line.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      }

      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.strokeWidth * scaleX; // Scale stroke width
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();

      for (let i = 0; i < line.points.length; i += 2) {
        const x = line.points[i] * scaleX;
        const y = line.points[i + 1] * scaleY;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  });
};
