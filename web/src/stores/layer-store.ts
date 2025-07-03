import { atom } from "jotai";
import { Layer } from "@/lib/drawing/types";
import { generateId } from "@/lib/drawing/utils";

const createDefaultLayer = (): Layer => ({
  id: generateId(),
  name: "Layer 1",
  visible: true,
  locked: false,
  opacity: 1,
  order: 0,
});

const defaultLayer = createDefaultLayer();
export const layersAtom = atom<Layer[]>([defaultLayer]);
export const currentLayerIdAtom = atom<string>(defaultLayer.id);

export const currentLayerAtom = atom<Layer | null>((get) => {
  const layers = get(layersAtom);
  const currentId = get(currentLayerIdAtom);
  return layers.find((layer) => layer.id === currentId) || null;
});

export const addLayerAtom = atom(null, (get, set) => {
  const layers = get(layersAtom);
  const newLayer: Layer = {
    id: generateId(),
    name: `Layer ${layers.length + 1}`,
    visible: true,
    locked: false,
    opacity: 1,
    order: layers.length,
  };
  set(layersAtom, [...layers, newLayer]);
  set(currentLayerIdAtom, newLayer.id);
});

export const removeLayerAtom = atom(null, (get, set, layerId: string) => {
  const layers = get(layersAtom);
  if (layers.length <= 1) return; // Keep at least one layer

  const newLayers = layers.filter((layer) => layer.id !== layerId);
  set(layersAtom, newLayers);

  // If current layer was removed, switch to the first layer
  if (get(currentLayerIdAtom) === layerId) {
    set(currentLayerIdAtom, newLayers[0].id);
  }
});

export const updateLayerAtom = atom(
  null,
  (get, set, layerId: string, updates: Partial<Layer>) => {
    const layers = get(layersAtom);
    set(
      layersAtom,
      layers.map((layer) =>
        layer.id === layerId ? { ...layer, ...updates } : layer,
      ),
    );
  },
);

export const reorderLayersAtom = atom(
  null,
  (get, set, fromIndex: number, toIndex: number) => {
    const layers = get(layersAtom);
    const newLayers = [...layers];
    const [removed] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, removed);
    set(layersAtom, newLayers);
  },
);

export const initializeLayersAtom = atom(
  null,
  (get, set, data: { layers: Layer[]; currentLayerId: string }) => {
    if (data.layers.length > 0) {
      set(layersAtom, data.layers);
      set(currentLayerIdAtom, data.currentLayerId);
    }
  },
);
