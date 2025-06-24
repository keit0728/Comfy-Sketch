"use client";

import React, { useState, useCallback, useEffect } from "react";

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onResize?: (width: number) => void;
  isAbsolute?: boolean;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultWidth = 256,
  minWidth = 200,
  maxWidth = 400,
  className = "",
  onResize,
  isAbsolute = true,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setStartX(e.clientX);
      setStartWidth(width);
    },
    [width],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate difference (positive when dragging right)
      const diff = e.clientX - startX;
      // Subtract diff to make panel expand when dragging left
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, startWidth - diff),
      );

      setWidth(newWidth);
      onResize?.(newWidth);
    },
    [isResizing, startX, startWidth, minWidth, maxWidth, onResize],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`${isAbsolute ? "absolute right-0 top-0 bottom-0" : "relative"} flex ${className}`}
      style={{ width: `${width}px`, flexShrink: 0 }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/50 transition-colors z-10"
        onMouseDown={handleMouseDown}
        style={{
          backgroundColor: isResizing
            ? "rgb(59, 130, 246, 0.5)"
            : "transparent",
        }}
      />
      <div className="w-full h-full overflow-hidden">{children}</div>
    </div>
  );
};
