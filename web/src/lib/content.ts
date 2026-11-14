/* All copy in one place. Writing style follows the previous winners: short headline, number first,
   "Temuan Kritis" banner, "Insight:" line under each chart. Numbers that depend on filters are computed. */
import { fmt, kfmt } from "./format";
import { aggCtx, type Ctx, groupLabel, growth, isReliable, periodLabel, thresholdLabel } from "./select";
import type { PageKey } from "./types";

export const PAGES: Record<PageKey, { n: string; title: string; sub: string; nav: string }> = {
  ringkasan: { n: "01", nav: "Ringkasan", title: "Ringkasan Nasional", sub: "Udara Kotor dan Rawat Inap ISPA" },
  waktu: { n: "02", nav: "Waktu & Wilayah", title: "Waktu & Wilayah", sub: "Kapan dan di Mana Udara Paling Kritis" },
  pemicu: { n: "03", nav: "Pemicu Polusi", title: "Pemicu Polusi", sub: "Lalu Lintas Kota dan Musim Gambut" },
  dampak: { n: "04", nav: "Dampak Kesehatan", title: "Dampak Kesehatan", sub: "Pasien Bertambah dan Kelompok Rentan" },
  jaringan: { n: "05", nav: "Jaringan Pemantau", title: "Jaringan Pemantau", sub: "Data Andal dan Titik Buta" },
};
export const PAGE_ORDER: PageKey[] = ["ringkasan", "waktu", "pemicu", "dampak", "jaringan"];

export function banner(page: PageKey, c: Ctx): string {
  if (page === "ringkasan") {
    const a = aggCtx(c);
    return `<b>Temuan Kritis:</b> ${fmt(a.af)}% rawat inap ISPA ${groupLabel(c.group)} (${fmt(a.ex)} kasus) berasosiasi dengan PM2.5 di atas ${thresholdLabel(c.f.c0)} µg/m³. Patuh baku mutu nasional 55 hanya mencegah ${fmt(a.ex25 ? (a.ex55 / a.ex25) * 100 : 0)}% beban di atas ambang 25.`;
  }
  return {
    waktu: "<b>Temuan Kritis:</b> asap datang tiap 1 Agustus dan makin pekat tiap tahun. Rata-rata PM2.5 nasional Jan–Okt naik dari 35,3 menjadi 47,1 µg/m³ (2024 ke 2026), seluruhnya dari musim asap.",
    pemicu: "<b>Temuan Kritis:</b> dua akar masalah butuh dua kebijakan. Level harian kota mengikuti lalu lintas, lonjakan mengikuti musim di lahan gambut. Cuaca lokal hampir tidak berpengaruh.",
    dampak: "<b>Temuan Kritis:</b> pasien bertambah sejak PM2.5 25 µg/m³, jauh di bawah baku mutu 55, dan datang di hari yang sama dengan lonjakan asap.",
    jaringan: "<b>Temuan Kritis:</b> wilayah terkotor justru paling buta. Sensor Muaro Jambi (baseline 68,9 µg/m³) rusak dengan 99,5% data tidak valid, dan 13 dari 34 provinsi tidak punya stasiun.",
  }[page];
}

