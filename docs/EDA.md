# EDA — Gelar Rasa 2026 (Dashboard Analysis)

> Dokumen konteks hasil eksplorasi data. Semua angka berasal dari dataset panitia (tanpa data eksternal).
> Kode: `analysis/00_profile_raw.py` → `01_clean.py` → `02_daily.py` → `03_health_model.py` → `04_network_cluster.py`.
> Output: `analysis/out/`. Tanggal analisis: 14 Nov 2026.

---

## 0. Ringkasan 10 detik

1. **Sepertiga rawat inap ISPA balita (33%) dan lansia (31%) berasosiasi dengan PM2.5 di atas 25 µg/m³.** Total ±56 ribu kasus balita dan ±65 ribu kasus lansia di 25 RS (Jan 2024–Okt 2026).
2. **Baku mutu harian 55 µg/m³ terlalu longgar.** Lonjakan pasien mulai di ~25 µg/m³. **36% kelebihan kasus terjadi di hari yang secara regulasi "aman"** (25–55). Patuh baku mutu nasional hanya mencegah ±29% beban.
3. **Dua wajah polusi.** *Kronis* (Jakarta, Medan, Yogya: tinggi sepanjang tahun, digerakkan lalu lintas) vs *episodik* (gambut Sumatra–Kalimantan: Agustus–Oktober, **makin parah tiap tahun**). Beban kasus terbesar justru di Jakarta (kronis), bukan di episode asap yang lebih sering jadi berita.
4. **Asap 2026 terburuk.** Rata-rata nasional Jan–Okt 35,3 → 39,8 → 47,1 µg/m³ (+33% dalam 2 tahun), seluruhnya dari musim asap. Palangka Raya/Sampit Okt 2026: rata-rata bulanan **867 µg/m³** (ISPU Berbahaya).
5. **Pasien datang di hari yang sama.** Admisi melonjak di hari ke-0 (bukan H+2). Peringatan dini harus mengantisipasi **musim**, bukan menunggu sensor.
6. **Jaringan pantau tidak bisa dipercaya penuh.** 5 dari 27 stasiun bermasalah serius (JMB-02 0,5% valid, MER-01 20%, MDN-01 68%, BJB-01 70%, PLB-01 80%). BJB-01 **macet 9 bulan tapi berlabel VALID**. KTG-01 dan KTG-02 (112 km) **identik** (r = 1,000). IKU memberi skor "baik" (≥ 78) ke stasiun dengan 84–92 hari di atas baku mutu.

---

## 1. Inventaris data

| Kelompok | File | Grain asli | Baris |
|---|---|---|---|
| Udara | 27 × `*_AQMS.csv` | stasiun × jam (nominal) | 676.967 raw |
| Kesehatan | `HLT-01_health_outcomes_daily.csv` | RS × hari | 27.491 (27 RS × 1.018–1.019 hari, 31 Des 2023–14 Okt 2026) |
| Master | `sites.csv`, `sensors.csv`, `hospitals.csv` | 27 baris | — |
| Metadata | `metadata_sensors.csv`, `metadata_dates.csv` | spesifikasi / periode | — |

**Relasi:** `sensor_id SENS-0NN` ↔ `location_id LOC-XXX-NN` ↔ `hospital_id RS-XXX-NN` (1:1:1, indeks NN sama; sesuai booklet). Mapping divalidasi: suhu harian RS = rata-rata suhu stasiun (selisih rata-rata 0,00 °C, r 0,6–0,96).

---

## 2. GRAIN & datamart (keputusan)

| Layer | Tabel | Grain | Isi | Dipakai untuk |
|---|---|---|---|---|
| Bronze | `raw_hourly.parquet` | baris file | apa adanya + kolom `n_err_strings` | audit |
| Silver | `hourly_clean.parquet` | **stasiun × jam (grid penuh)** 659.664 baris | µg/m³ seragam, `ts_wib`, `ts_local`, `qc_flag` (+ABSENT, STUCK), `valid` | profil diurnal, wind rose, DQ |
| **Gold (inti)** | `fact_station_day.parquet` | **stasiun-RS × tanggal lokal** 27.491 baris | rata-rata 24 jam, maks 8 jam CO/O3, ISPU + parameter kritis, `n_valid_h`, `day_valid`, `exceed_55` + 7 outcome + cuaca RS | semua analisis kesehatan, tren, kalender |
| Gold | `dim_station.csv` | stasiun | sites + sensors + hospitals | filter, peta |
| Gold | `attributable.parquet` | stasiun × hari × outcome × skenario C₀ | kasus berlebih (excess) | KPI beban, slider skenario |
| Gold | `exposure_response.csv` | outcome × level PM2.5 | RR relatif ke 15 µg/m³ | kurva dosis-respons |
| Gold | `station_archetype.csv`, `station_pairs.csv`, `station_distance_km.csv` | stasiun / pasangan | klaster ML, redundansi, jarak | halaman jaringan |
| Gold | `dq_log.csv` | stasiun × aturan | jumlah baris terdampak | dokumentasi & laporan |

