"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { PAGES, PAGE_ORDER } from "@/lib/content";
import type { PageKey } from "@/lib/types";
import { FilterPanel } from "./Filters";

const LOGO = "/brand/logo-gelar-rasa-web.png"; // versi ringan (420 px) dari logo-gelar-rasa.png
/** Logo panitia: tampil bila file ada di web/public/brand/, selain itu placeholder [LOGO]. */
function Logo() {
  const [ok, setOk] = useState(false);
  useEffect(() => { const im = new Image(); im.onload = () => setOk(true); im.src = LOGO; }, []);
  return (
    <div className="logo">
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={LOGO} alt="Logo Gelar Rasa 2026" width={100} height={38} />
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
      <div className="brand"><Logo /><div><b>{BRAND.name}</b><small>{BRAND.expansion}</small></div></div>
      <nav aria-label="Halaman">
        <div className="nav" ref={nav}>
          <div className="ind" ref={ind} aria-hidden="true" />
          {PAGE_ORDER.map((p) => (
            <Link key={p} href={`/${p}`} data-p={p} aria-current={p === page ? "page" : undefined}><span>{PAGES[p].n}</span>{PAGES[p].nav}</Link>
          ))}
        </div>
      </nav>
      <FilterPanel />
      {/* Tanya Data: ditambatkan di ruang kosong bawah sidebar agar tidak menutupi grafik */}
      <button className="ai-dock" type="button" onClick={onOpenChat} aria-controls="chat-drawer">
        <svg className="bot" width="34" height="26" viewBox="0 0 30 22" aria-hidden="true">
          <rect x="1" y="1" width="28" height="15" rx="7.5" fill="#1F2328" />
          <g className="eyes"><circle cx="10" cy="8.5" r="3.6" fill="none" stroke="#FF8A80" strokeWidth="2.2" /><circle cx="20" cy="8.5" r="3.6" fill="none" stroke="#FF8A80" strokeWidth="2.2" /></g>
          <path d="M11 19.2q4 2.6 8 0" fill="none" stroke="#1F2328" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <b>Tanya Data <em>AI</em></b>
      </button>
    </aside>
  );
}
