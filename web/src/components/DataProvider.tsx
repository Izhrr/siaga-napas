"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { islandOf, makeCtx, type Ctx } from "@/lib/select";
import { useUI } from "@/lib/store";
import { create } from "zustand";
import type { DashboardData } from "@/lib/types";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: DashboardData };
const DataCtx = createContext<State>({ status: "loading" });

/** Theme lives outside the filter store so charts can redraw when it flips. */
export const useTheme = create<{ theme: "light" | "dark"; set: (t: "light" | "dark") => void }>((set) => ({ theme: "light", set: (theme) => set({ theme }) }));

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    fetch("/data/dashboard.json")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<DashboardData>; })
      .then((data) => { data.stations.forEach((s) => (s.isl = islandOf(s.prov))); if (alive) setState({ status: "ready", data }); })
      .catch((e: Error) => alive && setState({ status: "error", message: e.message }));
    return () => { alive = false; };
  }, []);
  return <DataCtx.Provider value={state}>{children}</DataCtx.Provider>;
}

export const useDataState = () => useContext(DataCtx);

/** Selection context shared by KPIs, charts, and key points. Null until data is loaded. */
export function useCtx(): Ctx | null {
  const s = useContext(DataCtx);
  const filters = useUI((u) => u.filters);
  return useMemo(() => (s.status === "ready" ? makeCtx(s.data, filters) : null), [s, filters]);
}
