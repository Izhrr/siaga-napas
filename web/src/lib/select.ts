import { MON } from "./format";
import { groupKey, thresholdIndex } from "./store";
import type { DashboardData, Filters, Group, Station, Threshold } from "./types";

export const ARCH_LABEL: Record<string, string> = {
  kronis: "Kronis perkotaan", gambut: "Gambut bereskalasi", ekstrem: "Kalteng ekstrem", bersih: "Latar bersih", "tanpa-data": "Data tidak cukup",
};
export const islandOf = (prov: string): string =>
  /Jakarta|Jawa|Yogyakarta/.test(prov) ? "Jawa" : /Kalimantan/.test(prov) ? "Kalimantan" : /Sulawesi/.test(prov) ? "Sulawesi" : /Papua/.test(prov) ? "Papua" : "Sumatra";
export const shortProv = (n: string) =>
  n.replace(" (incl. Papua Barat Daya)", "").replace(" (incl. Papua Selatan)", "")
    .replace("Kalimantan", "Kal.").replace("Sumatera", "Sum.").replace("Sulawesi", "Sul.").replace("Kepulauan", "Kep.");
const EXCLUDED_HEALTH = new Set(["JMB-02", "MER-01"]); // tidak ada hari valid -> tidak masuk model kesehatan

export function monthIndices(d: DashboardData, f: Pick<Filters, "years" | "months">): number[] {
  return d.months.flatMap((m, i) => (f.years.includes(m.slice(0, 4)) && f.months.includes(+m.slice(5)) ? [i] : []));
}
export function selectedStations(d: DashboardData, f: Filters): Station[] {
  return d.stations.filter((s) => f.islands.includes(islandOf(s.prov)) && f.archs.includes(s.arch));
}

export interface Agg { ex: number; obs: number; pm: number | null; vd: number; exc: number; haz: number; excPct: number | null; af: number | null; ex25: number; ex55: number; xb: number[] }

/** Agregasi aditif dari grain stasiun × bulan. */
export function agg(d: DashboardData, codes: string[], idx: number[], c0: Threshold | "37.5", group: "both" | Group): Agg {
  const ci = thresholdIndex[c0];
  let ex = 0, obs = 0, pmw = 0, vd = 0, exc = 0, haz = 0, ex25 = 0, ex55 = 0; const xb = [0, 0, 0, 0];
  for (const c of codes) for (const i of idx) {
    const r = d.monthly[c]?.[i]; if (!r) continue;
    if (r.vd && r.pm != null) { pmw += r.pm * r.vd; vd += r.vd; exc += r.exc ?? 0; haz += r.haz ?? 0; }
    if (r.xu && r.xo && !EXCLUDED_HEALTH.has(c)) {
      const pick = (k: number) => (group === "u5" ? r.xu![k] : group === "o60" ? r.xo![k] : r.xu![k] + r.xo![k]);
      ex += pick(ci); ex25 += pick(1); ex55 += pick(3);
      obs += group === "u5" ? r.ou ?? 0 : group === "o60" ? r.oo ?? 0 : (r.ou ?? 0) + (r.oo ?? 0);
      r.xb?.forEach((v, k) => (xb[k] += v));
    }
  }
  return { ex, obs, vd, exc, haz, ex25, ex55, xb, pm: vd ? pmw / vd : null, excPct: vd ? (exc / vd) * 100 : null, af: obs ? (ex / obs) * 100 : null };
}

/** Context object used by every chart and KPI so they all read the same selection. */
export interface Ctx { d: DashboardData; f: Filters; idx: number[]; stations: Station[]; codes: string[]; group: "both" | Group }
export function makeCtx(d: DashboardData, f: Filters): Ctx {
  const stations = selectedStations(d, f);
  return { d, f, idx: monthIndices(d, f), stations, codes: stations.map((s) => s.code), group: groupKey(f.groups) };
}
export const aggCtx = (c: Ctx, codes = c.codes, idx = c.idx, c0: Threshold | "37.5" = c.f.c0, group = c.group) => agg(c.d, codes, idx, c0, group);

export const groupLabel = (g: "both" | Group) => ({ both: "balita + lansia", u5: "balita", o60: "lansia" })[g];
export const thresholdLabel = (t: Threshold) => ({ "55": "baku mutu 55", "25": "ambang 25", "15": "pedoman WHO 15" })[t];

export function monthsLabel(months: number[]): string {
  const m = [...months].sort((a, b) => a - b).join();
  if (months.length === 12) return "";
  if (m === "8,9,10") return "musim asap";
  if (m === "1,2,3,4,5,6,7,11,12") return "luar musim asap";
  return months.length <= 3 ? months.map((x) => MON[x - 1]).join(", ") : `${months.length} bulan`;
}
export function periodLabel(f: Filters): string {
  const y = [...f.years].sort();
  const ml = monthsLabel(f.months);
  return (y.length === 3 ? "2024–2026" : y.join(", ")) + (ml ? " · " + ml : "");
}

/** Tahun terakhir terpilih vs tahun terawal (atau tahun sebelumnya), pada bulan yang sama dan ≤ Oktober agar sebanding. */
export function growth(c: Ctx) {
  const ys = [...c.f.years].sort();
  const yNow = ys[ys.length - 1];
  const yPrev = ys.length > 1 ? ys[0] : String(+yNow - 1);
  if (yPrev < "2024") return null;
  const mm = c.f.months.filter((m) => m <= 10);
  if (!mm.length) return null;
  const pick = (y: string) => c.d.months.flatMap((m, i) => (m.startsWith(y) && mm.includes(+m.slice(5)) ? [i] : []));
  const a = aggCtx(c, c.codes, pick(yNow)), b = aggCtx(c, c.codes, pick(yPrev));
  return { yNow, yPrev, ex: b.ex ? (a.ex / b.ex - 1) * 100 : null, pm: b.pm && a.pm ? (a.pm / b.pm - 1) * 100 : null };
}
export const isReliable = (s: Station) => s.cap >= 85 && !s.issue.startsWith("Macet");
