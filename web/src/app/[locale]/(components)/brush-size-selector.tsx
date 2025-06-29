"use client";

import React, { ComponentProps, FC } from "react";
import { useAtom } from "jotai";
import { brushSizeAtom } from "@/stores/tool-store";
import { cn } from "@/lib/utils";

interface BrushSizeSelectorProps extends ComponentProps<"div"> {
  onSizeSelect?: () => void;
}

const brushSizes = [
  // First row - smallest sizes
  { size: 1, row: 0 },
  { size: 2, row: 0 },
  { size: 3, row: 0 },
  { size: 4, row: 0 },
  { size: 5, row: 0 },
  { size: 6, row: 0 },
  { size: 7, row: 0 },
  { size: 8, row: 0 },
  // Second row - small to medium sizes
  { size: 9, row: 1 },
  { size: 10, row: 1 },
  { size: 12, row: 1 },
  { size: 15, row: 1 },
  { size: 17, row: 1 },
  { size: 20, row: 1 },
  { size: 25, row: 1 },
  { size: 30, row: 1 },
  // Third row - medium to large sizes
  { size: 40, row: 2 },
  { size: 50, row: 2 },
  { size: 60, row: 2 },
  { size: 70, row: 2 },
  { size: 80, row: 2 },
  { size: 90, row: 2 },
  { size: 100, row: 2 },
  { size: 120, row: 2 },
  // Fourth row - largest sizes
  { size: 150, row: 3 },
  { size: 170, row: 3 },
  { size: 200, row: 3 },
  { size: 250, row: 3 },
  { size: 300, row: 3 },
  { size: 400, row: 3 },
  { size: 500, row: 3 },
  { size: 600, row: 3 },
];

export const BrushSizeSelector: FC<BrushSizeSelectorProps> = ({
  className,
  onSizeSelect,
  ...props
}) => {
  const [brushSize, setBrushSize] = useAtom(brushSizeAtom);

  const getCircleSize = (size: number) => {
    // Scale the visual size based on the brush size
    const minVisualSize = 8;
    const maxVisualSize = 40;
    const scaleFactor = Math.min(size / 100, 1);
    return minVisualSize + (maxVisualSize - minVisualSize) * scaleFactor;
  };

  return (
    <div className={cn("p-4", className)} {...props}>
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3].map((rowIndex) => (
          <div key={rowIndex}>
            <div className="flex justify-between gap-2">
              {brushSizes
                .filter((item) => item.row === rowIndex)
                .map(({ size }) => {
                  const circleSize = getCircleSize(size);
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setBrushSize(size);
                        onSizeSelect?.();
                      }}
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-lg transition-all hover:bg-gray-100",
                        brushSize === size && "ring-2 ring-blue-500",
                      )}
                      aria-label={`Brush size ${size}`}
                    >
                      <div
                        className="rounded-full bg-gray-600"
                        style={{
                          width: `${circleSize}px`,
                          height: `${circleSize}px`,
                        }}
                      />
                    </button>
                  );
                })}
            </div>
            <div className="mt-2 grid grid-cols-8 gap-2 text-center text-xs text-gray-600">
              {brushSizes
                .filter((item) => item.row === rowIndex)
                .map(({ size }) => (
                  <div key={size}>{size}</div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
