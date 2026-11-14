"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useTheme } from "./DataProvider";

/** Sized container for an imperative SVG chart. Redraws on resize, on theme change, and when `deps` change. */
export function Chart({ draw, deps, style }: { draw: (box: HTMLDivElement) => void; deps: unknown[]; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useTheme((t) => t.theme);
  const drawRef = useRef(draw);
  useLayoutEffect(() => { drawRef.current = draw; }); // latest closure, updated before the draw effect below
  useEffect(() => {
    const box = ref.current; if (!box) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const run = () => { try { drawRef.current(box); } catch (e) { console.error(e); box.innerHTML = '<div class="empty">Grafik gagal dimuat.</div>'; } };
    run();
    let last = `${box.clientWidth}x${box.clientHeight}`;
    const ro = new ResizeObserver(() => { const now = `${box.clientWidth}x${box.clientHeight}`; if (now === last) return; last = now; clearTimeout(t); t = setTimeout(run, 120); });
    ro.observe(box);
    return () => { ro.disconnect(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, ...deps]);
  return <div className="chart" ref={ref} style={style} />;
}