**Grain utama dashboard = stasiun-RS × hari**, karena pada grain inilah udara dan kesehatan bertemu 1:1. Agregat bulanan/tahunan/stasiun diturunkan dari sini (pre-aggregate ke JSON untuk web).

---

## 3. Data quality: temuan & aturan preprocessing

| # | Temuan | Stasiun | Aturan |
|---|---|---|---|
| R0 | String error di sel angka: `0xDEADBEEF`, `ERR_COMM_TIMEOUT`, `#VALUE!`, `BAD_CHECKSUM`, `VOLT_SURGE_99V`, `ADC_SAT_FAIL`, `TAPE_TEAR_CRITICAL` (8.986 baris); sentinel −999, −273,2, 999,9, −99 | JMB-02 | ubah ke NaN, catat |
| R1 | 132 baris bertimestamp 1970 (epoch) | JMB-02 | buang |
| R2 | *Clock drift* detik–menit (mis. SRG +11m22s, BTM −11m45s) di 17 stasiun | 17 stasiun | bulatkan ke jam terdekat |
| R3 | Jendela 15 menit (15.933 baris) | PLB-01 (+92 JMB-02) | rata-rata 4 kuartal → jam; 3.940 jam berhasil direkonstruksi |
| R4 | Header `_ppm`: PM ternyata **mg/m³** (×1000 cocok dengan `baseline_pm25`); gas = ppm sungguhan (× BM×1000/24,45 → cocok dengan stasiun template) | MDN-01, PSW-01, BJB-01 | konversi |
| R5 | `qc_flag` ≠ VALID: CALIBRATING, SUSPECT, MAINTENANCE, WARMUP, MISSING, COMM_LOST, CORRUPT, FATAL_ERR, GARBAGE, PARSER_FAIL, SENSOR_DEAD | semua | hanya VALID untuk metrik |
| R6 | Nilai di luar batas fisik (negatif, PM2.5 > 1500, RH > 100, dst.) | JMB-02, MER-01 (PM2.5 negatif) | NaN |
| R7 | Jam hilang dari file (MDN-01 3.632 jam = 5 bulan) | MDN-01, JMB-02, PLB-01 | reindex grid → ABSENT |
| **R8** | **Sensor macet berlabel VALID:** BJB-01 terkunci di 336,7 µg/m³ (Sep 2024–Mar 2025) lalu 3,5 (Apr–Jun 2025), total 7.329 jam | BJB-01 | ≥ 6 jam nilai PM2.5 identik → STUCK |
| R9 | Hari valid = ≥ 18 jam valid (75%, US EPA 40 CFR 50 App. N). Hari tak lengkap tetap dihitung *exceedance* bila rata-rata jam tersedia (≥ 6 jam) > 55 | semua | `day_valid`, `exceed_55` |
| R10 | Zona waktu: data WIB; profil diurnal pakai jam lokal (WITA +1: MRS, PLU, SM2, BJB; WIT +2: SRG, MER). Bukti: puncak jam sibuk MRS/SRG muncul 1 jam lebih awal di WIB | 6 stasiun | `ts_local` |

**Hasil:** 583.835 dari 659.664 jam grid valid (88,5%); 23.928 dari 27.491 hari valid (87%).

**Catatan master data:** `region_group` tidak konsisten (JMB-02 = "Sumatera", MER-01 = "Papua"). Booklet menyebut kapasitas TT bisa kosong, tetapi di `hospitals.csv` terisi semua. Booklet mencontohkan provinsi Gambir "D.I. Yogyakarta", tetapi file sudah "DKI Jakarta". `status_operasional`: JMB-02 Defective; PLB-01, MER-01, MDN-01 Intermittent (konsisten dengan temuan DQ).

