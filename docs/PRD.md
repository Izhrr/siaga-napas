# PRD · SIAGA NAPAS

## 1. Masalah
Data udara dan data rumah sakit tidak pernah disatukan dalam satu alur keputusan. Baku mutu harian (55 µg/m³) menilai hari "aman", padahal di data ini rawat inap ISPA sudah naik sejak 25 µg/m³. Asap gambut makin parah tiap tahun, beban kronis kota tidak terlihat, dan sebagian stasiun pemantau tidak bisa dipercaya.

## 2. Pengguna
| Peran | Keputusan | Frekuensi |
|---|---|---|
| **Primer:** tim surveilans kesehatan lingkungan (Kemenkes, Dinkes provinsi) | kapan & di mana siaga, RS mana disiapkan, ambang imbauan | bulanan; harian Juli–Oktober |
| Sekunder: KLH/DLH | stasiun mana diperbaiki, dipindah, ditambah; pengendalian sumber | kuartalan / tahunan |
| Juri lomba | memahami inti dalam 10 detik, menilai rubrik | sekali |

## 3. Tujuan & ukuran keberhasilan
| Tujuan | Ukuran |
|---|---|
| Inti terbaca dalam 10 detik | Temuan Kritis + 5 KPI + kolom Poin Kunci di atas lipatan, satu layar tanpa scroll (1366–1920 px) |
| Menjawab 6 tujuan booklet | tabel pemetaan di Panduan; setiap tujuan punya halaman |
| Value creation | kasus berlebih, skenario baku mutu, kalender siaga, daftar aksi jaringan |
| Interaktif & mudah dipakai | filter global (tahun, bulan, pulau, tipe wilayah, acuan, kelompok), peta yang bisa diklik, slider skenario, tooltip, poin kunci dengan detail, Tanya Data |
| Dapat dipercaya | aturan QC terdokumentasi, angka chatbot ditelusuri ke tabel |

Rubrik panitia: dashboard 70 (kualitas informasi 25, visualisasi 20, fungsionalitas 25) + laporan 30.

## 4. Ruang lingkup v1
- 5 halaman: 01 Ringkasan, 02 Waktu & Wilayah, 03 Pemicu Polusi, 04 Dampak Kesehatan, 05 Jaringan Pemantau.
- Panduan (dokumentasi dalam aplikasi), poin kunci dengan popup detail, mode gelap.
- Tanya Data: chatbot berbasis semantic layer, artefak grafik JSON, riwayat tersimpan (tanpa login).
- Data diperbarui bulanan lewat pipeline Python.

**Di luar lingkup v1:** login & riwayat per pengguna, peringatan otomatis (email/WA), prakiraan PM2.5, data eksternal (dilarang aturan lomba).

## 5. Persyaratan fungsional
| ID | Persyaratan |
|---|---|
| F1 | Filter global berlaku di semua halaman dan bertahan saat pindah halaman |
| F2 | Filter ≥ 3 opsi berupa dropdown multi-pilih dengan "Pilih semua"; 2 opsi berupa tombol centang |
| F3 | Acuan PM2.5 (55/25/15) mengubah KPI, peta, insight, dan poin kunci |
| F4 | Peta choropleth provinsi; provinsi tanpa stasiun bergaris; klik provinsi membuka profil |
| F5 | Setiap grafik punya tombol i (cara membaca), tooltip, dan strip Insight dinamis |
| F6 | Poin Kunci & Aksi di kolom kanan; klik membuka temuan, rekomendasi, pelaksana |
| F7 | Tanya Data menjawab dengan angka dari datamart dan grafik; menolak pertanyaan di luar cakupan |
| F8 | Setiap tampilan data punya status memuat, kosong, dan galat |

## 6. Persyaratan non-fungsional
- Satu layar desktop tanpa scroll; tata letak tumpuk di ponsel (< 900 px), tanpa overflow horizontal.
- WCAG AA: kontras, navigasi keyboard, fokus terlihat, `prefers-reduced-motion`.
- Kunci API hanya di server; LLM tidak pernah menulis SQL.

## 7. Batasan & asumsi
Data sintetis; angka ditulis sebagai asosiasi. Tanpa data populasi, beban tidak dinyatakan per kapita. Basemap provinsi (BAKOSURTANAL) hanya latar visual.
