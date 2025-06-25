"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";

interface DrawingLine {
  points: number[];
  color: string;
  strokeWidth: number;
}

export default function HomePage() {
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const stageRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Set canvas dimensions to full screen
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleMouseDown = () => {
    setIsDrawing(true);
    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    setLines([
      ...lines,
      { points: [point.x, point.y], color: "#000000", strokeWidth: 3 },
    ]);
  };

  const handleMouseMove = () => {
    if (!isDrawing) return;

    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];

    // Add point to last line
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // Replace last line
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <Stage
      width={dimensions.width}
      height={dimensions.height}
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchmove={handleMouseMove}
      onTouchend={handleMouseUp}
      ref={stageRef}
    >
      <Layer>
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke={line.color}
            strokeWidth={line.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation="source-over"
          />
        ))}
      </Layer>
    </Stage>
  );
}
