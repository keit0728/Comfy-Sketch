"use client";

import React, {
  useEffect,
  useRef,
  useState,
  FC,
  ComponentProps,
  useCallback,
} from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  currentToolAtom,
  brushSizeAtom,
  brushColorAtom,
  selectedLineIdAtom,
  selectedLineIdsAtom,
} from "@/stores/tool-store";
import {
  historyAtom,
  pushHistoryAtom,
  undoAtom,
  redoAtom,
  canUndoAtom,
  canRedoAtom,
  initializeHistoryAtom,
} from "@/stores/history-store";
import { currentLayerIdAtom, currentLayerAtom } from "@/stores/layer-store";
import { ToolBar } from "./tool-bar";
import { DrawingCanvas } from "./drawing-canvas";
import { DrawingLine, Point } from "@/lib/drawing/types";
import { generateId, isPointNearLine } from "@/lib/drawing/utils";

interface HomePageProps extends ComponentProps<"div"> {}

const HomePage: FC<HomePageProps> = ({ className, ...props }) => {
  const [localLines, setLocalLines] = useState<DrawingLine[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null);
  const [hoveredLineIds, setHoveredLineIds] = useState<string[]>([]);
  const stageRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const lastMouseMoveTime = useRef<number>(0);
  const mouseThrottleDelay = 16; // ~60fps

  const currentTool = useAtomValue(currentToolAtom);
  const brushSize = useAtomValue(brushSizeAtom);
  const brushColor = useAtomValue(brushColorAtom);
  const [selectedLineId, setSelectedLineId] = useAtom(selectedLineIdAtom);
  const [selectedLineIds, setSelectedLineIds] = useAtom(selectedLineIdsAtom);

  const history = useAtomValue(historyAtom);
  const pushHistory = useSetAtom(pushHistoryAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const initializeHistory = useSetAtom(initializeHistoryAtom);
  const currentLayerId = useAtomValue(currentLayerIdAtom);
  const currentLayer = useAtomValue(currentLayerAtom);

  const lines = history.present;

  // Initialize history on mount
  useEffect(() => {
    initializeHistory([]);
  }, [initializeHistory]);

  // Update local lines when history changes
  useEffect(() => {
    setLocalLines(history.present);
  }, [history.present]);

  // Handle keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
      } else if (
        ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey && canRedo) ||
        ((e.metaKey || e.ctrlKey) && e.key === "y" && canRedo)
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

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

  const handleMouseDown = useCallback(() => {
    const stage = stageRef.current;
    const point = stage.getPointerPosition();

    if (currentTool === "select") {
      // Check if current layer is locked
      if (currentLayer?.locked) {
        return;
      }

      // Find which line was clicked (excluding eraser lines and lines not on current layer)
      let clickedLineId = null;
      let clickedLine = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (
          lines[i].tool !== "eraser" &&
          lines[i].layerId === currentLayerId &&
          isPointNearLine(point, lines[i])
        ) {
          clickedLineId = lines[i].id;
          clickedLine = lines[i];
          break;
        }
      }

      setSelectedLineId(clickedLineId);

      if (clickedLineId && clickedLine) {
        // Select all lines on the same layer (including eraser lines)
        const sameLayerLineIds = lines
          .filter((line) => line.layerId === clickedLine.layerId)
          .map((line) => line.id);

        setSelectedLineIds(sameLayerLineIds);
        setIsDragging(true);
        setDragStartPoint(point);
      } else {
        setSelectedLineIds([]);
      }
    } else {
      // Check if current layer is locked
      if (currentLayer?.locked) {
        return;
      }

      setIsDrawing(true);
      setSelectedLineId(null);
      setSelectedLineIds([]);

      const newLine: DrawingLine = {
        id: generateId(),
        points: [point.x, point.y, point.x, point.y],
        color: currentTool === "eraser" ? "black" : brushColor,
        strokeWidth: currentTool === "eraser" ? brushSize * 2 : brushSize,
        tool: currentTool,
        layerId: currentLayerId,
      };

      setLocalLines([...lines, newLine]);
    }
  }, [
    currentTool,
    lines,
    brushColor,
    brushSize,
    setSelectedLineId,
    setSelectedLineIds,
    currentLayerId,
    currentLayer?.locked,
  ]);

  const handleMouseMove = useCallback(() => {
    const now = Date.now();
    if (now - lastMouseMoveTime.current < mouseThrottleDelay) {
      return;
    }
    lastMouseMoveTime.current = now;

    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    setCursorPosition({ x: point.x, y: point.y });

    // Check for hovered line when using select tool
    if (currentTool === "select" && !isDragging) {
      let hoveredLine = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (
          lines[i].tool !== "eraser" &&
          lines[i].layerId === currentLayerId &&
          isPointNearLine(point, lines[i])
        ) {
          hoveredLine = lines[i];
          break;
        }
      }

      if (hoveredLine) {
        // Select all lines on the same layer (including eraser lines)
        const sameLayerLineIds = lines
          .filter((line) => line.layerId === hoveredLine.layerId)
          .map((line) => line.id);
        setHoveredLineIds(sameLayerLineIds);
      } else {
        setHoveredLineIds([]);
      }
    }

    if (isDragging && selectedLineIds.length > 0 && dragStartPoint) {
      // Move all selected lines
      const dx = point.x - dragStartPoint.x;
      const dy = point.y - dragStartPoint.y;

      setLocalLines((prevLines) =>
        prevLines.map((line) => {
          if (selectedLineIds.includes(line.id)) {
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
      // Create a new array with updated last line
      setLocalLines((prevLines) => {
        const updatedLines = [...prevLines];
        const lastLine = updatedLines[updatedLines.length - 1];

        // Create a new line object with updated points
        updatedLines[updatedLines.length - 1] = {
          ...lastLine,
          points: [...lastLine.points, point.x, point.y],
        };

        return updatedLines;
      });
    }
  }, [
    isDragging,
    selectedLineIds,
    dragStartPoint,
    isDrawing,
    currentTool,
    currentLayerId,
    lines,
  ]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing || isDragging) {
      // Push current state to history when finishing drawing or dragging
      pushHistory(localLines);
    }

    setIsDrawing(false);
    setIsDragging(false);
    setDragStartPoint(null);

    // 選択ツールの場合は選択を解除
    if (currentTool === "select") {
      setSelectedLineId(null);
      setSelectedLineIds([]);
    }
  }, [
    currentTool,
    setSelectedLineId,
    isDrawing,
    isDragging,
    localLines,
    pushHistory,
    setSelectedLineIds,
  ]);

  const handleMouseLeave = useCallback(() => {
    setCursorPosition(null);
    setHoveredLineIds([]);
  }, []);

  return (
    <div className={className} {...props}>
      <ToolBar />
      <DrawingCanvas
        dimensions={dimensions}
        lines={localLines}
        selectedLineId={selectedLineId}
        selectedLineIds={selectedLineIds}
        hoveredLineIds={hoveredLineIds}
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
