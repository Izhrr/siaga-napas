"use client";
import { Card, Pills } from "../Card";
import { Chart } from "../Chart";
import { useCtx } from "../DataProvider";
import { cssVar, el, hover, row, seqColor } from "@/lib/charts/core";
import { combo, hbars, mapBase, mapLabels } from "@/lib/charts/kit";
import { fmt, kfmt, MON } from "@/lib/format";
import { aggCtx, groupLabel, periodLabel, shortProv, thresholdLabel, type Ctx } from "@/lib/select";
import { useUI } from "@/lib/store";

export const MAP_METRIC = {
  af: { bins: [10, 20, 30, 40, 50], lbl: ["< 10%", "10–20", "20–30", "30–40", "40–50", "≥ 50%"], name: "% ISPA terkait PM2.5", f: (v: number) => fmt(v) + "%" },
  pm: { bins: [15.5, 25, 35, 55, 75], lbl: ["< 15,5", "15,5–25", "25–35", "35–55", "55–75", "≥ 75 µg/m³"], name: "PM2.5 rata-rata", f: (v: number) => fmt(v, 1) + " µg/m³" },
  exc: { bins: [5, 10, 20, 30, 40], lbl: ["< 5%", "5–10", "10–20", "20–30", "30–40", "≥ 40%"], name: "% hari di atas 55", f: (v: number) => fmt(v) + "%" },
};
export const HATCH_SW = '<i class="sw" style="background:repeating-linear-gradient(45deg,var(--hatch) 0 2px,var(--land) 2px 4px)"></i>';

type ProvVal = { none?: true; off?: true; v?: number | null; ex?: number; n?: number };
function provValues(c: Ctx, metric: keyof typeof MAP_METRIC): Record<string, ProvVal> {
  const sel = new Set(c.codes), out: Record<string, ProvVal> = {};
  for (const p of c.d.provinces) {
    const cs = c.d.stations.filter((s) => s.geo === p.id).map((s) => s.code);
    if (!cs.length) { out[p.id] = { none: true }; continue; }
    const on = cs.filter((x) => sel.has(x));
    if (!on.length) { out[p.id] = { off: true }; continue; }
    const a = aggCtx(c, on);
    out[p.id] = { v: metric === "af" ? a.af : metric === "pm" ? a.pm : a.excPct, ex: a.ex, n: on.length };
  }
  return out;
}

