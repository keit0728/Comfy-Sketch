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
  addToHistoryAtom,
  cameraBoundsAtom,
  resizeCanvasesAtom,
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
  onDraw: (
    event: ThreeEvent<PointerEvent>,
    layer: LayerPlaneProps["layer"],
  ) => void;
}

function LayerPlane({
  layer,
  isActive,
  onDraw,
  cameraBounds = { width: 8, height: 6 },
}: LayerPlaneProps & { cameraBounds?: { width: number; height: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (layer.texture && meshRef.current) {
      layer.texture.needsUpdate = true;
    }
  }, [layer.texture]);

  if (!layer.visible || !layer.texture) return null;

  const handlePointerEvent = (event: ThreeEvent<PointerEvent>) => {
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
      <planeGeometry args={[cameraBounds.width, cameraBounds.height]} />
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
  const [, addToHistory] = useAtom(addToHistoryAtom);
  const [cameraBounds, setCameraBounds] = useAtom(cameraBoundsAtom);
  const [, resizeCanvases] = useAtom(resizeCanvasesAtom);

  const activeLayer = layers.find((layer) => layer.id === activeLayerId);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  // Use refs to track drawing state immediately without waiting for React state updates
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentTargetRef = useRef<Element | null>(null);
  const wasDrawingRef = useRef(false); // Track if actual drawing occurred
  const drawingLayerRef = useRef<string | null>(null); // Track which layer was being drawn on

  // Sync refs with state
  useEffect(() => {
    isDrawingRef.current = drawingState.isDrawing;
    lastPointRef.current = drawingState.lastPoint;
  }, [drawingState]);

  // Robust drawing state management with refs
  const stopDrawing = useCallback(() => {
    if (isDrawingRef.current) {
      // Save drawing completion state to history if actual drawing occurred
      if (wasDrawingRef.current && drawingLayerRef.current) {
        const targetLayer = layers.find(
          (layer) => layer.id === drawingLayerRef.current,
        );

        if (targetLayer?.canvas) {
          const ctx = targetLayer.canvas.getContext("2d");
          if (ctx) {
            const imageData = ctx.getImageData(
              0,
              0,
              targetLayer.canvas.width,
              targetLayer.canvas.height,
            );
            addToHistory(targetLayer.id, imageData);
          }
        }
      }

      // Reset drawing state
      isDrawingRef.current = false;
      lastPointRef.current = null;
      wasDrawingRef.current = false;
      drawingLayerRef.current = null;
      setDrawingState({ isDrawing: false, lastPoint: null });

      // Release pointer capture if active
      if (
        currentTargetRef.current &&
        "releasePointerCapture" in currentTargetRef.current
      ) {
        try {
          (currentTargetRef.current as HTMLElement).releasePointerCapture(-1);
        } catch {
          // Ignore errors - pointer might already be released
        }
      }
      currentTargetRef.current = null;
    }
  }, [setDrawingState, addToHistory, layers]);

  // Global event listeners for robust pointer event handling
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      stopDrawing();
    };

    const handleGlobalPointerCancel = () => {
      stopDrawing();
    };

    // Also handle mouse events as fallback
    const handleGlobalMouseUp = () => {
      stopDrawing();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopDrawing();
      }
    };

    document.addEventListener("pointerup", handleGlobalPointerUp, true);
    document.addEventListener("pointercancel", handleGlobalPointerCancel, true);
    document.addEventListener("mouseup", handleGlobalMouseUp, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("pointerup", handleGlobalPointerUp, true);
      document.removeEventListener(
        "pointercancel",
        handleGlobalPointerCancel,
        true,
      );
      document.removeEventListener("mouseup", handleGlobalMouseUp, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stopDrawing]);

  const handleDraw = useCallback(
    (event: ThreeEvent<PointerEvent>, layer: LayerPlaneProps["layer"]) => {
      if (!layer.canvas || layer.id !== activeLayerId) return;

      const ctx = layer.canvas.getContext("2d");
      if (!ctx) return;

      // Convert Three.js coordinates to canvas coordinates using dynamic camera bounds
      const bounds = cameraBounds;
      // Normalize coordinates to [0, 1] range
      const normalizedX = (event.point.x + bounds.width / 2) / bounds.width;
      const normalizedY = (event.point.y + bounds.height / 2) / bounds.height; // Don't invert Y - use same coordinate system

      // Map to canvas coordinates
      const x = normalizedX * canvasSize.width;
      const y = normalizedY * canvasSize.height;

      if (event.type === "pointerdown") {
        // Set pointer capture to ensure we receive all subsequent events
        const target = event.nativeEvent.target as Element;
        if (target && "setPointerCapture" in target) {
          try {
            (target as HTMLElement).setPointerCapture(
              event.nativeEvent.pointerId,
            );
            currentTargetRef.current = target;
          } catch {
            // Silently handle pointer capture error
          }
        }

        // Update both refs and state immediately
        isDrawingRef.current = true;
        lastPointRef.current = { x, y };
        wasDrawingRef.current = true; // Mark that drawing has started
        drawingLayerRef.current = layer.id; // Track which layer is being drawn on
        setDrawingState({ isDrawing: true, lastPoint: { x, y } });

        // Draw initial point
        if (drawingTool.type === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
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
      } else if (
        event.type === "pointermove" &&
        isDrawingRef.current &&
        lastPointRef.current
      ) {
        // Use refs for immediate state access
        const lastPoint = lastPointRef.current;

        // Draw line
        if (drawingTool.type === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
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
        setDrawingState((prev) => ({ ...prev, lastPoint: { x, y } }));

        if (layer.texture) {
          layer.texture.needsUpdate = true;
        }
      }
      // Remove pointerup handling here - it's now handled by global listeners
    },
    [activeLayerId, drawingTool, setDrawingState, canvasSize, cameraBounds],
  );

  // Update camera bounds based on container size
  const updateCameraBounds = useCallback(() => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();

      // Skip if container size is not yet available
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const aspectRatio = rect.width / rect.height;
      const baseHeight = 6; // Keep height constant
      const baseWidth = baseHeight * aspectRatio;

      const newBounds = { width: baseWidth, height: baseHeight };

      // Only update if bounds actually changed to avoid unnecessary canvas resizing
      if (
        Math.abs(cameraBounds.width - newBounds.width) > 0.1 ||
        Math.abs(cameraBounds.height - newBounds.height) > 0.1
      ) {
        setCameraBounds(newBounds);

        // Update camera if available
        if (cameraRef.current) {
          cameraRef.current.left = -baseWidth / 2;
          cameraRef.current.right = baseWidth / 2;
          cameraRef.current.top = baseHeight / 2;
          cameraRef.current.bottom = -baseHeight / 2;
          cameraRef.current.updateProjectionMatrix();
        }
      }
    }
  }, [cameraBounds, setCameraBounds]);

  // Resize canvases when camera bounds change
  useEffect(() => {
    resizeCanvases();
  }, [cameraBounds.width, cameraBounds.height, resizeCanvases]);

  // Initial bounds setup and container resize listener
  useEffect(() => {
    // Initial bounds calculation after component mount
    const initialUpdate = () => {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        updateCameraBounds();
      });
    };

    // Immediate attempt
    initialUpdate();

    // Fallback with timeout
    const timeoutId = setTimeout(initialUpdate, 100);

    const resizeObserver = new ResizeObserver(updateCameraBounds);
    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [updateCameraBounds]);

  return (
    <div
      ref={canvasContainerRef}
      className="w-full h-full bg-gray-100 rounded-lg overflow-hidden"
    >
      <Canvas
        camera={{
          position: [0, 0, 10],
          near: 0.1,
          far: 1000,
        }}
        orthographic
        style={{ width: "100%", height: "100%" }}
        onCreated={useCallback(
          ({ camera }: { camera: THREE.Camera }) => {
            // Store camera reference and set initial bounds
            if (camera.type === "OrthographicCamera") {
              cameraRef.current = camera as THREE.OrthographicCamera;
              
              // Set initial camera bounds based on current cameraBounds state
              const orthoCam = camera as THREE.OrthographicCamera;
              orthoCam.left = -cameraBounds.width / 2;
              orthoCam.right = cameraBounds.width / 2;
              orthoCam.top = cameraBounds.height / 2;
              orthoCam.bottom = -cameraBounds.height / 2;
              orthoCam.updateProjectionMatrix();
            }

            // Trigger bounds update after Three.js is fully initialized
            requestAnimationFrame(() => {
              updateCameraBounds();
            });
          },
          [updateCameraBounds, cameraBounds],
        )}
        resize={{
          scroll: false,
          debounce: { scroll: 50, resize: 50 },
        }}
      >
        <ambientLight intensity={1} />

        {/* Background transparent plane (for click detection) */}
        {activeLayer && (
          <mesh
            position={[0, 0, -0.001]}
            onPointerDown={(event) => handleDraw(event, activeLayer)}
            onPointerMove={(event) => handleDraw(event, activeLayer)}
          >
            <planeGeometry args={[cameraBounds.width, cameraBounds.height]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}

        {layers
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((layer) => (
            <LayerPlane
              key={layer.id}
              layer={layer}
              isActive={false} // Process events with background plane
              onDraw={(event) => handleDraw(event, layer)}
              cameraBounds={cameraBounds}
            />
          ))}
      </Canvas>
    </div>
  );
}