export interface Kpi { label: string; value?: number | null; dec?: number; pre?: string; suf?: string; unit?: string; raw?: string; sub: string; icon: string }
export function kpis(page: PageKey, c: Ctx): Kpi[] {
  const a = aggCtx(c), g = growth(c);
  const arrow = (v: number | null | undefined, y: string) => (v == null ? "" : `<b class="${v >= 0 ? "up" : "down"}">${v >= 0 ? "Naik" : "Turun"} ${fmt(Math.abs(v))}%</b> dari ${y}`);
  const ok = c.stations.filter(isReliable).length;
  const rs = [...c.stations].filter((s) => s.off100).sort((p, q) => q.peak100 / q.off100 - p.peak100 / p.off100)[0];
  const tb = a.xb.reduce((p, q) => p + q, 0);
  switch (page) {
    case "ringkasan": return [
      { label: "Jumlah Kasus ISPA Berlebih", value: a.ex, unit: "kasus", sub: g ? arrow(g.ex, g.yPrev) : periodLabel(c.f), icon: "lung" },
      { label: "Porsi Rawat Inap Terkait PM2.5", value: a.af, suf: "%", sub: `≈ 1 dari ${a.af ? fmt(100 / a.af) : "–"} pasien ${groupLabel(c.group)}`, icon: "hosp" },
      { label: "Tercegah Bila Patuh Baku 55", value: a.ex25 ? (a.ex55 / a.ex25) * 100 : null, suf: "%", sub: "dari kasus di atas ambang 25", icon: "part" },
      { label: "Rata-rata PM2.5", value: a.pm, dec: 1, unit: "µg/m³", sub: g ? arrow(g.pm, g.yPrev) : periodLabel(c.f), icon: "part" },
      { label: "Hari Melebihi Baku Mutu", value: a.excPct, suf: "%", sub: `${fmt(a.exc)} hari-stasiun di atas 55`, icon: "cal" }];
    case "waktu": return [
      { label: "Rata-rata PM2.5", value: a.pm, dec: 1, unit: "µg/m³", sub: g ? arrow(g.pm, g.yPrev) : periodLabel(c.f), icon: "part" },
      { label: "Hari Melebihi Baku Mutu", value: a.excPct, suf: "%", sub: `${fmt(a.exc)} hari-stasiun`, icon: "cal" },
      { label: "Hari Sangat Tidak Sehat", value: a.haz, unit: "hari", sub: "ISPU di atas 200", icon: "part" },
      { label: "Jam Paling Kotor", raw: "07–09", sub: "waktu setempat, 1,2–1,5× rata-rata", icon: "cal" },
      { label: "Beda Akhir Pekan", raw: "±0,5%", sub: "akhir pekan tidak lebih bersih", icon: "cal" }];
    case "pemicu": return [
      { label: "Korelasi Lalu Lintas", raw: "0,76", sub: "dengan PM2.5 di luar musim asap", icon: "fact" },
      { label: "Korelasi Jarak ke Jalan", raw: "−0,65", sub: "makin dekat jalan, makin kotor", icon: "fact" },
      { label: "Lonjakan Musim Asap", value: 7.3, dec: 1, suf: "×", sub: "Kalteng, Agu–Okt vs Jan–Jun", icon: "part" },
      { label: "Rasio PM2.5/PM10 Saat Asap", value: 0.81, dec: 2, sub: "perkotaan 0,64", icon: "part" },
      { label: "Pengaruh Cuaca Lokal", raw: "≤ 0,08", sub: "musim 0,78", icon: "wind" }];
    case "dampak": return [
      { label: "Jumlah Kasus ISPA Berlebih", value: a.ex, unit: "kasus", sub: `${groupLabel(c.group)}, di atas ${thresholdLabel(c.f.c0)}`, icon: "lung" },
      { label: "Ambang Efek", value: 25, unit: "µg/m³", sub: "baku mutu nasional 55", icon: "part" },
      { label: "Kasus di Hari Lolos Baku", value: tb ? (a.xb[0] / tb) * 100 : null, suf: "%", sub: "PM2.5 harian 25–55", icon: "hosp" },
      { label: "Bila PM2.5 Berlipat Dua", value: 57, pre: "+", suf: "%", sub: "ISPA balita, lansia +55%", icon: "lung" },
      { label: "Lonjakan RS Terbesar", value: rs ? rs.peak100 / rs.off100 : null, dec: 1, suf: "×", sub: rs ? `${rs.code} ${rs.kota}` : "tidak ada RS", icon: "hosp" }];
    case "jaringan": return [
      { label: "Stasiun Layak Dipakai", raw: `${ok}/${c.stations.length}`, sub: "jam valid ≥ 85% dan tidak macet", icon: "tower" },
      { label: "Provinsi Tanpa Stasiun", raw: "13/34", sub: "dari 34 provinsi", icon: "tower" },
      { label: "Sensor Macet Tak Terdeteksi", value: 9, unit: "bulan", sub: "BJB-01, tetap berlabel VALID", icon: "tower" },
      { label: "Stasiun Kembar", value: 1, unit: "pasang", sub: "KTG-01 dan KTG-02", icon: "tower" },
      { label: "Celah Terjauh", value: 1319, unit: "km", sub: "MER-01 ke stasiun terdekat", icon: "tower" }];
  }
}

