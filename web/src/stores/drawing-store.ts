import { atom } from "jotai";
import { DrawingLine, Layer } from "@/lib/drawing/types";
import { drawingStorage } from "@/lib/storage/drawing-storage";
import { debounce } from "@/lib/storage/utils";

// Storage save status atom
export const saveStatusAtom = atom<"idle" | "saving" | "saved" | "error">(
  "idle",
);

// Create a wrapper function for saving
const saveDrawingData = async (
  lines: DrawingLine[],
  layers: Layer[],
  currentLayerId: string,
  setSaveStatus: (status: "idle" | "saving" | "saved" | "error") => void,
) => {
  try {
    setSaveStatus("saving");
    await drawingStorage.save({
      lines,
      layers,
      currentLayerId,
      version: "1.0",
      timestamp: Date.now(),
    });
    setSaveStatus("saved");
    setTimeout(() => {
      setSaveStatus("idle");
    }, 2000);
  } catch (error) {
    console.error("Failed to save drawing data:", error);
    setSaveStatus("error");
  }
};

// Debounced save function
const debouncedSaveData = debounce(saveDrawingData, 1000);

// Persist drawing data atom
export const persistDrawingAtom = atom(
  null,
  (
    get,
    set,
    {
      lines,
      layers,
      currentLayerId,
    }: { lines: DrawingLine[]; layers: Layer[]; currentLayerId: string },
  ) => {
    const setSaveStatus = (status: "idle" | "saving" | "saved" | "error") => {
      set(saveStatusAtom, status);
    };
    debouncedSaveData(lines, layers, currentLayerId, setSaveStatus);
  },
);

// Load drawing data atom
export const loadDrawingAtom = atom(null, async () => {
  try {
    const data = await drawingStorage.load();
    if (data) {
      return data;
    }
  } catch (error) {
    console.error("Failed to load drawing data:", error);
  }
  return null;
});

// Clear drawing data atom
export const clearDrawingAtom = atom(null, async (_get, set) => {
  try {
    await drawingStorage.clear();
    set(saveStatusAtom, "idle");
  } catch (error) {
    console.error("Failed to clear drawing data:", error);
  }
});
