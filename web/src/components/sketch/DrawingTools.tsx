"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Brush, Eraser, Move } from "lucide-react";
import {
  drawingToolAtom,
  appModeAtom,
  activeLayerIdAtom,
  selectedLayerIdAtom,
} from "@/stores/sketchStore";
import { useState } from "react";

const BRUSH_SIZES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 17, 20, 25, 30, 40, 50, 60, 70, 80, 90,
  100, 120, 150, 170, 200, 250, 300, 400, 500, 600,
];

export default function DrawingTools() {
  const t = useTranslations("common");
  const [drawingTool, setDrawingTool] = useAtom(drawingToolAtom);
  const [appMode, setAppMode] = useAtom(appModeAtom);
  const activeLayerId = useAtomValue(activeLayerIdAtom);
  const setSelectedLayerId = useSetAtom(selectedLayerIdAtom);
  const [showBrushSizes, setShowBrushSizes] = useState(false);

  const handleToolChange = (type: "brush" | "eraser") => {
    setDrawingTool({ ...drawingTool, type });
  };

  const handleSizeChange = (size: number) => {
    setDrawingTool({ ...drawingTool, size });
    setShowBrushSizes(false);
  };

  const handleOpacityChange = (opacity: number) => {
    setDrawingTool({ ...drawingTool, opacity });
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-1 mr-4">
        <Button
          variant={appMode === "transform" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setAppMode("transform");
            // Select the active layer when switching to transform mode
            if (activeLayerId) {
              setSelectedLayerId(activeLayerId);
            }
          }}
        >
          <Move className="w-4 h-4" />
        </Button>
        <Button
          variant={
            appMode === "draw" && drawingTool.type === "brush"
              ? "default"
              : "outline"
          }
          size="sm"
          onClick={() => {
            setAppMode("draw");
            handleToolChange("brush");
          }}
        >
          <Brush className="w-4 h-4" />
        </Button>
        <Button
          variant={
            appMode === "draw" && drawingTool.type === "eraser"
              ? "default"
              : "outline"
          }
          size="sm"
          onClick={() => {
            setAppMode("draw");
            handleToolChange("eraser");
          }}
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
          <div className="absolute top-full mt-1 p-6 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-96">
            <div className="grid grid-cols-8 gap-x-8 gap-y-4">
              {BRUSH_SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center">
                  <button
                    onClick={() => handleSizeChange(size)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 ${
                      drawingTool.size === size ? "bg-gray-300" : "bg-gray-50"
                    }`}
                    title={`${size}px`}
                  >
                    <div
                      className="bg-gray-600 rounded-full"
                      style={{
                        width: `${Math.min(size * 0.8, 32)}px`,
                        height: `${Math.min(size * 0.8, 32)}px`,
                      }}
                    />
                  </button>
                  <div className="text-xs text-gray-700 text-center mt-1">
                    {size}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {drawingTool.type === "brush" && (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            {t("sketch.color")}:
            <div
              className="w-6 h-6 rounded-full border border-gray-300"
              style={{ backgroundColor: drawingTool.color }}
            >
              <input
                type="color"
                value={drawingTool.color}
                onChange={(e) =>
                  setDrawingTool({ ...drawingTool, color: e.target.value })
                }
                className="w-full h-full cursor-pointer opacity-0"
              />
            </div>
            <span className="text-xs text-gray-500 font-mono w-16 inline-block">
              {drawingTool.color}
            </span>
          </label>
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
        {appMode === "transform"
          ? t("sketch.transform")
          : drawingTool.type === "brush"
            ? t("sketch.brush")
            : t("sketch.eraser")}{" "}
        {appMode === "draw" && (
          <>
            •{drawingTool.size}px •{Math.round(drawingTool.opacity * 100)}%
          </>
        )}
      </div>
    </div>
  );
}
