"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import {
  selectedLayerIdAtom,
  layersAtom,
  activeResizeHandleAtom,
  transformStartMouseAtom,
  transformStartBoundsAtom,
  updateLayerTransformAtom,
  cameraBoundsAtom,
  type ResizeHandle,
  type LayerTransform,
} from "@/stores/sketchStore";

interface TransformOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function TransformOverlay({ containerRef }: TransformOverlayProps) {
  const [selectedLayerId] = useAtom(selectedLayerIdAtom);
  const [activeHandle, setActiveHandle] = useAtom(activeResizeHandleAtom);
  const [transformStartMouse, setTransformStartMouse] = useAtom(
    transformStartMouseAtom,
  );
  const [transformStartBounds, setTransformStartBounds] = useAtom(
    transformStartBoundsAtom,
  );
  const layers = useAtomValue(layersAtom);
  const cameraBounds = useAtomValue(cameraBoundsAtom);
  const updateLayerTransform = useSetAtom(updateLayerTransformAtom);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  // Get layer bounds with default values
  const getLayerBounds = (layer: typeof selectedLayer): LayerTransform => {
    if (!layer) return { x: 0, y: 0, width: 0, height: 0, scale: 1 };

    return (
      layer.transform || {
        x: 0,
        y: 0,
        width: cameraBounds.width,
        height: cameraBounds.height,
        scale: 1,
      }
    );
  };

  // Convert world coordinates to screen coordinates
  const worldToScreen = (x: number, y: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };

    const rect = containerRef.current.getBoundingClientRect();
    const screenX =
      ((x + cameraBounds.width / 2) / cameraBounds.width) * rect.width;
    const screenY =
      ((cameraBounds.height / 2 - y) / cameraBounds.height) * rect.height;

    return { x: screenX, y: screenY };
  };

  // Handle mouse down on resize handles
  const handleMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    setActiveHandle(handle);
    setTransformStartMouse({ x: e.clientX, y: e.clientY });
    setTransformStartBounds(getLayerBounds(selectedLayer));
  };

  // Handle mouse move for resizing
  useEffect(() => {
    if (
      !activeHandle ||
      !transformStartMouse ||
      !transformStartBounds ||
      !selectedLayerId
    )
      return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - transformStartMouse.x;
      const deltaY = e.clientY - transformStartMouse.y;

      // Convert delta to world space
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const worldDeltaX = (deltaX / rect.width) * cameraBounds.width;
      const worldDeltaY = -(deltaY / rect.height) * cameraBounds.height;

      const newTransform = { ...transformStartBounds };

      switch (activeHandle) {
        case "move":
          newTransform.x = transformStartBounds.x + worldDeltaX;
          newTransform.y = transformStartBounds.y + worldDeltaY;
          break;
        case "se":
          // Calculate scale based on the dominant axis movement
          const scaleXSE = (transformStartBounds.width + worldDeltaX) / transformStartBounds.width;
          const scaleYSE = (transformStartBounds.height - worldDeltaY) / transformStartBounds.height;
          
          // Use the larger scale to maintain aspect ratio
          const scaleSE = Math.max(0.1, Math.max(scaleXSE, scaleYSE));
          
          newTransform.width = transformStartBounds.width * scaleSE;
          newTransform.height = transformStartBounds.height * scaleSE;
          
          // Adjust Y position for bottom edge movement
          newTransform.y = transformStartBounds.y + transformStartBounds.height - newTransform.height;
          break;
        case "sw":
          // Calculate scale based on the dominant axis movement
          const scaleXSW = (transformStartBounds.width - worldDeltaX) / transformStartBounds.width;
          const scaleYSW = (transformStartBounds.height - worldDeltaY) / transformStartBounds.height;
          
          // Use the larger scale to maintain aspect ratio
          const scaleSW = Math.max(0.1, Math.max(scaleXSW, scaleYSW));
          
          const newWidthSW = transformStartBounds.width * scaleSW;
          const newHeightSW = transformStartBounds.height * scaleSW;
          
          // Adjust positions
          newTransform.x = transformStartBounds.x + transformStartBounds.width - newWidthSW;
          newTransform.y = transformStartBounds.y + transformStartBounds.height - newHeightSW;
          newTransform.width = newWidthSW;
          newTransform.height = newHeightSW;
          break;
        case "ne":
          // Calculate scale based on the dominant axis movement
          const scaleXNE = (transformStartBounds.width + worldDeltaX) / transformStartBounds.width;
          const scaleYNE = (transformStartBounds.height + worldDeltaY) / transformStartBounds.height;
          
          // Use the larger scale to maintain aspect ratio
          const scaleNE = Math.max(0.1, Math.max(scaleXNE, scaleYNE));
          
          newTransform.width = transformStartBounds.width * scaleNE;
          newTransform.height = transformStartBounds.height * scaleNE;
          break;
        case "nw":
          // Calculate scale based on the dominant axis movement
          const scaleXNW = (transformStartBounds.width - worldDeltaX) / transformStartBounds.width;
          const scaleYNW = (transformStartBounds.height + worldDeltaY) / transformStartBounds.height;
          
          // Use the larger scale to maintain aspect ratio
          const scaleNW = Math.max(0.1, Math.max(scaleXNW, scaleYNW));
          
          const newWidthNW = transformStartBounds.width * scaleNW;
          const newHeightNW = transformStartBounds.height * scaleNW;
          
          // Adjust X position for left edge movement
          newTransform.x = transformStartBounds.x + transformStartBounds.width - newWidthNW;
          newTransform.width = newWidthNW;
          newTransform.height = newHeightNW;
          break;
      }

      updateLayerTransform(selectedLayerId, newTransform);
    };

    const handleMouseUp = () => {
      setActiveHandle(null);
      setTransformStartMouse(null);
      setTransformStartBounds(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    activeHandle,
    transformStartMouse,
    transformStartBounds,
    selectedLayerId,
    cameraBounds,
    containerRef,
    updateLayerTransform,
    setActiveHandle,
    setTransformStartMouse,
    setTransformStartBounds,
  ]);

  if (!selectedLayer || !selectedLayerId || !containerRef.current) return null;

  const bounds = getLayerBounds(selectedLayer);
  const topLeft = worldToScreen(
    bounds.x - bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  const bottomRight = worldToScreen(
    bounds.x + bounds.width / 2,
    bounds.y - bounds.height / 2,
  );

  const width = bottomRight.x - topLeft.x;
  const height = bottomRight.y - topLeft.y;

  const handleStyle =
    "absolute w-2 h-2 bg-white border-2 border-blue-500 cursor-pointer";

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1000 }}
    >
      {/* Selection border */}
      <div
        className="absolute border-2 border-blue-500 pointer-events-auto"
        style={{
          left: `${topLeft.x}px`,
          top: `${topLeft.y}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        {/* Resize handles - corners only */}
        <div
          className={`${handleStyle} -left-1 -top-1 cursor-nw-resize`}
          onMouseDown={(e) => handleMouseDown(e, "nw")}
        />
        <div
          className={`${handleStyle} -right-1 -top-1 cursor-ne-resize`}
          onMouseDown={(e) => handleMouseDown(e, "ne")}
        />
        <div
          className={`${handleStyle} -right-1 -bottom-1 cursor-se-resize`}
          onMouseDown={(e) => handleMouseDown(e, "se")}
        />
        <div
          className={`${handleStyle} -left-1 -bottom-1 cursor-sw-resize`}
          onMouseDown={(e) => handleMouseDown(e, "sw")}
        />
      </div>
    </div>
  );
}
