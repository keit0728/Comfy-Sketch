import { atom } from "jotai";
import { DrawingLine } from "@/lib/drawing/types";

interface HistoryState {
  past: DrawingLine[][];
  present: DrawingLine[];
  future: DrawingLine[][];
}

const initialHistoryState: HistoryState = {
  past: [],
  present: [],
  future: [],
};

export const historyAtom = atom<HistoryState>(initialHistoryState);

export const canUndoAtom = atom((get) => get(historyAtom).past.length > 0);
export const canRedoAtom = atom((get) => get(historyAtom).future.length > 0);

export const pushHistoryAtom = atom(
  null,
  (get, set, newLines: DrawingLine[]) => {
    const history = get(historyAtom);
    set(historyAtom, {
      past: [...history.past, history.present],
      present: newLines,
      future: [],
    });
  },
);

export const undoAtom = atom(null, (get, set) => {
  const history = get(historyAtom);
  if (history.past.length === 0) return;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, history.past.length - 1);

  set(historyAtom, {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  });
});

export const redoAtom = atom(null, (get, set) => {
  const history = get(historyAtom);
  if (history.future.length === 0) return;

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  set(historyAtom, {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  });
});

export const initializeHistoryAtom = atom(
  null,
  (get, set, initialLines: DrawingLine[]) => {
    set(historyAtom, {
      past: [],
      present: initialLines,
      future: [],
    });
  },
);
