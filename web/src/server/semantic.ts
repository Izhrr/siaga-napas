import "server-only";
/* Semantic layer for Tanya Data. The LLM never writes SQL: it picks a typed tool, the tool runs fixed,
   parameterised SQL against mart views, and the chart artifact is built here from the rows. */
import type { Artifact } from "@/lib/chat-types";
import { sql } from "./db";

export const STATIONS = ["JKT-01", "JKT-02", "JKT-03", "KTG-01", "KTG-02", "BGR-01", "BGR-02", "YKY-01", "IDP-01", "KTB-01", "PKU-01", "JMB-01", "BTM-01", "BGL-01", "SRG-01", "MLG-01", "MRS-01", "PLU-01", "STG-01", "PKN-01", "PLB-01", "PSW-01", "MER-01", "MDN-01", "SM2-01", "BJB-01", "JMB-02"] as const;
const ISLANDS = ["Sumatra", "Jawa", "Kalimantan", "Sulawesi", "Papua"];
const ARCHS = ["kronis", "gambut", "ekstrem", "bersih"];
const METRICS = ["pm25", "excess_cases", "share_attributable", "exceed_days_pct", "very_unhealthy_days"] as const;
type Metric = (typeof METRICS)[number];
const METRIC_LABEL: Record<Metric, [string, string]> = {
  pm25: ["PM2.5 rata-rata", "µg/m³"], excess_cases: ["Kasus ISPA berlebih", "kasus"], share_attributable: ["Porsi rawat inap ISPA terkait PM2.5", "%"],
  exceed_days_pct: ["Hari di atas baku 55", "%"], very_unhealthy_days: ["Hari ISPU > 200", "hari"],
};

export interface Filters { years?: number[]; months?: number[]; islands?: string[]; archetypes?: string[]; stations?: string[]; group?: "u5" | "o60" | "both"; threshold?: 15 | 25 | 55 }
const filterSchema = {
  years: { type: "array", items: { type: "integer", enum: [2024, 2025, 2026] }, description: "Tahun. Kosong = semua (Jan 2024 – Okt 2026)." },
  months: { type: "array", items: { type: "integer", minimum: 1, maximum: 12 }, description: "Bulan 1–12. Musim asap = [8,9,10]." },
  islands: { type: "array", items: { type: "string", enum: ISLANDS } },
  archetypes: { type: "array", items: { type: "string", enum: ARCHS }, description: "Tipe wilayah hasil k-means." },
  stations: { type: "array", items: { type: "string", enum: STATIONS }, description: "Kode stasiun, lihat katalog di prompt sistem." },
  group: { type: "string", enum: ["u5", "o60", "both"], description: "u5 = balita, o60 = lansia. Default both." },
  threshold: { type: "integer", enum: [15, 25, 55], description: "Acuan PM2.5 untuk kasus berlebih. Default 25 (ambang efek di data); 55 = baku mutu nasional; 15 = WHO." },
} as const;

export const TOOL_DEFS = [
  { name: "kpi_summary", description: "Ringkasan angka utama untuk filter: kasus ISPA berlebih, porsi rawat inap terkait PM2.5, PM2.5 rata-rata, % hari di atas baku 55.", parameters: { type: "object", properties: { ...filterSchema } } },
  { name: "rank", description: "Peringkat stasiun/provinsi/pulau/tipe wilayah menurut satu metrik.", parameters: { type: "object", required: ["metric", "by"], properties: { metric: { type: "string", enum: METRICS }, by: { type: "string", enum: ["station", "province", "island", "archetype"] }, top_n: { type: "integer", minimum: 1, maximum: 27 }, order: { type: "string", enum: ["desc", "asc"] }, ...filterSchema } } },
  { name: "trend", description: "Deret waktu satu metrik per bulan atau per tahun, untuk nasional atau beberapa stasiun (maks 4).", parameters: { type: "object", required: ["metric", "grain"], properties: { metric: { type: "string", enum: METRICS }, grain: { type: "string", enum: ["month", "year"] }, ...filterSchema } } },
  { name: "hospital_pressure", description: "Tekanan RS: admisi pernapasan per 100 tempat tidur per hari, normal (Jan–Jun) vs puncak rata-rata 7 hari.", parameters: { type: "object", properties: { top_n: { type: "integer", minimum: 1, maximum: 27 }, stations: filterSchema.stations } } },
  { name: "exposure_response", description: "Kurva risiko rawat inap terhadap PM2.5 dari model Poisson (rasio terhadap hari dengan PM2.5 15).", parameters: { type: "object", required: ["outcome"], properties: { outcome: { type: "string", enum: ["resp_u5", "resp_o60", "asthma", "copd", "resp", "cvd", "death"] } } } },
  { name: "station_profile", description: "Profil satu stasiun: lokasi, tipe wilayah, RS, kualitas data, level dan lonjakan PM2.5.", parameters: { type: "object", required: ["station"], properties: { station: { type: "string", enum: STATIONS } } } },
  { name: "data_quality", description: "Kualitas data stasiun: % jam valid, masalah, stasiun layak atau tidak.", parameters: { type: "object", properties: { only_problematic: { type: "boolean" } } } },
  { name: "cannot_answer", description: "Gunakan bila pertanyaan di luar cakupan data JERNIH (mis. data lain, prediksi masa depan, opini politik). Jangan menjawab dengan metrik lain yang mirip.", parameters: { type: "object", required: ["reason"], properties: { reason: { type: "string" }, try_instead: { type: "array", items: { type: "string" } } } } },
] as const;

