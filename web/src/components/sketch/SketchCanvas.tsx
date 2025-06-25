"use client";

import { Canvas, ThreeEvent } from "@react-three/fiber";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
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
  appModeAtom,
  selectedLayerIdAtom,
  cameraPositionAtom,
  cameraZoomAtom,
  panStateAtom,
  type Layer,
} from "@/stores/sketchStore";

interface LayerPlaneProps {
  layer: Layer;
  isActive: boolean;
  onDraw: (event: ThreeEvent<PointerEvent>, layer: Layer) => void;
  onSelect?: (layerId: string) => void;
}

function LayerPlane({
  layer,
  isActive,
  onDraw,
  onSelect,
  cameraBounds = { width: 8, height: 6 },
  appMode,
}: LayerPlaneProps & {
  cameraBounds?: { width: number; height: number };
  appMode: "draw" | "transform";
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (layer.texture && meshRef.current) {
      layer.texture.needsUpdate = true;
    }
  }, [layer.texture]);

  if (!layer.visible || !layer.texture) return null;

  const handlePointerEvent = (event: ThreeEvent<PointerEvent>) => {
    if (appMode === "transform" && event.type === "pointerdown") {
      event.stopPropagation(); // Stop propagation to prevent background deselection
      onSelect?.(layer.id);
    } else if (appMode === "draw" && isActive) {
      // Stop propagation in draw mode to prevent drawing on background
      event.stopPropagation();
      onDraw(event, layer);
    }
  };

  // Apply transform if exists
  const transform = layer.transform || {
    x: 0,
    y: 0,
    width: cameraBounds.width,
    height: cameraBounds.height,
    scale: 1,
  };

  return (
    <mesh
      ref={meshRef}
      position={[transform.x, transform.y, layer.zIndex * 0.001]}
      scale={[transform.scale, transform.scale, 1]}
      onPointerDown={handlePointerEvent}
      onPointerMove={handlePointerEvent}
      onPointerUp={handlePointerEvent}
      onWheel={() => {
        // Don't stop propagation - let wheel events pass through for zooming
        // This allows the native wheel event listener on the canvas container to handle zoom
      }}
    >
      <planeGeometry args={[transform.width, transform.height]} />
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
  const layers = useAtomValue(layersAtom);
  const activeLayerId = useAtomValue(activeLayerIdAtom);
  const drawingTool = useAtomValue(drawingToolAtom);
  const [drawingState, setDrawingState] = useAtom(drawingStateAtom);
  const canvasSize = useAtomValue(canvasSizeAtom);
  const addToHistory = useSetAtom(addToHistoryAtom);
  const [cameraBounds, setCameraBounds] = useAtom(cameraBoundsAtom);
  const [cameraPosition, setCameraPosition] = useAtom(cameraPositionAtom);
  const [cameraZoom, setCameraZoom] = useAtom(cameraZoomAtom);
  const [panState, setPanState] = useAtom(panStateAtom);

  // Removed resizeCanvases as canvas size is now fixed
  const appMode = useAtomValue(appModeAtom);
  const setSelectedLayerId = useSetAtom(selectedLayerIdAtom);

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

  // Handle native wheel event for zooming
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      // Always prevent default to disable browser zoom and handle all wheel events
      event.preventDefault();
      
      // Block browser zoom with Ctrl/Cmd+wheel completely
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      
      // Allow horizontal scrolling with Shift+wheel
      if (event.shiftKey || event.altKey) {
        return;
      }

      // Calculate zoom delta
      const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, cameraZoom * zoomDelta));

      if (newZoom !== cameraZoom) {
        // Get mouse position relative to canvas
        const rect = container.getBoundingClientRect();
        if (!rect) return;

        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Convert to normalized coordinates [0, 1]
        const normalizedX = mouseX / rect.width;
        const normalizedY = mouseY / rect.height;

        // Convert to world coordinates before zoom
        const worldXBefore =
          ((normalizedX - 0.5) * cameraBounds.width) / cameraZoom -
          cameraPosition.x;
        const worldYBefore =
          ((0.5 - normalizedY) * cameraBounds.height) / cameraZoom -
          cameraPosition.y;

        // Convert to world coordinates after zoom
        const worldXAfter =
          ((normalizedX - 0.5) * cameraBounds.width) / newZoom -
          cameraPosition.x;
        const worldYAfter =
          ((0.5 - normalizedY) * cameraBounds.height) / newZoom -
          cameraPosition.y;

        // Adjust camera position to keep mouse position fixed
        const newCameraX = cameraPosition.x + (worldXBefore - worldXAfter);
        const newCameraY = cameraPosition.y + (worldYBefore - worldYAfter);

        setCameraPosition({ x: newCameraX, y: newCameraY });
        setCameraZoom(newZoom);
      }
    };

    // Add event listener with passive: false to allow preventDefault
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [
    cameraZoom,
    cameraPosition,
    cameraBounds,
    setCameraPosition,
    setCameraZoom,
  ]);

  // Handle middle mouse button for panning
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      // Middle mouse button or Ctrl+Left mouse for panning
      if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
        event.preventDefault();
        setPanState({
          isPanning: true,
          startMouse: { x: event.clientX, y: event.clientY },
          startCamera: { x: cameraPosition.x, y: cameraPosition.y },
        });
      }
    },
    [cameraPosition, setPanState],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (panState.isPanning && panState.startMouse && panState.startCamera) {
        const rect = canvasContainerRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Calculate mouse delta in pixels
        const deltaX = event.clientX - panState.startMouse.x;
        const deltaY = event.clientY - panState.startMouse.y;

        // Convert to world space delta
        const worldDeltaX =
          (-(deltaX / rect.width) * cameraBounds.width) / cameraZoom;
        const worldDeltaY =
          ((deltaY / rect.height) * cameraBounds.height) / cameraZoom;

        // Update camera position
        setCameraPosition({
          x: panState.startCamera.x + worldDeltaX,
          y: panState.startCamera.y + worldDeltaY,
        });
      }
    },
    [panState, cameraBounds, cameraZoom, setCameraPosition],
  );

  const handlePointerUp = useCallback(() => {
    if (panState.isPanning) {
      setPanState({
        isPanning: false,
        startMouse: null,
        startCamera: null,
      });
    }
  }, [panState.isPanning, setPanState]);

  const handleDraw = useCallback(
    (event: ThreeEvent<PointerEvent>, layer: Layer) => {
      if (!layer.canvas || layer.id !== activeLayerId) return;

      const ctx = layer.canvas.getContext("2d");
      if (!ctx) return;

      // Get layer transform or use defaults
      const transform = layer.transform || {
        x: 0,
        y: 0,
        width: cameraBounds.width,
        height: cameraBounds.height,
        scale: 1,
      };

      // Convert Three.js world coordinates to camera-relative world coordinates
      // Account for camera position and zoom
      const cameraRelativeX = event.point.x * cameraZoom + cameraPosition.x;
      const cameraRelativeY = event.point.y * cameraZoom + cameraPosition.y;

      // Convert world coordinates to layer-local coordinates
      // Account for scale transform
      const localX = (cameraRelativeX - transform.x) / transform.scale;
      const localY = (cameraRelativeY - transform.y) / transform.scale;

      // Normalize to layer bounds [-0.5, 0.5] then to [0, 1]
      const normalizedX = localX / transform.width + 0.5;
      const normalizedY = localY / transform.height + 0.5;

      // Map to canvas coordinates
      const x = normalizedX * canvasSize.width;
      const y = normalizedY * canvasSize.height;

      // Check if the point is within the layer bounds
      if (
        normalizedX < 0 ||
        normalizedX > 1 ||
        normalizedY < 0 ||
        normalizedY > 1
      ) {
        return;
      }

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
    [
      activeLayerId,
      drawingTool,
      setDrawingState,
      canvasSize,
      cameraBounds,
      cameraZoom,
      cameraPosition,
    ],
  );

  // Update camera bounds based on container size and apply zoom/pan
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

      // Update camera projection with zoom and pan
      if (cameraRef.current) {
        const currentCam = cameraRef.current;

        // Apply zoom to the camera bounds
        const zoomedWidth = baseWidth / cameraZoom;
        const zoomedHeight = baseHeight / cameraZoom;

        // Apply pan offset
        currentCam.left = -zoomedWidth / 2 + cameraPosition.x;
        currentCam.right = zoomedWidth / 2 + cameraPosition.x;
        currentCam.top = zoomedHeight / 2 + cameraPosition.y;
        currentCam.bottom = -zoomedHeight / 2 + cameraPosition.y;
        currentCam.updateProjectionMatrix();

        // Update camera bounds for coordinate calculations only
        setCameraBounds(newBounds);
      }
    }
  }, [setCameraBounds, cameraZoom, cameraPosition]);

  // Removed resize canvases effect to prevent canvas content loss

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

    // Debounced resize observer to prevent frequent updates
    let resizeTimeout: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateCameraBounds();
      }, 50); // Reduced to 50ms for faster response
    });

    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [updateCameraBounds]);

  // Update camera when zoom or position changes
  useEffect(() => {
    updateCameraBounds();
  }, [cameraZoom, cameraPosition, updateCameraBounds]);

  return (
    <div
      ref={canvasContainerRef}
      className="w-full h-full bg-gray-100 rounded-lg overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        cursor: panState.isPanning
          ? "grabbing"
          : appMode === "draw"
            ? "crosshair"
            : "grab",
      }}
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
            // Store camera reference
            if (camera.type === "OrthographicCamera") {
              cameraRef.current = camera as THREE.OrthographicCamera;
            }

            // Trigger bounds update after Three.js is fully initialized
            requestAnimationFrame(() => {
              updateCameraBounds();
            });
          },
          [updateCameraBounds],
        )}
        // Allow default resize behavior
        resize={{ debounce: { scroll: 50, resize: 100 } }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: true,
        }}
      >
        <ambientLight intensity={1} />

        {/* Background transparent plane (for click detection) */}
        {activeLayer && appMode === "draw" && (
          <mesh
            position={[cameraPosition.x, cameraPosition.y, -0.001]}
            onPointerDown={(event) => handleDraw(event, activeLayer)}
            onPointerMove={(event) => handleDraw(event, activeLayer)}
          >
            <planeGeometry
              args={[
                cameraBounds.width / cameraZoom,
                cameraBounds.height / cameraZoom,
              ]}
            />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}

        {/* Background plane for deselecting layers in transform mode */}
        {appMode === "transform" && (
          <mesh
            position={[cameraPosition.x, cameraPosition.y, -0.002]}
            onPointerDown={() => {
              setSelectedLayerId(null);
            }}
          >
            <planeGeometry
              args={[
                (cameraBounds.width * 2) / cameraZoom,
                (cameraBounds.height * 2) / cameraZoom,
              ]}
            />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}

        {layers
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((layer) => (
            <LayerPlane
              key={layer.id}
              layer={layer}
              isActive={appMode === "draw" && layer.id === activeLayerId}
              onDraw={handleDraw}
              onSelect={setSelectedLayerId}
              cameraBounds={cameraBounds}
              appMode={appMode}
            />
          ))}
      </Canvas>
    </div>
  );
}
