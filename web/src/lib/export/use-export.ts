import { useState, useCallback } from "react";
import { useAtomValue } from "jotai";
import { layersAtom } from "@/stores/layer-store";
import { historyAtom } from "@/stores/history-store";
import { ExportOptions } from "./types";
import { renderLayersToCanvas, exportCanvasAsPNG } from "./utils";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export const useExport = (canvasSize: { width: number; height: number }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const layers = useAtomValue(layersAtom);
  const history = useAtomValue(historyAtom);
  const lines = history.present;
  const t = useTranslations("home.export");

  const exportImage = useCallback(
    async (options: ExportOptions) => {
      setIsExporting(true);
      setExportProgress(0);

      try {
        // Create offscreen canvas for rendering
        const offscreenCanvas = document.createElement("canvas");

        // Update progress
        setExportProgress(25);

        // Render all layers to the offscreen canvas
        renderLayersToCanvas(layers, lines, offscreenCanvas, {
          width: options.width,
          height: options.height,
          background: options.background,
          includeHiddenLayers: options.includeHiddenLayers,
          sourceWidth: canvasSize.width,
          sourceHeight: canvasSize.height,
        });

        // Update progress
        setExportProgress(75);

        // Export as PNG
        await exportCanvasAsPNG(offscreenCanvas, options.filename);

        // Update progress
        setExportProgress(100);

        toast.success(t("exportSuccess"));
      } catch (error) {
        console.error("Export failed:", error);
        toast.error(
          t("exportError") +
            ": " +
            (error instanceof Error ? error.message : "Unknown error"),
        );
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    },
    [layers, lines, canvasSize, t],
  );

  return {
    exportImage,
    isExporting,
    exportProgress,
  };
};
