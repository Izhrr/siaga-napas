"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { PAGES, PAGE_ORDER } from "@/lib/content";
import { FILTERS, GUIDE_PAGES, QA, TERMS } from "@/lib/guide";
import type { PageKey } from "@/lib/types";

export interface GuideHandle { open: (section?: string) => void }

/** Panduan: latar belakang kasus, kenapa PM2.5, pertanyaan booklet, pengguna, filter & alasannya, cara membaca tiap halaman, istilah, metodologi. */
export const Guide = forwardRef<GuideHandle>(function Guide(_, ref) {
  const dlg = useRef<HTMLDialogElement>(null), body = useRef<HTMLDivElement>(null);
  const scrollTo = (id: string, smooth = true) => {
    const t = body.current?.querySelector<HTMLElement>(`#${id}`);
    if (t && body.current) body.current.scrollTo({ top: t.offsetTop - body.current.offsetTop - 6, behavior: smooth ? "smooth" : "auto" });
  };
  useImperativeHandle(ref, () => ({ open: (section) => { dlg.current?.showModal(); if (section) requestAnimationFrame(() => scrollTo(section, false)); } }));
  const sections: [string, string][] = [["g-case", "Latar belakang kasus"], ["g-why", "Kenapa PM2.5"], ["g-q", "Pertanyaan yang dijawab"], ["g-user", "Pengguna & alur kerja"], ["g-filter", "Filter & alasannya"],
    ...PAGE_ORDER.map((p) => [`g-${p}`, `${PAGES[p].n} ${PAGES[p].title}`] as [string, string]), ["g-term", "Istilah"], ["g-data", "Data & metodologi"]];
  return (
    <dialog ref={dlg} aria-labelledby="gTitle" onClick={(e) => e.target === dlg.current && dlg.current?.close()}>
      <div className="dg-h"><h2 id="gTitle">Panduan JERNIH</h2><button className="x" type="button" aria-label="Tutup panduan" onClick={() => dlg.current?.close()}>×</button></div>
      <div className="dg">
        <nav aria-label="Isi panduan">{sections.map(([id, t]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); scrollTo(id); }}>{t}</a>)}</nav>
        <div className="gbody" ref={body}>
          <h3 id="g-case">Latar belakang kasus</h3>
          <p>Dataset kompetisi berisi pengukuran udara per jam dari <b>27 stasiun AQMS</b> di lima pulau besar (Jan 2024 – Okt 2026) dan rawat inap harian di <b>27 RS rujukan</b> yang berpasangan dengan tiap stasiun. Data memperlihatkan dua masalah sekaligus: kota besar seperti Jakarta yang kotor sepanjang tahun, dan wilayah gambut Sumatra–Kalimantan yang dilanda asap tiap Agustus–Oktober dengan intensitas yang naik setiap tahun.</p>
          <p>Masalahnya bukan hanya udara kotor, tetapi <b>keputusan kesehatan yang belum terhubung dengan data udara</b>: baku mutu menilai hari aman atau tidak, sementara pasien sudah bertambah sebelum batas itu tercapai. JERNIH menyatukan keduanya: dari konsentrasi polutan, ke jumlah pasien, ke aksi.</p>
          <h3 id="g-why">Kenapa PM2.5</h3>
          <ul>
            <li><b>Polutan penentu ISPU:</b> PM2.5 menjadi parameter kritis pada 99,7% hari valid dan 98,4% hari berkategori Tidak Sehat ke atas.</li>
            <li><b>Paling terkait pasien:</b> rawat inap ISPA, asma, dan PPOK naik jelas mengikuti PM2.5 di seluruh RS.</li>
            <li><b>Punya baku mutu harian dan tahunan</b> (PP 22/2021) serta pedoman WHO sebagai pembanding.</li>
            <li>Polutan lain (SO2, NO2, CO, O3) tetap dipakai sebagai penanda sumber dan untuk menghitung IKU.</li>
          </ul>
          <h3 id="g-q">Pertanyaan yang dijawab</h3>
          <table><thead><tr><th>Tujuan booklet</th><th>Di mana</th><th>Jawaban singkat</th></tr></thead><tbody>{QA.map((q) => <tr key={q[0]}><td>{q[0]}</td><td>{q[1]}</td><td>{q[2]}</td></tr>)}</tbody></table>
          <h3 id="g-user">Pengguna &amp; alur kerja</h3>
          <p>Pengguna utama: <b>tim surveilans kesehatan lingkungan</b> (Kemenkes dan Dinkes provinsi) yang berkoordinasi dengan RS rujukan. Pengguna kedua: KLH/DLH untuk jaringan pemantau. Alur kerja: <b>laporan bulanan</b> sepanjang tahun, <b>pemantauan harian</b> saat musim kemarau (Juli–Oktober). Data diperbarui tiap bulan, sehingga waktu (tahun dan bulan) menjadi filter utama.</p>
          <h3 id="g-filter">Filter &amp; alasannya</h3>
          <table><thead><tr><th>Filter</th><th>Cara pakai</th><th>Kebutuhan pengguna</th></tr></thead><tbody>{FILTERS.map((f) => <tr key={f[0]}><td><b>{f[0]}</b></td><td>{f[1]}</td><td>{f[2]}</td></tr>)}</tbody></table>
          <p>Semua filter berlaku di seluruh halaman dan tersimpan saat pindah halaman. Tombol i di tiap grafik menjelaskan cara membacanya.</p>
          {PAGE_ORDER.map((p: PageKey) => (
            <div key={p}>
              <h3 id={`g-${p}`}>{PAGES[p].n} {PAGES[p].title}</h3>
              <h4>Inti halaman</h4><p>{GUIDE_PAGES[p][0]}</p>
              <h4>Cara membaca</h4><ol>{GUIDE_PAGES[p][1].map((x) => <li key={x}>{x}</li>)}</ol>
            </div>
          ))}
          <h3 id="g-term">Istilah</h3>
          <table><tbody>{TERMS.map((t) => <tr key={t[0]}><td style={{ width: 150 }}><b>{t[0]}</b></td><td>{t[1]}</td></tr>)}</tbody></table>
          <h3 id="g-data">Data &amp; metodologi</h3>
          <ul>
            <li>Hanya dataset panitia. Batas provinsi pada peta memakai Peta Dasar BAKOSURTANAL sebagai latar, tidak dipakai dalam perhitungan.</li>
            <li>Pembersihan: kode error dan nilai mustahil dibuang, jam alat disinkronkan, satuan ppm dikonversi, sensor macet ditandai, hanya data VALID yang dihitung.</li>
            <li>Kasus berlebih: model Poisson dengan efek tetap RS, spline log PM2.5, hari, suhu, dan tahun.</li>
            <li>Tipe wilayah: k-means pada level Jan–Jun, lonjakan musim asap, dan eskalasi 2024–2026.</li>
            <li>Data sintetis: angka menggambarkan pola dalam dataset ini dan ditulis sebagai asosiasi, bukan sebab-akibat.</li>
          </ul>
        </div>
      </div>
    </dialog>
  );
});
