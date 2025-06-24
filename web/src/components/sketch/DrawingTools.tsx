"use client";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Brush, Eraser, Palette } from "lucide-react";
import { drawingToolAtom } from "@/stores/sketchStore";
import { useState } from "react";

const BRUSH_SIZES = [1, 3, 5, 10, 15, 20, 30];
const PRESET_COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#008000",
  "#000080",
];

export default function DrawingTools() {
  const t = useTranslations("common");
  const [drawingTool, setDrawingTool] = useAtom(drawingToolAtom);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrushSizes, setShowBrushSizes] = useState(false);

  const handleToolChange = (type: "brush" | "eraser") => {
    setDrawingTool({ ...drawingTool, type });
  };

  const handleSizeChange = (size: number) => {
    setDrawingTool({ ...drawingTool, size });
    setShowBrushSizes(false);
  };

  const handleColorChange = (color: string) => {
    setDrawingTool({ ...drawingTool, color });
    setShowColorPicker(false);
  };

  const handleOpacityChange = (opacity: number) => {
    setDrawingTool({ ...drawingTool, opacity });
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-1 mr-4">
        <Button
          variant={drawingTool.type === "brush" ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolChange("brush")}
        >
          <Brush className="w-4 h-4" />
        </Button>
        <Button
          variant={drawingTool.type === "eraser" ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolChange("eraser")}
        >
          <Eraser className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBrushSizes(!showBrushSizes)}
        >
          {t("sketch.size")}: {drawingTool.size}px
        </Button>
        {showBrushSizes && (
          <div className="absolute top-full mt-1 p-2 bg-white border rounded-md shadow-lg z-10">
            <div className="grid grid-cols-4 gap-1">
              {BRUSH_SIZES.map((size) => (
                <Button
                  key={size}
                  variant={drawingTool.size === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSizeChange(size)}
                  className="w-12 h-8"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {drawingTool.type === "brush" && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-2"
          >
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: drawingTool.color }}
            />
            <Palette className="w-4 h-4" />
          </Button>
          {showColorPicker && (
            <div className="absolute top-full mt-1 p-3 bg-white border rounded-md shadow-lg z-10">
              <div className="grid grid-cols-5 gap-2 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        drawingTool.color === color ? "#3b82f6" : "#d1d5db",
                    }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={drawingTool.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={drawingTool.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="text-xs border rounded px-2 py-1 w-20"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm">{t("sketch.opacity")}:</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={drawingTool.opacity}
          onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
          className="w-20"
        />
        <span className="text-sm w-8">
          {Math.round(drawingTool.opacity * 100)}%
        </span>
      </div>

      <div className="ml-auto text-xs text-gray-500">
        {drawingTool.type === "brush" ? t("sketch.brush") : t("sketch.eraser")}{" "}
        •{drawingTool.size}px •{Math.round(drawingTool.opacity * 100)}%
      </div>
    </div>
  );
}
