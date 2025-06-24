"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import SketchCanvas from "./SketchCanvas";
import LayerPanel from "./LayerPanel";
import DrawingTools from "./DrawingTools";
import SketchControls from "./SketchControls";
import { createLayerAtom, layersAtom } from "@/stores/sketchStore";

export default function SketchApp() {
  const [layers] = useAtom(layersAtom);
  const [, createLayer] = useAtom(createLayerAtom);

  // 初期レイヤーを作成
  useEffect(() => {
    if (layers.length === 0) {
      console.log("Creating initial layer...");
      createLayer("レイヤー 1");
    } else {
      console.log(`Layers count: ${layers.length}`);
    }
  }, [layers.length, createLayer]);

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* 上部ツールバー */}
      <div className="flex-shrink-0">
        <SketchControls />
        <DrawingTools />
      </div>
      
      {/* メインエリア */}
      <div className="flex-1 flex overflow-hidden">
        {/* キャンバスエリア */}
        <div className="flex-1 p-4">
          <SketchCanvas />
        </div>
        
        {/* レイヤーパネル */}
        <LayerPanel />
      </div>
    </div>
  );
}