**Capture rate jam VALID:** JMB-02 0,5% · MER-01 20,0% · MDN-01 68,1% · BJB-01 70,0% · PLB-01 79,5% · SM2-01 85,0% · lainnya 96–99,5%.

---

## 4. Temuan per tujuan booklet

### T1. Kondisi kualitas udara (waktu & ruang)
- 2025 (tahun penuh): **22 dari 26 stasiun melebihi baku tahunan 15 µg/m³**. Rasio terhadap WHO 5: dari 1,8× (IDP-01) sampai 14,6× (PLB-01).
- Rata-rata nasional Jan–Okt: **35,3 (2024) → 39,8 (2025) → 47,1 (2026)**.
- **Di luar musim asap, udara tidak berubah** (off-season Jan–Jun identik tiap tahun di hampir semua stasiun). Pemburukan 100% datang dari musim asap. Pengecualian: SM2-01 Samarinda, baseline naik 33 → 43 → 53 (+60%), konsisten dengan tambang/deforestasi.
- Kenaikan 2024→2026 (Jan–Okt): KTG-01/02 **+277%**, PKN-01 +66%, STG-01 +52%, KTB-01 +45%, PLB-01 +32%, JMB-01 +28%, PKU-01 +26%. Jakarta 0%.
- Kategori ISPU 2026: 1,4% stasiun-hari **Berbahaya** (0% di 2024–2025), 1,2% Sangat Tidak Sehat.
- Peringkat rata-rata PM2.5 (2024–26): BJB-01 tampak tertinggi (102) **hanya karena sensor macet**; setelah dibersihkan, tertinggi PLB-01, SM2-01, KTG-01/02, JKT-02.

### T2. Waktu & wilayah paling kritis
- **Musim:** stasiun gambut punya episode **1 Agustus–31 Oktober** (KTG: Juli–Oktober, puncak Sep–Okt; SM2: Juli–Oktober). Episode berbentuk tangga (naik tiap 1 Agustus). Urban: punuk kering ringan Jul–Okt (+12%).
- **Jam (lokal):** puncak pagi **07–09** (1,2–1,5× rata-rata harian), puncak sore 17–19, terendah 12–14. Amplitudo terbesar: IDP-01 (4,6×, puncak 05.00), MDN-01, YKY-01. KTG tanpa pola harian saat asap (asap menutupi seluruh hari).
- **Hari kerja vs akhir pekan:** **praktis tidak berbeda** (±0,5%). Pengecualian YKY-01 +4% di akhir pekan (wisata). Implikasi: kebijakan berbasis hari (WFH, ganjil-genap akhir pekan) tidak akan terasa pada PM2.5.
- **Wilayah:** episode terparah 2026: KTG-01/02 (44 hari ISPU ≥ 201), PLB-01 (49 hari), SM2-01 (21 hari). Kronis: JKT-02 Marunda **> 55 setiap hari (365/365)**.

### T3. Faktor pemicu
- **Penentu level kronis (off-season) = lalu lintas.** Antarstasiun: Spearman ρ(PM2.5 off-season, traffic/jam) = **0,76** (p < 0,001); ρ(jarak ke jalan) = **−0,65** (p < 0,001). Anomali: BGR-02 (2.400 kendaraan/jam, PM 19), konsisten dengan "kota hujan" (pencucian oleh hujan).
- **Penentu variasi harian = musim × lokasi gambut.** Model gradient boosting (HistGBR, CV per stasiun): permutation importance **bulan 0,78 ≫ jarak jalan 0,59 > traffic 0,14 > gambut 0,11 > cuaca lokal ≤ 0,08**. Cuaca lokal (suhu, RH, angin) hampir tidak menjelaskan PM2.5 setelah musim dikontrol (|ρ| ≤ 0,3, tanda tidak konsisten).
- **Arah angin** relevan di beberapa stasiun: PLB-01 angin tenggara/selatan 71–73 µg/m³ vs barat laut 33 (asap dari arah rawa gambut); PKU-01 barat laut 58 vs utara 23.
- **Rasio PM2.5/PM10** = penanda asap halus: KTG 0,81 vs urban 0,64.
- SM2-01: PM2.5 berkorelasi kuat dengan CO (0,70) dan SO2 (0,70) → pembakaran + batu bara.
- **IKU buta PM2.5:** IKU (Permen LHK 27/2021, hanya SO2 + NO2) memberi skor 78–82 ("baik") ke PLB-01, PKN-01, PKU-01, BTM-01, JMB-01, STG-01 yang punya 84–92 hari > 55 µg/m³ di 2025. Hanya Jakarta yang IKU-nya buruk (18–39).

