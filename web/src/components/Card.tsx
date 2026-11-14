"use client";
import type { ReactNode } from "react";
import { HOW } from "@/lib/content";
import { hideTip, showTip } from "@/lib/charts/core";
import { InfoIcon } from "./Icons";

export function InfoButton({ k }: { k: string }) {
  // Teks dipecah per kalimat jadi daftar pendek agar mudah dipindai
  const html = `<div class="how"><b>Cara membaca</b><ul>${HOW[k].split(/(?<=\.)\s+/).map((s) => `<li>${s}</li>`).join("")}</ul></div>`;
  const show = (e: React.MouseEvent | React.FocusEvent) => showTip({ clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY, target: e.currentTarget }, html);
  return (
    <button className="info" type="button" aria-label="Cara membaca grafik" onMouseEnter={show} onMouseMove={show} onFocus={show} onClick={show} onMouseLeave={hideTip} onBlur={hideTip}>
      <InfoIcon />
    </button>
  );
}

/** Kartu grafik: header merah (judul + alat + tombol i), keterangan singkat, grafik, legenda, strip Insight. */
export function Card({ title, how, tools, sub, legend, insight, area, children }: {
  title: string; how: string; tools?: ReactNode; sub?: string; legend?: string; insight?: string; area: string; children: ReactNode;
}) {
  return (
    <section className="card" style={{ gridArea: area }}>
      <div className="card-h"><h2>{title}</h2><div className="tools">{tools}<InfoButton k={how} /></div></div>
      {sub && <p className="card-s">{sub}</p>}
      {children}
      {legend && <div className="legend" dangerouslySetInnerHTML={{ __html: legend }} />}
      {insight && <p className="ins" dangerouslySetInnerHTML={{ __html: `<b>Insight:</b> ${insight}` }} />}
    </section>
  );
}

export function Pills<T extends string>({ options, value, onChange, label }: { options: [T, string][]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="pills" role="group" aria-label={label}>
      {options.map(([v, l]) => <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}