export interface ToolResult { rows: Record<string, unknown>[]; artifact?: Artifact | null; refusal?: { reason: string; try_instead?: string[] } }

/* ---------- SQL helpers (whitelisted identifiers, parameterised values) ---------- */
function where(f: Filters, alias = "v") {
  const s = sql();
  const parts = [s`true`];
  if (f.years?.length) parts.push(s`${s(alias)}.year = any(${f.years})`);
  if (f.months?.length) parts.push(s`${s(alias)}.month = any(${f.months})`);
  if (f.islands?.length) parts.push(s`${s(alias)}.island = any(${f.islands})`);
  if (f.archetypes?.length) parts.push(s`${s(alias)}.archetype = any(${f.archetypes})`);
  if (f.stations?.length) parts.push(s`${s(alias)}.station_code = any(${f.stations})`);
  return parts.reduce((acc, p) => s`${acc} and ${p}`);
}
function metricExpr(m: Metric, f: Filters) {
  const s = sql(), t = String(f.threshold ?? 25), g = f.group ?? "both";
  const ex = g === "u5" ? `excess_u5_t${t}` : g === "o60" ? `excess_o60_t${t}` : `(excess_u5_t${t} + excess_o60_t${t})`;
  const ob = g === "u5" ? "obs_resp_u5" : g === "o60" ? "obs_resp_o60" : "(obs_resp_u5 + obs_resp_o60)";
  const health = "station_code not in ('JMB-02','MER-01')"; // tidak ada hari valid -> tidak masuk model kesehatan
  const expr: Record<Metric, string> = {
    pm25: "round((sum(pm25_mean * valid_days) / nullif(sum(valid_days), 0))::numeric, 1)",
    excess_cases: `round(sum(${ex}) filter (where ${health}))`,
    share_attributable: `round((100 * sum(${ex}) filter (where ${health}) / nullif(sum(${ob}) filter (where ${health}), 0))::numeric, 1)`,
    exceed_days_pct: "round((100.0 * sum(exceed_days) / nullif(sum(valid_days), 0))::numeric, 1)",
    very_unhealthy_days: "sum(very_unhealthy_days)",
  };
  return s.unsafe(expr[m]); // built only from whitelisted pieces above
}
const num = (v: unknown) => (v == null ? null : Number(v));

