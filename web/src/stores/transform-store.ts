import { atom } from "jotai";
import { TransformState } from "@/lib/transform/types";

const initialTransformState: TransformState = {
  isTransforming: false,
  transformType: null,
  startBounds: null,
  currentScale: { x: 1, y: 1 },
  anchorPoint: { x: 0, y: 0 },
  startMousePos: null,
};

export const transformStateAtom = atom<TransformState>(initialTransformState);

export const startTransformAtom = atom(
  null,
  (get, set, params: Partial<TransformState>) => {
    set(transformStateAtom, {
      ...get(transformStateAtom),
      ...params,
      isTransforming: true,
    });
  },
);

export const updateTransformAtom = atom(
  null,
  (get, set, scale: { x: number; y: number }) => {
    set(transformStateAtom, {
      ...get(transformStateAtom),
      currentScale: scale,
    });
  },
);

export const endTransformAtom = atom(null, (get, set) => {
  set(transformStateAtom, initialTransformState);
});
