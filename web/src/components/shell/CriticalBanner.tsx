"use client";
import { useEffect, useRef, useState } from "react";
import { PAGES, type KeyPoint } from "@/lib/content";
import type { PageKey } from "@/lib/types";
import { ChevronIcon, CloseButton } from "../Icons";

/** Sorot kartu grafik yang terkait sebuah poin: tutup dialog, gulir bila perlu, beri kedip garis tepi. */
function flashCard(title: string) {
  const card = [...document.querySelectorAll<HTMLElement>(".card")].find((c) => c.querySelector("h2")?.textContent === title);
  if (!card) return;
  card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
}

/** Temuan Kritis + Poin Kunci & Aksi dalam satu strip: kalimat inti di atas, 4 angka kunci sebagai tombol.
    Klik membuka detail tiap poin: apa yang terjadi, mengapa penting, aksi, pelaksana, dan grafik terkait. */
export function CriticalBanner({ page, headline, points }: { page: PageKey; headline: string; points: KeyPoint[] }) {
  const dlg = useRef<HTMLDialogElement>(null), list = useRef<HTMLOListElement>(null);
  const [focus, setFocus] = useState(0);
  const open = (i: number) => { setFocus(i); dlg.current?.showModal(); };
  useEffect(() => {
    const el = list.current?.children[focus] as HTMLElement | undefined;
    if (el && dlg.current?.open) list.current!.scrollTo({ top: el.offsetTop - list.current!.offsetTop - 4 });
  }, [focus]);
  return (
    <section className="crit" aria-label="Temuan kritis dan poin kunci">
      <div className="crit-top">
        <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true"><path d="M10 1 19 17H1Z" fill="var(--red)" /><path d="M10 6.5v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><circle cx="10" cy="14.2" r="1.2" fill="#fff" /></svg>
        <p dangerouslySetInnerHTML={{ __html: headline }} />
        <button className="crit-all" type="button" onClick={() => open(0)} aria-haspopup="dialog">Lihat poin kunci &amp; aksi <ChevronIcon /></button>
      </div>
      <ul className="crit-pts">
        {points.map((k, i) => (
          <li key={i}>
            <button type="button" onClick={() => open(i)} aria-haspopup="dialog" aria-label={`${k.fig} ${k.head}: lihat detail dan aksi`}>
              <b>{k.fig}</b><span>{k.head}</span><i aria-hidden="true">Aksi <ChevronIcon size={8} /></i>
            </button>
          </li>
        ))}
      </ul>
      <dialog ref={dlg} className="kpd" aria-labelledby="kpTitle" onClick={(e) => e.target === dlg.current && dlg.current?.close()}>
        <div className="dg-h"><h2 id="kpTitle">{PAGES[page].title}: Poin Kunci &amp; Aksi</h2><CloseButton onClick={() => dlg.current?.close()} /></div>
        <ol className="kp-list" ref={list}>
          {points.map((k, i) => (
            <li key={i} className={i === focus ? "on" : undefined}>
              <div className="kp-head"><span className="kp-n">Insight {i + 1}</span><div className="big">{k.fig}</div><p className="sub">{k.head}</p></div>
              <div className="kp-row"><h3>Apa yang terjadi</h3><p>{k.what}</p></div>
              <div className="kp-row"><h3>Mengapa penting</h3><p>{k.why}</p></div>
              <div className="kp-act"><h3>Aksi</h3><p>{k.action}</p><small>Pelaksana: {k.who}</small></div>
              {k.chart && (
                <button className="kp-go" type="button" onClick={() => { dlg.current?.close(); setTimeout(() => flashCard(k.chart), 120); }}>Lihat grafik: {k.chart} <ChevronIcon /></button>
              )}
            </li>
          ))}
        </ol>
      </dialog>
    </section>
  );
}
