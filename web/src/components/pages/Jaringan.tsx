"use client";
import { Card } from "../Card";
import { Chart } from "../Chart";
import { useCtx } from "../DataProvider";
import { cssVar, el, hover, row, text } from "@/lib/charts/core";
import { hbars, mapBase } from "@/lib/charts/kit";
import { fmt } from "@/lib/format";
import { isReliable } from "@/lib/select";
import { HATCH_SW } from "./Ringkasan";

const ACTIONS: [string, string, string, string, string][] = [
  ["Perbaiki", "JMB-02 Muaro Jambi", "Ganti sensor", "Baseline tertinggi (68,9 µg/m³), 99,5% data rusak", "Segera"],
  ["Perbaiki", "PLB-01, MDN-01, MER-01", "Pulihkan pengiriman data", "Data valid hanya 20–80%", "Segera"],
  ["Perbaiki QC", "Semua stasiun", "Aturan flatline ≥ 6 jam", "BJB-01 lolos 9 bulan berlabel VALID", "Bulan ini"],
  ["Relokasi", "KTG-02 Sampit", "Pindah ke provinsi tanpa stasiun", "Identik dengan KTG-01", "Kuartal ini"],
  ["Tambah", "Nusa Tenggara, Maluku, Sulawesi", "Bangun stasiun baru", "13 provinsi tanpa stasiun", "Tahun anggaran"],
];

export function Jaringan() {
  const c = useCtx()!;
  const iku = c.stations.filter((s) => s.iku != null && s.iku >= 75 && (s.exc25 ?? 0) > 0).sort((a, b) => (b.exc25 ?? 0) - (a.exc25 ?? 0));
  const low = [...c.stations].sort((a, b) => a.cap - b.cap).slice(0, 10);
  return (
    <>
      <Card area="1 / 1 / 2 / 11" title="Cakupan Stasiun per Provinsi" how="cover" sub="Status stasiun di tiap provinsi"
        legend={`<span><i class="sw" style="background:var(--s1)"></i>Semua stasiun layak</span><span><i class="sw" style="background:var(--s3)"></i>Ada stasiun bermasalah</span><span>${HATCH_SW}Tanpa stasiun</span><span><i class="sw dot" style="background:var(--ink)"></i>Stasiun layak</span><span><i class="sw dot" style="background:var(--bar)"></i>Stasiun tidak layak</span>`}
        insight="13 provinsi tanpa stasiun, termasuk seluruh Nusa Tenggara dan Maluku; dua stasiun Papua berjarak lebih dari 1.200 km.">
        <Chart deps={[c]} draw={(box) => {
          const { svg, hatch } = mapBase(box, "Cakupan stasiun per provinsi", "cover");
          for (const p of c.d.provinces) {
            const sts = c.d.stations.filter((s) => s.geo === p.id), st = !sts.length ? "none" : sts.some((s) => !isReliable(s)) ? "bad" : "ok";
            const path = el("path", { d: p.d, class: "prov", fill: st === "none" ? hatch : st === "bad" ? cssVar("--s3") : cssVar("--s1") }, svg);
            hover(path, `<b>${p.name}</b>` + (st === "none" ? "<div>Tidak ada stasiun</div>" : sts.map((s) => row(s.code, fmt(s.cap, 0) + "% valid")).join("")));
          }
          c.d.stations.forEach((s) => {
            const dot = el("circle", { cx: s.x, cy: s.y, r: 5, fill: isReliable(s) ? cssVar("--ink") : cssVar("--bar"), stroke: cssVar("--card"), "stroke-width": 1.6 }, svg);
            hover(dot, `<b>${s.code} · ${s.kota}</b>${row("Jam valid", fmt(s.cap, 1) + "%")}${row("Status alat", s.status)}${row("Stasiun terdekat", fmt(s.nn) + " km")}${s.issue ? `<div>${s.issue}</div>` : ""}`);
          });
          ([["MER-01", "1.319 km ke stasiun terdekat"], ["JMB-02", "JMB-02 rusak"]] as const).forEach(([code, t]) => {
            const s = c.d.stations.find((z) => z.code === code)!; const r = s.x > 820;
            text(svg, s.x + (r ? -9 : 9), s.y - 9, t, "lab-b halo", r ? "end" : "start", { style: "font-size:21px" });
          });
        }} />
      </Card>

      <Card area="1 / 11 / 2 / 19" title={'IKU "Baik", PM2.5 Buruk'} how="iku" sub="Hari PM2.5 > 55 pada 2025"
        insight="IKU hanya membaca SO2 dan NO2, jadi 92 hari asap tetap tampak baik.">
        <Chart deps={[c]} draw={(box) => hbars(box, "IKU baik, PM2.5 buruk", iku.map((s) => ({
          label: s.code, v: s.exc25 ?? 0, vl: `${fmt(s.exc25)} hari · IKU ${fmt(s.iku)}`, color: cssVar(`--a-${s.arch}`),
          tip: `<b>${s.code} · ${s.kota}</b>${row("IKU 2025", fmt(s.iku) + " (baik)")}${row("Hari PM2.5 > 55", fmt(s.exc25))}`,
        })), { lw: 54, vw: 96, empty: "Tidak ada stasiun ber-IKU baik yang melebihi baku PM2.5." })} />
      </Card>

      <section className="card" style={{ gridArea: "2 / 1 / 3 / 11" }}>
        <div className="card-h"><h2>Rencana Aksi Jaringan</h2></div>
        <div style={{ overflow: "auto", margin: "6px 8px 8px", flex: 1, minHeight: 0 }}>
          <table className="t">
            <thead><tr><th>Aksi</th><th>Lokasi</th><th>Langkah</th><th>Alasan dari data</th><th>Waktu</th></tr></thead>
            <tbody>{ACTIONS.map((r) => <tr key={r[1]}><td><span className="tag">{r[0]}</span></td><td><b>{r[1]}</b></td><td>{r[2]}</td><td>{r[3]}</td><td><span className="tag g">{r[4]}</span></td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <Card area="2 / 11 / 3 / 19" title="Kelayakan Data per Stasiun" how="cap" sub="% jam data valid, 10 terendah"
        insight="BJB-01 turun ke 70% setelah sensor macet terdeteksi, padahal alat melabelinya 100% VALID.">
        <Chart deps={[c]} draw={(box) => hbars(box, "Kelayakan data per stasiun", low.map((s) => ({
          label: s.code, v: s.cap, bold: !isReliable(s), vl: fmt(s.cap, 0) + "%", color: isReliable(s) ? cssVar("--bar-gray") : cssVar("--bar"),
          tip: `<b>${s.code} · ${s.kota}</b>${row("Jam valid", fmt(s.cap, 1) + "%")}${row("Status alat", s.status)}${s.issue ? `<div>${s.issue}</div>` : ""}`,
        })), { lw: 56, vw: 36, max: 100, refs: [{ v: 85, cls: "thr25" }] })} />
      </Card>
    </>
  );
}
