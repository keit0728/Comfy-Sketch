"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download, Trash2, RotateCcw, RotateCw } from "lucide-react";
import {
  layersAtom,
  activeLayerIdAtom,
  undoAtom,
  redoAtom,
  canUndoAtom,
  canRedoAtom,
  addToHistoryAtom,
  cameraBoundsAtom,
  canvasSizeAtom,
} from "@/stores/sketchStore";

// Utility function to detect content bounds of a canvas
function getContentBounds(
  canvas: HTMLCanvasElement,
): { x: number; y: number; width: number; height: number } | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;

  // Scan for non-transparent pixels
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      const alpha = data[index + 3];

      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // If no content found, return null
  if (minX > maxX || minY > maxY) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export default function SketchControls() {
  const t = useTranslations("common");
  const layers = useAtomValue(layersAtom);
  const activeLayerId = useAtomValue(activeLayerIdAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const addToHistory = useSetAtom(addToHistoryAtom);
  const cameraBounds = useAtomValue(cameraBoundsAtom);
  const canvasSize = useAtomValue(canvasSizeAtom);

  const activeLayer = layers.find((layer) => layer.id === activeLayerId);

  const handleClearLayer = () => {
    if (!activeLayer?.canvas) return;

    const ctx = activeLayer.canvas.getContext("2d");
    if (ctx) {
      // Save current state to history before clearing
      const imageData = ctx.getImageData(
        0,
        0,
        activeLayer.canvas.width,
        activeLayer.canvas.height,
      );
      addToHistory(activeLayer.id, imageData);

      // Clear the canvas to transparent
      ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      if (activeLayer.texture) {
        activeLayer.texture.needsUpdate = true;
      }
    }
  };

  const handleExportLayer = () => {
    if (!activeLayer?.canvas) return;

    // Determine the bounds to export
    let exportBounds: { x: number; y: number; width: number; height: number };

    if (activeLayer.transform) {
      // If layer has transform properties, calculate the pixel bounds
      // Convert from world space to canvas space

      const scaleX = canvasSize.width / cameraBounds.width;
      const scaleY = canvasSize.height / cameraBounds.height;

      const centerX = canvasSize.width / 2;
      const centerY = canvasSize.height / 2;

      // Convert world coordinates to canvas coordinates
      const pixelX =
        centerX +
        (activeLayer.transform.x - activeLayer.transform.width / 2) * scaleX;
      const pixelY =
        centerY -
        (activeLayer.transform.y + activeLayer.transform.height / 2) * scaleY;
      const pixelWidth = activeLayer.transform.width * scaleX;
      const pixelHeight = activeLayer.transform.height * scaleY;

      exportBounds = {
        x: Math.max(0, Math.round(pixelX)),
        y: Math.max(0, Math.round(pixelY)),
        width: Math.min(canvasSize.width - pixelX, Math.round(pixelWidth)),
        height: Math.min(canvasSize.height - pixelY, Math.round(pixelHeight)),
      };
    } else {
      // Auto-detect content bounds
      const contentBounds = getContentBounds(activeLayer.canvas);

      if (!contentBounds) {
        // If no content found, export a minimal 1x1 transparent image
        exportBounds = { x: 0, y: 0, width: 1, height: 1 };
      } else {
        exportBounds = contentBounds;
      }
    }

    // Create temporary canvas with the exact dimensions needed
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = exportBounds.width;
    tempCanvas.height = exportBounds.height;

    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // Draw the specific region of the source canvas
    // First draw normally to preserve the content
    ctx.drawImage(
      activeLayer.canvas,
      exportBounds.x,
      exportBounds.y,
      exportBounds.width,
      exportBounds.height,
      0,
      0,
      exportBounds.width,
      exportBounds.height,
    );

    // Create final canvas for vertical flip
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = exportBounds.width;
    finalCanvas.height = exportBounds.height;

    const finalCtx = finalCanvas.getContext("2d");
    if (!finalCtx) return;

    // Flip vertically to correct Three.js coordinate system
    finalCtx.scale(1, -1);
    finalCtx.translate(0, -finalCanvas.height);
    finalCtx.drawImage(tempCanvas, 0, 0);

    const link = document.createElement("a");
    link.download = `${activeLayer.name}.png`;
    link.href = finalCanvas.toDataURL();
    link.click();
  };

  const handleExportAll = () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvasSize.width;
    exportCanvas.height = canvasSize.height;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Save the context state
    ctx.save();

    // Flip vertically to correct Three.js coordinate system
    ctx.scale(1, -1);
    ctx.translate(0, -exportCanvas.height);

    // Fill background with white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Composite layers in zIndex order
    const sortedLayers = [...layers]
      .filter((layer) => layer.visible && layer.canvas)
      .sort((a, b) => a.zIndex - b.zIndex);

    sortedLayers.forEach((layer) => {
      if (layer.canvas) {
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });

    // Restore the context state
    ctx.restore();

    // Download
    const link = document.createElement("a");
    link.download = "sketch.png";
    link.href = exportCanvas.toDataURL();
    link.click();
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200">
      <Button
        variant="outline"
        size="sm"
        onClick={handleUndo}
        disabled={!canUndo}
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        {t("sketch.undo")}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleRedo}
        disabled={!canRedo}
      >
        <RotateCw className="w-4 h-4 mr-1" />
        {t("sketch.redo")}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleClearLayer}
        disabled={!activeLayer}
      >
        <Trash2 className="w-4 h-4 mr-1" />
        {t("sketch.clearLayer")}
      </Button>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportLayer}
        disabled={!activeLayer}
      >
        <Download className="w-4 h-4 mr-1" />
        {t("sketch.exportLayer")}
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={handleExportAll}
        disabled={layers.length === 0}
      >
        <Download className="w-4 h-4 mr-1" />
        {t("sketch.exportAll")}
      </Button>
    </div>
  );
}
