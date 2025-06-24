"use client";

import { Canvas, ThreeEvent } from "@react-three/fiber";
import { useAtom } from "jotai";
import { useRef, useCallback, useEffect } from "react";
import * as THREE from "three";
import {
  layersAtom,
  activeLayerIdAtom,
  drawingToolAtom,
  drawingStateAtom,
  canvasSizeAtom,
} from "@/stores/sketchStore";

interface LayerPlaneProps {
  layer: {
    id: string;
    name: string;
    visible: boolean;
    opacity: number;
    zIndex: number;
    canvas: HTMLCanvasElement | null;
    texture: THREE.CanvasTexture | null;
  };
  isActive: boolean;
  onDraw: (event: ThreeEvent<PointerEvent>, layer: LayerPlaneProps["layer"]) => void;
}

function LayerPlane({ layer, isActive, onDraw }: LayerPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (layer.texture && meshRef.current) {
      layer.texture.needsUpdate = true;
    }
  }, [layer.texture]);

  if (!layer.visible || !layer.texture) return null;

  const handlePointerEvent = (event: ThreeEvent<PointerEvent>) => {
    console.log(`Pointer event: ${event.type}, isActive: ${isActive}, layer: ${layer.name}`);
    if (isActive) {
      event.stopPropagation();
      onDraw(event, layer);
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, layer.zIndex * 0.001]}
      onPointerDown={handlePointerEvent}
      onPointerMove={handlePointerEvent}
      onPointerUp={handlePointerEvent}
    >
      <planeGeometry args={[8, 6]} />
      <meshBasicMaterial
        map={layer.texture}
        transparent
        opacity={layer.opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function SketchCanvas() {
  const [layers] = useAtom(layersAtom);
  const [activeLayerId] = useAtom(activeLayerIdAtom);
  const [drawingTool] = useAtom(drawingToolAtom);
  const [drawingState, setDrawingState] = useAtom(drawingStateAtom);
  const [canvasSize] = useAtom(canvasSizeAtom);

  const activeLayer = layers.find(layer => layer.id === activeLayerId);

  const handleDraw = useCallback((event: ThreeEvent<PointerEvent>, layer: LayerPlaneProps["layer"]) => {
    if (!layer.canvas || layer.id !== activeLayerId) return;

    const ctx = layer.canvas.getContext("2d");
    if (!ctx) return;

    // Three.jsの座標をキャンバス座標に変換
    // PlaneGeometryは[-4, 4] x [-3, 3]の範囲なので、それに合わせて変換
    // Y座標は上下反転させる必要がある（Three.jsとCanvas2Dの座標系の違い）
    const x = ((event.point.x + 4) / 8) * canvasSize.width;
    const y = ((event.point.y + 3) / 6) * canvasSize.height;

    console.log(`Event: ${event.type}, Three.js point: (${event.point.x.toFixed(2)}, ${event.point.y.toFixed(2)}), Canvas coords: (${x.toFixed(0)}, ${y.toFixed(0)})`); // デバッグ用

    if (event.type === "pointerdown") {
      setDrawingState({ isDrawing: true, lastPoint: { x, y } });
      
      // 点を描画
      if (drawingTool.type === "eraser") {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "white";
        ctx.globalAlpha = 1;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = drawingTool.color;
        ctx.globalAlpha = drawingTool.opacity;
      }
      ctx.beginPath();
      ctx.arc(x, y, drawingTool.size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      if (layer.texture) {
        layer.texture.needsUpdate = true;
      }
    } else if (event.type === "pointermove" && drawingState.isDrawing && drawingState.lastPoint) {
      // 線を描画
      if (drawingTool.type === "eraser") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "white";
        ctx.globalAlpha = 1;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = drawingTool.color;
        ctx.globalAlpha = drawingTool.opacity;
      }
      ctx.lineWidth = drawingTool.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      ctx.beginPath();
      ctx.moveTo(drawingState.lastPoint.x, drawingState.lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      setDrawingState({ ...drawingState, lastPoint: { x, y } });
      if (layer.texture) {
        layer.texture.needsUpdate = true;
      }
    } else if (event.type === "pointerup") {
      setDrawingState({ isDrawing: false, lastPoint: null });
    }
  }, [activeLayerId, drawingTool, drawingState, setDrawingState, canvasSize]);

  return (
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      <Canvas
        camera={{ 
          position: [0, 0, 10],
          left: -4,
          right: 4,
          top: 3,
          bottom: -3,
          near: 0.1,
          far: 1000
        }}
        orthographic
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={1} />
        
        {/* 背景の透明プレーン（クリック検出用） */}
        {activeLayer && (
          <mesh
            position={[0, 0, -0.001]}
            onPointerDown={(event) => handleDraw(event, activeLayer)}
            onPointerMove={(event) => handleDraw(event, activeLayer)}
            onPointerUp={(event) => handleDraw(event, activeLayer)}
          >
            <planeGeometry args={[8, 6]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}
        
        {layers
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(layer => (
            <LayerPlane
              key={layer.id}
              layer={layer}
              isActive={false} // 背景プレーンでイベントを処理するため
              onDraw={(event) => handleDraw(event, layer)}
            />
          ))}
      </Canvas>
    </div>
  );
}