/* ---------- executors ---------- */
export async function runTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const s = sql(), f = args as Filters;
  switch (name) {
    case "kpi_summary": {
      const [r] = await s`select ${metricExpr("excess_cases", f)} as excess_cases, ${metricExpr("share_attributable", f)} as share_attributable_pct,
        ${metricExpr("pm25", f)} as pm25_mean, ${metricExpr("exceed_days_pct", f)} as exceed_days_pct, count(distinct station_code) as stations
        from mart.v_station_month v where ${where(f)}`;
      const row = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, num(v)]));
      return { rows: [row], artifact: { kind: "table", title: "Ringkasan", columns: ["Metrik", "Nilai"], rows: [["Kasus ISPA berlebih", row.excess_cases], ["Porsi terkait PM2.5 (%)", row.share_attributable_pct], ["PM2.5 rata-rata (µg/m³)", row.pm25_mean], ["Hari di atas 55 (%)", row.exceed_days_pct]] } };
    }
    case "rank": {
      const m = args.metric as Metric, by = args.by as string, n = Math.min(Number(args.top_n ?? 10), 27), asc = args.order === "asc";
      const key = { station: "station_code", province: "provinsi", island: "island", archetype: "archetype" }[by] ?? "station_code";
      const rows = await s`select ${s(key)} as label, ${metricExpr(m, f)} as value from mart.v_station_month v where ${where(f)}
        group by 1 having ${metricExpr(m, f)} is not null order by 2 ${asc ? s`asc` : s`desc`} limit ${n}`;
      const out = rows.map((r) => ({ label: String(r.label), value: num(r.value) ?? 0 }));
      return { rows: out, artifact: { kind: "bars", title: `${METRIC_LABEL[m][0]} per ${by === "station" ? "stasiun" : by === "province" ? "provinsi" : by === "island" ? "pulau" : "tipe wilayah"}`, unit: METRIC_LABEL[m][1], bars: out } };
    }
    case "trend": {
      const m = args.metric as Metric, grain = args.grain === "year" ? "year" : "month";
      const per = (f.stations?.length ?? 0) > 0 && (f.stations?.length ?? 0) <= 4;
      const xcol = grain === "year" ? s`year::text` : s`to_char(month_start, 'YYYY-MM')`;
      const rows = per
        ? await s`select ${xcol} as x, station_code as series, ${metricExpr(m, f)} as value from mart.v_station_month v where ${where(f)} group by 1, 2 order by 1`
        : await s`select ${xcol} as x, 'Nasional' as series, ${metricExpr(m, f)} as value from mart.v_station_month v where ${where(f)} group by 1 order by 1`;
      const xs = [...new Set(rows.map((r) => String(r.x)))], names = [...new Set(rows.map((r) => String(r.series)))];
      const series = names.map((nm) => ({ name: nm, values: xs.map((x) => num(rows.find((r) => String(r.x) === x && String(r.series) === nm)?.value)) }));
      return { rows: rows.map((r) => ({ x: r.x, series: r.series, value: num(r.value) })), artifact: { kind: "lines", title: `${METRIC_LABEL[m][0]} per ${grain === "year" ? "tahun" : "bulan"}`, unit: METRIC_LABEL[m][1], x: xs, series } };
    }
    case "hospital_pressure": {
      const n = Math.min(Number(args.top_n ?? 7), 27), st = (args.stations as string[] | undefined) ?? [];
      const rows = await s`select station_code, kota_kabupaten, kelas_faskes, beds, resp_per100bed_normal as normal, resp_per100bed_peak7 as peak,
        round((resp_per100bed_peak7 / nullif(resp_per100bed_normal, 0))::numeric, 1) as multiplier
        from mart.v_station_profile where (${st.length === 0} or station_code = any(${st})) order by peak desc nulls last limit ${n}`;
      const out = rows.map((r) => ({ station: r.station_code, kota: r.kota_kabupaten, kelas: r.kelas_faskes, beds: r.beds, normal: num(r.normal), peak: num(r.peak), multiplier: num(r.multiplier) }));
      return { rows: out, artifact: { kind: "bars", title: "Puncak admisi pernapasan per 100 tempat tidur per hari", unit: "", bars: out.map((r) => ({ label: `${r.station} ${String(r.kelas).replace("Tipe ", "")}`, value: r.peak ?? 0 })) } };
    }
    case "exposure_response": {
      const rows = await s`select pm25, rr_vs_15 from mart.model_exposure_response where outcome = ${String(args.outcome)} and pm25 = any(${[15, 25, 37.5, 55, 75, 100, 150, 250]}) order by pm25`;
      const out = rows.map((r) => ({ pm25: num(r.pm25), rr: num(r.rr_vs_15) }));
      return { rows: out, artifact: { kind: "bars", title: "Risiko rawat inap dibanding PM2.5 15 µg/m³", unit: "×", bars: out.map((r) => ({ label: `PM2.5 ${r.pm25}`, value: r.rr ?? 0 })) } };
    }
    case "station_profile": {
      const [r] = await s`select station_code, station_name, kota_kabupaten, provinsi, island, archetype, site_type, kelas_faskes, beds, capture_pct, issue, is_reliable,
        offseason_pm25, haze_multiplier, escalation, nearest_km, iku_2025, exceed_days_2025 from mart.v_station_profile where station_code = ${String(args.station)}`;
      if (!r) return { rows: [] };
      const row = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" || typeof v === "boolean" ? v : num(v)]));
      return { rows: [row], artifact: { kind: "table", title: `Profil ${row.station_code}`, columns: ["Atribut", "Nilai"], rows: Object.entries(row).map(([k, v]) => [k, typeof v === "boolean" ? (v ? "ya" : "tidak") : (v as string | number | null)]) } };
    }
    case "data_quality": {
      const only = Boolean(args.only_problematic);
      const rows = await s`select station_code, capture_pct, issue, is_reliable from mart.station_quality where (${!only} or not is_reliable or issue <> '') order by capture_pct`;
      const out = rows.map((r) => ({ station: r.station_code, capture_pct: num(r.capture_pct), issue: r.issue, reliable: r.is_reliable }));
      return { rows: out, artifact: { kind: "table", title: "Kualitas data stasiun", columns: ["Stasiun", "% jam valid", "Masalah", "Layak"], rows: out.map((r) => [r.station, r.capture_pct, r.issue || "–", r.reliable ? "ya" : "tidak"]) } };
    }
    case "cannot_answer":
      return { rows: [], refusal: { reason: String(args.reason ?? "di luar cakupan"), try_instead: (args.try_instead as string[]) ?? [] } };
    default:
      throw new Error(`Tool tidak dikenal: ${name}`);
  }
}

export async function stationCatalog(): Promise<string> {
  const rows = await sql()`select station_code, kota_kabupaten, provinsi, island, archetype from mart.dim_station order by station_code`;
  return rows.map((r) => `${r.station_code}: ${r.kota_kabupaten}, ${r.provinsi} (${r.island}, ${r.archetype})`).join("\n");
}
