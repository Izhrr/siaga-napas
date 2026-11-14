export type Archetype = "kronis" | "gambut" | "ekstrem" | "bersih" | "tanpa-data";
export type Group = "u5" | "o60";
export type Threshold = "15" | "25" | "55";
export type PageKey = "ringkasan" | "waktu" | "pemicu" | "dampak" | "jaringan";

export interface Station {
  code: string; kota: string; prov: string; geo: string; lat: number; lon: number; x: number; y: number;
  site: string; status: string; arch: Archetype;
  off: number | null; mult: number | null; esc: number | null; h24: number | null; h26: number | null;
  traffic: number; road: number; beds: number; kelas: string; cap: number; issue: string;
  iku: number | null; exc25: number | null; off100: number; peak100: number; nn: number; baseline: number;
  isl?: string;
}
export interface MonthRow {
  pm?: number; vd?: number; exc?: number; haz?: number; ou?: number; oo?: number;
  xu?: [number, number, number, number]; xo?: [number, number, number, number]; xb?: [number, number, number, number];
}
export interface Province { id: string; name: string; d: string }
export interface DashboardData {
  meta: { period: string; updated: string; n: number };
  provinces: Province[]; stations: Station[]; months: string[]; monthly: Record<string, MonthRow[]>;
  diurnal: Record<string, number[]>; weekpart: { kerja: number[]; akhir: number[] };
  curves: Record<string, [number, number][]>; event: Record<string, [number, number][]>;
  pct2x: Record<string, number>; wind: Record<string, { pm: (number | null)[]; share: number[] }>;
  importance: [string, number][];
}
export interface Filters { years: string[]; months: number[]; islands: string[]; archs: Archetype[]; groups: Group[]; c0: Threshold }