/** Poin kunci & aksi. Angka utama mengikuti filter pada grain besar (periode, wilayah, kelompok, acuan);
    hasil model (dosis-respons, faktor pemicu, jeda waktu) dihitung dari seluruh data sehingga tetap. */
export interface KeyPoint { fig: string; head: string; what: string; why: string; action: string; who: string; chart: string }

const MON_LONG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const shortName = (n: string) => n.replace(" (incl. Papua Barat Daya)", "").replace(" (incl. Papua Selatan)", "");

export function keyPoints(page: PageKey, c: Ctx): KeyPoint[] {
  const a = aggCtx(c), grp = groupLabel(c.group), per = periodLabel(c.f);
  const prevent = a.ex25 ? (a.ex55 / a.ex25) * 100 : 0;
  const bad = c.stations.filter((s) => !isReliable(s));
  // provinsi dengan kasus berlebih terbanyak
  const provs = [...new Set(c.stations.map((s) => s.geo))].map((g) => {
    const sts = c.stations.filter((s) => s.geo === g);
    return { g, name: shortName(c.d.provinces.find((p) => p.id === g)?.name ?? g), ex: aggCtx(c, sts.map((s) => s.code)).ex, archs: new Set(sts.map((s) => s.arch)) };
  }).sort((p, q) => q.ex - p.ex);
  const topP = provs[0], seasonal = topP && (topP.archs.has("gambut") || topP.archs.has("ekstrem"));
  // bulan-stasiun terkotor dalam pilihan
  let peak: { v: number; code: string; kota: string; m: string } | null = null;
  for (const s of c.stations) for (const i of c.idx) { const v = c.d.monthly[s.code][i].pm; if (v != null && (!peak || v > peak.v)) peak = { v, code: s.code, kota: s.kota, m: c.d.months[i] }; }
  const pk = peak as { v: number; code: string; kota: string; m: string } | null;
  const pkLabel = pk ? `${MON_LONG[+pk.m.slice(5) - 1]} ${pk.m.slice(0, 4)}` : "";
  const none: KeyPoint = { fig: "–", head: "tidak ada data pada filter ini", what: "Kombinasi filter tidak menyisakan stasiun atau bulan.", why: "Tanpa data, temuan tidak bisa dihitung.", action: "Longgarkan filter atau tekan Atur ulang filter.", who: "Pengguna dashboard", chart: "" };

  if (page === "ringkasan") return [
    { fig: fmt(prevent) + "%", head: "beban tercegah bila patuh baku 55",
      what: `Pada ${per}, ada ${fmt(a.ex25)} kasus ISPA ${grp} berlebih di atas ambang 25 µg/m³. Bila PM2.5 hanya ditekan sampai baku mutu 55, yang hilang hanya ${fmt(a.ex55)} kasus.`,
      why: `Pasien sudah bertambah sejak 25 µg/m³. Kebijakan yang menunggu angka 55 membiarkan ${fmt(100 - prevent)}% beban tetap terjadi tanpa peringatan.`,
      action: "Gunakan 25 µg/m³ sebagai pemicu imbauan kesehatan harian, bukan 55.", who: "Kemenkes, Komite Penanggulangan Penyakit Respirasi", chart: "Kasus Berlebih per Level PM2.5" },
    topP ? { fig: kfmt(topP.ex), head: `kasus berlebih di ${topP.name}`,
      what: `${topP.name} menyumbang ${fmt(a.ex ? (topP.ex / a.ex) * 100 : 0)}% dari ${fmt(a.ex)} kasus ISPA ${grp} berlebih pada pilihan ini, terbanyak di antara provinsi yang dipantau.`,
      why: seasonal ? "Bebannya terkumpul di musim asap Agustus–Oktober, jadi bisa diantisipasi dengan kalender siaga." : "Bebannya datang dari polusi harian sepanjang tahun yang jarang memicu status darurat, sehingga mudah luput.",
      action: seasonal ? "Aktifkan siaga RS dan stok obat napas mulai Juli." : "Kendalikan lalu lintas dan sumber industri sepanjang tahun, bukan hanya saat episode.",
      who: seasonal ? `Dinkes ${topP.name}, BPBD` : `Dinkes dan DLH ${topP.name}`, chart: "Peringkat Provinsi" } : none,
    pk ? { fig: fmt(pk.v), head: `µg/m³ di ${pk.kota}, ${pkLabel}`,
      what: `Rata-rata PM2.5 bulanan tertinggi pada pilihan ini tercatat di ${pk.code} ${pk.kota} pada ${pkLabel}.`,
      why: `Angka ini ${fmt(pk.v / 55, 1)}× baku mutu harian 55. Pada level ini rawat inap ISPA bisa mencapai beberapa kali lipat hari normal.`,
      action: "Tetapkan wilayah ini sebagai prioritas siaga RS dan distribusi masker pada bulan yang sama tahun depan.", who: "Dinkes provinsi, RS rujukan", chart: "Tren Bulanan Kasus Berlebih" } : none,
    { fig: String(bad.length), head: `stasiun tidak layak dari ${c.stations.length}`,
      what: bad.length ? `${bad.map((s) => s.code).join(", ")} punya jam data valid di bawah 85% atau sensornya macet.` : "Semua stasiun pada pilihan ini layak dipakai.",
      why: "Keputusan siaga hanya sebaik datanya. Wilayah dengan sensor bermasalah bisa tampak bersih padahal tidak terpantau.",
      action: bad.length ? "Perbaiki sensor sebelum musim asap berikutnya." : "Pertahankan perawatan rutin dan aturan QC flatline.", who: "KLH, operator AQMS", chart: "Persebaran Beban ISPA per Provinsi" },
  ];

  if (page === "waktu") {
    const byMonth = Array.from({ length: 12 }, (_, k) => k + 1).filter((m) => c.f.months.includes(m))
      .map((m) => ({ m, pm: aggCtx(c, c.codes, c.d.months.flatMap((x, i) => (+x.slice(5) === m && c.f.years.includes(x.slice(0, 4)) ? [i] : []))).pm ?? 0 }));
    const hi = [...byMonth].sort((p, q) => q.pm - p.pm)[0], lo = [...byMonth].sort((p, q) => p.pm - q.pm)[0];
    const g = growth(c);
    const exc = c.stations.map((s) => ({ s, n: aggCtx(c, [s.code]).exc })).sort((p, q) => q.n - p.n)[0];
    return [
      hi ? { fig: MON_LONG[hi.m - 1].slice(0, 3), head: "bulan paling kotor",
        what: `Rata-rata PM2.5 di ${MON_LONG[hi.m - 1]} ${fmt(hi.pm, 1)} µg/m³, ${fmt(lo.pm ? hi.pm / lo.pm : 0, 1)}× bulan terbersih (${MON_LONG[lo.m - 1]}).`,
        why: "Puncaknya berulang di bulan yang sama tiap tahun, jadi bisa dijadwalkan, tidak perlu menunggu sensor naik.",
        action: `Siapkan posko kesehatan dan stok obat sebulan sebelum ${MON_LONG[hi.m - 1]}.`, who: "Dinkes provinsi", chart: "Pola Musiman" } : none,
      g && g.pm != null ? { fig: (g.pm >= 0 ? "+" : "") + fmt(g.pm) + "%", head: `PM2.5 ${g.yPrev} ke ${g.yNow}`,
        what: `Rata-rata PM2.5 pada bulan yang sama berubah ${fmt(g.pm)}% dari ${g.yPrev} ke ${g.yNow}.`,
        why: g.pm > 5 ? "Udara memburuk, dan kenaikan ini datang dari musim asap; bulan di luar musim hampir tidak berubah." : "Udara relatif stabil antartahun pada pilihan ini.",
        action: g.pm > 5 ? "Arahkan anggaran ke pencegahan karhutla di wilayah gambut." : "Pertahankan pemantauan rutin.", who: "BNPB, KLH", chart: "Musim Asap per Tahun" }
        : { fig: "–", head: "perbandingan tahun", what: "Pilih lebih dari satu tahun untuk melihat tren.", why: "Tren butuh minimal dua tahun pembanding.", action: "Centang 2024 dan 2026 di filter Tahun.", who: "Pengguna dashboard", chart: "Musim Asap per Tahun" },
      exc && exc.n ? { fig: fmt(exc.n), head: `hari ${exc.s.code} di atas baku 55`,
        what: `${exc.s.code} ${exc.s.kota} paling sering melewati baku mutu harian pada pilihan ini (${fmt(exc.n)} hari-stasiun).`,
        why: "Paparan berulang lebih berbahaya daripada satu episode: kelompok rentan tidak sempat pulih.",
        action: "Audit sumber emisi lokal dan siapkan imbauan rutin untuk wilayah ini.", who: "DLH, Dinkes kabupaten/kota", chart: "Kalender PM2.5 per Wilayah" } : none,
      { fig: "07–09", head: "jam paling kotor",
        what: "PM2.5 pagi hari 1,2–1,5× rata-rata harian (waktu setempat), dan akhir pekan tidak lebih bersih (beda ±0,5%).",
        why: "Jam masuk sekolah dan berangkat kerja jatuh tepat di puncak paparan.",
        action: "Imbauan aktivitas luar ruang di pagi hari, berlaku setiap hari.", who: "Dinkes, dinas pendidikan", chart: "Pola Jam Harian" },
    ];
  }

  if (page === "pemicu") return [
    { fig: "0,76", head: "korelasi lalu lintas dan PM2.5",
      what: "Level PM2.5 di luar musim asap naik seiring jumlah kendaraan per jam (ρ 0,76) dan makin tinggi dekat jalan (ρ −0,65).",
      why: "Polusi kota bersumber dari aktivitas harian, jadi bisa dikendalikan oleh kebijakan transportasi.", action: "Uji coba pembatasan kendaraan di koridor dekat stasiun terkotor.", who: "Dishub, DLH", chart: "Lalu Lintas vs PM2.5" },
    { fig: "0,78", head: "pengaruh musim, cuaca lokal ≤ 0,08",
      what: "Model gradient boosting: musim (0,78) dan jarak ke jalan (0,59) paling menentukan; suhu, kelembapan, dan angin lokal di bawah 0,1.",
      why: "Prakiraan cuaca harian tidak cukup untuk memicu siaga; kalender musim lebih andal.", action: "Gunakan kalender musim sebagai pemicu siaga.", who: "Dinkes", chart: "Faktor Paling Berpengaruh" },
    { fig: "7,3×", head: "lonjakan asap di Kalimantan Tengah",
      what: 'KTG-01 berlabel "Urban Background", padahal PM2.5 musim asapnya 7,3× bulan biasa, tertinggi di jaringan.',
      why: "Label lokasi resmi menyembunyikan risiko; kebijakan yang memakai label itu salah sasaran.", action: "Kelompokkan wilayah berdasarkan tipe hasil data (k-means), bukan label lokasi.", who: "KLH", chart: "Peta Tipe Wilayah" },
    { fig: "2,2×", head: "PM2.5 dari arah selatan Palembang",
      what: "Di PLB-01, angin dari selatan membawa PM2.5 2,2× lebih tinggi dibanding dari barat laut.",
      why: "Asap datang dari lahan gambut di luar kota; pengendalian di dalam kota saja tidak cukup.", action: "Pantau titik api di arah datang angin dan koordinasi lintas kabupaten.", who: "BPBD Sumatera Selatan", chart: "Arah Angin" },
  ];

  if (page === "dampak") {
    const tb = a.xb.reduce((p, q) => p + q, 0);
    const rs = [...c.stations].filter((s) => s.off100).sort((p, q) => q.peak100 / q.off100 - p.peak100 / p.off100)[0];
    return [
      { fig: kfmt(a.ex), head: `kasus ISPA ${grp} berlebih`,
        what: `${fmt(a.af)}% rawat inap ISPA ${grp} pada ${per} berasosiasi dengan PM2.5 di atas ${thresholdLabel(c.f.c0)} µg/m³.`,
        why: `Kira-kira 1 dari ${a.af ? fmt(100 / a.af) : "–"} pasien tidak perlu dirawat bila udara di bawah acuan.`, action: "Pakai angka ini sebagai target kasus yang bisa dicegah dalam rencana kerja.", who: "Kemenkes, Dinkes", chart: "Kurva Risiko Rawat Inap" },
      { fig: fmt(tb ? (a.xb[0] / tb) * 100 : 0) + "%", head: "kasus berlebih di hari lolos baku",
        what: `Dari kasus berlebih pada pilihan ini, ${fmt(tb ? (a.xb[0] / tb) * 100 : 0)}% terjadi saat PM2.5 harian 25–55 µg/m³.`,
        why: "Hari-hari ini dianggap aman oleh baku mutu, sehingga tidak ada imbauan sama sekali.", action: "Terbitkan imbauan kelompok rentan mulai 25 µg/m³.", who: "Kemenkes", chart: "Kurva Risiko Rawat Inap" },
      { fig: "H0", head: "pasien datang di hari lonjakan",
        what: "Admisi naik 1,8× di hari PM2.5 melonjak dan turun di hari yang sama saat asap hilang (49 kejadian).",
        why: "Tidak ada jeda dua hari untuk bersiap; RS yang menunggu sensor naik sudah terlambat.", action: "Siapkan RS sebelum musim asap dimulai.", who: "RS rujukan, Dinkes", chart: "Kapan Pasien Datang" },
      rs ? { fig: fmt(rs.peak100 / rs.off100, 1) + "×", head: `lonjakan admisi di ${rs.code}`,
        what: `RS ${rs.kota} (${rs.kelas}, ${rs.beds} tempat tidur) mencapai ${fmt(rs.peak100)} admisi pernapasan per 100 tempat tidur per hari saat puncak, ${fmt(rs.peak100 / rs.off100, 1)}× kondisi normal.`,
        why: "RS kecil di wilayah gambut paling cepat penuh; pasien bisa tertolak atau dirujuk jauh.", action: "Siapkan tempat tidur cadangan dan jalur rujukan sebelum musim asap.", who: "Dinkes provinsi, RS rujukan", chart: "Tekanan Rumah Sakit" } : none,
    ];
  }

  return [
    { fig: `${c.stations.length - bad.length}/${c.stations.length}`, head: "stasiun layak dipakai",
      what: bad.length ? `${bad.map((s) => `${s.code} (${fmt(s.cap, 0)}%)`).join(", ")} tidak layak: jam valid di bawah 85% atau sensor macet.` : "Semua stasiun pada pilihan ini layak.",
      why: "Angka dari stasiun bermasalah bisa salah arah: wilayah kotor tampak bersih, atau sebaliknya.", action: "Perbaiki atau ganti sensor, prioritas wilayah dengan beban tertinggi.", who: "KLH", chart: "Kelayakan Data per Stasiun" },
    { fig: "9 bln", head: "data macet lolos QC",
      what: "BJB-01 terkunci di 336,7 lalu 3,5 µg/m³ selama 9 bulan, semuanya tetap berlabel VALID.",
      why: "Pemeriksaan otomatis alat tidak cukup; data palsu bisa masuk laporan resmi.", action: "Tambahkan aturan flatline ≥ 6 jam di pipeline QC.", who: "KLH, operator AQMS", chart: "Kelayakan Data per Stasiun" },
    { fig: "1", head: "pasang stasiun kembar",
      what: "KTG-01 dan KTG-02 berjarak 112 km tetapi datanya identik (r = 1,000, beda rata-rata 0,96 µg/m³).",
      why: "Satu unit tidak menambah informasi, sementara 13 provinsi tidak punya stasiun sama sekali.", action: "Relokasi satu unit ke provinsi tanpa stasiun.", who: "KLH", chart: "Rencana Aksi Jaringan" },
    { fig: "13", head: "provinsi tanpa stasiun",
      what: "13 dari 34 provinsi tidak dipantau, termasuk seluruh Nusa Tenggara dan Maluku. IKU juga tidak membaca PM2.5.",
      why: "Beban kesehatan di wilayah ini tidak terlihat sehingga tidak masuk perencanaan.", action: "Tambah stasiun di Nusa Tenggara, Maluku, Sulawesi; usulkan PM2.5 masuk IKU.", who: "KLH, Bappenas", chart: "Cakupan Stasiun per Provinsi" },
  ];
}

