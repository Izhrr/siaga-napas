/* Smoke test for the semantic layer: runs every tool against DATABASE_URL and prints row counts + first rows.
   Usage: DATABASE_URL=postgres://... npx tsx --conditions=react-server scripts/test-tools.ts */
import { runTool } from "../src/server/semantic";
import { traceFigures } from "../src/server/llm";

const cases: [string, Record<string, unknown>][] = [
  ["kpi_summary", {}],
  ["kpi_summary", { threshold: 55 }],
  ["rank", { metric: "excess_cases", by: "province", top_n: 5 }],
  ["rank", { metric: "pm25", by: "station", top_n: 3, months: [8, 9, 10], years: [2026] }],
  ["trend", { metric: "pm25", grain: "year", stations: ["JKT-01", "KTG-01"] }],
  ["trend", { metric: "excess_cases", grain: "month", years: [2026] }],
  ["hospital_pressure", { top_n: 3 }],
  ["exposure_response", { outcome: "resp_u5" }],
  ["station_profile", { station: "BJB-01" }],
  ["data_quality", { only_problematic: true }],
];
(async () => {
  for (const [t, a] of cases) {
    const r = await runTool(t, a);
    console.log(`${t} ${JSON.stringify(a)} -> ${r.rows.length} rows, artifact=${r.artifact?.kind ?? "-"}`, JSON.stringify(r.rows.slice(0, 2)));
  }
  console.log("guard", traceFigures("Ada 56.354 kasus, porsi 32,6% dan PM2.5 39,4 µg/m³ di 2026", [56354, 32.6, 39.4]));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
