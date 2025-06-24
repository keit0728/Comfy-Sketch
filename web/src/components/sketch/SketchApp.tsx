"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
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
  const [layers] = useAtom(layersAtom);
  const [, createLayer] = useAtom(createLayerAtom);
  const [, undo] = useAtom(undoAtom);
  const [, redo] = useAtom(redoAtom);

  // Create initial layer
  useEffect(() => {
    if (layers.length === 0) {
      createLayer("レイヤー 1");
    } else {
      console.log(`Layers count: ${layers.length}`);
    }
  }, [layers.length, createLayer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "z" && !event.shiftKey) {
          event.preventDefault();
          undo();
        } else if ((event.key === "z" && event.shiftKey) || event.key === "y") {
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
