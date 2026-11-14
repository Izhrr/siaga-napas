/* Low-level SVG helpers shared by all charts. Charts draw imperatively into a sized container
   (see components/Chart.tsx), which keeps every label inside the box and redraws on resize. */
import { fmt } from "../format";

const NS = "http://www.w3.org/2000/svg";
export type Attrs = Record<string, string | number>;

export const cssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
export const reduceMotion = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
export function text(p: Element, x: number, y: number, s: string | number, cls = "lab", anchor = "start", extra: Attrs = {}) {
  const t = el("text", { x, y, class: cls, "text-anchor": anchor, ...extra }, p);
  t.textContent = String(s);
  return t;
}
export const lin = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

export interface Frame { svg: SVGSVGElement; w: number; h: number }
export function frame(box: HTMLElement, label: string): Frame {
  box.innerHTML = "";
  const w = Math.max(box.clientWidth, 120), h = Math.max(box.clientHeight, 80);
  const svg = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": label }, box);
  return { svg, w, h };
}
export function empty(box: HTMLElement, msg: string) { box.innerHTML = `<div class="empty">${msg}</div>`; }

/* ---------- tooltip (one shared element) ---------- */
let tipEl: HTMLDivElement | null = null;
function tipNode() {
  if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "tip"; tipEl.setAttribute("role", "tooltip"); document.body.appendChild(tipEl); }
  return tipEl;
}
export function showTip(ev: { clientX?: number; clientY?: number; target?: EventTarget | null }, html: string) {
  const t = tipNode(); t.innerHTML = html; t.style.opacity = "1";
  const r = (ev.target as Element | null)?.getBoundingClientRect?.();
  const cx = ev.clientX || r?.right || 0, cy = ev.clientY || r?.bottom || 0;
  t.style.left = Math.max(4, Math.min(cx + 14, innerWidth - t.offsetWidth - 8)) + "px";
  t.style.top = Math.max(4, Math.min(cy + 14, innerHeight - t.offsetHeight - 8)) + "px";
}
export const hideTip = () => { if (tipEl) tipEl.style.opacity = "0"; };
export function hover(n: Element, html: string | (() => string)) {
  n.addEventListener("mousemove", (e) => showTip(e as MouseEvent, typeof html === "function" ? html() : html));
  n.addEventListener("mouseleave", hideTip);
}
export const row = (k: string, v: string | number) => `<div class="row"><span>${k}</span><b>${v}</b></div>`;

/* ---------- motion ---------- */
export function grow(node: Element, attrs: Attrs) {
  const apply = () => { for (const k in attrs) node.setAttribute(k, String(attrs[k])); };
  if (reduceMotion()) return apply();
  (node as SVGElement).style.transition = "all .6s cubic-bezier(.2,.8,.2,1)";
  requestAnimationFrame(() => requestAnimationFrame(apply));
}
export function drawLine<T extends SVGGeometryElement>(p: T): T {
  if (reduceMotion()) return p;
  const L = p.getTotalLength();
  p.style.strokeDasharray = String(L); p.style.strokeDashoffset = String(L); p.getBoundingClientRect();
  p.style.transition = "stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)"; p.style.strokeDashoffset = "0";
  return p;
}
export function yGrid(svg: Element, y: (v: number) => number, ticks: number[], x0: number, x1: number, f: (v: number) => string = (v) => fmt(v)) {
  const g = el("g", { class: "axis" }, svg);
  ticks.forEach((t) => { el("line", { x1: x0, x2: x1, y1: y(t), y2: y(t), class: "gl" }, g); text(g, x0 - 5, y(t) + 3, f(t), "", "end"); });
}
export function seqColor(v: number | null | undefined, bins: number[]) {
  if (v == null) return cssVar("--hatch");
  const k = bins.findIndex((b) => v < b);
  return cssVar("--s" + (k < 0 ? 6 : k + 1));
}
