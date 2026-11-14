"use client";
import { Card, Pills } from "../Card";
import { Chart } from "../Chart";
import { useCtx } from "../DataProvider";
import { cssVar, el, empty, frame, hover, lin, row, text, yGrid } from "@/lib/charts/core";
import { combo, hbars, scatter } from "@/lib/charts/kit";
import { fmt, nice } from "@/lib/format";
import { ARCH_LABEL, aggCtx } from "@/lib/select";
import { ARCHS, useUI } from "@/lib/store";

const AC = (a: string) => cssVar(`--a-${a === "tanpa-data" ? "none" : a}`);
const ARCH_LABELS = new Set(["KTG-01", "PKN-01", "KTB-01", "SM2-01", "PLB-01", "JKT-02", "MDN-01", "BGR-02", "IDP-01"]); // label tetap; stasiun lain lewat tooltip
const SEC = ["U", "TL", "T", "Tg", "S", "BD", "B", "BL"], SEC_N = ["utara", "timur laut", "timur", "tenggara", "selatan", "barat daya", "barat", "barat laut"];

export function Pemicu() {
  const c = useCtx()!;
  const wind = useUI((s) => s.windStation), setWind = useUI((s) => s.setWindStation);
  const on = new Set(c.codes);
  const W = c.d.wind[wind], wv = W.pm.filter((v): v is number => v != null), wmx = Math.max(...wv), wmn = Math.min(...wv);
  const offIdx = c.d.months.flatMap((m, i) => (+m.slice(5) <= 6 ? [i] : [])), hzIdx = c.d.months.flatMap((m, i) => ([8, 9, 10].includes(+m.slice(5)) ? [i] : []));
  const archRows = ARCHS.filter((a) => c.f.archs.includes(a)).map((a) => { const cs = c.stations.filter((s) => s.arch === a).map((s) => s.code); return { a, o: aggCtx(c, cs, offIdx).pm, h: aggCtx(c, cs, hzIdx).pm }; }).filter((r) => r.o != null);

  return (
    <>
      <Card area="1 / 1 / 2 / 11" title="Peta Tipe Wilayah" how="arch" sub="Level dasar vs lonjakan musim asap"
        legend={ARCHS.map((a) => `<span><i class="sw dot" style="background:var(--a-${a})"></i>${ARCH_LABEL[a]}</span>`).join("") + '<span><i class="sw ln" style="background:var(--thr)"></i>ambang 25</span>'}
        insight='KTG-01 berlabel "Urban Background" tapi lonjakannya 7×; Jakarta dan Medan kotor tanpa musim.'>
        <Chart deps={[c]} draw={(box) => scatter(box, "Peta tipe wilayah", c.d.stations.filter((s) => s.off).map((s) => ({
          x: s.off!, y: s.mult!, color: AC(s.arch), on: on.has(s.code), r: 6.5, label: ARCH_LABELS.has(s.code) ? (s.code === "KTG-01" ? "KTG-01 & 02" : s.code) : "",
          tip: `<b>${s.code} · ${s.kota}</b>${row("Tipe wilayah", ARCH_LABEL[s.arch])}${row("PM2.5 Jan–Jun", fmt(s.off, 1))}${row("Lonjakan Agu–Okt", fmt(s.mult, 1) + "×")}${row("Eskalasi 2024→2026", fmt(s.esc, 1) + "×")}`,
        })), { xlog: true, x0: 8, x1: 70, xt: [10, 15, 25, 40, 60], ylog: true, y0: 0.9, y1: 9, yt: [1, 2, 4, 8], yf: (v) => v + "×", xl: "PM2.5 di luar musim asap, µg/m³ →", yl: "↑ lonjakan saat musim asap",
          vref: [{ v: 25, cls: "thr25" }] })} />
      </Card>

      <Card area="1 / 11 / 2 / 19" title="Lalu Lintas vs PM2.5" how="traffic" sub="Kendaraan per jam vs PM2.5 dasar"
        insight="makin padat lalu lintas, makin kotor. Bogor (BGR-02) pengecualian karena hujan.">
        <Chart deps={[c]} draw={(box) => scatter(box, "Lalu lintas vs PM2.5", c.d.stations.filter((s) => s.off).map((s) => ({
          x: s.traffic, y: s.off!, color: AC(s.arch), on: on.has(s.code), r: 4.5, label: ["JKT-03", "BGR-02", "MDN-01"].includes(s.code) ? s.code : "",
          tip: `<b>${s.code}</b>${row("Kendaraan/jam", fmt(s.traffic))}${row("Jarak ke jalan", fmt(s.road) + " m")}${row("PM2.5 Jan–Jun", fmt(s.off, 1))}`,
        })), { x0: 0, x1: 3400, xt: [0, 1000, 2000, 3000], y0: 0, y1: 65, yt: [0, 25, 55], xl: "kendaraan/jam →", yl: "↑ PM2.5, µg/m³", fit: true })} />
      </Card>

      <Card area="2 / 1 / 3 / 7" title="Level per Tipe Wilayah" how="archbar" sub="PM2.5 Jan–Jun vs Agu–Okt"
        legend='<span><i class="sw" style="background:var(--bar-gray)"></i>Jan–Jun</span><span><i class="sw" style="background:var(--a-gambut)"></i>Agu–Okt</span>'
        insight="kota hampir rata sepanjang tahun, wilayah gambut melonjak 3–7× saat musim asap.">
        <Chart deps={[c]} draw={(box) => {
          if (!archRows.length) return empty(box, "Tidak ada tipe wilayah pada filter ini.");
          const { svg, w, h } = frame(box, "Level per tipe wilayah");
          const m = { l: 32, r: 4, t: 16, b: 30 }, ymax = nice(Math.max(...archRows.flatMap((r) => [r.o ?? 0, r.h ?? 0])) * 1.08), y = lin(0, ymax, h - m.b, m.t);
          yGrid(svg, y, [0, ymax / 2, ymax], m.l, w - m.r); el("line", { x1: m.l, x2: w - m.r, y1: y(55), y2: y(55), class: "std55" }, svg);
          const gw = (w - m.l - m.r) / archRows.length, bw = gw * 0.34;
          archRows.forEach((r, i) => {
            ([[r.o ?? 0, cssVar("--bar-gray")], [r.h ?? 0, AC(r.a)]] as [number, string][]).forEach(([v, col], k) => {
              const b = el("rect", { x: m.l + gw * i + gw * 0.14 + bw * k, width: bw - 2, y: y(v), height: h - m.b - y(v), rx: 2, fill: col }, svg);
              hover(b, `<b>${ARCH_LABEL[r.a]}</b>${row("Jan–Jun", fmt(r.o, 1))}${row("Agu–Okt", fmt(r.h, 1))}`);
              text(svg, m.l + gw * i + gw * 0.14 + bw * k + bw / 2 - 1, y(v) - 3, fmt(v), "lab-b", "middle");
            });
            const wd = ARCH_LABEL[r.a].split(" ");
            text(svg, m.l + gw * i + gw / 2, h - 16, wd[0], "lab", "middle"); text(svg, m.l + gw * i + gw / 2, h - 4, wd.slice(1).join(" "), "lab", "middle");
          });
        }} />
      </Card>

      <Card area="2 / 7 / 3 / 13" title="Faktor Paling Berpengaruh" how="imp" sub="Kontribusi tiap faktor"
        insight="musim dan lokasi menentukan; suhu, kelembapan, dan angin lokal di bawah 0,1.">
        <Chart deps={[c]} draw={(box) => hbars(box, "Faktor paling berpengaruh", c.d.importance.map(([l, v]) => ({ label: l, v, vl: fmt(v, 2), bold: v > 0.5, color: ["Kelembapan", "Suhu", "Kecepatan angin"].includes(l) ? cssVar("--bar-gray") : cssVar("--bar") })), { lw: 100, vw: 36, dec: 2 })} />
      </Card>

      <Card area="2 / 13 / 3 / 19" title="Arah Angin" how="wind" sub="PM2.5 menurut arah datang angin"
        tools={<Pills label="Pilih stasiun" value={wind} onChange={setWind} options={[["PLB-01", "PLB-01"], ["PKU-01", "PKU-01"], ["JKT-02", "JKT-02"]]} />}
        insight={wmx / wmn > 1.15 ? `di ${wind}, angin dari ${SEC_N[W.pm.indexOf(wmx)]} membawa PM2.5 ${fmt(wmx / wmn, 1)}× dibanding dari ${SEC_N[W.pm.indexOf(wmn)]}.` : `di ${wind}, PM2.5 hampir sama dari semua arah: sumbernya lokal.`}>
        <Chart deps={[c, wind]} draw={(box) => combo(box, "Arah angin dan PM2.5", SEC, W.pm.map((v) => ({ v: v ?? 0, color: v === wmx ? cssVar("--bar") : cssVar("--bar-soft"), label: v === wmx ? fmt(v) : "" })), {
          yf: (v) => fmt(v), tip: (i) => `<b>Angin dari ${SEC_N[i]}</b>${row("PM2.5", W.pm[i] == null ? "tidak ada" : fmt(W.pm[i], 1) + " µg/m³")}${row("Frekuensi", fmt(W.share[i], 1) + "% jam")}`,
        })} />
      </Card>
    </>
  );
}
