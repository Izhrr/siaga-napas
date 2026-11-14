"use client";
import { useEffect, useRef } from "react";
import { fmt } from "@/lib/format";
import { reduceMotion } from "@/lib/charts/core";
import type { Kpi } from "@/lib/content";
import { Orn } from "../Ornaments";

function Value({ k }: { k: Kpi }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current; if (!node) return;
    if (k.raw) { node.textContent = k.raw; return; }
    const put = (v: number | null | undefined) => (node.textContent = (k.pre ?? "") + fmt(v, k.dec ?? 0) + (k.suf ?? ""));
    if (k.value == null || reduceMotion()) return void put(k.value);
    const to = k.value, t0 = performance.now(); let raf = 0;
    const step = (t: number) => { const p = Math.min(1, (t - t0) / 650); put(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [k.value, k.raw, k.dec, k.pre, k.suf]);
  return <span ref={ref} />;
}

export function KpiRow({ items }: { items: Kpi[] }) {
  return (
    <section className="kpis" aria-label="Angka utama">
      {items.map((k) => (
        <div className="kpi" key={k.label}>
          <Orn id={k.icon} />
          <div className="l" title={k.label}>{k.label}</div>
          <div className="v"><Value k={k} />{k.unit && <small>{k.unit}</small>}</div>
          <div className="d" dangerouslySetInnerHTML={{ __html: k.sub }} />
        </div>
      ))}
    </section>
  );
}
