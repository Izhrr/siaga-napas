/* All copy in one place. Writing style follows the previous winners: short headline, number first,
   "Temuan Kritis" banner, "Insight:" line under each chart. Numbers that depend on filters are computed. */
import { fmt } from "./format";
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

/** Poin kunci: [angka, headline, temuan, rekomendasi, pelaksana, grafik terkait]. */
export type KeyPoint = [string, string, string, string, string, string];
export function keyPoints(page: PageKey, c: Ctx): KeyPoint[] {
  const a = aggCtx(c); const prevent = a.ex25 ? (a.ex55 / a.ex25) * 100 : 0;
  return {
    ringkasan: [
      [fmt(prevent) + "%", "beban tercegah bila patuh baku 55", `Dari ${fmt(a.ex25)} kasus ISPA ${groupLabel(c.group)} berlebih di atas ambang 25 µg/m³, hanya ${fmt(a.ex55)} hilang bila PM2.5 ditekan ke baku mutu 55. Pasien sudah bertambah sejak 25 µg/m³.`, "Usulkan 25 µg/m³ sebagai pemicu imbauan kesehatan harian.", "Kemenkes, Komite Penanggulangan Penyakit Respirasi", "Kasus Berlebih per Level PM2.5"],
      ["18,5rb", "kasus balita berlebih di Jakarta", "JKT-02, JKT-03, dan JKT-01 adalah tiga penyumbang terbesar kasus balita berlebih, tanpa satu pun episode asap. PM2.5 Jakarta di atas 46 µg/m³ sepanjang tahun.", "Kendalikan lalu lintas dan industri sepanjang tahun, bukan hanya saat episode.", "Dinkes dan DLH DKI Jakarta", "Peringkat Provinsi"],
      ["867", "µg/m³ di Kalteng, Oktober 2026", "Musim asap Agu–Okt naik di 10 wilayah gambut. Rata-rata Oktober 2026 di Palangka Raya dan Sampit mencapai 867 µg/m³, kategori ISPU Berbahaya.", "Aktifkan siaga RS wilayah gambut mulai Juli.", "Dinkes Kalteng, Riau, Jambi, Sumsel", "Tren Bulanan Kasus Berlebih"],
      ["5", "stasiun tidak layak dipakai", "JMB-02, MER-01, MDN-01, BJB-01, dan PLB-01 di bawah 85% jam valid atau macet, sehingga angkanya tidak bisa jadi dasar keputusan.", "Perbaiki kelima stasiun sebelum musim asap berikutnya.", "KLH, Direktorat Pengendalian Pencemaran Udara", "halaman 05 Jaringan Pemantau"]],
    waktu: [
      ["1 Agu", "awal musim asap tiap tahun", "Di wilayah gambut, PM2.5 naik bertingkat setiap 1 Agustus dan turun 1 November, berulang 2024–2026.", "Jadwalkan posko kesehatan dan stok obat mulai Juli.", "Dinkes provinsi wilayah gambut", "Kalender PM2.5 per Wilayah"],
      ["0%", "perubahan di luar musim asap", "Rata-rata Jan–Jun hampir identik 2024–2026. Kenaikan nasional 35,3 → 47,1 µg/m³ seluruhnya datang dari Agu–Okt.", "Arahkan anggaran ke pencegahan karhutla.", "BNPB, KLH", "Pola Musiman"],
      ["365", "hari Marunda di atas baku", "JKT-02 di kawasan industri dan pelabuhan Marunda melebihi 55 µg/m³ setiap hari sepanjang 2025.", "Audit sumber industri dan pelabuhan di Jakarta Utara.", "DLH DKI Jakarta", "Kalender PM2.5 per Wilayah"],
      ["07–09", "jam paling kotor", "Puncak pagi 1,2–1,5× rata-rata harian (waktu setempat). Akhir pekan tidak lebih bersih (beda ±0,5%).", "Imbauan aktivitas luar ruang di pagi hari, setiap hari.", "Dinkes, dinas pendidikan", "Pola Jam Harian"]],
    pemicu: [
      ["0,76", "korelasi lalu lintas dan PM2.5", "Level PM2.5 di luar musim asap mengikuti jumlah kendaraan per jam (ρ 0,76) dan jarak ke jalan (ρ −0,65).", "Uji coba pembatasan kendaraan di koridor dekat stasiun.", "Dishub, DLH", "Lalu Lintas vs PM2.5"],
      ["0,78", "pengaruh musim, cuaca ≤ 0,08", "Model gradient boosting: musim 0,78, jarak ke jalan 0,59, sedangkan suhu, kelembapan, dan angin lokal di bawah 0,1.", "Gunakan kalender musim sebagai pemicu siaga, bukan prakiraan cuaca harian.", "Dinkes", "Faktor Paling Berpengaruh"],
      ["7,3×", "lonjakan asap di KTG-01", 'KTG-01 berlabel "Urban Background", padahal lonjakan musim asapnya 7,3×, tertinggi di jaringan.', "Susun kebijakan per tipe wilayah hasil data, bukan label lokasi.", "KLH", "Peta Tipe Wilayah"],
      ["2,2×", "PM2.5 dari arah selatan", "Di Palembang (PLB-01), angin dari selatan membawa PM2.5 2,2× lebih tinggi dibanding dari barat laut.", "Pantau titik api di arah datang angin.", "BPBD Sumatera Selatan", "Arah Angin dan PM2.5"]],
    dampak: [
      ["25", "µg/m³, pasien mulai bertambah", "Rawat inap naik mulai PM2.5 25 µg/m³, menjadi 2× di 55 dan 4× di 150 µg/m³.", "Tetapkan 25 µg/m³ sebagai ambang siaga kesehatan.", "Kemenkes", "Kurva Risiko Rawat Inap"],
      ["H0", "pasien datang di hari lonjakan", "Admisi naik 1,8× di hari PM2.5 melonjak dan turun di hari yang sama saat asap hilang (49 kejadian).", "Siapkan RS sebelum musim asap, bukan setelah sensor naik.", "RS rujukan, Dinkes", "Kapan Pasien Datang"],
      ["+57%", "balita, lansia +55%", "Bila PM2.5 berlipat dua, rawat inap ISPA balita naik 57% dan lansia 55%. Lansia lebih banyak secara absolut.", "Jalankan imbauan untuk kedua kelompok sekaligus.", "Posyandu, layanan lansia", "Kerentanan per Penyakit"],
      ["10,6×", "lonjakan RS Pangkalan Bun", "PKN-01 mencapai 10,6× admisi normal saat puncak asap; RS Tipe C Sampit 115 admisi per 100 tempat tidur per hari.", "Siapkan rujukan dan tempat tidur cadangan di RS Tipe C wilayah gambut.", "Dinkes Kalteng, RS rujukan", "Tekanan Rumah Sakit"]],
    jaringan: [
      ["5", "stasiun tidak layak", "JMB-02 (0,5% valid), MER-01 (20%), MDN-01 (68%), BJB-01 (70%), PLB-01 (80%).", "Perbaiki atau ganti sensor, prioritas JMB-02 dan PLB-01.", "KLH", "Kelayakan Data per Stasiun"],
      ["9 bln", "data macet lolos QC", "BJB-01 terkunci di 336,7 lalu 3,5 µg/m³ selama 9 bulan, semuanya berlabel VALID.", "Tambahkan aturan flatline ≥ 6 jam di pipeline QC.", "KLH, operator AQMS", "Kelayakan Data per Stasiun"],
      ["1", "pasang stasiun kembar", "KTG-01 dan KTG-02 berjarak 112 km tetapi datanya identik (r = 1,000, beda rata-rata 0,96 µg/m³).", "Relokasi satu unit ke provinsi tanpa stasiun.", "KLH", "Rencana Aksi Jaringan"],
      ["13", "provinsi tanpa stasiun", "13 dari 34 provinsi tidak dipantau, termasuk seluruh Nusa Tenggara dan Maluku. IKU juga tidak membaca PM2.5.", "Tambah stasiun di Nusa Tenggara, Maluku, Sulawesi; usulkan PM2.5 masuk IKU.", "KLH, Bappenas", "Cakupan Stasiun per Provinsi"]],
  }[page] as KeyPoint[];
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
  arch: "Kanan = kotor sepanjang tahun. Atas = lonjakan besar saat musim asap. Warna = tipe wilayah hasil pengelompokan k-means.",
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
