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
  
  // Use refs to track drawing state immediately without waiting for React state updates
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentTargetRef = useRef<Element | null>(null);

  // Sync refs with state
  useEffect(() => {
    isDrawingRef.current = drawingState.isDrawing;
    lastPointRef.current = drawingState.lastPoint;
  }, [drawingState]);

  // Robust drawing state management with refs
  const stopDrawing = useCallback(() => {
    if (isDrawingRef.current) {
      console.log('Stopping drawing - resetting state');
      isDrawingRef.current = false;
      lastPointRef.current = null;
      setDrawingState({ isDrawing: false, lastPoint: null });
      
      // Release pointer capture if active
      if (currentTargetRef.current && 'releasePointerCapture' in currentTargetRef.current) {
        try {
          (currentTargetRef.current as HTMLElement).releasePointerCapture(-1);
        } catch {
          // Ignore errors - pointer might already be released
        }
      }
      currentTargetRef.current = null;
    }
  }, [setDrawingState]);

  // Global event listeners for robust pointer event handling
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      console.log('Global pointerup event');
      stopDrawing();
    };

    const handleGlobalPointerCancel = () => {
      console.log('Global pointercancel event');
      stopDrawing();
    };

    // Also handle mouse events as fallback
    const handleGlobalMouseUp = () => {
      console.log('Global mouseup event');
      stopDrawing();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden - stopping drawing');
        stopDrawing();
      }
    };

    document.addEventListener('pointerup', handleGlobalPointerUp, true);
    document.addEventListener('pointercancel', handleGlobalPointerCancel, true);
    document.addEventListener('mouseup', handleGlobalMouseUp, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp, true);
      document.removeEventListener('pointercancel', handleGlobalPointerCancel, true);
      document.removeEventListener('mouseup', handleGlobalMouseUp, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopDrawing]);

  const handleDraw = useCallback((event: ThreeEvent<PointerEvent>, layer: LayerPlaneProps["layer"]) => {
    if (!layer.canvas || layer.id !== activeLayerId) return;

    const ctx = layer.canvas.getContext("2d");
    if (!ctx) return;

    // Convert Three.js coordinates to canvas coordinates
    const x = ((event.point.x + 4) / 8) * canvasSize.width;
    const y = ((event.point.y + 3) / 6) * canvasSize.height;

    console.log(`Event: ${event.type}, Three.js point: (${event.point.x.toFixed(2)}, ${event.point.y.toFixed(2)}), Canvas coords: (${x.toFixed(0)}, ${y.toFixed(0)}), isDrawing: ${isDrawingRef.current}`);

    if (event.type === "pointerdown") {
      // Set pointer capture to ensure we receive all subsequent events
      const target = event.nativeEvent.target as Element;
      if (target && 'setPointerCapture' in target) {
        try {
          (target as HTMLElement).setPointerCapture(event.nativeEvent.pointerId);
          currentTargetRef.current = target;
          console.log('Pointer capture set');
        } catch (error) {
          console.warn('Failed to set pointer capture:', error);
        }
      }

      // Update both refs and state immediately
      isDrawingRef.current = true;
      lastPointRef.current = { x, y };
      setDrawingState({ isDrawing: true, lastPoint: { x, y } });
      
      // Draw initial point
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
    } else if (event.type === "pointermove" && isDrawingRef.current && lastPointRef.current) {
      // Use refs for immediate state access
      const lastPoint = lastPointRef.current;
      
      // Draw line
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
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Update refs and state
      lastPointRef.current = { x, y };
      setDrawingState(prev => ({ ...prev, lastPoint: { x, y } }));
      
      if (layer.texture) {
        layer.texture.needsUpdate = true;
      }
    }
    // Remove pointerup handling here - it's now handled by global listeners
  }, [activeLayerId, drawingTool, setDrawingState, canvasSize]);

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
        
        {/* Background transparent plane (for click detection) */}
        {activeLayer && (
          <mesh
            position={[0, 0, -0.001]}
            onPointerDown={(event) => handleDraw(event, activeLayer)}
            onPointerMove={(event) => handleDraw(event, activeLayer)}
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
              isActive={false} // Process events with background plane
              onDraw={(event) => handleDraw(event, layer)}
            />
          ))}
      </Canvas>
    </div>
  );
}