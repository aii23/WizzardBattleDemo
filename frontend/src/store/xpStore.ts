import { create } from "zustand";
import { XPState } from "../trpc/types";

export interface XPStore {
    xpData: XPState | null;
    setXPData: (data: XPState) => void;
}

export const useXPStore = create<XPStore>((set) => ({
    xpData: null,
    setXPData: (data) => set({ xpData: data }),
}));