### T4. Dampak kesehatan & kerentanan
- **Bentuk dosis-respons (binned, relatif ke 20% hari terbersih tiap stasiun):** ≤ 25 µg/m³ tidak ada kelebihan; 25–37,5 → +13%; 37,5–55 → +28%; 55–75 → +46%; 75–100 → ×2,4; 100–150 → ×4,2; > 500 → ×7. **Ambang efek di data ≈ 25 µg/m³** (= WHO IT-4 harian), jauh di bawah baku nasional 55.
- **Model:** Poisson GLM, efek tetap stasiun + spline kubik natural log(PM2.5) + hari + suhu + tahun. Log-linear lebih cocok daripada linear (deviance 17,3 rb vs 28,8 rb untuk balita). **Setiap PM2.5 berlipat dua → admisi ISPA balita +57%, lansia +55%, PPOK +60%, asma +55%, kardiovaskular +32%, kematian +41%.**
- **CVD & kematian** hanya melonjak tajam pada asap ekstrem (> 250 µg/m³: ×8).
- **Jeda waktu (event study, 49 kenaikan & 25 penurunan tajam PM2.5):** admisi naik **di hari yang sama** (×1,75–1,84 di H0, ±85% efek), puncak ×2,0 di H+2, dan turun di hari yang sama saat asap hilang. Korelasi lag mentah datar di semua lag (termasuk lead) karena musim → wajib dikontrol.
- **Balita vs lansia:** efek relatif **setara** (rasio slope 1,05). Kelebihan kasus absolut lansia sedikit lebih besar (+15,9 vs +14,2 kasus/hari/RS pada 100–150 µg/m³). Tanpa data populasi, rate per kapita tidak bisa dihitung.
- **Beban teratribusi (C₀ = 25):** ISPA balita **56.354 (33%)**, ISPA lansia **64.883 (31%)**, asma 35.270 (32%), PPOK 32.427 (32%), CVD 20.054 (11%), kematian 7.625 (16%). Per tahun (balita): 16,1 rb (2024) → 20,1 rb (2025) → 20,2 rb (2026, baru s.d. Oktober).
- **36% kelebihan kasus terjadi di hari "legal" (25–55 µg/m³).** Skenario C₀ = 55 hanya mencegah 16.215 kasus balita (29% dari 56 rb).
- **Peringkat beban balita:** JKT-02 7,2 rb · JKT-03 6,2 rb · JKT-01 5,2 rb · PLB-01 4,8 rb · PSW-01 4,1 rb · KTG-01 3,8 rb · KTG-02 3,7 rb.
- **Tekanan RS (admisi pernapasan per 100 TT per hari, puncak 7 hari):** KTG-02 Sampit (Tipe C) **115** (5,1× normal), PKN-01 104 (**10,5×** normal), KTG-01 75, STG-01 56, PLB-01 53. Jakarta stabil 21–26 (tinggi tapi datar). RS Tipe A (MDN-01, SM2-01) longgar (< 4).
- **Bukti lintas-stasiun untuk beban kronis:** di luar musim, Jakarta 17–22 admisi/100 TT/hari vs stasiun bersih 8–11 (±2×).

### T5. Kecukupan jaringan
- **Reliabilitas:** 5 stasiun tidak layak jadi dasar keputusan tanpa perbaikan (JMB-02, MER-01, MDN-01, BJB-01, PLB-01). Ironis: **JMB-02 Muaro Jambi punya baseline tertinggi (68,9 µg/m³) tapi 99,5% datanya rusak**, dan admisi RS-nya tidak mengikuti asap stasiun tetangga (JMB-01, 1 km; ρ = −0,25) → wilayah buta.
- **Redundansi:** KTG-01 ↔ KTG-02 (112 km) r = 1,000, beda rata-rata 0,96 µg/m³ → satu unit bisa direlokasi. JMB-01 ↔ JMB-02 hanya 1 km. JKT-01/02/03 (11–26 km) r = 0,93 tapi level berbeda 6–12 µg/m³ → masih informatif. BGR-01 ↔ BGR-02 (18 km) r ≈ 0, level berbeda.
- **Celah jarak:** tetangga terdekat SRG-01 1.239 km, MER-01 1.319 km (Papua; MER pun hanya 20% valid). Sulawesi hanya 2 stasiun (MRS-01, PLU-01; 378 km). IDP-01 ↔ MDN-01 425 km.
- **Korelasi antarstasiun gambut turun dengan jarak:** r = 1,00 (112 km), 0,75 (143–254 km), 0,52 (175–235 km) → satu stasiun mewakili radius ±150 km untuk episode asap.
- **QC pipeline perlu aturan flatline:** flag alat meloloskan 9 bulan data macet (BJB-01).

