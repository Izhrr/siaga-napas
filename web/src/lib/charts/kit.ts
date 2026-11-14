/* Reusable chart forms (Datawrapper-style choices): horizontal bars, bars + trend line on one axis,
   lines with direct end labels, scatter with label de-collision, choropleth base. */
import { fmt, nice } from "../format";
import { cssVar, drawLine, el, empty, frame, grow, hideTip, hover, lin, row, showTip, text, yGrid } from "./core";

export interface BarRow { label: string; v?: number; segs?: { v: number; color: string }[]; color?: string; vl?: string; bold?: boolean; tip?: string }
export function hbars(box: HTMLElement, label: string, rows: BarRow[], o: { lw?: number; vw?: number; max?: number; dec?: number; refs?: { v: number; cls: string }[]; empty?: string } = {}) {
  if (!rows.length) return empty(box, o.empty ?? "Tidak ada data untuk filter ini.");
  const { svg, w, h } = frame(box, label);
  const lw = o.lw ?? 90, vw = o.vw ?? 64, rh = h / rows.length, bh = Math.max(6, Math.min(rh * 0.7, 32));
  const tot = (r: BarRow) => (r.segs ? r.segs.reduce((a, s) => a + s.v, 0) : r.v ?? 0);
  const x = lin(0, o.max ?? (Math.max(...rows.map(tot)) || 1), lw, w - vw);
  (o.refs ?? []).forEach((rf) => el("line", { x1: x(rf.v), x2: x(rf.v), y1: 0, y2: h, class: rf.cls }, svg));
  rows.forEach((r, i) => {
    const yy = i * rh + (rh - bh) / 2;
    text(svg, lw - 7, yy + bh / 2 + 4, r.label, r.bold ? "lab-b" : "lab", "end");
    let acc = 0;
    (r.segs ?? [{ v: r.v ?? 0, color: r.color ?? cssVar("--bar") }]).forEach((sg) => {
      const b = el("rect", { x: x(acc), y: yy, height: bh, width: 0, rx: 3, fill: sg.color }, svg);
      grow(b, { width: Math.max(1.5, x(acc + sg.v) - x(acc) - (r.segs ? 1 : 0)) });
      acc += sg.v;
    });
    text(svg, x(acc) + 6, yy + bh / 2 + 4, r.vl ?? fmt(tot(r), o.dec ?? 0), "lab-b");
    const hit = el("rect", { x: 0, y: i * rh, width: w, height: rh, fill: "transparent" }, svg);
    if (r.tip) hover(hit, r.tip);
  });
}

export function combo(box: HTMLElement, label: string, cats: string[], bars: { v: number; color: string; label?: string }[],
  o: { line?: (number | null)[]; refs?: { v: number; cls: string; label: string }[]; xl?: (c: string, i: number) => string; yf?: (v: number) => string; tip: (i: number) => string }) {
  if (!cats.length) return empty(box, "Tidak ada bulan pada filter ini.");
  const { svg, w, h } = frame(box, label);
  const m = { l: 38, r: 8, t: 14, b: 20 };
  const vals = bars.map((b) => b.v).concat((o.line ?? []).filter((v): v is number => v != null));
  const ymax = nice(Math.max(...vals, 1) * 1.08), y = lin(0, ymax, h - m.b, m.t);
  yGrid(svg, y, [0, ymax / 2, ymax], m.l, w - m.r, o.yf);
  (o.refs ?? []).forEach((r) => { if (r.v < ymax) { el("line", { x1: m.l, x2: w - m.r, y1: y(r.v), y2: y(r.v), class: r.cls }, svg); text(svg, w - m.r - 2, y(r.v) - 3, r.label, "lab halo", "end"); } });
  const bw = (w - m.l - m.r) / cats.length, cx = (i: number) => m.l + bw * i + bw / 2;
  bars.forEach((b, i) => {
    const r = el("rect", { x: cx(i) - bw * 0.36, width: bw * 0.72, y: h - m.b, height: 0, rx: 2, fill: b.color }, svg);
    grow(r, { y: y(b.v), height: Math.max(0, h - m.b - y(b.v)) });
    if (b.label) text(svg, cx(i), y(b.v) - 4, b.label, "lab-b", "middle");
  });
  if (o.line) {
    let d = "";
    o.line.forEach((v, i) => { if (v != null) d += (d ? "L" : "M") + cx(i) + "," + y(v); });
    drawLine(el("path", { d, fill: "none", stroke: cssVar("--trend"), "stroke-width": 2, "stroke-linejoin": "round" }, svg));
    if (cats.length <= 14) o.line.forEach((v, i) => { if (v != null) el("circle", { cx: cx(i), cy: y(v), r: 2.8, fill: cssVar("--card"), stroke: cssVar("--trend"), "stroke-width": 1.6 }, svg); });
  }
  const ax = el("g", { class: "axis" }, svg);
  cats.forEach((c, i) => { const lb = o.xl ? o.xl(c, i) : c; if (lb) text(ax, cx(i), h - 5, lb, "", "middle"); });
  cats.forEach((_, i) => { const hit = el("rect", { x: m.l + bw * i, y: m.t, width: bw, height: h - m.t - m.b, fill: "transparent" }, svg); hover(hit, () => o.tip(i)); });
}

