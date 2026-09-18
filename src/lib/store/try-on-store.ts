import { create } from "zustand";

interface TryOnState {
  modelPhotoId: string | null;
  selectedItemIds: string[];
  resultImageUrl: string | null;
  generating: boolean;
  setModelPhoto: (id: string | null) => void;
  toggleItem: (id: string) => void;
  clearSelection: () => void;
  setResult: (url: string | null) => void;
  setGenerating: (v: boolean) => void;
}

export const useTryOnStore = create<TryOnState>((set) => ({
  modelPhotoId: null,
  selectedItemIds: [],
  resultImageUrl: null,
  generating: false,
  setModelPhoto: (id) => set({ modelPhotoId: id, resultImageUrl: null }),
  toggleItem: (id) =>
    set((state) => ({
      selectedItemIds: state.selectedItemIds.includes(id)
        ? state.selectedItemIds.filter((i) => i !== id)
        : [...state.selectedItemIds, id],
      resultImageUrl: null,
    })),
  clearSelection: () => set({ selectedItemIds: [], resultImageUrl: null }),
  setResult: (url) => set({ resultImageUrl: url }),
  setGenerating: (v) => set({ generating: v }),
}));
