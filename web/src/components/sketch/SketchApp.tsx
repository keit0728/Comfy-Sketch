"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import SketchCanvas from "./SketchCanvas";
import LayerPanel from "./LayerPanel";
import DrawingTools from "./DrawingTools";
import SketchControls from "./SketchControls";
import {
  createLayerAtom,
  layersAtom,
  undoAtom,
  redoAtom,
} from "@/stores/sketchStore";

export default function SketchApp() {
  const t = useTranslations("common");
  const [layers] = useAtom(layersAtom);
  const [, createLayer] = useAtom(createLayerAtom);
  const [, undo] = useAtom(undoAtom);
  const [, redo] = useAtom(redoAtom);

  // Create initial layer
  useEffect(() => {
    if (layers.length === 0) {
      createLayer(`${t("sketch.layer")} 1`);
    }
  }, [layers.length, createLayer, t]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === "z" && !event.shiftKey) {
          event.preventDefault();
          undo();
        } else if (
          (event.key.toLowerCase() === "z" && event.shiftKey) ||
          event.key === "y"
        ) {
          event.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Top toolbar */}
      <div className="flex-shrink-0">
        <SketchControls />
        <DrawingTools />
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 p-4">
          <SketchCanvas />
        </div>

        {/* Layer panel */}
        <LayerPanel />
      </div>
    </div>
  );
}
