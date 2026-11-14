/* Documentation content (Panduan): case background, why PM2.5, booklet questions, users, filters and their rationale,
   per-page how-to-read, glossary, data & method. */
import type { PageKey } from "./types";

/** Panduan baca per halaman (gaya dokumentasi Paragon): inti halaman, penjelasan tiap penanda bernomor
    pada screenshot (kunci = "filter" | "crit" | "kpi" | "ai" | judul kartu), dan contoh membaca dengan filter bawaan. */
export interface ReadGuide { inti: string; items: Record<string, [string, string]>; contoh: string[] }
const COMMON: Record<string, [string, string]> = {
  filter: ["Atur Filter", "Berlaku di semua halaman: tahun, bulan, pulau, tipe wilayah, acuan PM2.5, kelompok rentan."],
  crit: ["Temuan Kritis & Poin Kunci", "Kalimat inti halaman. Empat angka di bawahnya bisa diklik untuk melihat apa yang terjadi, mengapa penting, dan aksinya."],
  kpi: ["Angka utama", "Lima angka sesuai filter. Baris kecil di bawah angka menunjukkan perubahan dibanding tahun sebelumnya pada bulan yang sama."],
  ai: ["Tanya Data AI", "Asisten AI untuk pertanyaan yang tidak tersedia di grafik."],
};
export const GUIDE_READ: Record<PageKey, ReadGuide> = {
  ringkasan: {
    inti: "Seberapa besar beban rawat inap akibat udara kotor, di provinsi mana paling berat, dan berapa yang bisa dicegah.",
    items: { ...COMMON,
      "Persebaran Beban ISPA per Provinsi": ["Peta beban", "Makin gelap makin berat. Ganti metrik di header peta. Provinsi bergaris tidak punya stasiun. Klik provinsi untuk profil stasiunnya."],
      "Tren Bulanan Kasus Berlebih": ["Tren bulanan", "Batang merah tua = Agustus–Oktober. Garis hitam = rata-rata 3 bulan untuk melihat arah."],
      "Kasus Berlebih per Level PM2.5": ["Level PM2.5", "Kasus berlebih menurut PM2.5 harian. Batang merah = hari yang lolos baku mutu (25–55 µg/m³)."],
      "Peringkat Provinsi": ["Peringkat", "Provinsi dengan kasus berlebih terbanyak. Merah = balita, abu = lansia."] },
    contoh: [
      "Dengan filter bawaan, peta paling gelap di DKI Jakarta (43%). Artinya hampir separuh rawat inap ISPA balita dan lansia di sana berasosiasi dengan PM2.5 di atas 25 µg/m³.",
      "Ganti Bulan ke Musim asap: Kalimantan Tengah naik ke 71%. Beban Jakarta merata sepanjang tahun, beban Kalimantan menumpuk di Agustus–Oktober.",
      "Ganti Acuan PM2.5 ke 55: kasus berlebih turun dari ±121 ribu menjadi ±35 ribu. Selisihnya adalah beban yang tidak tertangkap baku mutu nasional."] },
  waktu: {
    inti: "Kapan dan di mana udara paling kritis: bulan, tahun, dan jam.",
    items: { ...COMMON,
      "Kalender PM2.5 per Wilayah": ["Kalender", "Baris = stasiun, kolom = bulan. Makin gelap makin kotor. Kotak kecil di kiri = tipe wilayah. Sel bergaris = data tidak valid."],
      "Pola Musiman": ["Pola musiman", "Batang = rata-rata tiap bulan 2024–2025, garis = 2026. Garis di atas batang berarti 2026 lebih buruk."],
      "Musim Asap per Tahun": ["Musim asap", "Tiga batang per wilayah (2024, 2025, 2026) untuk Agustus–Oktober. Batang yang naik berarti asap makin pekat."],
      "Pola Jam Harian": ["Pola jam", "1,0× = rata-rata harian. Pita merah muda = pukul 07–09 waktu setempat."] },
    contoh: [
      "Di kalender, blok gelap muncul tiap Agustus–Oktober pada baris KTG, PKN, dan PLB, dan tahun 2026 paling gelap.",
      "Di Pola Musiman, garis 2026 melonjak jauh di atas batang mulai Agustus: Oktober 2026 lebih dari dua kali rata-rata Oktober dua tahun sebelumnya.",
      "Puncak harian pukul 07–09: imbauan paling efektif dikirim sebelum jam berangkat sekolah dan kerja."] },
  pemicu: {
    inti: "Faktor yang menentukan level dan lonjakan PM2.5: lalu lintas kota dan musim di lahan gambut.",
    items: { ...COMMON,
      "Peta Tipe Wilayah": ["Tipe wilayah", "Sumbu x = PM2.5 di luar musim asap, sumbu y = lonjakan saat musim asap. Kanan = kotor sepanjang tahun, atas = melonjak saat asap. Warna = tipe hasil k-means."],
      "Lalu Lintas vs PM2.5": ["Lalu lintas", "Tiap titik satu stasiun; garis putus-putus = tren. Makin ke kanan makin padat kendaraan."],
      "Level per Tipe Wilayah": ["Level per tipe", "Abu = Januari–Juni, berwarna = Agustus–Oktober. Selisih tinggi batang = besar lonjakan."],
      "Faktor Paling Berpengaruh": ["Faktor", "Kontribusi tiap faktor dalam model gradient boosting yang memprediksi PM2.5 harian."],
      "Arah Angin": ["Arah angin", "PM2.5 rata-rata menurut arah datang angin. Pilih stasiun di header kartu."] },
    contoh: [
      "KTG-01 di kiri atas: bersih di luar musim, tetapi melonjak 7,3× saat asap.",
      "JKT-02 di kanan bawah: kotor sepanjang tahun tanpa lonjakan musim. Sumbernya lalu lintas dan industri, bukan asap.",
      "Musim 0,78 vs cuaca lokal ≤ 0,08: siaga cukup mengikuti kalender musim, tidak perlu menunggu prakiraan cuaca."] },
  dampak: {
    inti: "Berapa pasien bertambah, siapa paling rentan, kapan mereka datang, dan RS mana yang paling tertekan.",
    items: { ...COMMON,
      "Kurva Risiko Rawat Inap": ["Kurva risiko", "Risiko rawat inap dibanding hari dengan PM2.5 15 µg/m³. Pita merah muda = hari lolos baku. Geser Skenario batas untuk menghitung ulang kasus berlebih."],
      "Kapan Pasien Datang": ["Waktu kedatangan", "Admisi sebelum dan sesudah lonjakan PM2.5 (H0). Di atas 1× berarti lebih tinggi dari minggu sebelumnya."],
      "Kerentanan per Penyakit": ["Kerentanan", "Kenaikan kasus bila PM2.5 naik dua kali lipat, per penyakit."],
      "Tekanan Rumah Sakit": ["Tekanan RS", "Titik abu = normal, titik merah = puncak 7 hari. Makin panjang garis, makin besar lonjakan."],
      "Kasus Berlebih per Tahun": ["Per tahun", "Kasus berlebih Januari–Oktober tiap tahun agar sebanding. Angka merah = perubahan dari tahun sebelumnya."] },
    contoh: [
      "Pada PM2.5 55 µg/m³ risiko rawat inap ISPA balita sudah sekitar 2× hari bersih; pada 150 sekitar 4×.",
      "Garis balita langsung naik di H0, jadi RS harus siap sebelum asap datang, bukan setelah sensor naik.",
      "KTG-02 (RS Tipe C, 150 tempat tidur) mencapai 115 admisi pernapasan per 100 tempat tidur per hari saat puncak asap."] },
  jaringan: {
    inti: "Stasiun mana yang datanya bisa dipercaya, dan mana yang perlu diperbaiki, dipindah, atau ditambah.",
    items: { ...COMMON,
      "Cakupan Stasiun per Provinsi": ["Cakupan", "Warna = status stasiun di provinsi. Bergaris = tanpa stasiun. Titik hitam = stasiun layak, titik merah = tidak layak."],
      'IKU "Baik", PM2.5 Buruk': ["IKU vs PM2.5", "Stasiun yang IKU-nya tergolong baik (≥ 75) padahal PM2.5 sering di atas 55."],
      "Rencana Aksi Jaringan": ["Rencana aksi", "Urutan aksi: perbaiki data, relokasi, lalu tambah stasiun."],
      "Kelayakan Data per Stasiun": ["Kelayakan data", "% jam valid, 10 stasiun terendah. Garis kuning = batas layak 85%."] },
    contoh: [
      "JMB-02 Muaro Jambi hanya 0,5% data valid, padahal baseline wilayahnya tertinggi (68,9 µg/m³).",
      "KTG-02 punya IKU 75 (baik) padahal 96 hari di atas baku 55 pada 2025, karena IKU hanya membaca SO2 dan NO2.",
      "13 provinsi bergaris di peta tidak punya stasiun sama sekali: bebannya tidak terlihat dalam perencanaan."] },
};

