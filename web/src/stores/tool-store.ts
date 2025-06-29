import { atom } from "jotai";

export type ToolType = "pen" | "eraser" | "select";

export const currentToolAtom = atom<ToolType>("pen");
export const brushSizeAtom = atom<number>(3);
export const brushColorAtom = atom<string>("#000000");
export const selectedLineIdAtom = atom<string | null>(null);