export interface Series { name: string; color: string; pts: (number | null)[]; w?: number }
export function lines(box: HTMLElement, label: string, series: Series[], o: { ymin?: number; ymax: number; ticks: number[]; tf?: (v: number) => string; xticks: number[]; xf: (i: number, long?: boolean) => string;
  refs?: { v: number; cls: string; label: string }[]; band?: [number, number]; unit?: string; dec?: number; r?: number }) {
  const { svg, w, h } = frame(box, label);
  const m = { l: 34, r: o.r ?? 62, t: 8, b: 20 }, n = series[0].pts.length;
  const x = lin(0, n - 1, m.l, w - m.r), y = lin(o.ymin ?? 0, o.ymax, h - m.b, m.t);
  if (o.band) el("rect", { x: x(o.band[0]), y: m.t, width: x(o.band[1]) - x(o.band[0]), height: h - m.t - m.b, fill: cssVar("--red-tint") }, svg);
  yGrid(svg, y, o.ticks, m.l, w - m.r, o.tf);
  (o.refs ?? []).forEach((r) => { el("line", { x1: m.l, x2: w - m.r, y1: y(r.v), y2: y(r.v), class: r.cls }, svg); text(svg, m.l + 4, y(r.v) - 4, r.label, "lab"); });
  const ends: { y: number; name: string }[] = [];
  series.forEach((s) => {
    let d = "";
    s.pts.forEach((v, i) => { if (v != null) d += (d ? "L" : "M") + x(i) + "," + y(v); });
    drawLine(el("path", { d, fill: "none", stroke: s.color, "stroke-width": s.w ?? 2.2, "stroke-linejoin": "round" }, svg));
    const last = s.pts[s.pts.length - 1];
    if (last != null) ends.push({ y: y(last), name: s.name });
  });
  ends.sort((a, b) => a.y - b.y).forEach((e, i, a) => { if (i && e.y - a[i - 1].y < 12) e.y = a[i - 1].y + 12; text(svg, w - m.r + 5, e.y + 3, e.name, "lab-b"); });
  const ax = el("g", { class: "axis" }, svg);
  o.xticks.forEach((i) => text(ax, x(i), h - 5, o.xf(i), "", "middle"));
  const cross = el("line", { y1: m.t, y2: h - m.b, stroke: cssVar("--muted"), "stroke-dasharray": "3 3", opacity: 0 }, svg);
  const hv = el("rect", { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: "transparent" }, svg);
  hv.addEventListener("mousemove", (e) => {
    const r = svg.getBoundingClientRect();
    const i = Math.max(0, Math.min(n - 1, Math.round((((e.clientX - r.left) * w) / r.width - m.l) / ((w - m.l - m.r) / (n - 1)))));
    cross.setAttribute("x1", String(x(i))); cross.setAttribute("x2", String(x(i))); cross.setAttribute("opacity", "1");
    showTip(e, `<b>${o.xf(i, true)}</b>` + series.map((s) => row(s.name, fmt(s.pts[i], o.dec ?? 2) + (o.unit ?? ""))).join(""));
  });
  hv.addEventListener("mouseleave", () => { hideTip(); cross.setAttribute("opacity", "0"); });
}

