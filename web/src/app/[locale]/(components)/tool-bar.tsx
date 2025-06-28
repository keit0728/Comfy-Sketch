"use client";

import React, { ComponentProps, FC } from "react";
import { useAtom } from "jotai";
import { currentToolAtom } from "@/stores/tool-store";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Pencil, Eraser } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ToolBarProps extends ComponentProps<"div"> {}

export const ToolBar: FC<ToolBarProps> = ({ className, ...props }) => {
  const [currentTool, setCurrentTool] = useAtom(currentToolAtom);
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
      </div>
    </Card>
  );
};
