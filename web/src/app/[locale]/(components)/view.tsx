"use client";

import React, { useEffect, useRef, useState, FC, ComponentProps } from "react";
import { Stage, Layer, Line, Circle } from "react-konva";
import { useAtomValue } from "jotai";
import {
  currentToolAtom,
  brushSizeAtom,
  brushColorAtom,
} from "@/stores/tool-store";
import { ToolBar } from "./tool-bar";

interface DrawingLine {
  points: number[];
  color: string;
  strokeWidth: number;
  tool: "pen" | "eraser";
}

interface HomePageProps extends ComponentProps<"div"> {}

const HomePage: FC<HomePageProps> = ({ className, ...props }) => {
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [cursorPosition, setCursorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const stageRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const currentTool = useAtomValue(currentToolAtom);
  const brushSize = useAtomValue(brushSizeAtom);
  const brushColor = useAtomValue(brushColorAtom);

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
      {
        points: [point.x, point.y, point.x, point.y],
        color: currentTool === "eraser" ? "black" : brushColor,
        strokeWidth: currentTool === "eraser" ? brushSize * 2 : brushSize,
        tool: currentTool,
      },
    ]);
  };

  const handleMouseMove = () => {
    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    setCursorPosition({ x: point.x, y: point.y });

    if (!isDrawing) return;

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

  const handleMouseLeave = () => {
    setCursorPosition(null);
  };

  return (
    <div className={className} {...props}>
      <ToolBar />
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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
              globalCompositeOperation={
                line.tool === "eraser" ? "destination-out" : "source-over"
              }
            />
          ))}
          {cursorPosition && (
            <Circle
              x={cursorPosition.x}
              y={cursorPosition.y}
              radius={currentTool === "eraser" ? brushSize : brushSize / 2}
              stroke={currentTool === "eraser" ? "#FF0000" : brushColor}
              strokeWidth={2}
              fill="transparent"
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default HomePage;
