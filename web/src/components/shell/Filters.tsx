"use client";
import { useEffect, useRef } from "react";
import { MON } from "@/lib/format";
import { ARCH_LABEL, monthsLabel } from "@/lib/select";
import { ALL_MONTHS, ARCHS, HAZE_MONTHS, ISLANDS, OFF_MONTHS, YEARS, defaultFilters, useUI } from "@/lib/store";
import type { Archetype, Filters, Threshold } from "@/lib/types";

const ARCH_COLOR: Record<string, string> = { kronis: "var(--a-kronis)", gambut: "var(--a-gambut)", ekstrem: "var(--a-ekstrem)", bersih: "var(--a-bersih)" };
type MultiKey = "years" | "months" | "islands" | "archs";
const OPTS: Record<MultiKey, [string | number, string][]> = {
  years: YEARS.map((y) => [y, y === "2026" ? "2026 (s.d. Okt)" : y]),
  months: ALL_MONTHS.map((m) => [m, MON[m - 1]]),
  islands: ISLANDS.map((x) => [x, x]),
  archs: ARCHS.map((a) => [a, ARCH_LABEL[a]]),
};
const NOUN: Record<MultiKey, string> = { years: "tahun", months: "bulan", islands: "pulau", archs: "tipe" };
const C0: [Threshold, string][] = [["55", "55 · baku mutu nasional"], ["25", "25 · ambang efek di data"], ["15", "15 · pedoman WHO"]];

function label(k: MultiKey, f: Filters): string {
  const sel = (f[k] as (string | number)[]).filter((v) => OPTS[k].some((o) => o[0] === v));
  if (sel.length === OPTS[k].length) return `Semua ${NOUN[k]}`;
  if (k === "months") {
    const m = monthsLabel(f.months);
    return m === "musim asap" ? "Musim asap (Agu–Okt)" : m === "luar musim asap" ? "Di luar musim asap" : sel.length <= 3 ? sel.map((v) => MON[(v as number) - 1]).join(", ") : `${sel.length} dari 12 bulan`;
  }
  return sel.length <= 2 ? sel.map((v) => OPTS[k].find((o) => o[0] === v)![1]).join(", ") : `${sel.length} dari ${OPTS[k].length} ${NOUN[k]}`;
}

/** Dropdown = <details>: keyboard-accessible natively; satu yang terbuka, tertutup dengan Escape atau klik di luar. */
function Dropdown({ id, summary, children }: { id: string; summary: string; children: React.ReactNode }) {
  return (
    <details className="dd" data-dd={id}>
      <summary aria-label={`${id}: ${summary}`}><span>{summary}</span></summary>
      <div className="menu">{children}</div>
    </details>
  );
}

function MultiSelect({ k }: { k: MultiKey }) {
  const f = useUI((s) => s.filters), setFilter = useUI((s) => s.setFilter);
  const cur = f[k] as (string | number)[];
  const set = (vals: (string | number)[]) => {
    if (!vals.length) return; // minimal satu pilihan
    setFilter(k, (k === "archs" ? [...vals, "tanpa-data"] : vals) as never);
  };
  const allOn = OPTS[k].every((o) => cur.includes(o[0]));
  return (
    <Dropdown id={NOUN[k]} summary={label(k, f)}>
      {k === "months" && (
        <div className="pre">
          <button type="button" onClick={() => set(HAZE_MONTHS)}>Musim asap</button>
          <button type="button" onClick={() => set(OFF_MONTHS)}>Luar musim</button>
        </div>
      )}
      <label className="all"><input type="checkbox" checked={allOn} onChange={(e) => e.target.checked && set(OPTS[k].map((o) => o[0]))} />Pilih semua</label>
      <div className={k === "months" ? "grid3" : undefined}>
        {OPTS[k].map(([v, l]) => (
          <label key={v}>
            <input type="checkbox" checked={cur.includes(v)} onChange={(e) => set(e.target.checked ? [...cur.filter((x) => OPTS[k].some((o) => o[0] === x)), v] : cur.filter((x) => x !== v && OPTS[k].some((o) => o[0] === x)))} />
            {k === "archs" && <i className="sw" style={{ background: ARCH_COLOR[v as Archetype] }} />}{l}
          </label>
        ))}
      </div>
    </Dropdown>
  );
}

export function FilterPanel() {
  const f = useUI((s) => s.filters), setFilter = useUI((s) => s.setFilter), reset = useUI((s) => s.reset);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = root.current!;
    const onToggle = (e: Event) => { const t = e.target as HTMLDetailsElement; if (t.open) el.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((d) => d !== t && (d.open = false)); };
    const onDoc = (e: MouseEvent) => { if (!(e.target as Element).closest(".dd")) el.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((d) => (d.open = false)); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { const d = el.querySelector<HTMLDetailsElement>("details[open]"); if (d) { d.open = false; d.querySelector("summary")?.focus(); } } };
    el.addEventListener("toggle", onToggle, true); document.addEventListener("click", onDoc); addEventListener("keydown", onKey);
    return () => { el.removeEventListener("toggle", onToggle, true); document.removeEventListener("click", onDoc); removeEventListener("keydown", onKey); };
  }, []);
  const d = defaultFilters();
  const active = [f.years.length !== 3, f.months.length !== 12, f.islands.length !== 5, f.archs.length !== d.archs.length, f.groups.length !== 2, f.c0 !== "25"].filter(Boolean).length;
  return (
    <section className="filters" aria-labelledby="fl" ref={root}>
      <p className="sec-l" id="fl">Atur Filter <span>{active ? `${active} aktif` : ""}</span></p>
      <div><span className="fg-l">Tahun</span><MultiSelect k="years" /></div>
      <div><span className="fg-l">Bulan</span><MultiSelect k="months" /></div>
      <div><span className="fg-l">Pulau</span><MultiSelect k="islands" /></div>
      <div><span className="fg-l">Tipe wilayah</span><MultiSelect k="archs" /></div>
      <div><span className="fg-l">Acuan PM2.5</span>
        <Dropdown id="acuan PM2.5" summary={C0.find((o) => o[0] === f.c0)![1]}>
          {C0.map(([v, l]) => <label key={v}><input type="radio" name="c0" checked={f.c0 === v} onChange={() => setFilter("c0", v)} />{l}</label>)}
        </Dropdown>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="fg-l">Kelompok rentan</legend>
        <div className="chips">
          {([["u5", "Balita"], ["o60", "Lansia"]] as const).map(([v, l]) => (
            <label className="chk" key={v}>
              <input type="checkbox" checked={f.groups.includes(v)} onChange={(e) => { const next = e.target.checked ? [...f.groups, v] : f.groups.filter((g) => g !== v); if (next.length) setFilter("groups", next); }} />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button className="reset" type="button" onClick={reset}>Atur ulang filter</button>
    </section>
  );
}