export const HOW: Record<string, string> = {
  map: "Warna = metrik terpilih, makin gelap makin buruk. Bergaris = tidak ada stasiun. Titik = stasiun. Klik provinsi untuk profil. Batas provinsi: BAKOSURTANAL (34 provinsi).",
  trend: "Batang = kasus berlebih per bulan. Merah tua = Agu–Okt. Garis = rata-rata 3 bulan.",
  bands: "Kasus berlebih dikelompokkan menurut PM2.5 hari itu (acuan ambang 25, balita + lansia). Merah = hari yang lolos baku mutu 55.",
  rank: "Provinsi diurutkan dari kasus berlebih terbanyak. Merah = balita, abu = lansia.",
  heat: "Baris = stasiun, kolom = bulan. Makin gelap makin kotor. Kotak kiri = tipe wilayah. Bergaris = bulan tanpa hari valid (minimal 18 jam data).",
  season: "Batang = rata-rata tiap bulan kalender 2024–2025. Garis = 2026. Garis di atas batang = tahun ini lebih buruk.",
  esc: "Tiga batang per wilayah: 2024, 2025, 2026. Garis putus-putus = baku 55.",
  diurnal: "1,0× = rata-rata harian. Jam dihitung waktu setempat (WIB, WITA, WIT).",
  arch: "Kanan = kotor sepanjang tahun. Atas = melonjak saat musim asap. Kiri atas: bersih, lalu meledak saat asap. Kanan atas: beban ganda. Warna = tipe wilayah (k-means). Arahkan kursor ke titik untuk nama stasiun.",
  traffic: "Tiap titik = stasiun. Garis putus-putus = tren. Korelasi Spearman 0,76.",
  archbar: "Abu = Jan–Jun, berwarna = Agu–Okt. Selisih tinggi batang = besar lonjakan musim asap.",
  imp: "Makin panjang batang, makin besar kontribusi faktor dalam model gradient boosting yang memprediksi PM2.5 harian.",
  wind: "Batang = rata-rata PM2.5 saat angin datang dari arah tersebut (U = utara, Tg = tenggara, BL = barat laut).",
  curve: "1× = risiko pada PM2.5 15. Pita = hari lolos baku (25–55). Garis hitam = batas skenario dari slider. Model: Poisson GLM, efek tetap RS, kontrol hari, suhu, tahun.",
  event: "H0 = hari PM2.5 melonjak. Di atas 1× = admisi lebih tinggi dari minggu sebelumnya. Dihitung dari 49 kejadian lonjakan.",
  pct: "Persentase kenaikan kasus bila PM2.5 naik dua kali lipat, misalnya 25 menjadi 50.",
  rs: "Titik abu = normal (rata-rata Jan–Jun), titik merah = puncak rata-rata 7 hari.",
  year: "Batang = kasus berlebih Jan–Okt tiap tahun agar sebanding. Angka merah = perubahan dari tahun sebelumnya.",
  cover: "Warna = status stasiun di provinsi. Titik merah = stasiun tidak layak.",
  cap: "Batang = % jam valid setelah QC, 10 stasiun terendah. Garis kuning = batas layak 85%.",
  iku: "Hari PM2.5 di atas 55 pada 2025, untuk stasiun yang IKU-nya tergolong baik (≥ 75).",
  act: "Urutan prioritas: perbaiki data, relokasi, lalu tambah stasiun.",
};
