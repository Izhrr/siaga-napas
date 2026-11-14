"use client";
import { Card } from "../Card";
import { Chart } from "../Chart";
import { useCtx } from "../DataProvider";
import { cssVar, el, empty, frame, hover, lin, row, seqColor, text, yGrid } from "@/lib/charts/core";
import { combo, lines } from "@/lib/charts/kit";
import { fmt, MON, nice } from "@/lib/format";
import { ARCH_LABEL, aggCtx } from "@/lib/select";
import { ARCHS, YEARS } from "@/lib/store";

const HB = [15.5, 25, 55, 150, 250];
const AC = (a: string) => cssVar(`--a-${a === "tanpa-data" ? "none" : a}`);
const HATCH_SW = '<i class="sw" style="background:repeating-linear-gradient(45deg,var(--hatch) 0 2px,var(--land) 2px 4px)"></i>';

export function Waktu() {
  const c = useCtx()!;
  const order = ["ekstrem", "gambut", "kronis", "bersih", "tanpa-data"];
  const rows = [...c.stations].sort((a, b) => order.indexOf(a.arch) - order.indexOf(b.arch) || (b.off ?? 0) - (a.off ?? 0));
  let best: { v: number; code: string; i: number } | null = null;
  rows.forEach((s) => c.idx.forEach((i) => { const v = c.d.monthly[s.code][i].pm; if (v != null && (!best || v > best.v)) best = { v, code: s.code, i }; }));
  const bestV = best as { v: number; code: string; i: number } | null;

  // pola musiman: rata-rata 2024–2025 vs 2026
  const base: (number | null)[] = [], y26: (number | null)[] = [];
  for (let mo = 1; mo <= 12; mo++) {
    const ib = c.d.months.flatMap((m, i) => (+m.slice(5) === mo && m < "2026" ? [i] : []));
    const i6 = c.d.months.flatMap((m, i) => (+m.slice(5) === mo && m.startsWith("2026") ? [i] : []));
    base.push(aggCtx(c, c.codes, ib).pm); y26.push(i6.length ? aggCtx(c, c.codes, i6).pm : null);
  }
  const g10 = y26[9] && base[9] ? (y26[9] / base[9] - 1) * 100 : null;

  // eskalasi musim asap
  const hz = (code: string, y: string) => aggCtx(c, [code], c.d.months.flatMap((m, i) => (m.startsWith(y) && +m.slice(5) >= 8 && +m.slice(5) <= 10 ? [i] : []))).pm;
  const esc = c.stations.filter((s) => s.h26 != null).map((s) => ({ s, v: YEARS.map((y) => hz(s.code, y)) })).filter((r) => r.v[2] != null).sort((a, b) => (b.v[2] ?? 0) - (a.v[2] ?? 0)).slice(0, 6);
  const di = ARCHS.filter((a) => c.f.archs.includes(a) && c.d.diurnal[a]);

  return (
    <>
      <Card area="1 / 1 / 3 / 8" title="Kalender PM2.5 per Wilayah" how="heat" sub="Rata-rata PM2.5 bulanan, µg/m³"
        legend={["< 15,5", "15,5–25", "25–55", "55–150", "150–250", "> 250"].map((l, i) => `<span><i class="sw" style="background:var(--s${i + 1})"></i>${l}</span>`).join("") + `<span>${HATCH_SW}tidak valid</span>`}
        insight={bestV ? `terparah ${bestV.code} ${MON[+c.d.months[bestV.i].slice(5) - 1]} ${c.d.months[bestV.i].slice(0, 4)} (${fmt(bestV.v)} µg/m³). Blok Agu–Okt berulang tiap tahun di wilayah gambut; Jakarta tinggi sepanjang tahun.` : undefined}>
        <Chart deps={[c]} draw={(box) => {
          if (!rows.length || !c.idx.length) return empty(box, "Tidak ada data untuk filter ini.");
          const { svg, w, h } = frame(box, "Kalender PM2.5 per wilayah");
          const lw = 64, cw = (w - lw) / c.idx.length, ch = Math.min(22, (h - 16) / rows.length);
          const pat = el("pattern", { id: "hh", width: 5, height: 5, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, el("defs", {}, svg));
          el("rect", { width: 5, height: 5, fill: cssVar("--land") }, pat); el("line", { x1: 0, y1: 0, x2: 0, y2: 5, stroke: cssVar("--hatch"), "stroke-width": 1.6 }, pat);
          rows.forEach((s, r) => {
            const yy = r * ch;
            el("rect", { x: 2, y: yy + ch / 2 - 4, width: 8, height: 8, rx: 2, fill: AC(s.arch) }, svg);
            text(svg, lw - 5, yy + ch / 2 + 3.5, s.code, "lab", "end");
            c.idx.forEach((i, k) => {
              const v = c.d.monthly[s.code][i].pm;
              const cell = el("rect", { x: lw + k * cw, y: yy, width: Math.max(1, cw - 1.5), height: ch - 1.5, rx: 2, fill: v == null ? "url(#hh)" : seqColor(v, HB) }, svg);
              hover(cell, `<b>${s.code} · ${s.kota}</b>${row(MON[+c.d.months[i].slice(5) - 1] + " " + c.d.months[i].slice(0, 4), v == null ? "data tidak valid" : fmt(v) + " µg/m³")}${row("Tipe wilayah", ARCH_LABEL[s.arch])}`);
            });
          });
          const ax = el("g", { class: "axis" }, svg);
          c.idx.forEach((i, k) => { const m = c.d.months[i]; const lab = c.idx.length > 14 ? (m.endsWith("-01") ? m.slice(0, 4) : m.endsWith("-08") ? "Agu" : "") : MON[+m.slice(5) - 1]; if (lab) text(ax, lw + k * cw + cw / 2, rows.length * ch + 12, lab, "", "middle"); });
        }} />
      </Card>

      <Card area="1 / 8 / 2 / 19" title="Pola Musiman" how="season" sub="PM2.5 per bulan, µg/m³"
        legend='<span><i class="sw" style="background:var(--bar)"></i>Agu–Okt 2024–25</span><span><i class="sw" style="background:var(--bar-soft)"></i>Bulan lain</span><span><i class="sw ln" style="background:var(--trend)"></i>2026</span><span><i class="sw ln" style="background:var(--ink2)"></i>baku 55</span>'
        insight={g10 != null ? `Oktober 2026 ${fmt(g10)}% lebih tinggi dari rata-rata Oktober dua tahun sebelumnya.` : undefined}>
        <Chart deps={[c]} draw={(box) => combo(box, "Pola musiman PM2.5", MON, base.map((v, i) => ({ v: v ?? 0, color: i >= 7 && i <= 9 ? cssVar("--bar") : cssVar("--bar-soft") })), {
          line: y26, refs: [{ v: 55, cls: "std55", label: "baku 55" }], yf: (v) => fmt(v),
          tip: (i) => `<b>${MON[i]}</b>${row("Rata-rata 2024–2025", fmt(base[i], 1))}${row("2026", y26[i] == null ? "belum ada" : fmt(y26[i], 1))}`,
        })} />
      </Card>

      <Card area="2 / 8 / 3 / 14" title="Musim Asap per Tahun" how="esc" sub="PM2.5 Agu–Okt, wilayah terparah"
        legend={YEARS.map((y, k) => `<span><i class="sw" style="background:var(${["--bar-gray", "--bar-soft", "--bar"][k]})"></i>${y}</span>`).join("")}
        insight={esc[0] ? `${esc[0].s.code} naik ${fmt((esc[0].v[2] ?? 0) / (esc[0].v[0] ?? 1), 1)}× dalam dua tahun, dari ${fmt(esc[0].v[0])} menjadi ${fmt(esc[0].v[2])} µg/m³.` : undefined}>
        <Chart deps={[c]} draw={(box) => {
          if (!esc.length) return empty(box, "Tidak ada wilayah dengan musim asap pada filter ini.");
          const { svg, w, h } = frame(box, "Musim asap per tahun");
          const m = { l: 32, r: 4, t: 16, b: 20 }, ymax = nice(Math.max(...esc.flatMap((r) => r.v.map((x) => x ?? 0))) * 1.08), y = lin(0, ymax, h - m.b, m.t);
          yGrid(svg, y, [0, ymax / 2, ymax], m.l, w - m.r);
          el("line", { x1: m.l, x2: w - m.r, y1: y(55), y2: y(55), class: "std55" }, svg);
          const gw = (w - m.l - m.r) / esc.length, bw = gw * 0.26, cols = [cssVar("--bar-gray"), cssVar("--bar-soft"), cssVar("--bar")];
          esc.forEach((r, i) => {
            r.v.forEach((v, k) => { const b = el("rect", { x: m.l + gw * i + gw * 0.11 + bw * k, width: bw - 1, y: y(v ?? 0), height: Math.max(0, h - m.b - y(v ?? 0)), rx: 2, fill: cols[k] }, svg); hover(b, `<b>${r.s.code} · ${r.s.kota}</b>${YEARS.map((yy, j) => row("Agu–Okt " + yy, fmt(r.v[j]) + " µg/m³")).join("")}`); });
            text(svg, m.l + gw * i + gw / 2, y(r.v[2] ?? 0) - 4, fmt(r.v[2]), "lab-b", "middle");
            text(svg, m.l + gw * i + gw / 2, h - 5, r.s.code, "lab", "middle", { style: "font-size:9.5px" });
          });
        }} />
      </Card>

      <Card area="2 / 14 / 3 / 19" title="Pola Jam Harian" how="diurnal" sub="Dibanding rata-rata harian"
        legend={di.map((a) => `<span><i class="sw ln" style="background:var(--a-${a})"></i>${ARCH_LABEL[a].split(" ")[0]}</span>`).join("")}
        insight="puncak pagi 07–09 di kota dan wilayah bersih. Saat asap, Kalteng kotor sepanjang hari.">
        <Chart deps={[c]} draw={(box) => {
          if (!di.length) return empty(box, "Tidak ada tipe wilayah terpilih.");
          lines(box, "Pola jam harian", di.map((a) => ({ name: ARCH_LABEL[a].split(" ")[0], color: AC(a), pts: c.d.diurnal[a] })), {
            ymin: 0.7, ymax: 1.5, ticks: [0.8, 1, 1.2, 1.4], tf: (v) => fmt(v, 1) + "×", xticks: [0, 6, 12, 18, 23],
            xf: (i, l) => (l ? "Pukul " : "") + String(i).padStart(2, "0") + (l ? ".00" : ""), band: [7, 9], unit: "×", r: 58,
          });
        }} />
      </Card>
    </>
  );
}
