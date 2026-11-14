"use client";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { PAGES, PAGE_ORDER } from "@/lib/content";
import { FILTERS, GUIDE_READ, QA, TANYA_ITEMS, TERMS } from "@/lib/guide";
import shots from "@/lib/guide-shots.json";
import type { PageKey } from "@/lib/types";
import { ChevronIcon, CloseButton } from "../Icons";

export interface GuideHandle { open: (section?: string) => void }
type Shot = { w: number; h: number; markers: { key: string; x: number; y: number }[] };
const SHOTS = shots as Record<string, Shot>;

/* Halaman panduan: 0 Gambaran umum, 1–5 cara membaca tiap halaman, 6 Tanya Data AI, 7 Istilah & metodologi. */
const SECTIONS: { id: string; nav: string; title: string }[] = [
  { id: "overview", nav: "Gambaran umum", title: `Tentang ${BRAND.name}` },
  ...PAGE_ORDER.map((p) => ({ id: p, nav: `${PAGES[p].nav}`, title: `Cara membaca: ${PAGES[p].title}` })),
  { id: "tanya", nav: "Tanya Data AI", title: "Cara memakai Tanya Data AI" },
  { id: "istilah", nav: "Istilah & metodologi", title: "Istilah & metodologi" },
];

/** Screenshot dengan penanda bernomor; arahkan kursor ke penjelasan untuk menyorot penanda (dan sebaliknya). */
function Annotated({ id, items, img, alt, below }: { id: string; items: Record<string, [string, string]>; img: string; alt: string; below?: React.ReactNode }) {
  const [hot, setHot] = useState<number | null>(null);
  const shot = SHOTS[id];
  if (!shot) return <p className="g-note">Screenshot belum dibuat. Jalankan <code>web/scripts/guide_shots.py</code>.</p>;
  const marks = shot.markers.filter((m) => items[m.key]);
  return (
    <div className="g-ann">
      <div>
      <figure className="g-shot" style={{ aspectRatio: `${shot.w} / ${shot.h}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={alt} width={shot.w} height={shot.h} loading="lazy" />
        {marks.map((m, i) => (
          <span key={m.key} className={`g-mark${hot === i ? " hot" : ""}`} style={{ left: `${m.x}%`, top: `${m.y}%` }} onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)} aria-hidden="true">{i + 1}</span>
        ))}
      </figure>
      {below}
      </div>
      <ol className="g-keys">
        {marks.map((m, i) => (
          <li key={m.key} className={hot === i ? "hot" : undefined} onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)}>
            <span className="g-n">{i + 1}</span><div><b>{items[m.key][0]}</b><p>{items[m.key][1]}</p></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Overview({ go }: { go: (i: number) => void }) {
  return (
    <>
      <p className="g-lead"><b>{BRAND.name}</b> ({BRAND.expansion}) menghubungkan kualitas udara dengan rawat inap di rumah sakit, supaya daerah bisa bersiaga sebelum pasien melonjak.</p>
      <div className="g-two">
        <section><h3>Latar belakang</h3>
          <p>Data lomba berisi pengukuran udara per jam dari <b>27 stasiun AQMS</b> di lima pulau dan rawat inap harian di <b>27 RS rujukan</b> yang berpasangan dengan tiap stasiun (1 Jan 2024 – 14 Okt 2026). Ada dua masalah sekaligus: kota besar yang kotor sepanjang tahun, dan wilayah gambut yang dilanda asap tiap Agustus–Oktober dengan intensitas yang naik setiap tahun.</p>
          <p>Baku mutu menilai sebuah hari aman atau tidak, padahal pasien sudah bertambah sebelum batas itu tercapai. Dashboard ini menerjemahkan konsentrasi polutan menjadi jumlah pasien, lalu menjadi aksi.</p></section>
        <section><h3>Kenapa PM2.5</h3><ul>
          <li>Polutan penentu ISPU pada 99,7% hari valid.</li>
          <li>Paling jelas terkait rawat inap ISPA, asma, dan PPOK.</li>
          <li>Punya baku mutu harian (55) dan tahunan (15) serta pedoman WHO.</li>
          <li>SO2, NO2, CO, O3 tetap dipakai sebagai penanda sumber dan untuk IKU.</li></ul></section>
      </div>
      <h3>Untuk siapa</h3>
      <div className="g-users">
        <div><b>Pengguna utama</b><p>Tim surveilans kesehatan lingkungan (Kemenkes, Dinkes provinsi) bersama RS rujukan.</p><small>Keputusan: kapan dan di mana siaga, RS mana disiapkan, ambang imbauan. Dipakai bulanan, harian saat Juli–Oktober.</small></div>
        <div><b>Pengguna kedua</b><p>KLH/DLH pengelola jaringan pemantau.</p><small>Keputusan: stasiun mana diperbaiki, dipindah, atau ditambah; sumber mana dikendalikan.</small></div>
      </div>
      <h3>Isi dashboard</h3>
      <div className="g-pages">
        {PAGE_ORDER.map((p, i) => (
          <button key={p} type="button" onClick={() => go(i + 1)}><span>{PAGES[p].n}</span><b>{PAGES[p].title}</b><small>{GUIDE_READ[p].inti}</small></button>
        ))}
      </div>
      <h3>Fitur</h3>
      <div className="g-feat">
        <div><b>Filter &amp; alasannya</b>
          <table><tbody>{FILTERS.map((f) => <tr key={f[0]}><td><b>{f[0]}</b></td><td>{f[2]}</td></tr>)}</tbody></table></div>
        <div>
          <b>Tombol i</b><p>Ada di tiap grafik: cara membaca grafik itu.</p>
          <b>Tooltip</b><p>Arahkan kursor ke batang, titik, sel, atau provinsi untuk angka detail.</p>
          <b>Poin Kunci &amp; Aksi</b><p>Klik angka di strip Temuan Kritis untuk penjelasan dan aksi.</p>
          <b>Navigasi</b><p>Menu halaman di kiri; filter tetap tersimpan saat pindah halaman.</p>
          <b>Tanya Data AI</b><p>Tombol di kiri bawah untuk pertanyaan bebas.</p>
        </div>
      </div>
      <p className="g-note">Sumber: hanya dataset panitia (data sintetis). Batas provinsi pada peta memakai Peta Dasar BAKOSURTANAL sebagai latar visual.</p>
    </>
  );
}

function PageGuide({ p }: { p: PageKey }) {
  const g = GUIDE_READ[p];
  return (
    <>
      <p className="g-lead"><b>Inti halaman:</b> {g.inti}</p>
      <Annotated id={p} items={g.items} img={`/guide/${p}.jpg`} alt={`Screenshot halaman ${PAGES[p].title} dengan penanda bernomor`}
        below={<div className="g-contoh"><h3>Contoh membaca</h3><ol className="g-ex">{g.contoh.map((c) => <li key={c}>{c}</li>)}</ol></div>} />
    </>
  );
}

function TanyaGuide() {
  return (
    <>
      <p className="g-lead"><b>Tanya Data AI</b> menjawab pertanyaan yang tidak tersedia langsung di grafik, misalnya membandingkan dua kota atau mencari RS tertentu. Setiap angka dihitung dari datamart dashboard ini, bukan dari pengetahuan umum AI.</p>
      <div className="g-tanya-ann"><Annotated id="tanya" items={TANYA_ITEMS} img="/guide/tanya.jpg" alt="Screenshot panel Tanya Data dengan penanda bernomor" /></div>
      <div className="g-tanya">
        <div>
          <h3>Langkah</h3>
          <ol className="g-ex"><li>Klik <b>Tanya Data AI</b> di kiri bawah.</li><li>Ketik pertanyaan atau pilih contoh.</li><li>Baca jawaban dan grafiknya; lanjutkan dengan pertanyaan susulan bila perlu.</li><li>Buka <b>Riwayat</b> untuk melihat percakapan sebelumnya.</li></ol>
        </div>
        <div>
          <h3>Contoh pertanyaan</h3>
          <ul><li>RS mana paling tertekan saat musim asap 2026?</li><li>Bandingkan PM2.5 Jakarta Pusat dan Palangka Raya per tahun.</li><li>Berapa kasus ISPA balita berlebih bila PM2.5 ditekan ke 25?</li><li>Stasiun mana yang datanya tidak layak?</li></ul>
        </div>
        <div>
          <h3>Batasan</h3>
          <ul><li>Hanya menjawab dari data dashboard ini; pertanyaan di luar cakupan akan ditolak dengan sopan.</li><li>Angka adalah asosiasi dari data sintetis, bukan sebab-akibat.</li><li>Prototipe tanpa login: riwayat bisa dilihat semua pengunjung. Jangan menulis data pribadi.</li></ul>
        </div>
      </div>
    </>
  );
}

function Istilah() {
  return (
    <>
      <h3>Pertanyaan booklet yang dijawab</h3>
      <table><thead><tr><th>Tujuan booklet</th><th>Di mana</th><th>Jawaban singkat</th></tr></thead><tbody>{QA.map((q) => <tr key={q[0]}><td>{q[0]}</td><td>{q[1]}</td><td>{q[2]}</td></tr>)}</tbody></table>
      <h3>Istilah</h3>
      <table><tbody>{TERMS.map((t) => <tr key={t[0]}><td style={{ width: 160 }}><b>{t[0]}</b></td><td>{t[1]}</td></tr>)}</tbody></table>
      <h3>Metodologi</h3>
      <ul>
        <li>Pembersihan: kode error dan nilai mustahil dibuang, jam alat disinkronkan, satuan ppm dikonversi, sensor macet ditandai, hanya data VALID yang dihitung. Hari valid = minimal 18 jam data.</li>
        <li>Kasus berlebih: model Poisson dengan efek tetap RS, spline log PM2.5, hari, suhu, dan tahun.</li>
        <li>Tipe wilayah: k-means pada level Januari–Juni, lonjakan musim asap, dan eskalasi 2024–2026.</li>
        <li>Faktor pemicu: gradient boosting + permutation importance.</li>
      </ul>
    </>
  );
}

/** Panduan bergaya dokumentasi: navigasi halaman di kiri, isi di kanan, tombol sebelumnya/berikutnya di bawah. */
export const Guide = forwardRef<GuideHandle>(function Guide(_, ref) {
  const dlg = useRef<HTMLDialogElement>(null), body = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const go = (n: number) => { setI(n); body.current?.scrollTo({ top: 0 }); };
  useImperativeHandle(ref, () => ({
    open: (section) => { const k = SECTIONS.findIndex((s) => `g-${s.id}` === section); go(k < 0 ? 0 : k); dlg.current?.showModal(); },
  }));
  const s = SECTIONS[i];
  return (
    <dialog ref={dlg} className="guide" aria-labelledby="gTitle" onClick={(e) => e.target === dlg.current && dlg.current?.close()}>
      <div className="dg-h"><h2 id="gTitle">Panduan {BRAND.name}</h2><CloseButton label="Tutup panduan" onClick={() => dlg.current?.close()} /></div>
      <div className="dg">
        <nav aria-label="Halaman panduan">
          {SECTIONS.map((x, k) => (
            <button key={x.id} type="button" aria-current={k === i ? "page" : undefined} onClick={() => go(k)}><span>{String(k + 1).padStart(2, "0")}</span>{x.nav}</button>
          ))}
        </nav>
        <div className="gbody" ref={body}>
          <h2 className="g-title">{s.title}</h2>
          {s.id === "overview" ? <Overview go={go} /> : s.id === "tanya" ? <TanyaGuide /> : s.id === "istilah" ? <Istilah /> : <PageGuide p={s.id as PageKey} />}
          <div className="g-pager">
            <button type="button" className="btn" disabled={i === 0} onClick={() => go(i - 1)}><ChevronIcon dir="left" /> {i > 0 ? SECTIONS[i - 1].nav : "Sebelumnya"}</button>
            <span>{i + 1} / {SECTIONS.length}</span>
            <button type="button" className="btn" disabled={i === SECTIONS.length - 1} onClick={() => go(i + 1)}>{i < SECTIONS.length - 1 ? SECTIONS[i + 1].nav : "Berikutnya"} <ChevronIcon /></button>
          </div>
        </div>
      </div>
    </dialog>
  );
});
