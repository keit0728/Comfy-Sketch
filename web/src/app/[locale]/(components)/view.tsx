"use client";

import React, { useEffect, useRef, useState, FC, ComponentProps } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  currentToolAtom,
  brushSizeAtom,
  brushColorAtom,
  selectedLineIdAtom,
} from "@/stores/tool-store";
import { ToolBar } from "./tool-bar";
import { DrawingCanvas } from "./drawing-canvas";
import { DrawingLine, Point } from "@/lib/drawing/types";
import { generateId, isPointNearLine } from "@/lib/drawing/utils";

interface HomePageProps extends ComponentProps<"div"> {}

const HomePage: FC<HomePageProps> = ({ className, ...props }) => {
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null);
  const stageRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const currentTool = useAtomValue(currentToolAtom);
  const brushSize = useAtomValue(brushSizeAtom);
  const brushColor = useAtomValue(brushColorAtom);
  const [selectedLineId, setSelectedLineId] = useAtom(selectedLineIdAtom);

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
    const stage = stageRef.current;
    const point = stage.getPointerPosition();

    if (currentTool === "select") {
      // Find which line was clicked
      let clickedLineId = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (isPointNearLine(point, lines[i])) {
          clickedLineId = lines[i].id;
          break;
        }
      }

      setSelectedLineId(clickedLineId);

      if (clickedLineId) {
        setIsDragging(true);
        setDragStartPoint(point);
      }
    } else {
      setIsDrawing(true);
      setSelectedLineId(null);

      setLines([
        ...lines,
        {
          id: generateId(),
          points: [point.x, point.y, point.x, point.y],
          color: currentTool === "eraser" ? "black" : brushColor,
          strokeWidth: currentTool === "eraser" ? brushSize * 2 : brushSize,
          tool: currentTool,
        },
      ]);
    }
  };

  const handleMouseMove = () => {
    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    setCursorPosition({ x: point.x, y: point.y });

    if (isDragging && selectedLineId && dragStartPoint) {
      // Move the selected line
      const dx = point.x - dragStartPoint.x;
      const dy = point.y - dragStartPoint.y;

      setLines(
        lines.map((line) => {
          if (line.id === selectedLineId) {
            const newPoints = [];
            for (let i = 0; i < line.points.length; i += 2) {
              newPoints.push(line.points[i] + dx);
              newPoints.push(line.points[i + 1] + dy);
            }
            return { ...line, points: newPoints };
          }
          return line;
        }),
      );

      setDragStartPoint(point);
    } else if (isDrawing && currentTool !== "select") {
      const lastLine = lines[lines.length - 1];

      // Add point to last line
      lastLine.points = lastLine.points.concat([point.x, point.y]);

      // Replace last line
      lines.splice(lines.length - 1, 1, lastLine);
      setLines(lines.concat());
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsDragging(false);
    setDragStartPoint(null);

    // 選択ツールの場合は選択を解除
    if (currentTool === "select") {
      setSelectedLineId(null);
    }
  };

  const handleMouseLeave = () => {
    setCursorPosition(null);
  };

  return (
    <div className={className} {...props}>
      <ToolBar />
      <DrawingCanvas
        dimensions={dimensions}
        lines={lines}
        selectedLineId={selectedLineId}
        cursorPosition={cursorPosition}
        stageRef={stageRef}
        currentTool={currentTool}
        brushSize={brushSize}
        brushColor={brushColor}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default HomePage;
