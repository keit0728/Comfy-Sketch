"use client";

import React, { ComponentProps, FC, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  currentToolAtom,
  brushSizeAtom,
  brushColorAtom,
} from "@/stores/tool-store";
import {
  undoAtom,
  redoAtom,
  canUndoAtom,
  canRedoAtom,
} from "@/stores/history-store";
import {
  layersAtom,
  currentLayerIdAtom,
  addLayerAtom,
} from "@/stores/layer-store";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pencil,
  Eraser,
  MousePointer,
  Undo2,
  Redo2,
  Layers,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { BrushSizeSelector } from "./brush-size-selector";

interface ToolBarProps extends ComponentProps<"div"> {}

export const ToolBar: FC<ToolBarProps> = ({ className, ...props }) => {
  const [currentTool, setCurrentTool] = useAtom(currentToolAtom);
  const [brushSize] = useAtom(brushSizeAtom);
  const [brushColor, setBrushColor] = useAtom(brushColorAtom);
  const [openSize, setOpenSize] = React.useState(false);
  const t = useTranslations("home.toolbar");
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);

  const layers = useAtomValue(layersAtom);
  const [currentLayerId, setCurrentLayerId] = useAtom(currentLayerIdAtom);
  const addLayer = useSetAtom(addLayerAtom);
  const [openLayers, setOpenLayers] = useState<boolean>(false);

  return (
    <Card
      className={cn(
        "fixed top-4 left-1/2 z-10 flex -translate-x-1/2 transform items-center gap-6 p-4",
        className,
      )}
      {...props}
    >
      <div className="flex gap-2">
        <Toggle
          pressed={currentTool === "pen"}
          onPressedChange={() => setCurrentTool("pen")}
          aria-label={t("penTool")}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Pencil className="h-4 w-4" />
          <span className="ml-2">{t("pen")}</span>
        </Toggle>
        <Toggle
          pressed={currentTool === "eraser"}
          onPressedChange={() => setCurrentTool("eraser")}
          aria-label={t("eraserTool")}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Eraser className="h-4 w-4" />
          <span className="ml-2">{t("eraser")}</span>
        </Toggle>
        <Toggle
          pressed={currentTool === "select"}
          onPressedChange={() => setCurrentTool("select")}
          aria-label={t("selectTool")}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <MousePointer className="h-4 w-4" />
          <span className="ml-2">{t("select")}</span>
        </Toggle>
        <div className="h-8 w-px bg-gray-300" />
        <Toggle
          pressed={false}
          onPressedChange={() => undo()}
          aria-label={t("undo")}
          disabled={!canUndo}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Undo2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={false}
          onPressedChange={() => redo()}
          aria-label={t("redo")}
          disabled={!canRedo}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Redo2 className="h-4 w-4" />
        </Toggle>
        <div className="h-8 w-px bg-gray-300" />
        <Toggle
          pressed={false}
          onPressedChange={() => {}}
          aria-label={t("selectBrushSize")}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Popover open={openSize} onOpenChange={setOpenSize}>
            <PopoverTrigger asChild>
              <div className="flex items-center">
                <span className="w-12 text-center text-sm">{brushSize}px</span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <BrushSizeSelector onSizeSelect={() => setOpenSize(false)} />
            </PopoverContent>
          </Popover>
        </Toggle>
        <div className="h-8 w-px bg-gray-300" />
        <Toggle
          pressed={false}
          onPressedChange={() => colorInputRef.current?.click()}
          aria-label={t("selectColor")}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground relative"
        >
          <input
            ref={colorInputRef}
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <div
            className="h-4 w-4 rounded-sm border border-gray-300"
            style={{ backgroundColor: brushColor }}
          />
        </Toggle>
        <div className="h-8 w-px bg-gray-300" />
        <Popover open={openLayers} onOpenChange={setOpenLayers}>
          <PopoverTrigger asChild>
            <Toggle
              pressed={false}
              aria-label={t("layers")}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Layers className="h-4 w-4" />
              <span className="ml-2">
                {layers.find((l) => l.id === currentLayerId)?.name || ""}
              </span>
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="center">
            <div className="space-y-1">
              {layers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => {
                    setCurrentLayerId(layer.id);
                    setOpenLayers(false);
                  }}
                  className={`w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                    currentLayerId === layer.id ? "bg-gray-100 font-medium" : ""
                  }`}
                >
                  {layer.name}
                </button>
              ))}
              <button
                onClick={() => {
                  addLayer();
                  setOpenLayers(false);
                }}
                className="flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addLayer")}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </Card>
  );
};
