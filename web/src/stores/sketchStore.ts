import { atom } from "jotai";
import * as THREE from "three";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
  canvas: HTMLCanvasElement | null;
  texture: THREE.CanvasTexture | null;
}

export interface DrawingTool {
  type: "brush" | "eraser";
  size: number;
  color: string;
  opacity: number;
}

export interface DrawingState {
  isDrawing: boolean;
  lastPoint: { x: number; y: number } | null;
}

// Layer management
export const layersAtom = atom<Layer[]>([]);

// Active layer
export const activeLayerIdAtom = atom<string | null>(null);

// Drawing tool
export const drawingToolAtom = atom<DrawingTool>({
  type: "brush",
  size: 5,
  color: "#000000",
  opacity: 1,
});

// Drawing state
export const drawingStateAtom = atom<DrawingState>({
  isDrawing: false,
  lastPoint: null,
});

// Camera bounds for coordinate system
export const cameraBoundsAtom = atom({
  width: 8,
  height: 6,
});

// Canvas size - computed based on camera bounds to maintain aspect ratio
export const canvasSizeAtom = atom((get) => {
  const bounds = get(cameraBoundsAtom);
  // Use a higher resolution for better quality
  const baseResolution = 1200; // Base resolution for the longer dimension
  const aspectRatio = bounds.width / bounds.height;

  // Calculate dimensions maintaining aspect ratio
  let width, height;
  if (aspectRatio >= 1) {
    // Landscape or square
    width = baseResolution;
    height = Math.round(baseResolution / aspectRatio);
  } else {
    // Portrait
    width = Math.round(baseResolution * aspectRatio);
    height = baseResolution;
  }

  return { width, height };
});

// History management
export interface HistoryState {
  layerId: string;
  imageData: ImageData;
  timestamp: number;
}

export const historyAtom = atom<HistoryState[]>([]);
export const currentHistoryIndexAtom = atom(-1);

// History management functions
export const addToHistoryAtom = atom(
  null,
  (get, set, layerId: string, imageData: ImageData) => {
    const history = get(historyAtom);
    const currentIndex = get(currentHistoryIndexAtom);

    // Prevent duplicate saves within 50ms for the same layer
    const now = Date.now();
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      if (lastState.layerId === layerId && now - lastState.timestamp < 50) {
        return;
      }
    }

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, currentIndex + 1);

    // Add new state
    const newState: HistoryState = {
      layerId,
      imageData,
      timestamp: now,
    };

    newHistory.push(newState);

    // Limit history to 50 states and update index accordingly
    let newIndex = newHistory.length - 1;
    if (newHistory.length > 50) {
      newHistory.shift();
      newIndex = newHistory.length - 1;
    }

    set(historyAtom, newHistory);
    set(currentHistoryIndexAtom, newIndex);
  },
);

export const undoAtom = atom(null, (get, set) => {
  const history = get(historyAtom);
  const currentIndex = get(currentHistoryIndexAtom);

  if (currentIndex > 0) {
    const prevState = history[currentIndex - 1];
    const layers = get(layersAtom);
    const targetLayer = layers.find((layer) => layer.id === prevState.layerId);

    if (targetLayer?.canvas) {
      const ctx = targetLayer.canvas.getContext("2d");
      if (ctx) {
        ctx.putImageData(prevState.imageData, 0, 0);
        if (targetLayer.texture) {
          targetLayer.texture.needsUpdate = true;
        }
      }
    }

    set(currentHistoryIndexAtom, currentIndex - 1);
  }
});

export const redoAtom = atom(null, (get, set) => {
  const history = get(historyAtom);
  const currentIndex = get(currentHistoryIndexAtom);

  if (currentIndex < history.length - 1) {
    const nextState = history[currentIndex + 1];
    const layers = get(layersAtom);
    const targetLayer = layers.find((layer) => layer.id === nextState.layerId);

    if (targetLayer?.canvas) {
      const ctx = targetLayer.canvas.getContext("2d");
      if (ctx) {
        ctx.putImageData(nextState.imageData, 0, 0);
        if (targetLayer.texture) {
          targetLayer.texture.needsUpdate = true;
        }
      }
    }

    set(currentHistoryIndexAtom, currentIndex + 1);
  }
});

export const canUndoAtom = atom((get) => {
  const currentIndex = get(currentHistoryIndexAtom);
  return currentIndex > 0;
});

