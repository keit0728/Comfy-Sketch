"use client";

import React, { ComponentProps, FC } from "react";
import { useAtom } from "jotai";
import { currentToolAtom, brushSizeAtom } from "@/stores/tool-store";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Pencil, Eraser, MousePointer } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { BrushSizeSelector } from "./brush-size-selector";

interface ToolBarProps extends ComponentProps<"div"> {}

export const ToolBar: FC<ToolBarProps> = ({ className, ...props }) => {
  const [currentTool, setCurrentTool] = useAtom(currentToolAtom);
  const [brushSize] = useAtom(brushSizeAtom);
  const [open, setOpen] = React.useState(false);
  const t = useTranslations("home.toolbar");

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
          onPressedChange={() => {}}
          aria-label={t("selectBrushSize")}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center">
                <span className="w-12 text-center text-sm">{brushSize}px</span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <BrushSizeSelector onSizeSelect={() => setOpen(false)} />
            </PopoverContent>
          </Popover>
        </Toggle>
      </div>
    </Card>
  );
};