export interface Pt { x: number; y: number; color: string; on?: boolean; r?: number; label?: string; tip: string }
export function scatter(box: HTMLElement, label: string, pts: Pt[], o: { x0: number; x1: number; y0: number; y1: number; xt: number[]; yt: number[]; xlog?: boolean; ylog?: boolean;
  xf?: (v: number) => string; yf?: (v: number) => string; xl: string; yl: string; vref?: { v: number; cls: string }[]; quads?: { x: "l" | "r"; y: "t" | "b"; t: string }[]; fit?: boolean }) {
  const { svg, w, h } = frame(box, label);
  const m = { l: 38, r: 12, t: 16, b: 26 };
  const sx = o.xlog ? Math.log : (v: number) => v, sy = o.ylog ? Math.log : (v: number) => v;
  const X = (v: number) => lin(sx(o.x0), sx(o.x1), m.l, w - m.r)(sx(v)), Y = (v: number) => lin(sy(o.y0), sy(o.y1), h - m.b, m.t)(sy(v));
  yGrid(svg, Y, o.yt, m.l, w - m.r, o.yf);
  const ax = el("g", { class: "axis" }, svg);
  o.xt.forEach((t) => text(ax, X(t), h - m.b + 13, (o.xf ?? fmt)(t), "", "middle"));
  text(ax, w - m.r, h - 2, o.xl, "", "end"); text(ax, m.l, m.t - 6, o.yl);
  (o.vref ?? []).forEach((r) => el("line", { x1: X(r.v), x2: X(r.v), y1: m.t, y2: h - m.b, class: r.cls }, svg));
  (o.quads ?? []).forEach((q) => text(svg, q.x === "r" ? w - m.r - 4 : m.l + 6, q.y === "t" ? m.t + 10 : h - m.b - 6, q.t, "lab", q.x === "r" ? "end" : "start", { opacity: 0.7 }));
  if (o.fit) {
    const P = pts.filter((p) => p.on !== false);
    if (P.length > 2) {
      const mx = P.reduce((a, p) => a + p.x, 0) / P.length, my = P.reduce((a, p) => a + p.y, 0) / P.length;
      const b = P.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / (P.reduce((a, p) => a + (p.x - mx) ** 2, 0) || 1), a0 = my - b * mx;
      el("line", { x1: X(o.x0), x2: X(o.x1), y1: Y(Math.max(o.y0, a0 + b * o.x0)), y2: Y(Math.min(o.y1, a0 + b * o.x1)), stroke: cssVar("--trend"), "stroke-width": 1.6, "stroke-dasharray": "6 4" }, svg);
    }
  }
  type Box = { x: number; y: number; w: number; h: number };
  const placed: Box[] = [], clash = (a: Box) => placed.some((b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
  pts.forEach((p) => {
    const c = el("circle", { cx: X(p.x), cy: Y(p.y), r: p.r ?? 5.5, fill: p.color, "fill-opacity": p.on === false ? 0.15 : 0.9, stroke: cssVar("--card"), "stroke-width": 1.5 }, svg);
    hover(c, p.tip); placed.push({ x: X(p.x) - 5, y: Y(p.y) - 5, w: 10, h: 10 });
  });
  pts.forEach((p) => {
    if (!p.label || p.on === false) return;
    const lw = p.label.length * 6.1 + 2;
    const c = ([[X(p.x) + 8, Y(p.y) - 6], [X(p.x) - 8 - lw, Y(p.y) - 6], [X(p.x) - lw / 2, Y(p.y) - 19], [X(p.x) - lw / 2, Y(p.y) + 8]] as [number, number][])
      .map(([a, b]) => ({ x: a, y: b, w: lw, h: 12 }))
      .filter((c) => c.x > m.l && c.x + c.w < w - 2 && c.y > 0 && c.y + c.h < h - m.b)
      .find((c) => !clash(c));
    if (c) { placed.push(c); text(svg, c.x, c.y + 10, p.label, "lab"); }
  });
}

/** Indonesia basemap (pre-projected paths, 1° = 22 units). */
export function mapBase(box: HTMLElement, label: string, id: string) {
  box.innerHTML = "";
  const svg = el("svg", { viewBox: "0 -6 1035 345", preserveAspectRatio: "xMidYMid meet", role: "img", "aria-label": label }, box);
  const pat = el("pattern", { id: "hatch-" + id, width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, el("defs", {}, svg));
  el("rect", { width: 6, height: 6, fill: cssVar("--land") }, pat);
  el("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: cssVar("--hatch"), "stroke-width": 2.2 }, pat);
  return { svg, hatch: `url(#hatch-${id})` };
}