export const canRedoAtom = atom((get) => {
  const history = get(historyAtom);
  const currentIndex = get(currentHistoryIndexAtom);
  return currentIndex < history.length - 1;
});

// Helper functions for layer operations
export const createLayerAtom = atom(null, (get, set, name: string) => {
  const layers = get(layersAtom);
  const canvasSize = get(canvasSizeAtom);

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;

  // Initialize canvas with white
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.flipY = false; // Disable Y-axis flipping of canvas texture in Three.js

  const newLayer: Layer = {
    id: `layer-${Date.now()}`,
    name,
    visible: true,
    opacity: 1,
    zIndex: layers.length,
    canvas,
    texture,
  };

  set(layersAtom, [...layers, newLayer]);
  set(activeLayerIdAtom, newLayer.id);

  // Add initial state to history
  if (ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const history = get(historyAtom);
    const newState: HistoryState = {
      layerId: newLayer.id,
      imageData,
      timestamp: Date.now(),
    };
    const newHistory = [...history, newState];
    set(historyAtom, newHistory);
    set(currentHistoryIndexAtom, newHistory.length - 1);
  }

  return newLayer.id;
});

export const deleteLayerAtom = atom(null, (get, set, layerId: string) => {
  const layers = get(layersAtom);
  const activeLayerId = get(activeLayerIdAtom);

  const updatedLayers = layers.filter((layer) => layer.id !== layerId);
  set(layersAtom, updatedLayers);

  if (activeLayerId === layerId) {
    set(
      activeLayerIdAtom,
      updatedLayers.length > 0 ? updatedLayers[0].id : null,
    );
  }
});

export const toggleLayerVisibilityAtom = atom(
  null,
  (get, set, layerId: string) => {
    const layers = get(layersAtom);
    const updatedLayers = layers.map((layer) =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
    );
    set(layersAtom, updatedLayers);
  },
);

export const updateLayerOpacityAtom = atom(
  null,
  (get, set, layerId: string, opacity: number) => {
    const layers = get(layersAtom);
    const updatedLayers = layers.map((layer) =>
      layer.id === layerId ? { ...layer, opacity } : layer,
    );
    set(layersAtom, updatedLayers);
  },
);

export const reorderLayersAtom = atom(
  null,
  (get, set, dragIndex: number, hoverIndex: number) => {
    const layers = get(layersAtom);
    const dragLayer = layers[dragIndex];

    const updatedLayers = [...layers];
    updatedLayers.splice(dragIndex, 1);
    updatedLayers.splice(hoverIndex, 0, dragLayer);

    // Update zIndex
    const reindexedLayers = updatedLayers.map((layer, index) => ({
      ...layer,
      zIndex: index,
    }));

    set(layersAtom, reindexedLayers);
  },
);

// Resize all canvases when camera bounds change
export const resizeCanvasesAtom = atom(null, (get, set) => {
  const layers = get(layersAtom);
  const newCanvasSize = get(canvasSizeAtom);

  const updatedLayers = layers.map((layer) => {
    if (!layer.canvas) return layer;

    const oldCanvas = layer.canvas;
    const oldCtx = oldCanvas.getContext("2d");
    if (!oldCtx) return layer;

    // Store current canvas content
    const imageData = oldCtx.getImageData(
      0,
      0,
      oldCanvas.width,
      oldCanvas.height,
    );

    // Create new canvas with new dimensions
    const newCanvas = document.createElement("canvas");
    newCanvas.width = newCanvasSize.width;
    newCanvas.height = newCanvasSize.height;

    const newCtx = newCanvas.getContext("2d");
    if (!newCtx) return layer;

    // Fill with white background
    newCtx.fillStyle = "white";
    newCtx.fillRect(0, 0, newCanvasSize.width, newCanvasSize.height);

    // Scale and draw the old content onto the new canvas
    // Create temporary canvas for scaling the image data
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = oldCanvas.width;
    tempCanvas.height = oldCanvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
      newCtx.drawImage(
        tempCanvas,
        0,
        0,
        oldCanvas.width,
        oldCanvas.height,
        0,
        0,
        newCanvasSize.width,
        newCanvasSize.height,
      );
    }

    // Update texture
    const newTexture = new THREE.CanvasTexture(newCanvas);
    newTexture.needsUpdate = true;
    newTexture.flipY = false;

    return {
      ...layer,
      canvas: newCanvas,
      texture: newTexture,
    };
  });

  set(layersAtom, updatedLayers);
});
