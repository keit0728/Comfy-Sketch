import { atom } from "jotai";

export type ToolType = "pen" | "eraser";

export const currentToolAtom = atom<ToolType>("pen");
export const brushSizeAtom = atom<number>(3);
export const brushColorAtom = atom<string>("#000000");
