"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Archetype, Filters, Group, Threshold } from "./types";

export const YEARS = ["2024", "2025", "2026"];
export const ISLANDS = ["Sumatra", "Jawa", "Kalimantan", "Sulawesi", "Papua"];
export const ARCHS: Archetype[] = ["kronis", "gambut", "ekstrem", "bersih"];
export const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const HAZE_MONTHS = [8, 9, 10];
export const OFF_MONTHS = [1, 2, 3, 4, 5, 6, 7, 11, 12];

export const defaultFilters = (): Filters => ({
  years: [...YEARS], months: [...ALL_MONTHS], islands: [...ISLANDS], archs: [...ARCHS, "tanpa-data"], groups: ["u5", "o60"], c0: "25",
});

interface UIState {
  filters: Filters;
  mapMetric: "af" | "pm" | "exc";
  windStation: string;
  selectedProvince: string | null;
  setFilter: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  reset: () => void;
  setMapMetric: (m: UIState["mapMetric"]) => void;
  setWindStation: (s: string) => void;
  selectProvince: (p: string | null) => void;
}

/** Filter global: berlaku di semua halaman dan bertahan saat pindah halaman (sessionStorage). */
export const useUI = create<UIState>()(
  persist(
    (set) => ({
      filters: defaultFilters(),
      mapMetric: "af",
      windStation: "PLB-01",
      selectedProvince: null,
      setFilter: (k, v) => set((s) => ({ filters: { ...s.filters, [k]: v }, selectedProvince: null })),
      reset: () => set({ filters: defaultFilters(), selectedProvince: null }),
      setMapMetric: (mapMetric) => set({ mapMetric }),
      setWindStation: (windStation) => set({ windStation }),
      selectProvince: (selectedProvince) => set({ selectedProvince }),
    }),
    {
      name: "jernih-ui",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ filters: s.filters, mapMetric: s.mapMetric, windStation: s.windStation }),
    },
  ),
);

export const groupKey = (groups: Group[]): "both" | Group => (groups.length === 2 ? "both" : groups[0]);
export const thresholdIndex: Record<Threshold | "37.5", number> = { "15": 0, "25": 1, "37.5": 2, "55": 3 };
