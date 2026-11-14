"use client";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { banner, keyPoints, kpis, PAGES, PAGE_ORDER } from "@/lib/content";
import type { PageKey } from "@/lib/types";
import { useCtx, useDataState, useTheme } from "../DataProvider";
import { OrnamentDefs } from "../Ornaments";
import { ChatDrawer, type ChatHandle } from "./ChatDrawer";
import { Guide, type GuideHandle } from "./Guide";
import { KeyPoints } from "./KeyPoints";
import { KpiRow } from "./KpiRow";
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
  useEffect(() => { document.title = `JERNIH · ${PAGES[page].title}`; }, [page]);
  const toggleTheme = () => { const t = theme === "dark" ? "light" : "dark"; try { localStorage.setItem("jernih-theme", t); } catch {} applyTheme(t); };

  return (
    <>
      <OrnamentDefs />
      <div className="stage" ref={stage}>
        <Sidebar page={page} onOpenChat={() => chat.current?.open()} />
        <main>
          <header className="top">
            <h1>{PAGES[page].title} <span>: {PAGES[page].sub}</span></h1>
            <span className="stamp">Data s.d. 14 Okt 2026 · diperbarui bulanan</span>
            <button className="btn" type="button" onClick={() => guide.current?.open(`g-${page}`)}>Panduan</button>
            <button className="btn" type="button" onClick={toggleTheme}>{theme === "dark" ? "Mode terang" : "Mode gelap"}</button>
          </header>
          {state.status === "loading" && <div className="empty">Memuat data dashboard…</div>}
          {state.status === "error" && <div className="empty">Data gagal dimuat ({state.message}). Pastikan web/public/data/dashboard.json ada; jalankan analysis/06_export_dashboard.py.</div>}
          {ctx && (
            <>
              <div className="banner" role="note">
                <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true"><path d="M10 1 19 17H1Z" fill="var(--red)" /><path d="M10 6.5v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><circle cx="10" cy="14.2" r="1.2" fill="#fff" /></svg>
                <div dangerouslySetInnerHTML={{ __html: banner(page, ctx) }} />
              </div>
              <div className="body">
                <div className="left">
                  <KpiRow items={kpis(page, ctx)} />
                  <div className="grid" key={page}>{children}</div>
                </div>
                <KeyPoints page={page} items={keyPoints(page, ctx)} ctx={ctx} />
              </div>
            </>
          )}
        </main>
      </div>
      <Guide ref={guide} />
      <ChatDrawer ref={chat} page={page} />
    </>
  );
}
