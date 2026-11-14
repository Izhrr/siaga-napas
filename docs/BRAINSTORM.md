# Brainstorm: narasi, halaman, dan fitur (v2, keputusan user 14 Nov 2026)

Dasar: `docs/EDA.md`. Rubrik: dashboard 70 (kualitas informasi 25, visualisasi 20, fungsionalitas & interaktivitas 25), laporan 30.

## 1. Satu kalimat dashboard
> **"Sepertiga pasien ISPA balita dan lansia di 25 RS rujukan berasosiasi dengan PM2.5 di atas 25 µg/m³, dan lebih dari sepertiganya terjadi di hari yang menurut baku mutu masih aman."**

Narasi tema "From Roots to Clarity": **akar** (dari mana polusi datang dan kapan) → **dampak** (berapa pasien) → **kejelasan** (apa yang harus dilakukan, dan seberapa bisa dipercaya datanya).

## 2. User
- **Primer:** Tim Kerja Penyehatan Udara / surveilans kesehatan lingkungan (Kemenkes, turun ke Dinkes Provinsi). Keputusan: kapan dan di mana siaga, RS mana disiapkan, target baku mutu apa yang diusulkan.
- **Sekunder:** KLH/DLH (jaringan pemantauan, pengendalian sumber).

## 3. Lima pesan inti (urutan cerita)
1. **Dua wajah polusi:** kronis (kota, lalu lintas, sepanjang tahun) vs episodik (gambut, Agu–Okt). ML k-means 4 arketipe.
2. **Asap makin parah tiap tahun**, udara di luar musim tidak berubah. 2026 terburuk (KTG 867 µg/m³).
3. **Pasien naik mulai 25 µg/m³, di hari yang sama.** 36% kelebihan kasus di hari "legal". Baku 55 hanya mencegah 29% beban.
4. **Beban terbesar justru di Jakarta (kronis)**; lonjakan per tempat tidur terbesar di RS kecil wilayah gambut (PKN-01 10,5×, KTG-02 Tipe C 115/100 TT).
5. **Jaringan tidak bisa dipercaya penuh:** 5 stasiun bermasalah, 1 pasang kembar, IKU buta PM2.5.

## 4. Halaman (5 + dokumentasi + chatbot)
| # | Halaman | Pertanyaan | Visual utama (pilihan chart mengikuti Datawrapper: mulai dari pesan) | Tujuan booklet |
|---|---|---|---|---|
| 1 | **Ringkasan** | Seberapa besar masalahnya, di mana, apa yang dilakukan? | KPI (kasus berlebih, % beban, hari > baku, stasiun andal), peta 27 titik (warna = arketipe, ukuran = beban), panel "Catatan" bernomor (dinamis per filter), strip aksi | semua |
| 2 | **Waktu & Wilayah** | Kapan & di mana paling kritis? | heatmap stasiun × bulan (34 bulan), arrow plot musim asap 2024→2026, profil jam (lokal), tangga baku mutu vs WHO | T1, T2 |
| 3 | **Pemicu** | Kenapa? | scatter arketipe (level kronis × pengali asap, warna klaster ML), scatter lalu lintas vs PM off-season, bar faktor (permutation importance), wind rose stasiun terpilih | T3 |
| 4 | **Dampak Kesehatan** | Berapa pasien, siapa paling rentan, kapan datang? | kurva dosis-respons dengan pita 25/55, bar kasus berlebih per pita PM (36% legal), event study H−7..H+7, tekanan RS per 100 TT, slider skenario baku mutu (15/25/37,5/55) | T4 |
| 5 | **Jaringan & Kepercayaan Data** | Data mana bisa dipercaya, stasiun mana diperbaiki/dipindah/ditambah? | dot plot capture rate + status, pasangan redundan, jarak tetangga terdekat, IKU vs hari > baku, daftar aksi (perbaiki / relokasi / tambah) | T5 |
| — | Panduan (modal + halaman) | cara membaca, metodologi, kamus metrik | pola dokumentasi Paragon | — |
| — | Tanya Data (chatbot, drawer) | pertanyaan bebas → jawaban + artefak grafik JSON | pola Egypt | — |

## 5. Interaktivitas (rubrik 25 poin)
- Filter global tersimpan antarhalaman: periode/tahun, arketipe/region, kelompok (balita/lansia/semua), **acuan baku mutu (55 / 25 / 15)** yang mengubah KPI, warna, dan teks insight.
- Klik stasiun di peta/heatmap → cross-filter + panel profil stasiun.
- Slider skenario → angka kasus berlebih beranimasi (count-up).
- Insight hard-coded berbasis template per filter (tanpa LLM).
- Tooltip "artinya apa" di setiap KPI; tombol Panduan selalu terlihat.
- Satu layar desktop (1440×900 / 1920×1080), tanpa scroll halaman.

## 6. ML (tidak berlebihan)
Dipakai: Poisson GLM + spline (dosis-respons, beban), k-means (arketipe), rule-based anomaly (sensor macet), GBM importance (bukti pemicu). Tidak dipakai: forecasting (data tangga bulanan, akan menyesatkan), DLNM (respons di H0).

## 7. Keputusan (dijawab user)
- **Nama:** JERNIH, *Jejak Emisi, Risiko Napas, dan Imbas Hospitalisasi* (selaras tema "Clarity").
- **Antislop:** mode DURING.
- **User primer:** surveilans kesehatan lingkungan (disetujui).
- **Tema:** terang + toggle gelap.
- **Logo & palet:** menyusul dari user ke `assets/brand/` (lihat README di sana). Sementara placeholder `[LOGO]`, navy `#1D2B4C` + emas `#D9A21B`.
- **Timeline:** user menyatakan aman, lanjut tanpa mengikuti tanggal guidebook.

## 8. Layout mock
`mockup/jernih-layout.html` (+ `mockup/data.js` dari `analysis/05_export_mock.py`). Angka asli dari EDA v1.
Sistem visual: rail navy bernomor 01–05, kanvas krem, kartu putih radius 14, KPI hero gelap, kolom "Catatan" bernomor (motif identitas), garis emas = ambang 25 dan garis putus-putus = baku 55 di setiap grafik PM2.5.
Font Plus Jakarta Sans (alasan: tipe buatan desainer Indonesia untuk identitas Jakarta, cocok untuk produk publik Indonesia). Warna arketipe divalidasi skrip dataviz (all-pairs, light PASS; dark CVD 7,4 → wajib bentuk berbeda per arketipe).
