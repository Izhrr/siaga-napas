"use client";
import { CloseButton } from "../Icons";
import { useEffect, useRef } from "react";
import { fmt } from "@/lib/format";
import { ARCH_LABEL, aggCtx, groupLabel, type Ctx } from "@/lib/select";
import { useUI } from "@/lib/store";

/** Profil provinsi saat peta diklik: stasiun di provinsi itu, PM2.5, kasus berlebih, RS, dan masalah data. */
export function ProvinceDialog({ ctx }: { ctx: Ctx }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const sel = useUI((s) => s.selectedProvince), selectProvince = useUI((s) => s.selectProvince);
  useEffect(() => { if (sel && !dlg.current?.open) dlg.current?.showModal(); if (!sel && dlg.current?.open) dlg.current.close(); }, [sel]);
  const name = sel ? ctx.d.provinces.find((p) => p.id === sel)?.name ?? sel : "";
  const sts = sel ? ctx.d.stations.filter((s) => s.geo === sel) : [];
  return (
    <dialog ref={dlg} className="kpd" aria-labelledby="pvTitle" onClose={() => selectProvince(null)} onClick={(e) => e.target === dlg.current && dlg.current?.close()}>
      <div className="dg-h"><h2 id="pvTitle">Profil {name}</h2><CloseButton label="Tutup" onClick={() => dlg.current?.close()} /></div>
      <ol className="kp-list">
        {sts.length ? sts.map((s) => {
          const a = aggCtx(ctx, [s.code]);
          return (
            <li key={s.code}>
              <div className="big">{fmt(a.pm, 1)}<small> µg/m³</small></div>
              <p className="sub">{s.code} · {s.kota}</p>
              <dl>
                <dt>Kasus berlebih</dt><dd>{fmt(a.ex)} ({groupLabel(ctx.group)})</dd>
                <dt>Tipe wilayah</dt><dd>{ARCH_LABEL[s.arch]}</dd>
                <dt>Rumah sakit</dt><dd>{s.kelas}, {s.beds} tempat tidur</dd>
                <dt>Kualitas data</dt><dd>{fmt(s.cap, 0)}% jam valid{s.issue ? ` · ${s.issue}` : ""}</dd>
              </dl>
            </li>
          );
        }) : <li><p className="sub">Tidak ada stasiun di provinsi ini.</p><p>Kandidat lokasi relokasi atau stasiun baru.</p></li>}
      </ol>
    </dialog>
  );
}
