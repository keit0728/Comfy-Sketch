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

// Canvas size
export const canvasSizeAtom = atom({
  width: 800,
  height: 600,
});

// Helper functions for layer operations
export const createLayerAtom = atom(
  null,
  (get, set, name: string) => {
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
    
    return newLayer.id;
  }
);

export const deleteLayerAtom = atom(
  null,
  (get, set, layerId: string) => {
    const layers = get(layersAtom);
    const activeLayerId = get(activeLayerIdAtom);
    
    const updatedLayers = layers.filter(layer => layer.id !== layerId);
    set(layersAtom, updatedLayers);
    
    if (activeLayerId === layerId) {
      set(activeLayerIdAtom, updatedLayers.length > 0 ? updatedLayers[0].id : null);
    }
  }
);

export const toggleLayerVisibilityAtom = atom(
  null,
  (get, set, layerId: string) => {
    const layers = get(layersAtom);
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    set(layersAtom, updatedLayers);
  }
);

export const updateLayerOpacityAtom = atom(
  null,
  (get, set, layerId: string, opacity: number) => {
    const layers = get(layersAtom);
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, opacity } : layer
    );
    set(layersAtom, updatedLayers);
  }
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
  }
);