"use client";

import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Download, Trash2, RotateCcw } from "lucide-react";
import { layersAtom, activeLayerIdAtom } from "@/stores/sketchStore";

export default function SketchControls() {
  const [layers] = useAtom(layersAtom);
  const [activeLayerId] = useAtom(activeLayerIdAtom);

  const activeLayer = layers.find(layer => layer.id === activeLayerId);

  const handleClearLayer = () => {
    if (!activeLayer?.canvas) return;
    
    const ctx = activeLayer.canvas.getContext("2d");
    if (ctx) {
      // Clear the canvas and reinitialize with white background
      ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      if (activeLayer.texture) {
        activeLayer.texture.needsUpdate = true;
      }
    }
  };

  const handleExportLayer = () => {
    if (!activeLayer?.canvas) return;
    
    const link = document.createElement("a");
    link.download = `${activeLayer.name}.png`;
    link.href = activeLayer.canvas.toDataURL();
    link.click();
  };

  const handleExportAll = () => {
    const canvasSize = { width: 800, height: 600 };
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvasSize.width;
    exportCanvas.height = canvasSize.height;
    
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Fill background with white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Composite layers in zIndex order
    const sortedLayers = [...layers]
      .filter(layer => layer.visible && layer.canvas)
      .sort((a, b) => a.zIndex - b.zIndex);

    sortedLayers.forEach(layer => {
      if (layer.canvas) {
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });

    // Download
    const link = document.createElement("a");
    link.download = "sketch.png";
    link.href = exportCanvas.toDataURL();
    link.click();
  };

  const handleUndo = () => {
    // TODO: Implementation of Undo function
    console.log("Undo function is not implemented");
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200">
      <Button
        variant="outline"
        size="sm"
        onClick={handleUndo}
        disabled={true}
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        元に戻す
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleClearLayer}
        disabled={!activeLayer}
      >
        <Trash2 className="w-4 h-4 mr-1" />
        レイヤーをクリア
      </Button>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportLayer}
        disabled={!activeLayer}
      >
        <Download className="w-4 h-4 mr-1" />
        レイヤーを保存
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={handleExportAll}
        disabled={layers.length === 0}
      >
        <Download className="w-4 h-4 mr-1" />
        全体を保存
      </Button>
    </div>
  );
}