/** Panduan Tanya Data: penanda pada screenshot panel chat. */
export const TANYA_ITEMS: Record<string, [string, string]> = {
  hist: ["Percakapan & riwayat", "Mulai percakapan baru atau buka percakapan lama. Riwayat tersimpan beserta grafik dan waktunya."],
  q: ["Pertanyaan Anda", "Tulis dengan bahasa sehari-hari. Sebut wilayah, periode, atau kelompok bila perlu."],
  ans: ["Jawaban", "Kalimat pertama berisi jawaban, diikuti angka pendukung. Baris \"angka ditelusuri\" menunjukkan berapa angka yang cocok dengan hasil kueri."],
  chart: ["Grafik otomatis", "Dibuat dari hasil kueri ke datamart, bukan digambar oleh AI."],
  sug: ["Contoh pertanyaan", "Klik untuk langsung bertanya."],
  input: ["Kolom tanya", "Ketik pertanyaan lalu tekan Enter atau Kirim."],
};

export const TERMS: [string, string][] = [
  ["PM2.5", "Partikel udara berdiameter di bawah 2,5 mikrometer. Cukup kecil untuk masuk ke paru-paru dan aliran darah."],
  ["PM10", "Partikel di bawah 10 mikrometer. Rasio PM2.5/PM10 tinggi menandakan asap pembakaran."],
  ["µg/m³", "Mikrogram per meter kubik udara, satuan konsentrasi polutan."],
  ["Baku mutu 55", "Batas PM2.5 rata-rata 24 jam menurut PP 22/2021. Tahunan: 15 µg/m³."],
  ["Pedoman WHO 15", "Batas PM2.5 harian WHO 2021 (tahunan 5 µg/m³)."],
  ["Ambang 25", "Level PM2.5 harian saat rawat inap mulai naik di data ini. Setara target antara WHO (IT-4)."],
  ["ISPU", "Indeks Standar Pencemar Udara (Permen LHK 14/2020): Baik, Sedang, Tidak Sehat, Sangat Tidak Sehat, Berbahaya."],
  ["IKU", "Indeks Kualitas Udara (Permen LHK 27/2021), dihitung hanya dari SO2 dan NO2."],
  ["ISPA", "Infeksi saluran pernapasan akut. Dashboard memakai rawat inap ISPA balita (di bawah 5 tahun) dan lansia (di atas 60 tahun)."],
  ["PPOK", "Penyakit paru obstruktif kronik."],
  ["Kasus berlebih", "Selisih rawat inap prediksi model pada PM2.5 aktual dengan rawat inap bila PM2.5 dibatasi di nilai acuan."],
  ["Porsi terkait PM2.5", "Kasus berlebih dibagi seluruh rawat inap pada kelompok yang sama."],
  ["Hari valid", "Hari dengan minimal 18 dari 24 jam data VALID (aturan 75% US EPA)."],
  ["Hari melebihi baku", "Hari valid dengan rata-rata PM2.5 di atas 55 µg/m³."],
  ["Musim asap", "Agustus–Oktober, saat PM2.5 di wilayah gambut melonjak."],
  ["Tipe wilayah", "Pengelompokan stasiun dengan k-means berdasarkan perilaku data: Kronis perkotaan, Gambut bereskalasi, Kalteng ekstrem, Latar bersih."],
  ["Lonjakan musim asap", "Rata-rata Agu–Okt dibagi rata-rata Jan–Jun."],
  ["Eskalasi", "Rata-rata Agu–Okt 2026 dibagi Agu–Okt 2024."],
  ["Tekanan RS", "Admisi pernapasan per 100 tempat tidur per hari."],
  ["Capture rate", "Persentase jam data valid dari seluruh jam periode."],
  ["Stasiun layak", "Capture rate ≥ 85% dan tidak terdeteksi macet."],
  ["Sensor macet", "Nilai PM2.5 identik ≥ 6 jam berturut-turut walau berlabel VALID."],
  ["Tanya Data", "Asisten AI yang menjawab pertanyaan dari datamart SIAGA NAPAS, lengkap dengan grafik. Setiap angka ditelusuri ke tabel sumber."],
];

