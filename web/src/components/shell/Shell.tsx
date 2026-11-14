"use client";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { banner, keyPoints, kpis, PAGES, PAGE_ORDER } from "@/lib/content";
import type { PageKey } from "@/lib/types";
import { useCtx, useDataState, useTheme } from "../DataProvider";
import { OrnamentDefs } from "../Ornaments";
import { ChatDrawer, type ChatHandle } from "./ChatDrawer";
import { CriticalBanner } from "./CriticalBanner";
import { Guide, type GuideHandle } from "./Guide";
import { KpiRow } from "./KpiRow";
import { ProvinceDialog } from "./ProvinceDialog";
import { Sidebar } from "./Sidebar";

/** Kanvas desain 1440 px diskalakan ke layar; tinggi mengikuti rasio layar (min 790). Di bawah 900 px: tata letak ponsel. */
function useFitStage(ref: React.RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current; if (!el) return;
      const vw = innerWidth, vh = innerHeight;
      if (vw < 900) { document.body.classList.add("mobile"); el.style.transform = ""; el.style.height = ""; el.style.left = ""; return; }
      document.body.classList.remove("mobile");
      let k = vw / 1440, H = vh / k; if (H < 790) { k = vh / 790; H = 790; }
      el.style.height = H + "px"; el.style.transform = `scale(${k})`; el.style.left = Math.max(0, (vw - 1440 * k) / 2) + "px";
    };
    fit(); addEventListener("resize", fit); return () => removeEventListener("resize", fit);
  }, [ref]);
}

/** Saklar tema: ikon matahari/bulan, role="switch" agar status terbaca pembaca layar. */
function ThemeSwitch({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button className="theme-sw" type="button" role="switch" aria-checked={dark} aria-label="Mode gelap" title={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"} onClick={onToggle}>
      <span className="knob" aria-hidden="true">
        {dark ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 13.2A9 9 0 1 1 10.8 3a7 7 0 0 0 10.2 10.2Z" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="4.2" fill="currentColor" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
        )}
      </span>
    </button>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const page = (PAGE_ORDER.find((p) => path?.startsWith(`/${p}`)) ?? "ringkasan") as PageKey;
  const stage = useRef<HTMLDivElement>(null), chat = useRef<ChatHandle>(null), guide = useRef<GuideHandle>(null);
  const state = useDataState(), ctx = useCtx();
  const { theme, set: setTheme } = useTheme();
  useFitStage(stage);
  // Atribut tema diset SEBELUM state berubah, karena grafik (efek anak) membaca token CSS saat menggambar ulang.
  const applyTheme = (t: "light" | "dark") => { document.documentElement.dataset.theme = t; setTheme(t); };
  useEffect(() => { let t: "light" | "dark" = "light"; try { t = (localStorage.getItem("jernih-theme") as "light" | "dark" | null) ?? "light"; } catch {} document.documentElement.dataset.theme = t; setTheme(t); }, [setTheme]);
  useEffect(() => { document.title = `${BRAND.name} · ${PAGES[page].title}`; }, [page]);
  const toggleTheme = () => { const t = theme === "dark" ? "light" : "dark"; try { localStorage.setItem("jernih-theme", t); } catch {} applyTheme(t); };

  return (
    <>
      <OrnamentDefs />
      <div className="stage" ref={stage}>
        <Sidebar page={page} onOpenChat={() => chat.current?.open()} />
        <main>
          <header className="top">
            <h1>{PAGES[page].title} <span>: {PAGES[page].sub}</span></h1>
            <span className="stamp">{BRAND.dataRange}</span>
            <button className="btn" type="button" onClick={() => guide.current?.open(`g-${page}`)}>Panduan</button>
            <ThemeSwitch dark={theme === "dark"} onToggle={toggleTheme} />
          </header>
          {state.status === "loading" && <div className="empty">Memuat data dashboard…</div>}
          {state.status === "error" && <div className="empty">Data gagal dimuat ({state.message}). Pastikan web/public/data/dashboard.json ada; jalankan analysis/06_export_dashboard.py.</div>}
          {ctx && (
            <>
              <CriticalBanner page={page} headline={banner(page, ctx)} points={keyPoints(page, ctx)} />
              <KpiRow items={kpis(page, ctx)} />
              <div className="grid" key={page}>{children}</div>
              <ProvinceDialog ctx={ctx} />
            </>
          )}
        </main>
      </div>
      <Guide ref={guide} />
      <ChatDrawer ref={chat} page={page} />
    </>
  );
}
