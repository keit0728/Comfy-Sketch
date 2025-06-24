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
} from "@/stores/sketchStore";

export default function SketchControls() {
  const t = useTranslations("common");
  const layers = useAtomValue(layersAtom);
  const activeLayerId = useAtomValue(activeLayerIdAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const addToHistory = useSetAtom(addToHistoryAtom);

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

    // Create temporary canvas to flip the image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = activeLayer.canvas.width;
    tempCanvas.height = activeLayer.canvas.height;
    
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;
    
    // Flip vertically to correct Three.js coordinate system
    ctx.scale(1, -1);
    ctx.translate(0, -tempCanvas.height);
    ctx.drawImage(activeLayer.canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `${activeLayer.name}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
  };

  const handleExportAll = () => {
    const canvasSize = { width: 800, height: 600 };
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
