"use client";
import { useRef, useState } from "react";
import { PAGES, type KeyPoint } from "@/lib/content";
import { fmt } from "@/lib/format";
import { ARCH_LABEL, aggCtx, groupLabel, shortProv, type Ctx } from "@/lib/select";
import { useUI } from "@/lib/store";
import type { PageKey } from "@/lib/types";
import { Orn } from "../Ornaments";

/** Kolom fokus di kanan: angka besar + headline + aksi; klik membuka detail (temuan, rekomendasi, pelaksana). */
export function KeyPoints({ page, items, ctx }: { page: PageKey; items: KeyPoint[]; ctx: Ctx }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<KeyPoint | null>(null);
  const sel = useUI((s) => s.selectedProvince), selectProvince = useUI((s) => s.selectProvince);
  const show = (k: KeyPoint) => { setOpen(k); dlg.current?.showModal(); };

  const profile = page === "ringkasan" && sel ? ctx.d.stations.filter((s) => s.geo === sel) : null;
  const provName = sel ? ctx.d.provinces.find((p) => p.id === sel)?.name ?? sel : "";
  return (
    <aside className="kp-col" aria-label="Poin kunci dan aksi">
      <Orn id={page === "jaringan" ? "tower" : "lung"} />
      {profile ? (
        <>
          <div className="card-h"><h2>Profil {shortProv(provName)}</h2><button className="btn" style={{ marginLeft: "auto", padding: "2px 8px" }} type="button" onClick={() => selectProvince(null)}>Kembali</button></div>
          <ul className="kp">
            {profile.length ? profile.map((s) => {
              const a = aggCtx(ctx, [s.code]);
              return (
                <li key={s.code}><button type="button" tabIndex={-1}>
                  <span className="fig">{fmt(a.pm, 0)}<small style={{ fontSize: 11, fontWeight: 600 }}> µg/m³</small></span>
                  <span className="hd">{s.code} · {s.kota}</span>
                  <span className="ac">{fmt(a.ex)} kasus berlebih ({groupLabel(ctx.group)}) · {ARCH_LABEL[s.arch]} · RS {s.kelas}, {s.beds} TT{s.issue ? ` · ${s.issue}` : ""}</span>
                </button></li>
              );
            }) : (
              <li><button type="button" tabIndex={-1}><span className="fig">0</span><span className="hd">stasiun di provinsi ini</span><span className="ac">Kandidat lokasi relokasi atau stasiun baru.</span></button></li>
            )}
          </ul>
        </>
      ) : (
        <>
          <div className="card-h"><h2>Poin Kunci &amp; Aksi</h2><small>klik untuk detail</small></div>
          <ul className="kp">
            {items.map((k) => (
              <li key={k[1]}><button type="button" aria-haspopup="dialog" onClick={() => show(k)}>
                <span className="fig">{k[0]}</span>
                <span className="hd">{k[1]}</span>
                <span className="ac">Aksi: {k[3]}</span>
                <span className="more">Lihat detail ›</span>
              </button></li>
            ))}
          </ul>
        </>
      )}
      <dialog ref={dlg} className="kpd" aria-labelledby="kpTitle" onClick={(e) => e.target === dlg.current && dlg.current?.close()}>
        <div className="dg-h"><h2 id="kpTitle">{PAGES[page].title} · poin kunci</h2><button className="x" type="button" aria-label="Tutup detail" onClick={() => dlg.current?.close()}>×</button></div>
        {open && (
          <div className="kp-body">
            <div className="big">{open[0]}</div>
            <p className="sub">{open[1]}</p>
            <dl><dt>Temuan</dt><dd>{open[2]}</dd><dt>Rekomendasi</dt><dd>{open[3]}</dd><dt>Pelaksana</dt><dd>{open[4]}</dd><dt>Lihat grafik</dt><dd>{open[5]}</dd></dl>
            <button className="btn" style={{ marginTop: 16 }} type="button" onClick={() => dlg.current?.close()}>Tutup</button>
          </div>
        )}
      </dialog>
    </aside>
  );
}
