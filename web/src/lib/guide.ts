/* Documentation content (Panduan): case background, why PM2.5, booklet questions, users, filters and their rationale,
   per-page how-to-read, glossary, data & method. */
import type { PageKey } from "./types";

export const GUIDE_PAGES: Record<PageKey, [string, string[]]> = {
  ringkasan: ["Seberapa besar beban kesehatan akibat udara kotor, di mana, dan apa yang harus dilakukan.", ["Baca Temuan Kritis di bawah judul.", "Mulai dari kolom Poin Kunci & Aksi di kanan; klik poin untuk detail.", "KPI: jumlah kasus berlebih, porsi pasien, dan yang tercegah bila patuh baku 55.", "Peta: ganti metrik di header peta, klik provinsi untuk profil.", "Tren: merah tua = musim asap."]],
  waktu: ["Kapan dan di mana pencemaran paling kritis.", ["Kalender: cari blok gelap Agu–Okt yang berulang.", "Pola musiman: garis 2026 di atas batang = tahun ini lebih buruk.", "Musim asap per tahun: batang naik = eskalasi.", "Pola jam: kapan imbauan paling efektif."]],
  pemicu: ["Faktor yang menentukan level dan lonjakan PM2.5.", ["Peta tipe wilayah: kanan = kronis, atas = musiman.", "Lalu lintas: titik naik ke kanan = makin padat makin kotor.", "Faktor: musim dan lokasi jauh di atas cuaca lokal.", "Arah angin: pilih stasiun di header kartu."]],
  dampak: ["Berapa pasien bertambah, siapa paling rentan, dan kapan mereka datang.", ["Kurva: geser slider skenario batas.", "Kapan pasien datang: lonjakan di H0.", "Kerentanan: balita dan lansia setara.", "Tekanan RS: RS kecil di wilayah gambut paling tertekan."]],
  jaringan: ["Data mana yang bisa dipercaya, dan stasiun mana diperbaiki, dipindah, atau ditambah.", ["Peta cakupan: bergaris = tanpa stasiun.", "Kelayakan: merah = di bawah 85% atau macet.", "IKU: indeks resmi tidak membaca PM2.5.", "Rencana aksi: urutan prioritas."]],
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
  ["Tanya Data", "Asisten AI yang menjawab pertanyaan dari datamart JERNIH, lengkap dengan grafik. Setiap angka ditelusuri ke tabel sumber."],
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