---

## 5. Machine learning: dipakai di mana, kenapa

| Teknik | Tujuan | Hasil | Dipakai di dashboard? |
|---|---|---|---|
| **Poisson GLM + spline (supervised, statistik)** | dosis-respons & beban teratribusi | log-linear, ambang ~25, 33% beban | **Ya, inti** (kurva, KPI, slider skenario) |
| **K-means 4 klaster** (fitur: log PM off-season, log pengali musim asap, log eskalasi 2026/2024; silhouette 0,46) | segmentasi stasiun berbasis perilaku, bukan label `site_type` | 0 *Gambut bereskalasi* (KTB, STG, PKN, JMB-01, PKU, BTM, PLB, SM2) · 1 *Latar bersih* (PLU, IDP, BGR-01/02, SRG, BGL) · 2 *Kalteng ekstrem* (KTG-01/02, eskalasi ×7,3) · 3 *Kronis perkotaan* (JKT×3, MDN, YKY, MRS, MLG, PSW, BJB) | **Ya** (peta & scatter "dua wajah polusi"; label `site_type` resmi tidak mencerminkan perilaku, mis. KTG-01 "Urban Background") |
| **Anomaly detection berbasis aturan** (flatline, sentinel, range) | kepercayaan data | BJB-01 macet 9 bulan | **Ya** (halaman jaringan) |
| HistGradientBoosting + permutation importance | faktor pemicu | musim ≫ lokasi > cuaca | Ya, sebagai satu bar chart kecil (bukti, bukan fitur) |
| Forecasting deret waktu | prediksi PM | **Tidak.** Data sintetis berbentuk tangga bulanan, prediksi akan trivial/overfit. Diganti "kalender siaga" berbasis pola musim + eskalasi | — |
| DLNM / distributed lag | jeda | tidak perlu: event study menunjukkan respons H0 | — |

---

## 6. Batasan (untuk laporan)
- Data sintetis: pola sangat teratur (episode berbentuk tangga, cuaca template identik di 11 stasiun). Klaim ditulis "berasosiasi", "dalam data ini".
- Beban teratribusi di Jakarta bergantung pada asumsi kurva pooled (Jakarta hampir tidak pernah < 25). Didukung bukti lintas-stasiun (admisi per TT ±2× stasiun bersih).
- Tanpa data populasi: tidak ada rate per kapita / paparan tertimbang populasi. Denominator = RS dan TT.
- MER-01 dan JMB-02 dikeluarkan dari model kesehatan (tidak ada hari valid).
- Tanpa data hotspot/emisi: sumber dikenali lewat proksi (tipe situs, musim, rasio PM2.5/PM10, CO/SO2, arah angin).

## 7. Kamus metrik
| Metrik | Definisi |
|---|---|
| PM2.5 harian | rata-rata jam VALID pada tanggal lokal; valid bila ≥ 18 jam |
| Hari melebihi baku | hari valid dengan PM2.5 > 55 (PP 22/2021); + hari tak lengkap (≥ 6 jam) dengan rata-rata > 55 |
| ISPU harian | maks sub-indeks PM2.5, PM10, SO2, NO2 (24 jam), CO & O3 (maks rata-rata bergerak 8 jam); interpolasi linier Permen LHK 14/2020 |
| Kasus berlebih (excess) | Σ[ŷ(PM aktual) − ŷ(min(PM, C₀))], C₀ ∈ {15, 25, 37,5, 55} |
| % beban teratribusi | kasus berlebih ÷ kasus teramati |
| Tekanan RS | admisi pernapasan (`resp`) ÷ kapasitas TT × 100, per hari; puncak = maks rata-rata 7 hari |
| Capture rate | jam VALID ÷ jam grid |
| Pengali musim asap | rata-rata Agu–Okt ÷ rata-rata Jan–Jun |
| Eskalasi | rata-rata Agu–Okt 2026 ÷ Agu–Okt 2024 |
| IKU | 100 − (50/0,9)(IEU − 0,1); IEU = (NO2/40 + SO2/20)/2 |
