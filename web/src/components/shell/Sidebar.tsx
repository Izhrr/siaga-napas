"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PAGES, PAGE_ORDER } from "@/lib/content";
import type { PageKey } from "@/lib/types";
import { FilterPanel } from "./Filters";

const LOGO = "/brand/logo-gelar-rasa.png";
/** Logo panitia: tampil bila file ada di web/public/brand/, selain itu placeholder [LOGO]. */
function Logo() {
  const [ok, setOk] = useState(false);
  useEffect(() => { const im = new Image(); im.onload = () => setOk(true); im.src = LOGO; }, []);
  return (
    <div className="logo">
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={LOGO} alt="Logo Gelar Rasa 2026" width={44} height={44} />
      ) : "[LOGO]"}
    </div>
  );
}

export function Sidebar({ page, onOpenChat }: { page: PageKey; onOpenChat: () => void }) {
  const nav = useRef<HTMLDivElement>(null), ind = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const a = nav.current?.querySelector<HTMLAnchorElement>(`a[data-p="${page}"]`);
    if (a && ind.current) ind.current.style.transform = `translateY(${a.offsetTop}px)`;
  }, [page]);
  return (
    <aside className="side" aria-label="Navigasi dan filter">
      <div className="side-bg" aria-hidden="true"><svg className="orn"><use href="#o-part" /></svg></div>
      <div className="brand"><Logo /><div><b>JERNIH</b><small>Jejak Emisi, Risiko Napas, dan Imbas Hospitalisasi</small></div></div>
      <nav aria-label="Halaman">
        <div className="nav" ref={nav}>
          <div className="ind" ref={ind} aria-hidden="true" />
          {PAGE_ORDER.map((p) => (
            <Link key={p} href={`/${p}`} data-p={p} aria-current={p === page ? "page" : undefined}><span>{PAGES[p].n}</span>{PAGES[p].nav}</Link>
          ))}
        </div>
      </nav>
      <FilterPanel />
      <button className="ai-btn" type="button" onClick={onOpenChat} aria-controls="chat-drawer">
        <span className="ic" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="3" /></svg>
        </span>
        <span><b>Tanya Data <em>AI</em></b><small>Asisten AI: tanya dengan bahasa sehari-hari, jawab dengan grafik</small></span>
      </button>
    </aside>
  );
}