export function Ringkasan() {
  const c = useCtx()!;
  const metric = useUI((s) => s.mapMetric), setMetric = useUI((s) => s.setMapMetric);
  const sel = useUI((s) => s.selectedProvince), selectProvince = useUI((s) => s.selectProvince);
  const M = MAP_METRIC[metric], V = provValues(c, metric);
  const ranked = Object.entries(V).filter(([, v]) => v.v != null).sort((a, b) => (b[1].v ?? 0) - (a[1].v ?? 0)).slice(0, 3);
  const pname = (id: string) => c.d.provinces.find((p) => p.id === id)?.name ?? id;

  // tren bulanan
  const months = c.idx.map((i) => c.d.months[i]);
  const vals = c.idx.map((i) => aggCtx(c, c.codes, [i]).ex);
  const ma = vals.map((_, i) => (i < 2 ? null : (vals[i] + vals[i - 1] + vals[i - 2]) / 3));
  const haze = (i: number) => [8, 9, 10].includes(+months[i].slice(5));
  const mx = vals.indexOf(Math.max(...vals));
  const other = vals.filter((_, i) => !haze(i)), avgO = other.length ? other.reduce((a, b) => a + b, 0) / other.length : 0;

  // level PM2.5 & peringkat
  const b = aggCtx(c, c.codes, c.idx, "25", "both"), bt = b.xb.reduce((p, q) => p + q, 0);
  const rank = Object.entries(V).filter(([, v]) => (v.ex ?? 0) > 0).map(([id]) => {
    const cs = c.stations.filter((s) => s.geo === id).map((s) => s.code);
    return { id, u: aggCtx(c, cs, c.idx, c.f.c0, "u5").ex, o: aggCtx(c, cs, c.idx, c.f.c0, "o60").ex };
  }).sort((a, z) => z.u + z.o - (a.u + a.o)).slice(0, 7);
  const rankTot = rank.reduce((a, r) => a + r.u + r.o, 0);

  return (
    <>
      <Card area="1 / 1 / 2 / 11" title="Persebaran Beban ISPA per Provinsi" how="map" sub={`${M.name}, ${periodLabel(c.f)}`}
        tools={<Pills label="Metrik peta" value={metric} onChange={setMetric} options={[["af", "% ISPA terkait"], ["pm", "PM2.5"], ["exc", "Hari > 55"]]} />}
        legend={M.lbl.map((l, i) => `<span><i class="sw" style="background:var(--s${i + 1})"></i>${l}</span>`).join("") + `<span>${HATCH_SW}Tanpa stasiun</span><span><i class="sw dot" style="background:var(--ink)"></i>Stasiun pemantau</span>` + (c.codes.length < c.d.stations.length ? '<span><i class="sw dot" style="background:var(--bar-gray)"></i>Stasiun di luar filter</span>' : "") + '<span><i class="sw" style="background:transparent;outline:2px solid var(--ink);outline-offset:-2px"></i>Provinsi dipilih</span>'}
        insight={ranked[0] ? `${shortProv(pname(ranked[0][0]))} tertinggi (${M.f(ranked[0][1].v!)}). Provinsi bergaris tidak punya stasiun, bebannya tidak terlihat.` : "tidak ada provinsi pada filter ini."}>
        <Chart deps={[c, metric, sel]} draw={(box) => {
          const { svg, hatch } = mapBase(box, "Peta beban ISPA per provinsi", "map");
          for (const p of c.d.provinces) {
            const v = V[p.id];
            const path = el("path", { d: p.d, class: "prov" + (sel === p.id ? " sel" : ""), fill: v.none ? hatch : v.off || v.v == null ? cssVar("--land") : seqColor(v.v, M.bins), tabindex: v.none ? -1 : 0, role: "button", "aria-label": `${p.name}: ${v.none ? "tidak ada stasiun" : v.off ? "di luar filter" : M.f(v.v ?? 0)}` }, svg);
            hover(path, () => `<b>${p.name}</b>` + (v.none ? "<div>Tidak ada stasiun</div>" : v.off ? "<div>Di luar filter</div>" : row(M.name, M.f(v.v ?? 0)) + row(`Kasus berlebih, ${groupLabel(c.group)}`, fmt(v.ex)) + row("Stasiun", v.n ?? 0)));
            if (!v.none) {
              const pick = () => selectProvince(sel === p.id ? null : p.id);
              path.addEventListener("click", pick);
              path.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") { e.preventDefault(); pick(); } });
            }
          }
          const on = new Set(c.codes);
          c.d.stations.forEach((s) => el("circle", { cx: s.x, cy: s.y, r: 4, fill: on.has(s.code) ? cssVar("--ink") : cssVar("--bar-gray"), stroke: cssVar("--card"), "stroke-width": 1.5, "pointer-events": "none" }, svg));
          mapLabels(svg, ranked.map(([id, v]) => { const st = c.d.stations.find((s) => s.geo === id)!; return { x: st.x, y: st.y, text: `${shortProv(pname(id))} ${M.f(v.v!)}` }; }));
        }} />
      </Card>

      <Card area="1 / 11 / 2 / 19" title="Tren Bulanan Kasus Berlebih" how="trend" sub={`${groupLabel(c.group)}, di atas ${thresholdLabel(c.f.c0)}`}
        legend={'<span><i class="sw" style="background:var(--bar)"></i>Agu–Okt</span><span><i class="sw" style="background:var(--bar-soft)"></i>Bulan lain</span><span><i class="sw ln" style="background:var(--trend)"></i>Rata-rata 3 bulan</span>'}
        insight={vals.length ? `puncak ${MON[+months[mx].slice(5) - 1]} ${months[mx].slice(0, 4)} dengan ${fmt(vals[mx])} kasus${avgO ? `, ${fmt(vals[mx] / avgO, 1)}× rata-rata bulan di luar musim asap` : ""}.` : undefined}>
        <Chart deps={[c]} draw={(box) => combo(box, "Tren bulanan kasus berlebih", months, vals.map((v, i) => ({ v, color: haze(i) ? cssVar("--bar") : cssVar("--bar-soft") })), {
          line: ma, yf: kfmt, xl: (m) => (months.length > 14 ? (m.endsWith("-01") ? m.slice(0, 4) : "") : MON[+m.slice(5) - 1]),
          tip: (i) => `<b>${MON[+months[i].slice(5) - 1]} ${months[i].slice(0, 4)}</b>${row("Kasus berlebih", fmt(vals[i]))}${row("Rata-rata 3 bulan", fmt(ma[i]))}`,
        })} />
      </Card>

      <Card area="2 / 1 / 3 / 9" title="Kasus Berlebih per Level PM2.5" how="bands" sub="PM2.5 harian, µg/m³"
        insight={bt ? `${fmt((b.xb[0] / bt) * 100)}% kasus berlebih terjadi saat PM2.5 25–55 µg/m³, hari yang dianggap aman oleh baku mutu.` : undefined}>
        <Chart deps={[c]} draw={(box) => {
          const L = ["25–55 (lolos baku)", "55–150", "150–250", "di atas 250"];
          hbars(box, "Kasus berlebih per level PM2.5", b.xb.map((v, i) => ({ label: L[i], v, bold: i === 0, color: i === 0 ? cssVar("--bar") : cssVar("--bar-gray"), vl: `${kfmt(v)} · ${fmt(bt ? (v / bt) * 100 : 0)}%`,
            tip: `<b>PM2.5 ${L[i]} µg/m³</b>${row("Kasus berlebih", fmt(v))}${row("Porsi", fmt(bt ? (v / bt) * 100 : 0, 1) + "%")}` })), { lw: 114, vw: 78, empty: "Tidak ada kasus berlebih pada filter ini." });
        }} />
      </Card>

      <Card area="2 / 9 / 3 / 19" title="Peringkat Provinsi" how="rank" sub="Kasus berlebih per provinsi"
        legend={(c.group !== "o60" ? '<span><i class="sw" style="background:var(--bar)"></i>Balita</span>' : "") + (c.group !== "u5" ? '<span><i class="sw" style="background:var(--bar-gray)"></i>Lansia</span>' : "")}
        insight={rank.length ? `${shortProv(pname(rank[0].id))} menyumbang ${fmt(((rank[0].u + rank[0].o) / rankTot) * 100)}% dari ${rank.length} provinsi teratas.` : undefined}>
        <Chart deps={[c]} draw={(box) => hbars(box, "Peringkat provinsi", rank.map((r) => ({
          label: shortProv(pname(r.id)),
          segs: c.group === "u5" ? [{ v: r.u, color: cssVar("--bar") }] : c.group === "o60" ? [{ v: r.o, color: cssVar("--bar-gray") }] : [{ v: r.u, color: cssVar("--bar") }, { v: r.o, color: cssVar("--bar-gray") }],
          vl: kfmt(c.group === "u5" ? r.u : c.group === "o60" ? r.o : r.u + r.o), tip: `<b>${pname(r.id)}</b>${row("Balita", fmt(r.u))}${row("Lansia", fmt(r.o))}`,
        })), { lw: 104, vw: 44, empty: "Tidak ada kasus berlebih pada filter ini." })} />
      </Card>
    </>
  );
}
