"use client";
import { Card } from "../Card";
import { Chart } from "../Chart";
import { useCtx } from "../DataProvider";
import { cssVar, drawLine, el, empty, frame, grow, hideTip, hover, lin, row, showTip, text, yGrid } from "@/lib/charts/core";
import { hbars, lines } from "@/lib/charts/kit";
import { fmt, kfmt, nice } from "@/lib/format";
import { aggCtx, groupLabel, thresholdLabel } from "@/lib/select";
import { useUI, YEARS } from "@/lib/store";
import type { Threshold } from "@/lib/types";

const STEPS: Threshold[] = ["15", "25", "55"];

export function Dampak() {
  const c = useCtx()!;
  const setFilter = useUI((s) => s.setFilter);
  const a = aggCtx(c);
  const E = c.d.event;
  const rs = [...c.stations].filter((s) => s.peak100).sort((p, q) => q.peak100 - p.peak100).slice(0, 7);
  const yv = YEARS.map((y) => {
    const ii = c.d.months.flatMap((m, i) => (m.startsWith(y) && +m.slice(5) <= 10 && c.f.months.includes(+m.slice(5)) ? [i] : []));
    return { u: aggCtx(c, c.codes, ii, c.f.c0, "u5").ex, o: aggCtx(c, c.codes, ii, c.f.c0, "o60").ex };
  });
  const tot = yv.map((r) => (c.group === "u5" ? r.u : c.group === "o60" ? r.o : r.u + r.o));

  return (
    <>
      <Card area="1 / 1 / 2 / 11" title="Kurva Risiko Rawat Inap" how="curve" sub="Risiko dibanding hari dengan PM2.5 15 µg/m³"
        tools={<div className="range"><label htmlFor="rC0">Skenario batas</label><input id="rC0" type="range" min={0} max={2} step={1} value={STEPS.indexOf(c.f.c0)} onChange={(e) => setFilter("c0", STEPS[+e.target.value])} /><output htmlFor="rC0">{c.f.c0}</output></div>}
        legend='<span><i class="sw ln" style="background:var(--thr)"></i>ambang 25</span><span><i class="sw ln" style="background:var(--ink2)"></i>baku 55</span><span><i class="sw ln" style="background:var(--ink)"></i>batas skenario</span>'
        insight={`dengan batas ${c.f.c0} µg/m³ ada ${fmt(a.ex)} kasus ISPA ${groupLabel(c.group)} berlebih. Geser slider untuk membandingkan skenario.`}>
        <Chart deps={[c]} draw={(box) => {
          const { svg, w, h } = frame(box, "Kurva risiko rawat inap");
          const m = { l: 34, r: 84, t: 10, b: 22 }, x = lin(5, 300, m.l, w - m.r), y = lin(0.8, 6, h - m.b, m.t);
          el("rect", { x: x(25), y: m.t, width: x(55) - x(25), height: h - m.t - m.b, fill: cssVar("--red-tint") }, svg);
          text(svg, (x(25) + x(55)) / 2, m.t + 11, "lolos baku", "lab", "middle");
          yGrid(svg, y, [1, 2, 3, 4, 5, 6], m.l, w - m.r, (v) => v + "×");
          const ax = el("g", { class: "axis" }, svg); [25, 55, 100, 150, 200, 250, 300].forEach((t) => text(ax, x(t), h - 7, t, "", "middle"));
          el("line", { x1: x(25), x2: x(25), y1: m.t, y2: h - m.b, class: "thr25" }, svg); el("line", { x1: x(55), x2: x(55), y1: m.t, y2: h - m.b, class: "std55" }, svg);
          const c0 = +c.f.c0; el("line", { x1: x(c0), x2: x(c0), y1: m.t, y2: h - m.b, stroke: cssVar("--ink"), "stroke-width": 2 }, svg); text(svg, x(c0) + 5, h - m.b - 8, "batas " + c.f.c0, "lab-b halo");
          const ser: [string, string, string, number][] = [["resp_admissions_under5", "ISPA balita", cssVar("--bar"), 2.6], ["resp_admissions_over60", "ISPA lansia", cssVar("--trend"), 2.2], ["cvd", "Jantung", cssVar("--bar-gray"), 2]];
          const ends: { y: number; n: string }[] = [];
          ser.forEach(([k, n, col, sw]) => { const P = c.d.curves[k]; drawLine(el("path", { d: P.map(([p, r], i) => (i ? "L" : "M") + x(p) + "," + y(r)).join(""), fill: "none", stroke: col, "stroke-width": sw }, svg)); ends.push({ y: y(P[P.length - 1][1]), n }); });
          ends.sort((p, q) => p.y - q.y).forEach((e, i, arr) => { if (i && e.y - arr[i - 1].y < 12) e.y = arr[i - 1].y + 12; text(svg, w - m.r + 5, e.y + 3, e.n, "lab-b"); });
          const hv = el("rect", { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: "transparent" }, svg);
          hv.addEventListener("mousemove", (e) => {
            const r = svg.getBoundingClientRect(), pm = 5 + (((e.clientX - r.left) * w) / r.width - m.l) / (w - m.l - m.r) * 295;
            const near = (k: string) => c.d.curves[k].reduce((p, q) => (Math.abs(q[0] - pm) < Math.abs(p[0] - pm) ? q : p));
            showTip(e, `<b>PM2.5 ≈ ${fmt(near("cvd")[0])} µg/m³</b>` + ser.map(([k, n]) => row(n, fmt(near(k)[1], 2) + "×")).join(""));
          });
          hv.addEventListener("mouseleave", hideTip);
        }} />
      </Card>

      <Card area="1 / 11 / 2 / 19" title="Kapan Pasien Datang" how="event" sub="Admisi sebelum dan sesudah lonjakan PM2.5"
        legend='<span><i class="sw" style="background:var(--red-tint);outline:1px solid var(--bar-soft)"></i>hari lonjakan PM2.5</span>'
        insight="admisi naik di hari lonjakan (×1,8), bukan dua hari setelahnya.">
        <Chart deps={[c]} draw={(box) => lines(box, "Kapan pasien datang", [
          { name: "Balita", color: cssVar("--bar"), pts: E.u5.map((p) => p[1]) }, { name: "Lansia", color: cssVar("--trend"), pts: E.o60.map((p) => p[1]) }, { name: "Jantung", color: cssVar("--bar-gray"), pts: E.cvd.map((p) => p[1]) }],
          { ymin: 0.6, ymax: 2.3, ticks: [1, 1.5, 2], tf: (v) => fmt(v, 1) + "×", xticks: [0, 7, 14], xf: (i, l) => { const k = E.u5[i][0]; return k === 0 ? (l ? "Hari lonjakan" : "H0") : (k > 0 ? "H+" : "H") + k; },
            refs: [{ v: 1, cls: "std55", label: "normal" }], band: [6.6, 7.4], unit: "×", r: 52 })} />
      </Card>

      <Card area="2 / 1 / 3 / 7" title="Kerentanan per Penyakit" how="pct" sub="Kenaikan bila PM2.5 berlipat dua"
        insight="balita (+57%) dan lansia (+55%) sama rentan; PPOK paling sensitif.">
        <Chart deps={[c]} draw={(box) => hbars(box, "Kerentanan per penyakit", Object.entries(c.d.pct2x).sort((p, q) => q[1] - p[1]).map(([k, v]) => ({ label: k, v, vl: "+" + fmt(v) + "%", bold: k.startsWith("ISPA"), color: k.startsWith("ISPA") ? cssVar("--bar") : cssVar("--bar-gray") })), { lw: 92, vw: 42 })} />
      </Card>

      <Card area="2 / 7 / 3 / 13" title="Tekanan Rumah Sakit" how="rs" sub="Admisi napas per 100 tempat tidur/hari"
        legend='<span><i class="sw dot" style="background:var(--bar-gray)"></i>Normal</span><span><i class="sw dot" style="background:var(--bar)"></i>Puncak 7 hari</span>'
        insight={rs[0] ? `${rs[0].code} ${rs[0].kota} mencapai ${fmt(rs[0].peak100)} admisi per 100 tempat tidur per hari saat puncak asap.` : undefined}>
        <Chart deps={[c]} draw={(box) => {
          if (!rs.length) return empty(box, "Tidak ada RS untuk filter ini.");
          const { svg, w, h } = frame(box, "Tekanan rumah sakit");
          const lw = 54, vw = 76, x = lin(0, nice(Math.max(...rs.map((r) => r.peak100))), lw, w - vw), rh = (h - 14) / rs.length;
          const g = el("g", { class: "axis" }, svg);
          [0, 50, 100].forEach((t) => { if (x(t) <= w - vw + 1) { el("line", { x1: x(t), x2: x(t), y1: 0, y2: rs.length * rh, class: "gl" }, g); text(g, x(t), rs.length * rh + 11, t, "", "middle"); } });
          rs.forEach((s, i) => {
            const yy = i * rh + rh / 2;
            text(svg, lw - 6, yy + 4, s.code, "lab", "end");
            const ln = el("line", { x1: x(s.off100), x2: x(s.off100), y1: yy, y2: yy, stroke: cssVar("--bar-soft"), "stroke-width": 4, "stroke-linecap": "round" }, svg); grow(ln, { x2: x(s.peak100) });
            el("circle", { cx: x(s.off100), cy: yy, r: 4, fill: cssVar("--bar-gray") }, svg); el("circle", { cx: x(s.peak100), cy: yy, r: 5, fill: cssVar("--bar") }, svg);
            text(svg, x(s.peak100) + 9, yy + 4, `${fmt(s.peak100 / s.off100, 1)}× · ${s.kelas.replace(" (Khusus Paru)", "")}`, "lab");
            const hit = el("rect", { x: 0, y: yy - rh / 2, width: w, height: rh, fill: "transparent" }, svg);
            hover(hit, `<b>${s.code} · ${s.kota}</b>${row("Normal (Jan–Jun)", fmt(s.off100, 1))}${row("Puncak 7 hari", fmt(s.peak100, 1))}${row("Kapasitas", s.beds + " TT, " + s.kelas)}`);
          });
        }} />
      </Card>

      <Card area="2 / 13 / 3 / 19" title="Kasus Berlebih per Tahun" how="year" sub={`Jan–Okt, di atas ${thresholdLabel(c.f.c0)}`}
        legend={(c.group !== "o60" ? '<span><i class="sw" style="background:var(--bar)"></i>Balita</span>' : "") + (c.group !== "u5" ? '<span><i class="sw" style="background:var(--bar-gray)"></i>Lansia</span>' : "")}
        insight={tot[0] ? `kasus berlebih Jan–Okt naik ${fmt((tot[2] / tot[0] - 1) * 100)}% dari 2024 ke 2026, seiring musim asap yang makin pekat.` : undefined}>
        <Chart deps={[c]} draw={(box) => {
          if (!Math.max(...tot)) return empty(box, "Tidak ada kasus berlebih pada filter ini.");
          const { svg, w, h } = frame(box, "Kasus berlebih per tahun");
          const m = { l: 36, r: 6, t: 22, b: 20 }, ymax = nice(Math.max(...tot) * 1.12), y = lin(0, ymax, h - m.b, m.t);
          yGrid(svg, y, [0, ymax / 2, ymax], m.l, w - m.r, kfmt);
          const gw = (w - m.l - m.r) / 3, bw = gw * 0.46;
          yv.forEach((r, i) => {
            const x0 = m.l + gw * i + (gw - bw) / 2; let acc = 0;
            const segs: [number, string][] = c.group === "u5" ? [[r.u, cssVar("--bar")]] : c.group === "o60" ? [[r.o, cssVar("--bar-gray")]] : [[r.u, cssVar("--bar")], [r.o, cssVar("--bar-gray")]];
            segs.forEach(([val, col]) => { const b = el("rect", { x: x0, width: bw, y: y(acc + val), height: Math.max(0, y(acc) - y(acc + val) - 1), rx: 2, fill: col }, svg); hover(b, `<b>Jan–Okt ${YEARS[i]}</b>${row("Balita", fmt(r.u))}${row("Lansia", fmt(r.o))}`); acc += val; });
            text(svg, x0 + bw / 2, y(acc) - 5, kfmt(tot[i]), "lab-b", "middle"); text(svg, x0 + bw / 2, h - 5, YEARS[i], "lab", "middle");
            if (i && tot[i - 1]) { const gp = (tot[i] / tot[i - 1] - 1) * 100; text(svg, m.l + gw * i, y(Math.max(tot[i], tot[i - 1])) - 12, (gp >= 0 ? "+" : "") + fmt(gp) + "%", "lab-b halo", "middle", { fill: cssVar("--red-ink") }); }
          });
        }} />
      </Card>
    </>
  );
}