export const QA: [string, string, string][] = [
  ["1. Kondisi udara antar stasiun dan pulau, dibanding baku mutu, tren membaik atau memburuk", "01 Ringkasan, 02 Waktu & Wilayah", "22 dari 26 stasiun di atas baku tahunan 15. Memburuk: PM2.5 nasional Jan–Okt naik 33% dari 2024 ke 2026, seluruhnya dari musim asap."],
  ["2. Waktu dan wilayah paling kritis: jam, hari kerja vs akhir pekan, musim, asap gambut", "02 Waktu & Wilayah", "Agu–Okt di wilayah gambut, puncak jam 07–09, tidak ada efek akhir pekan. Kalteng Okt 2026 rata-rata 867 µg/m³."],
  ["3. Faktor yang memengaruhi: suhu, kelembapan, angin, lalu lintas, jarak jalan, tipe lokasi", "03 Pemicu Polusi", "Musim × gambut menentukan lonjakan; lalu lintas dan jarak jalan menentukan level kota; cuaca lokal kecil pengaruhnya."],
  ["4. Dampak kesehatan, efek jeda, balita vs lansia", "04 Dampak Kesehatan", "Efek mulai 25 µg/m³, respons di hari yang sama, balita dan lansia setara (+57% vs +55% per PM2.5 berlipat dua)."],
  ["5. Kecukupan jaringan dan wilayah prioritas", "05 Jaringan Pemantau", "5 stasiun tidak layak, 1 pasang kembar, 13 provinsi tanpa stasiun."],
  ["6. Dashboard interaktif dan komunikatif", "Seluruh dashboard", "Filter global, peta interaktif, slider skenario, tooltip, poin kunci yang bisa diklik, Tanya Data."],
];

export const FILTERS: [string, string, string][] = [
  ["Tahun", "Dropdown, centang satu atau beberapa tahun, atau Pilih semua", "Membandingkan perbaikan atau pemburukan antar tahun (tujuan 1) dan menyusun laporan tahunan. KPI otomatis membandingkan tahun terakhir dengan tahun terawal pada bulan yang sama."],
  ["Bulan", "Dropdown dengan pintasan Musim asap / Luar musim", "Surveilans bekerja per periode siaga. Pintasan musim asap (Agu–Okt) langsung menampilkan beban saat karhutla."],
  ["Pulau", "Dropdown, centang pulau", "Booklet meminta perbandingan antar pulau, dan koordinasi Dinkes berjalan per wilayah."],
  ["Tipe wilayah", "Dropdown, centang tipe hasil k-means", "Kebijakan berbeda per akar masalah: lalu lintas untuk wilayah kronis, karhutla untuk wilayah gambut."],
  ["Acuan PM2.5", "Dropdown satu pilihan: 55, 25, atau 15", "Simulasi kebijakan: berapa kasus yang hilang bila udara ditekan ke baku nasional, ambang data, atau pedoman WHO."],
  ["Kelompok rentan", "Dua tombol centang: Balita, Lansia", "Program berbeda per kelompok (posyandu vs layanan lansia); tujuan 4 meminta perbandingan keduanya."],
];
