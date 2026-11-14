# Guide Riset & Desain Dashboard "Gelar Rasa 2026": Dari Akar Polusi ke Keputusan Kesehatan

Dashboard yang paling berpeluang juara bukan "dashboard kualitas udara" biasa. Yang paling kuat adalah **sistem peringatan dini beban kesehatan berbasis polusi**. User primernya **tim surveilans & kesiapsiagaan kesehatan lingkungan (Kemenkes/Dinkes Provinsi) yang berkoordinasi dengan RS rujukan**. Dashboard ini menjawab dalam 5 detik: *"Di mana dan kapan PM2.5 akan menambah pasien ISPA balita/lansia dalam 0–3 hari ke depan, berapa kasus yang bisa dicegah, dan RS mana yang harus bersiap?"*

## TL;DR

- **User & masalah:** Pilih user primer **surveilans & kesiapsiagaan kesehatan lingkungan** (Kemenkes Dit. Kesehatan Lingkungan / Komite Penanggulangan Penyakit Respirasi dan Dampak Polusi Udara, turun ke Dinkes Provinsi & RS rujukan). Hanya user ini yang bisa dilayani *seluruh* dataset: udara + kesehatan + kapasitas RS + jaringan. Masalah intinya adalah **keputusan yang reaktif**. Kasus ISPA melonjak (rata-rata di atas 200 ribu/bulan di Jabodetabek 2023 menurut Dirjen P2P Kemenkes; 283.270 kasus ISPA terkait karhutla 18 Agustus–13 Oktober 2026), padahal data udara dan data RS tidak pernah disatukan dalam satu alur keputusan.
- **Metric & insight pembeda:** North Star Metric = **"Kasus pernapasan yang dapat dicegah (attributable/avoidable cases) per minggu jika PM2.5 ≤ baku mutu 55 µg/m³"**. Metric ini didukung **lead time peringatan (lag 0–3 hari)**, **% hari > baku mutu PP 22/2021**, **tekanan RS per tempat tidur**, dan **Indeks Prioritas Stasiun**. Insight standout datang dari tiga hal: estimasi lag dari data sendiri (kurva % perubahan per 10 µg/m³), "jendela 48 jam" untuk persiapan RS, dan kuantifikasi kasus yang dapat dicegah per wilayah.
- **Cara menang:** Kerjakan **top-down** (issue tree dari beban kesehatan → sumber/meteorologi/sistem → kolom data), lalu **bottom-up** (data-quality traps: ppm vs µg/m³, WIB vs WITA/WIT, qc_flag, completeness ≥18 jam). Bangun 6 halaman dengan alur *Apa → Kapan/Di mana → Mengapa → Dampak → Aksi → Kepercayaan data*. Petakan setiap fitur ke rubrik: 70 poin dashboard, 30 poin laporan. Deadline preliminary **hari ini (14 November 2026, 23.59 WIB)**, jadi jalankan "Checklist 6 jam" di Bagian 16 bila waktu sempit.

---

## 1. Key Findings (ringkasan untuk pengambil keputusan)

1. **Masalah nyata bukan "udara buruk", tetapi "respons kesehatan terlambat".** Dirjen P2P Kemenkes dr. Maxi Rein Rondonuwu menyatakan dalam press briefing 28 Agustus 2023 bahwa kasus ISPA Jabodetabek per bulan rata-rata di atas 200 ribu kasus. Menkes Budi Gunadi Sadikin (24 Agustus 2023) menyebut kasus di Jakarta naik dari "sekitar 50.000-an" sebelum pandemi menjadi 200.000 kasus. Kemenkes kemudian membentuk Komite Penanggulangan Penyakit Respirasi dan Dampak Polusi Udara (Kepmenkes HK.01.07/MENKES/1625/2023).\[1\]\[2\] Artinya, user kesehatan sudah punya mandat kelembagaan tetapi belum punya alat yang menghubungkan udara dengan pasien.
2. **Karhutla gambut adalah pembunuh episodik terbesar.** Pada 2019 BNPB mencatat 919.516 penderita ISPA di 6 provinsi.\[3\]\[4\] Pada 2026, di tengah El Niño kuat, tercatat 283.270 kasus ISPA terkait karhutla (18 Agustus–13 Oktober 2026) di 63 kabupaten/kota pada 7 provinsi, termasuk 63.711 balita. Palangka Raya menyentuh ISPU "Berbahaya" pada 12 Oktober 2026.\[5\] Dataset Anda memiliki 6+ stasiun di zona gambut (KTG-01, KTG-02, PKN-01, PKU-01, JMB-01/02, PLB-01, BJB-01, STG-01), jadi episode ini *pasti* menjadi cerita utama.
3. **Beban kronis juga nyata.** AQLI Indonesia Fact Sheet 2025 (berbasis data PM2.5 tahun 2023) menyebut PM2.5 memangkas harapan hidup rata-rata orang Indonesia 1,3 tahun. Sebanyak 72,9% penduduk tinggal di wilayah di atas baku mutu tahunan nasional 15 µg/m³; jika wilayah tersebut memenuhi baku mutu nasional, penduduknya hidup 6,9 bulan lebih lama. IQAir 2025 World Air Quality Report mencatat rata-rata nasional 30,0 µg/m³ (peringkat 17 dari 143 negara), atau 6 kali pedoman tahunan WHO 5 µg/m³, tertinggi di Asia Tenggara meski membaik 16%.
4. **Jaringan pemantauan timpang dan baru tumbuh.** Dirjen PPKL KLHK Sigit Reliantoro (21 Agustus 2024) menyebut 56 AQMS beroperasi dan "tahun ini kita menambah sekitar 60 lagi, jadi nanti ada sekitar 120-an stasiun pemantauan kualitas udara". Laporan Kinerja Dit. PPU mencatat 134 unit SPKUA dibangun 2015–2024, dengan 65 di antaranya *low-cost sensor station* pada 2024.\[6\] Dataset Anda mencerminkan ketimpangan ini: hanya 2 stasiun di Papua (SRG-01, MER-01) dan 2 di Sulawesi (MRS-01, PLU-01).
5. **Gap benchmark:** dashboard publik (ISPU, IQAir, AQICN, AirNow) berhenti di "*indeks hari ini*". Dashboard kesehatan (CDC Heat & Health Tracker) menggabungkan bahaya + outcome + kerentanan, tetapi untuk panas.\[7\]\[8\] **Belum ada dashboard Indonesia yang menyatukan polutan → lag kesehatan → kapasitas RS → kecukupan jaringan dalam satu alur keputusan.** Ini sweet spot Anda.
6. **Kompetitor sudah bergerak.** Setidaknya satu peserta mempublikasikan repo publik ("NAPAS — Dashboard Gelar Rasa 2026") dengan 6 halaman standar: ringkasan, peta, waktu, pendorong, kesehatan, kualitas data. Repo itu juga punya skor prioritas berbobot (30% rata-rata PM2.5, 25% frekuensi > 55, 25% tekanan kunjungan respirasi, 10% kekurangan completeness, 10% penalti redundansi KTG-01/KTG-02), aturan ≥18 jam valid, dan konversi PM ×1000.\[9\] **Struktur halaman "standar" sudah menjadi komoditas.** Pembeda Anda harus ada pada *keputusan, kuantifikasi kasus yang dapat dicegah, lead time, validasi statistik, dan kesiapan RS*.

---

## 2. Konteks Permasalahan & Existing Condition (riset eksternal)

### 2.1 Kondisi kualitas udara Indonesia

| Indikator | Nilai | Sumber | Makna untuk dashboard |
|---|---|---|---|
| Rata-rata PM2.5 nasional 2025 | 30,0 µg/m³ (2024: 35,5; 2023: 37,1; 2019: 51,7), peringkat 17/143\[10\] | IQAir World Air Quality Report 2025 | Benchmark kewajaran: rata-rata urban sintetis Anda sebaiknya berada di kisaran 20–45 |
| Jakarta 2024 | 41,7 µg/m³ (2023: 43,8)\[11\]\[12\] | IQAir 2024/2023 | JKT-01..03 harus menjadi stasiun urban tertinggi di luar episode asap |
| Musim Jakarta | Puncak Juni–Agustus (kemarau), turun September–April\[13\] | IQAir (analisis 2019–2023) | Hipotesis musiman urban ≠ musiman gambut (Agustus–Oktober) |
| Dampak harapan hidup | −1,3 tahun rata-rata; Jakarta −2,6 tahun vs WHO; 72,9% penduduk di atas 15 µg/m³\[14\] | AQLI Indonesia Fact Sheet 2025 | Framing value: "setiap 10 µg/m³ PM2.5 permanen ≈ −0,98 tahun harapan hidup"\[14\] |
| Sumber PM2.5 Jakarta | Kendaraan 32–41% (hujan), 42–57% (kemarau); jejak batu bara 14% di Lubang Buaya; konstruksi 13% di Kebon Jeruk\[15\] | Vital Strategies–ITB (source apportionment 2019–2020) | Validasi pola roadside: puncak jam sibuk & efek weekend |
| PLTU sekitar Jakarta | ±2.500 kematian dini/tahun, Rp5,1 triliun/tahun dari PLTU radius 100 km; polusi naik saat angin dari arah PLTU\[16\]\[17\] | CREA | Justifikasi analisis **arah angin (polar plot)** untuk JKT-02 Marunda (pesisir/industri) |
| Beban Jakarta total | >10.000 kematian, >5.000 rawat inap kardiorespirasi, >7.000 outcome buruk anak/tahun; ±US$2,9 miliar (2,2% PDRB) | Vital Strategies & DLH DKI (2023)\[18\] | Framing value ekonomi |

### 2.2 Karhutla & kabut asap gambut (episode kunci)

| Tahun | Fakta | Sumber |
|---|---|---|
| 2015 | 24 meninggal, >500–600 ribu penderita ISPA, ±40 juta terpapar, kerugian Rp200–221 triliun; studi Harvard–Columbia memperkirakan 100.300 kematian dini regional\[3\]\[19\]\[20\] | BNPB via Kompas; Mongabay |
| 2019 | 919.516 penderita ISPA di Riau, Sumsel, Jambi, Kalbar, Kalteng, Kalsel (Sumsel 291.807; Riau 275.793)\[4\]\[21\] | BNPB/Kemenkes via CNN Indonesia |
| 2023 (El Niño) | Luas indikatif 1,16 juta ha (KLHK); Greenpeace menghitung ≥2,13 juta ha. Kalteng 114,57 ribu ha\[22\]\[23\] | KLHK; Greenpeace; Tempo |
| 2026 (El Niño kuat + IOD positif) | Karhutla Januari–Juli 202.010,96 ha; 283.270 kasus ISPA (18 Agustus–13 Oktober), 63.711 balita, 63 kab/kota, 7 provinsi; Palangka Raya ISPU Berbahaya 12 Oktober; >3 juta penduduk di 37 kab/kota terpapar (±21 Agustus)\[24\] | Kemenhut/BMKG via ITERA; iNews via Human Initiative\[5\]\[25\]\[26\] |

**So-what:** periode data Anda (Januari 2024–Oktober 2026) **mencakup musim kemarau 2026** yang ekstrem di dunia nyata.\[25\]\[27\]\[28\] Jika generator sintetis meniru realitas, akan ada episode besar Agustus–Oktober 2026 di stasiun gambut. Itu menjadi "momen cerita" dashboard.

### 2.3 Jaringan pemantauan (existing condition)

- Agustus 2024: **56 AQMS** beroperasi "di daerah rawan kebakaran, semua ibu kota provinsi dan beberapa kabupaten". Dirjen PPKL KLHK Sigit Reliantoro (konferensi pers 21 Agustus 2024): "Tahun ini kita menambah sekitar 60 lagi, jadi nanti ada sekitar 120-an stasiun pemantauan kualitas udara", termasuk "lokasi yang kemarin bolong di Pantura".
- LKj Dit. PPU: **134 unit SPKUA** dibangun 2015–2024. Pada 2024 dibangun 66 lokasi, terdiri dari 65 *low-cost sensor* dan 1 *reference station*.\[6\]
- Implikasi: mayoritas penambahan baru adalah **sensor low-cost**, sehingga isu **QC, kalibrasi, dan satuan** sangat relevan. Ini membenarkan halaman "Kepercayaan Data" sebagai insight operasional, bukan sekadar lampiran.

### 2.4 Regulasi & threshold (gunakan sebagai garis referensi di chart)

**Baku mutu udara ambien nasional (PP 22/2021 Lampiran VII):**

| Parameter | Waktu | Baku mutu |
|---|---|---|
| PM2.5 | 24 jam / 1 tahun | **55 / 15 µg/m³**\[29\]\[30\] |
| PM10 | 24 jam / 1 tahun | **75 / 40 µg/m³**\[31\] |
| SO2 | 1 jam / 24 jam / 1 tahun | 150 / 75 / 45 µg/m³\[32\] |
| CO | 1 jam / 8 jam | 10.000 / 4.000 µg/m³\[30\] |
| NO2, O3 | 1 jam / 24 jam / 8 jam / tahunan | *Verifikasi langsung dari Lampiran VII sebelum dipakai* (nilai umum: NO2 200/65/–/50; O3 150 (1 jam)/100 (8 jam)/35 (tahunan)) |

**WHO AQG 2021 + interim targets (IT):**

| | IT-1 | IT-2 | IT-3 | IT-4 | AQG |
|---|---|---|---|---|---|
| PM2.5 tahunan | 35 | 25 | 15 | 10 | **5** |
| PM2.5 24 jam* | 75 | 50 | 37,5 | 25 | **15** |
| PM10 tahunan | 70 | 50 | 30 | 20 | 15 |
| PM10 24 jam* | 150 | 100 | 75 | 50 | 45\[33\] |

*Persentil ke-99 (3–4 hari terlampaui per tahun diperbolehkan).\[34\]\[35\]

Insight framing: **baku mutu harian nasional PM2.5 (55) berada di antara IT-1 (75) dan IT-2 (50)**, dan baku mutu tahunan nasional (15) setara IT-3. Tampilkan "tangga target" ini sebagai *ladder chart*: "Stasiun X sudah lolos baku nasional, tapi baru di IT-2 WHO."

**ISPU (Permen LHK 14/2020) — breakpoint batas atas konsentrasi (µg/m³):**

| ISPU | Kategori | PM10 | PM2.5 | SO2 | CO | O3 | NO2 | HC |
|---|---|---|---|---|---|---|---|---|
| 0–50 | Baik | 50 | 15,5 | 52 | 4.000 | 120 | 80 | 45 |
| 51–100 | Sedang | 150 | 55,4 | 180 | 8.000 | 235 | 200 | 100 |
| 101–200 | Tidak Sehat | 350 | 150,4 | 400 | 15.000 | 400 | 1.130 | 215 |
| 201–300 | Sangat Tidak Sehat | 420 | 250,4 | 800 | 30.000 | 800 | 2.260 | 432\[36\] |
| >300 | Berbahaya | >420 | >250,4 | >800 | >30.000 | >800 | >2.260 | >432 |

Rumus interpolasi linier: **I = ((Ia − Ib)/(Xa − Xb)) × (Xx − Xb) + Ib**. Ia/Ib adalah ISPU batas atas/bawah, Xa/Xb konsentrasi batas atas/bawah, dan Xx konsentrasi terukur.\[37\] Contoh resmi di Permen: PM2.5 24 jam 31,4 µg/m³ → ISPU 70 (Sedang).\[38\] Ketentuan pelaporan: **ISPU PM2.5 disampaikan tiap jam selama 24 jam**, sedangkan parameter lain paling sedikit pada jam 09.00 dan 15.00.\[39\] ISPU stasiun = **nilai maksimum sub-indeks** dengan "parameter pencemar kritis".\[36\]\[40\] *Verifikasi periode rata-rata gas (1 jam/8 jam/24 jam) langsung di Lampiran Permen.*

**IKU (Permen LHK 27/2021):** hanya memakai **SO2 dan NO2**. Indeks NO2 = rata-rata NO2/40, Indeks SO2 = rata-rata SO2/20 (referensi EU).\[41\]\[42\] IEU = (Indeks NO2 + Indeks SO2)/2, lalu **IKU = 100 − (50/0,9) × (IEU − 0,1)**.\[43\] **Insight penting:** IKU *buta terhadap PM2.5*. Sebuah wilayah gambut bisa ber-IKU "baik" padahal mengalami episode PM2.5 ekstrem. Ini kritik kebijakan yang tajam dan bisa ditampilkan (H-insight #7).

---

## 3. User: Evaluasi & Pemilihan Persona

### 3.1 Matriks evaluasi kandidat user (skor 1–5)

| Kandidat | Data tersedia melayani? | Keputusan jelas & sering? | Value terukur? | Unik vs peserta lain? | Total |
|---|---|---|---|---|---|
| **Surveilans & kesiapsiagaan kesehatan lingkungan (Kemenkes/Dinkes Prov.) + RS rujukan** | 5 (udara+kesehatan+RS+jaringan) | 5 (harian–mingguan) | 5 (kasus dicegah, bed) | 5 | **20** |
| KLH/DLH (pengendalian pencemaran) | 4 (tanpa data sumber emisi) | 3 | 3 | 2 (paling umum dipilih) | 12 |
| BPBD/Satgas Karhutla | 3 (tanpa hotspot) | 4 (musiman) | 3 | 3 | 13 |
| Manajemen RS saja | 3 (hanya 1 RS) | 4 | 4 | 4 | 15 |
| Bappeda (investasi AQMS) | 3 | 2 (tahunan) | 3 | 3 | 11 |

**Keputusan:** user primer adalah **Ketua Tim Kerja Penyehatan Udara / Koordinator Surveilans Kesehatan Lingkungan**. Dalam praktiknya ini posisi di Direktorat Kesehatan Lingkungan Kemenkes atau Bidang P2P Dinkes Provinsi, sebagai sekretariat teknis Komite Penanggulangan Penyakit Respirasi dan Dampak Polusi Udara. Persona ini cocok karena 27 stasiun + 27 RS lintas 5 pulau adalah sudut pandang **nasional**, dan mandatnya ada sejak Agustus 2023.\[1\]

**User sekunder (dilayani oleh halaman tertentu):**
- **Direktur Pelayanan Medik RS rujukan Tipe B/C** → halaman "Kesiapan RS" (bed, oksigen, nebulizer, poli ISPA).
- **KLH/DLH Dit. Pengendalian Pencemaran Udara** → halaman "Mengapa" dan "Kecukupan Jaringan" (investasi stasiun, kalibrasi sensor).

### 3.2 Persona primer: "dr. Rina, Ketua Tim Kerja Penyehatan Udara"

- **Jobs-to-be-done:**
  1. Menentukan **wilayah & kelompok rentan** yang harus diberi intervensi minggu ini (imbauan masker, kurangi aktivitas luar, sekolah, posko).
  2. Mengirim **notifikasi kesiapsiagaan ke RS rujukan** 1–3 hari sebelum lonjakan.
  3. Menyusun **laporan bulanan** ke Menkes/Komite: berapa kasus terkait polusi, berapa yang dapat dicegah.
  4. Memberi **rekomendasi lintas sektor** ke KLH/BPBD (wilayah prioritas stasiun, wilayah prioritas pengendalian).
- **Frekuensi:** harian saat musim kemarau/karhutla (Juli–Oktober), mingguan di luar musim, bulanan untuk pelaporan.
- **Pain points:** data ISPA datang terlambat dan agregat; ISPU tidak menerjemahkan risiko ke jumlah pasien; tidak tahu RS mana yang paling rentan *overload*; data sensor sering bolong/meragukan.
- **5 pertanyaan "5 detik pertama":**
  1. Berapa wilayah yang saat ini/minggu ini **di atas baku mutu** dan sedang tren naik?
  2. Berapa **tambahan kasus pernapasan** (balita & lansia) yang diperkirakan terkait PM2.5 dalam **48 jam** ke depan?
  3. **RS mana** yang tekanan bed-nya paling tinggi?
  4. **Apa pemicunya**: asap gambut, lalu lintas, atau industri/angin?
  5. **Seberapa bisa dipercaya** angkanya (completeness data)?

---

## 4. Benchmark Dashboard Sejenis

| Dashboard | Kekuatan | Kelemahan / gap | Pelajaran untuk Anda |
|---|---|---|---|
| ISPU KLH (ispu.kemenlh.go.id, ISPUNet) | Resmi, kategori ISPU, ISPU kawasan industri, peta titik\[44\]\[45\] | Snapshot indeks, tanpa outcome kesehatan, tanpa tren/attribution | Gunakan **palet & kategori ISPU resmi** agar familier bagi user pemerintah |
| IQAir / AQICN-WAQI | Cakupan global, peringkat kota, forecast | Pakai US AQI (beda breakpoint dengan ISPU), banyak sensor low-cost, tanpa kesehatan\[46\] | Hindari mencampur US AQI dan ISPU; jelaskan perbedaannya di tooltip |
| Jakarta (udara.jakarta.go.id / Jakarta Rendah Emisi) | Konteks sumber emisi, edukasi | Terbatas Jakarta | Narasi sumber (kendaraan 32–57%) untuk halaman "Mengapa"\[47\] |
| US EPA AirNow + Fire & Smoke Map | NowCast, overlay asap, aksi per kategori | Tanpa outcome kesehatan | Konsep **"aksi per kategori"** dan *smoke layer* |
| CDC Heat & Health Tracker / EPHT | **Bahaya + outcome (ED visits, rawat inap, kematian) + kerentanan + kapasitas medis per county**, forecast, API | Untuk panas, bukan polusi\[7\]\[8\]\[48\] | **Template terbaik**: tiru logika "hazard → health → vulnerability → resources" |
| SiPongi KLHK | Hotspot & luas karhutla | Tanpa kualitas udara–kesehatan | Hubungkan episode asap dengan musim karhutla |

**GAP utama (positioning statement):**
> *"Dashboard publik berhenti di indeks hari ini. Dashboard kesehatan terbaik (CDC) sudah menggabungkan bahaya, outcome, kerentanan, dan kapasitas, tetapi untuk panas. Kami membawa logika itu ke polusi udara Indonesia: dari µg/m³ → lag kesehatan → kasus yang dapat dicegah → RS yang harus bersiap → di mana stasiun berikutnya dibangun."*

---

## 5. Metric Penting, Formula, dan KPI Hierarchy

### 5.1 North Star Metric

**Kasus pernapasan yang dapat dicegah (Avoidable Respiratory Cases, ARC)** per minggu/periode, jika PM2.5 harian ditekan ke baku mutu nasional (55) dan, sebagai skenario ambisius, ke WHO IT-3 (37,5) atau AQG (15).

Alasan: metric ini langsung menerjemahkan polusi ke **beban kesehatan yang bisa ditindaklanjuti** dan mudah dibaca dalam 5 detik ("±X kasus/minggu").

### 5.2 KPI Hierarchy

```
NSM: Avoidable Respiratory Cases (ARC) / minggu
├── L1 Paparan (Exposure)
│   ├── PM2.5 rata-rata 24 jam & tahunan per stasiun
│   ├── % hari > baku mutu PP22 (55) | % hari > WHO 15 | hari kategori ISPU ≥ Tidak Sehat
│   ├── Exceedance hours (jam > 55,4) & durasi episode (hari berturut-turut)
│   └── ISPU harian (maks sub-indeks) + parameter kritis
├── L2 Respons kesehatan (Response)
│   ├── % perubahan admisi per +10 µg/m³ (lag 0–7) per outcome & kelompok umur
│   ├── Lag puncak (hari) → "lead time peringatan"
│   └── Rasio kerentanan balita vs lansia (RR_balita / RR_lansia)
├── L3 Beban & kapasitas (Burden & Capacity)
│   ├── Attributable cases (AC) per RS/periode
│   ├── Tekanan RS = admisi pernapasan harian / kapasitas tempat tidur × 100
│   └── Hari "overload" (tekanan > P90 historis RS tsb)
└── L4 Sistem (System/Trust)
    ├── Data capture rate (% jam valid; % hari valid ≥18 jam)
    ├── Indeks Prioritas Stasiun (IPS)
    └── Redundansi stasiun (korelasi antar stasiun berdekatan)
```

### 5.3 Formula kunci

| Metric | Formula / aturan |
|---|---|
| Rata-rata harian valid | Valid jika ≥18 dari 24 jam (75%) tersedia; rata-rata dibagi jumlah jam tersedia. Aturan ini mengikuti US EPA 40 CFR Part 50 App. N: *"A 24-hour average concentration shall be considered valid if at least 75 percent of the hourly averages (i.e., 18 hourly values) … are available."* Pengecualian EPA: hari dengan ≥7 jam hilang tetap valid jika, dengan jam hilang = 0, rata-ratanya tetap > standar.\[49\] Gunakan versi ini dengan threshold 55 agar hari episode ekstrem tidak terbuang |
| Rata-rata tahunan valid | Minimal 75% hari valid per tahun; tampilkan *flag* bila kurang |
| % hari > baku mutu | hari valid dengan PM2.5_24j > 55 / total hari valid |
| WHO exceedance ratio | PM2.5 tahunan / 5 (contoh: 30 → "6× WHO")\[50\] |
| ISPU | Interpolasi linier (Bagian 2.4); ISPU stasiun = maks sub-indeks |
| IKU | 100 − (50/0,9)(IEU − 0,1); IEU = ((NO2/40)+(SO2/20))/2\[43\] |
| β (koefisien) | β = ln(RR)/10 untuk RR per 10 µg/m³ |
| Attributable fraction harian | AF = 1 − exp(−β × max(0, C − C₀)); C₀ = counterfactual (55 / 37,5 / 15) |
| Attributable/avoidable cases | AC = Σ_hari (kasus_observasi × AF) per RS/kelompok |
| Tekanan RS | (resp + asthma + copd + resp_under5 + resp_over60 sesuai definisi non-overlap) / kapasitas_tempat_tidur × 100. *Cek dulu apakah `resp` sudah mencakup sub-kategori agar tidak double count* |
| Rasio kerentanan | %Δ per 10 µg/m³ balita ÷ %Δ lansia (dengan CI) |
| Indeks Prioritas Stasiun (IPS) | Lihat Bagian 9 (komposit 5 komponen) |

### 5.4 Parameter literatur untuk plausibility check (bukan input model utama)

| Outcome | Efek per +10 µg/m³ PM2.5 | Lag | Sumber |
|---|---|---|---|
| Kematian semua sebab | RR 1,0065 (95% CI 1,0044–1,0086) | jangka pendek | Orellano et al. 2020, *Environ Int* (review sistematis WHO)\[51\]\[52\] |
| Kematian kardiovaskular | RR 1,0090 (1,0074–1,0106) | jangka pendek | Yang et al., *JACC* 2026 (meta-analisis 100 studi, 123 estimasi efek) |
| Rawat inap gagal jantung (≥65 th) | +1,28% (0,78–1,78) | lag 0 | Dominici et al. 2006, *JAMA* 295(10) |
| Rawat inap PPOK (≥65 th) | +0,91% (0,18–1,64) | lag 0 (dan 1) | Dominici et al. 2006 |
| Infeksi saluran napas (≥65 th) | +0,92% (0,41–1,43) | **lag 2** | Dominici et al. 2006\[53\] |
| Pneumonia anak (<18 th) | +1,8% (0,5–3,1) | jangka pendek | Nhung et al. 2017, *Environ Pollut* 230 (17 studi)\[54\]\[55\] |

Pola kunci dari Dominici 2006: *"The largest effect was found at lag 0 for all of the cardiovascular outcomes except ischemic heart disease… For respiratory outcomes, the largest effects occurred at lags 0 and 1 for COPD and at lag 2 for respiratory tract infections."*\[53\] **Implikasinya:** CVD dan PPOK bersifat "hari yang sama" (respons cepat RS). ISPA/infeksi muncul sekitar 2 hari kemudian, sehingga ada **jendela ±48 jam untuk bersiap**.

**Catatan penting:** karena datanya sintetis, efek di data Anda bisa jauh lebih besar dari literatur (generator sering "menanam" efek kuat). Laporkan efek dari data, lalu bandingkan dengan literatur: "efek di data X kali lebih besar dari meta-analisis, wajar untuk data sintetis/ilustratif".

---

## 6. Pendekatan TOP-DOWN: Issue Tree (MECE) → Kolom Data

**Masalah inti:** *"Mengapa beban penyakit pernapasan/kardiovaskular akibat polusi udara tetap tinggi dan respons kesehatan terlambat?"*

```
A. PAPARAN TINGGI (hazard)
│  A1. Sumber emisi
│  │   A1a. Transportasi → site_type roadside, distance_to_road_m, traffic_intensity_per_h, NO2, CO, pola jam sibuk, weekday vs weekend
│  │   A1b. Industri/PLTU/pelabuhan → JKT-02 Marunda, BTM-01, site_type industrial perimeter, SO2, arah angin (polar plot)
│  │   A1c. Biomassa/karhutla gambut → karakteristik_wilayah gambut, PM2.5/PM10 & CO melonjak Agustus–Oktober, rasio PM2.5/PM10 tinggi (>0,7 = asap halus)
│  │   A1d. Latar/regional → stasiun clean background (KTB-01 GAW Kototabang, PLU-01 Lore Lindu, MER-01, SRG-01) sebagai baseline
│  A2. Meteorologi yang memperburuk
│  │   A2a. Angin lemah/stagnan → wind_speed_ms
│  │   A2b. Kelembapan rendah / kemarau → humidity_pct, musim
│  │   A2c. Inversi malam–pagi (proxy: suhu rendah + angin lemah dini hari) → temperature_c, diurnal
│  │   A2d. Arah angin membawa plume → wind_direction_deg
│  └── A3. Tren jangka panjang → 2024 vs 2025 vs 2026 (membaik/memburuk)
│
B. KERENTANAN & DAMPAK (vulnerability → outcome)
│  B1. Kelompok umur → resp_admissions_under5 vs resp_admissions_over60
│  B2. Jenis penyakit → asthma_emergency_cases, copd_admissions, resp, cvd, death
│  B3. Lag waktu → lag 0–7 hari
│  B4. Konfounder cuaca → temp_c, dptp_c, rhum_pct (data RS), dow
│
C. KAPASITAS RESPONS (system response)
│  C1. Kapasitas RS → kelas_faskes (B/C), kapasitas_tempat_tidur (sebagian kosong!)
│  C2. Lead time peringatan → lag puncak (B3)
│  └── C3. Lonjakan vs baseline → admisi / median musiman RS
│
D. INFORMASI & PEMANTAUAN (information system)
   D1. Cakupan geografis → lat/lon sites, jarak antar stasiun, region_group (Papua/Sulawesi tipis)
   D2. Kualitas data → qc_flag, gap, duplikat, satuan ppm vs µg/m³, status_operasional, tanggal_instalasi
   D3. Redundansi → korelasi stasiun berdekatan (JKT-01/02/03, KTG-01/KTG-02/PKN-01, JMB-01/JMB-02)
   D4. Integrasi data udara–kesehatan → join sensor → site → RS (inti dashboard)
```

**Yang TIDAK bisa dijawab data (catat sebagai batasan):** inventaris emisi aktual, hotspot satelit, populasi/kepadatan (sehingga tidak ada *population-weighted exposure* dan tidak bisa menghitung rate per 100.000), status sosial-ekonomi, data puskesmas, dan jumlah kunjungan rawat jalan.

---

## 7. Pendekatan BOTTOM-UP: Dari Kolom ke Analisis, GAP, dan Sweet Spot

### 7.1 Inventaris kemampuan data

| Kelompok data | Analisis yang mungkin |
|---|---|
| Udara per jam (27 file) | Profil diurnal (jam lokal!), weekday/weekend, bulanan/musiman, kalender heatmap, deteksi episode (≥2 hari berturut > 55), dekomposisi STL, rasio PM2.5/PM10, korelasi antarpolutan, polar plot (konsentrasi vs arah & kecepatan angin), regresi PM2.5 ~ meteorologi + fitur situs, deteksi anomali sensor (flatline, lonjakan, nilai negatif, drift) |
| Kesehatan harian (27 RS) | Time-series Poisson/quasi-Poisson + lag terdistribusi, perbandingan balita vs lansia, musiman admisi, excess admissions vs baseline, tekanan per bed |
| Master/metadata | Join, karakterisasi tipe situs, jarak haversine antar stasiun & ke stasiun terdekat, umur sensor, status operasional, mapping satuan |

### 7.2 GAP top-down vs bottom-up

| Pertanyaan top-down | Data bisa? | Strategi |
|---|---|---|
| Kontribusi sumber (%) | Tidak langsung | Proxy: tipe situs + polutan penanda (NO2/CO → lalu lintas; SO2 → industri/batu bara; PM2.5/PM10 & CO tinggi musiman → biomassa) + arah angin |
| Paparan per penduduk | Tidak (tanpa populasi) | Gunakan "per RS" dan "per bed" sebagai denominator. Nyatakan sebagai batasan |
| Kausalitas | Tidak | Asosiasi + kontrol konfounder + **uji plasebo (lead PM)** + konsistensi dengan literatur |
| Hotspot karhutla | Tidak | Proxy episode: PM2.5 tinggi + rasio PM2.5/PM10 tinggi + CO naik + RH rendah di stasiun gambut |

**Potensi tersembunyi dari bottom-up (yang tidak tertulis di guidebook):**
1. **Dua sumber cuaca** (stasiun & RS) memungkinkan validasi silang mapping/sensor.
2. **status_operasional + tanggal_instalasi + qc_flag** → insight "kepercayaan data" sebagai keputusan operasional (kalibrasi/penggantian sensor).
3. **dow + time** di data RS → kontrol tren & hari minggu ala NMMAPS.

### 7.3 SWEET SPOT

> **"Health-Burden Early Warning": sebuah lingkaran keputusan yang memakai PM2.5 harian valid → kurva lag dari data sendiri → kasus yang dapat dicegah & tekanan RS → aksi 48 jam → prioritas investasi stasiun.**

Sweet spot ini (1) memakai keempat kelompok data, (2) menjawab ke-6 tujuan guidebook *sekaligus* melampauinya, (3) bisa dihitung dengan data yang ada, dan (4) jarang dikerjakan peserta karena butuh pemodelan lag yang benar.

---

## 8. Key Problem Statements & Hipotesis Teruji

**Key problem statements:**
- **P1.** Episode asap gambut musiman menghasilkan konsentrasi PM2.5 berlipat dari baku mutu. Lonjakan pasien ISPA muncul beberapa hari kemudian, saat RS tipe C dengan kapasitas kecil sudah terlambat bersiap.
- **P2.** Polusi kronis urban/industri (Jabodetabek, Medan, Batam, Marunda) jarang "berbahaya" secara harian, tetapi akumulasi paparan sepanjang tahun menghasilkan beban terbesar dalam jumlah kasus.
- **P3.** Jaringan pemantauan timpang dan sebagian datanya tidak andal, sehingga wilayah berisiko tinggi bisa "tidak terlihat".

| # | Hipotesis | Cara uji dengan data | Metode statistik | Visual | "So what" untuk user |
|---|---|---|---|---|---|
| H1 | Stasiun gambut (KTG-01/02, PKN-01, PKU-01, JMB-01/02, PLB-01, BJB-01, STG-01) mengalami episode PM2.5 ekstrem Agustus–Oktober, terutama 2026 | % hari > 55 per bulan × stasiun; deteksi episode (≥2 hari > 55) | Uji Mann-Whitney musim karhutla vs non; STL | Kalender heatmap per stasiun; small multiples bulanan | Kalender kesiapsiagaan: aktifkan posko mulai Juli |
| H2 | Urban roadside (JKT-01, JKT-03, BGR-02, MDN-01) memiliki puncak pagi (06–09) & sore (17–20) dan PM2.5/NO2 lebih rendah pada weekend | Profil diurnal jam lokal, weekday vs weekend | Kruskal-Wallis; bootstrap CI selisih | Diurnal line (weekday vs weekend) | Waktu imbauan aktivitas luar & jam masuk sekolah |
| H3 | PM2.5 berasosiasi dengan ISPA balita dengan lag 1–3 hari; lansia lebih kuat ke CVD/kematian di lag 0–1 | Model per RS: admisi ~ PM2.5 lag 0..7 | Quasi-Poisson GLM + spline waktu & suhu + DOW; DLNM; pooling random-effects | Kurva lag (%Δ per 10 µg/m³ + CI) per outcome | **Jendela 48 jam** untuk menyiapkan bed anak & oksigen |
| H4 | Angin lemah (<1,5 m/s) & RH rendah memperparah PM2.5 | Binning kecepatan angin & RH | Regresi/GBM + SHAP / partial dependence | Polar plot; heatmap angin × RH | Gunakan forecast cuaca BMKG sebagai pemicu siaga |
| H5 | JKT-02 Marunda (industri/pelabuhan) memiliki SO2/PM tertinggi saat angin dari sektor tertentu | Konsentrasi per sektor arah angin | Conditional probability function (CPF) | Polar/bivariate plot | Bukti untuk pengawasan sumber tidak bergerak (DLH) |
| H6 | Stasiun latar bersih (KTB-01, PLU-01, MER-01, SRG-01) konsisten di bawah WHO IT-3, kecuali terkena asap regional | Rata-rata & episode di stasiun background | Deskriptif + korelasi silang dengan stasiun gambut | Bar dengan garis ladder WHO | Baseline "udara bersih Indonesia" & indikator transport asap |
| H7 | Ada stasiun dengan data bermasalah (satuan ppm, flatline, gap besar, qc_flag non-VALID) | Distribusi nilai per stasiun vs baseline_pm25; run-length nilai identik | Rule-based QC + z-score robust | Heatmap completeness stasiun × bulan | Prioritas kalibrasi/penggantian sensor |
| H8 | Indonesia timur (Papua, Sulawesi) under-monitored relatif terhadap risikonya | Jarak ke stasiun terdekat, jumlah stasiun per region | Haversine; nearest-neighbor | Peta + bar region | Prioritas investasi stasiun |
| H9 | RS tipe C di wilayah gambut memiliki tekanan per bed tertinggi saat episode | Admisi/bed saat episode vs non-episode | Rasio & selisih dengan CI | Scorecard RS (bullet chart) | Prioritas surge capacity & distribusi logistik |
| H10 | Stasiun berdekatan bersifat redundan (r > 0,9), sehingga relokasi lebih efisien daripada menambah | Korelasi harian antarstasiun | Pearson/Spearman + jarak | Matriks korelasi diurutkan jarak | Hemat anggaran AQMS |
| H11 (plasebo) | PM2.5 *besok* tidak memprediksi admisi *hari ini* | Masukkan lead −1/−2 dalam model | GLM yang sama | Lag chart dengan batang lead | Bukti bahwa asosiasi bukan artefak tren |

---

## 9. Insight Standout di Luar Guidebook

1. **Kurva "Jendela 48 Jam":** dari data sendiri, tunjukkan lag puncak per outcome. Narasinya: "Ketika PM2.5 melewati 55, kunjungan ISPA balita puncak ~X hari kemudian. Itu waktu Anda untuk bersiap."
2. **Kasus yang dapat dicegah (ARC) per wilayah & skenario:** slider counterfactual (55 / 37,5 / 25 / 15). Ilustrasi formula dengan RR anak Nhung 2017: pada hari asap 150 µg/m³ vs baku 55 (Δ = 95), RR = 1,018^9,5 ≈ 1,185, sehingga **≈16% admisi pneumonia anak hari itu teratribusi pada kelebihan PM2.5**.\[55\] Dengan RR kematian Orellano (1,0065), hari yang sama ≈ +6,3% kematian.\[56\]\[57\] *(Angka ilustratif; di dashboard pakai koefisien dari data Anda.)*
3. **Ranking prioritas intervensi:** matriks 2×2 "frekuensi exceedance × beban kesehatan teratribusi" per wilayah, dengan kuadran "Aksi segera / Pantau / Kronis / Aman".
4. **Scorecard kesiapan RS:** tekanan per bed (saat ini vs P90 historis), kelas faskes, dan flag "kapasitas tidak diketahui" (data kosong ditampilkan sebagai *risiko informasi*, bukan dihapus).
5. **Indeks Prioritas Stasiun (IPS) 0–100:** 25% beban kesehatan teratribusi RS terkait + 20% frekuensi exceedance + 20% jarak ke stasiun terdekat (gap geografis) + 20% (1 − capture rate) + 15% (1 − redundansi). Jelaskan bobot dan berikan **slider bobot** agar juri melihat robustness (ranking stabil = kredibel). Pembeda dari skor kompetitor: komponen *gap geografis* dan *sensitivity analysis*.
6. **Deteksi sensor bermasalah sebagai insight operasional:** "X% jam di stasiun Y tidak valid; nilai PM tercatat dalam ppm/mg dan dikonversi; sensor Z flatline N jam". Ini langsung relevan karena 65 dari 66 stasiun baru KLHK 2024 adalah low-cost.\[6\]
7. **"IKU buta PM2.5":** bandingkan IKU (SO2+NO2) vs % hari PM2.5 > 55 per stasiun.\[42\] Stasiun gambut bisa ber-IKU baik padahal PM2.5 berbahaya. Ini rekomendasi kebijakan yang tajam.
8. **Divergensi cuaca stasiun vs RS:** korelasi suhu stasiun vs temp_c RS. Korelasi rendah menandakan mapping keliru atau sensor bermasalah, sehingga menjadi bukti ketelitian preprocessing.

---

## 10. Guide Pengolahan Data (Pipeline)

**Rekomendasi stack:** Python (pandas/polars, statsmodels, scikit-learn) → output **Parquet/CSV tidy** → dashboard di **Tableau Public** atau **Power BI (Publish to web)**. Keduanya kuat untuk cross-filter, parameter, dan tooltip. Alternatifnya **Streamlit/Next.js** untuk kontrol penuh (lebih lama dibangun). Looker Studio mudah tetapi lemah untuk model lag dan parameter kompleks. Pilih tool yang paling dikuasai tim; *pre-compute* semua model di Python.

### Langkah demi langkah

1. **Load & skema:** baca 27 file dengan glob yang toleran (`*_AQMS.csv` dan pola dengan tanda hubung seperti `JMB-02-MuaroJambi`). Ambil kode stasiun dari sensor_id → sensors.csv, *bukan* dari nama file. Validasi kolom, tipe, dan rentang tanggal vs metadata_dates.csv.
2. **Master data cleaning:** standarisasi nama provinsi/kota. Contoh: Gambir tercatat "D.I. Yogyakarta" di hospitals.csv, padahal seharusnya DKI Jakarta. Koreksi via lookup kota→provinsi dan **catat di log perubahan**. Seragamkan kode (SM2-01). Cek duplikat ID.
3. **Timestamp:** parse WIB; deteksi duplikat (measurement_id & timestamp), jam hilang (reindex ke grid 1 jam penuh), timestamp tidak teratur (bulatkan ke jam bila selisih kecil; jika tidak, buang dan catat). Buat kolom **jam lokal**: WITA (+1 jam) untuk MRS-01, PLU-01, SM2-01, BJB-01; WIT (+2 jam) untuk SRG-01 dan MER-01. Profil diurnal harus memakai jam lokal, sedangkan agregasi harian untuk join kesehatan memakai tanggal lokal.
4. **qc_flag:** hanya VALID yang dipakai untuk metrik resmi. Tampilkan proporsi flag per stasiun di halaman Data Trust. Lakukan sensitivity: hasil dengan vs tanpa nilai non-VALID.
5. **Harmonisasi satuan (ppm → µg/m³) untuk gas:** µg/m³ = ppm × BM × 1000 / 24,45 (25 °C, 1 atm). BM: SO2 64,07; NO2 46,01; O3 48,00; CO 28,01. Jadi faktornya: SO2 ×2.620, NO2 ×1.882, O3 ×1.963, CO ×1.146 (ppm → µg/m³). **Partikulat tidak punya ppm fisik.** Label "ppm" pada PM kemungkinan berarti mg/m³ (×1000). Validasi dengan membandingkan distribusi terhadap baseline_pm25 dan stasiun tetangga sebelum mengonversi. Deteksi otomatis: median per file/periode yang berbeda ~10³ kali dari tetangga atau baseline.
6. **Outlier & nilai fisik mustahil:** nilai negatif → NaN; PM2.5 > PM10 (toleransi kecil) → flag; flatline ≥6 jam nilai identik → flag; lonjakan (robust z > 6 terhadap median 24 jam) → flag, **tetapi jangan hapus episode asap yang konsisten antarpolutan/tetangga**.
7. **Imputasi:** hanya untuk visual kontinu (interpolasi ≤3 jam). **Jangan imputasi untuk metrik kepatuhan.** Hari valid mengikuti aturan ≥18 jam (plus pengecualian EPA untuk hari yang tetap > standar).
8. **Agregasi harian:** mean 24 jam (PM, SO2, NO2), maks rata-rata bergerak 8 jam (CO, O3), maks 1 jam; hitung ISPU per polutan & ISPU harian; jam > 55,4; flag episode.
9. **Join:** sensor_id → location_id (sites) → RS (mapping indeks SENS-0NN ↔ RS-XXX-NN ↔ station sesuai booklet). Verifikasi via kota/kecamatan dan korelasi suhu stasiun vs RS.
10. **Feature engineering:** lag PM2.5 0–7, rata-rata bergerak lag 0–2 & 0–6, lead −1/−2 (plasebo), musim (kemarau Mei–Oktober vs hujan; sesuaikan per region), bulan, dow, libur (opsional, tanpa data eksternal: cukup dow), angin kategori, RH kategori.
11. **Model kesehatan (per RS lalu dipool):** `admisi ~ PM2.5_lag(k) + ns(time, 7 df/tahun) + ns(temp_c, 3) + ns(dptp_c, 3) + dow`, family quasi-Poisson. Lakukan untuk k = 0..7 dan untuk DLNM (crossbasis) bila sempat. Pool dengan meta-analisis random-effects (DerSimonian-Laird). Output: %Δ per 10 µg/m³ = (exp(10β) − 1) × 100 dengan CI. Simpan tabel koefisien untuk dashboard.
12. **Attributable cases & skenario:** hitung AF harian per RS dengan β terpool (atau per RS jika stabil), lalu ARC untuk counterfactual 55/37,5/25/15.
13. **Network adequacy:** jarak haversine antarstasiun, nearest neighbour, korelasi harian, capture rate, lalu IPS.
14. **Data log:** tabel "sebelum → sesudah" (jumlah baris, % dibuang per alasan). Ini untuk laporan bagian preprocessing (10 poin).

---

## 11. Guide Desain Dashboard

### 11.1 Prinsip

- **Storyline (Knaflic):** satu halaman = satu pertanyaan; judul halaman berupa *kalimat insight* (contoh: "Asap gambut Agustus–Oktober menyumbang 70% hari tidak sehat"), bukan label ("Analisis Temporal").
- **Shneiderman:** overview first → zoom & filter → details on demand (tooltip, drill-through).
- **Stephen Few:** rasio data-ink tinggi, tanpa 3D/gauge dekoratif; KPI card memuat angka + konteks (vs baku mutu, vs periode lalu) + sparkline.
- **F/Z pattern:** kiri atas = KPI paling penting (NSM); kanan atas = status/peringatan; tengah = peta/chart utama; bawah = detail.
- **Palet ISPU resmi untuk kategori:** Baik hijau, Sedang biru, Tidak Sehat kuning, Sangat Tidak Sehat merah, Berbahaya hitam. Warna ini *hanya* dipakai untuk kategori kualitas udara. Gunakan satu warna netral (abu/biru tua) untuk data non-kategori, dan satu warna aksen (ungu/oranye) untuk kesehatan. Konsisten di semua halaman.
- **Aksesibilitas:** jangan andalkan warna saja (tambah label/ikon), kontras cukup, font minimal 11 pt, tooltip berbahasa sederhana.
- **Wajib:** logo Gelar Rasa di setiap halaman (header kiri) dan *"Data sintetis — untuk tujuan kompetisi"* di footer.

### 11.2 Struktur 6 halaman + wireframe teks

**Halaman 1 — "Ringkasan 5 Detik" (Executive)**
```
[Logo] RESPIRA: Peringatan Dini Beban Kesehatan Polusi     [Filter: Periode | Pulau | Kelompok umur]
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Kasus dapat  │ Hari > baku  │ Wilayah      │ RS tekanan   │
│ dicegah (NSM)│ mutu (%)     │ siaga kini   │ tertinggi    │
│ ±X /minggu ▲ │ Y% (vs WHO)  │ N dari 27    │ RS-.. (Z%/bed)│
└──────────────┴──────────────┴──────────────┴──────────────┘
┌────────────── Peta 27 stasiun (warna ISPU, ukuran = kasus teratribusi) ─────┐  ┌─ "3 hal yang harus dilakukan minggu ini" ─┐
│                                                                              │  │ 1. Siaga RS-KTG.. (lag 2 hari)           │
│                                                                              │  │ 2. Imbauan balita Palembang              │
└──────────────────────────────────────────────────────────────────────────────┘  │ 3. Kalibrasi sensor ...                  │
[Strip kalender nasional: % stasiun > 55 per hari]                                └──────────────────────────────────────────┘
```

**Halaman 2 — "Kapan & Di Mana Kritis"**: kalender heatmap (stasiun × hari), diurnal line jam lokal (weekday vs weekend), small multiples bulanan per tipe situs (urban/roadside/industri/gambut/background), ladder WHO per stasiun, timeline episode (Gantt).

**Halaman 3 — "Mengapa" (Driver)**: polar plot per stasiun terpilih, scatter PM2.5 vs kecepatan angin (warna = RH), bar feature importance/partial dependence, boxplot tipe situs & jarak ke jalan, matriks korelasi polutan (rasio PM2.5/PM10 sebagai penanda asap).

**Halaman 4 — "Dampak Kesehatan & Kerentanan"**: **kurva lag** (%Δ per 10 µg/m³, lag −2..7 dengan batang plasebo) untuk balita vs lansia vs CVD/kematian; dual-axis time series PM2.5 vs admisi (dengan anotasi episode); bar ARC per skenario (slider counterfactual); rasio kerentanan balita/lansia.

**Halaman 5 — "Aksi: Kesiapan RS & Prioritas Jaringan"**: scorecard RS (bullet chart tekanan/bed vs P90), matriks 2×2 prioritas intervensi, peta IPS + tabel ranking dengan **slider bobot**, matriks redundansi.

**Halaman 6 — "Kepercayaan Data & Metodologi"**: heatmap capture rate (stasiun × bulan), funnel data (raw → valid), log konversi satuan & koreksi master data, definisi metric, asumsi & batasan.

### 11.3 Interaktivitas (rubrik 25 poin)

- Filter global yang konsisten (periode, pulau/region, tipe situs, kelompok umur) dan **tersimpan antarhalaman**.
- Cross-filter: klik stasiun di peta → semua chart terfilter; drill-through dari peta ke "profil stasiun".
- **Parameter threshold** (55 / 37,5 / 15) yang mengubah exceedance & ARC sekaligus. Ini fitur paling "wow" dan relevan.
- Tooltip "apa artinya & apa yang dilakukan" di setiap KPI.
- Tombol reset, navigasi tab/ikon, dan breadcrumb. Uji dengan orang awam: <3 klik untuk menjawab 5 pertanyaan kunci.

---

## 12. Guide Laporan (30 poin)

**Struktur (ikuti template panitia; isi berikut di dalamnya):**
1. **Latar belakang & user:** masalah respons terlambat, persona, dan JTBD (½ halaman).
2. **Data & preprocessing (10 poin):** tabel log data (raw → valid per stasiun), keputusan & alasan (aturan 18 jam, konversi satuan dengan rumus, zona waktu, koreksi master data, perlakuan qc_flag), serta dampak keputusan (sensitivity).
3. **EDA:** distribusi, missingness, musiman, korelasi, plus 3–5 temuan EDA yang *mengarahkan* model.
4. **Metodologi:** ISPU, baku mutu, model lag (spesifikasi lengkap), AF/ARC, IPS (bobot + sensitivity).
5. **Hasil & insight (10 poin):** tiap insight ditulis dengan format **Temuan → Bukti (angka + CI) → Makna → Rekomendasi aksi**.
6. **Rekomendasi** per user (Kemenkes/Dinkes, RS, KLH/DLH).
7. **Batasan:** data sintetis; tidak ada data populasi (tidak ada rate per kapita/population-weighted exposure); asosiasi ≠ kausalitas; kapasitas bed sebagian kosong; ekstrapolasi literatur hanya untuk plausibility.
8. **Kesimpulan** yang hanya mengklaim apa yang didukung data.

**Cara menulis kesimpulan yang aman:** gunakan "berasosiasi dengan", "konsisten dengan literatur", dan "dalam data sintetis ini". Hindari "menyebabkan". Sertakan CI dan istilah konsisten (PM2.5, bukan campur "pm 2,5"/"PM25").

---

## 13. Value Creation Nyata

| Value | Mekanisme | Cara kuantifikasi di dashboard |
|---|---|---|
| **Keputusan lebih cepat** | Lag puncak ISPA ~2 hari (Dominici 2006; diverifikasi di data) → peringatan sebelum pasien datang\[53\] | "Lead time rata-rata X hari" + jumlah hari siaga yang terpicu tepat waktu (backtest: berapa lonjakan admisi yang didahului alarm PM2.5) |
| **Kasus dapat dicegah** | Counterfactual 55/37,5/15 | ARC per wilayah & total; ARC balita sebagai headline |
| **Efisiensi sumber daya RS** | Surge plan berbasis tekanan per bed | Hari overload diprediksi vs aktual; RS dengan kapasitas tidak diketahui ditandai |
| **Prioritas investasi jaringan** | IPS + redundansi | "Relokasi 1 stasiun redundan ke wilayah gap mengurangi jarak rata-rata ke stasiun terdekat sebesar X km" |
| **Kualitas data** | Deteksi sensor bermasalah | % jam yang diselamatkan via konversi satuan; daftar sensor prioritas kalibrasi |

**Kalimat value (untuk halaman 1 & pitch):** *"Dashboard ini mengubah angka µg/m³ menjadi jumlah pasien, hari siaga, dan tempat tidur. Dengan begitu, Dinkes dan RS bergerak 48 jam lebih awal, dan anggaran stasiun berikutnya diarahkan ke tempat risiko tertinggi yang belum terlihat."*

---

## 14. Simulasi Review Juri & User, serta Revisi

*Catatan metode: review berikut adalah simulasi terstruktur dengan empat persona yang menilai draf v1 terhadap rubrik. Draf v1 adalah versi awal dokumen sebelum revisi: dashboard 6 halaman standar + model lag.*

| Persona | Skor v1 (perkiraan) | Kritik utama | Revisi yang dilakukan (v2 = dokumen ini) |
|---|---|---|---|
| **Juri data analytics** | Dashboard 52/70, Laporan 22/30 | "Struktur halaman mirip peserta lain; skor prioritas bobotnya arbitrer; terlalu banyak chart di halaman driver." | Menambahkan NSM tunggal, slider bobot + sensitivity IPS, judul-insight, pembatasan maks 4–5 visual per halaman, serta halaman 1 dengan "3 aksi minggu ini" |
| **Juri epidemiologi** | Validitas 6/10 | "Korelasi PM2.5–admisi tanpa kontrol tren & suhu bisa spurious; lag belum di-pool; tidak ada uji plasebo; hati-hati double count `resp` vs sub-kategori; kapasitas bed kosong jangan diimputasi diam-diam." | Menambahkan spesifikasi quasi-Poisson + spline waktu/suhu/dew point + DOW, pooling random-effects, lead −1/−2 sebagai plasebo, cek overlap kategori, flag "kapasitas tidak diketahui", dan bahasa asosiasi |
| **User primer (Ketua Tim Kerja Penyehatan Udara)** | Kegunaan 6/10 | "Saya tidak butuh ISPU per jam; saya butuh: wilayah mana, berapa pasien, RS mana, kapan. Istilah DLNM/β membingungkan." | KPI dalam satuan kasus & hari; tooltip bahasa awam; istilah teknis dipindah ke halaman 6; kotak "3 aksi minggu ini" |
| **Pejabat KLH/DLH** | Relevansi 7/10 | "Rekomendasi stasiun harus mempertimbangkan sensor low-cost & kalibrasi, dan jangan hanya menambah, pertimbangkan relokasi." | Komponen redundansi & capture rate dalam IPS; insight "IKU buta PM2.5"; rekomendasi relokasi vs penambahan |

**Iterasi kedua (v2), sisa celah:**
- *Data sintetis mungkin tidak memiliki efek lag yang jelas.* **Mitigasi:** jika tidak signifikan, tampilkan hasil apa adanya (CI melewati 0). Ubah narasi menjadi "data belum cukup untuk membuktikan, sistem tetap memakai threshold regulasi + parameter literatur untuk peringatan". Kejujuran ini dinilai tinggi oleh juri epidemiologi.
- *Mapping stasiun–RS mungkin tidak 1:1 sempurna.* **Mitigasi:** validasi via korelasi suhu dan tampilkan di halaman 6.
- **Skor perkiraan v2:** Dashboard 61–64/70, Laporan 26–28/30. Tidak ada celah besar tersisa selama eksekusi mengikuti checklist.

---

## 15. Mengapa Hasil Ini Layak JUARA & Standout

| Aspek | Peserta umum | Pendekatan ini | Rubrik terdampak |
|---|---|---|---|
| User | "Pemerintah & masyarakat" (kabur) | Satu persona dengan mandat nyata (Komite Kemenkes 2023) + JTBD + 5 pertanyaan | Pemahaman topik (15), mudah dipahami (10) |
| Struktur | 6 tujuan guidebook = 6 halaman chart | Alur keputusan Apa→Kapan→Mengapa→Dampak→Aksi→Kepercayaan, dengan judul-insight | Konsistensi informasi (10), navigasi (15) |
| Metric | Rata-rata PM2.5, ISPU, korelasi | NSM "kasus dapat dicegah", lead time, tekanan per bed, IPS dengan sensitivity | Pemahaman (15), insight laporan (10) |
| Kesehatan | Korelasi Pearson PM2.5 vs ISPA | Model lag terkontrol + pooling + plasebo + perbandingan literatur (Dominici, Orellano, Nhung) | Kesimpulan sesuai data (10) |
| Data quality | Drop NA | Satuan ppm→µg/m³ dengan rumus, zona waktu WITA/WIT, aturan 18 jam EPA, koreksi master data, log | Preprocessing & EDA (10) |
| Desain | Banyak chart, warna acak | Palet ISPU resmi + 2 warna fungsi, grid tetap, judul-insight, maks 4–5 visual per halaman | Mudah dipahami (10), desain (5), konsistensi (5) |
| Interaktivitas | Filter tanggal | Slider counterfactual & bobot, cross-filter, drill-through | Fitur interaktif (10) |
| Kebijakan | Rekomendasi generik | "IKU buta PM2.5", relokasi vs tambah stasiun, kalender siaga Juli–Oktober | Pemahaman (15) |
| Kejujuran | Klaim kausal | Batasan eksplisit, label ilustratif, CI | Kesimpulan (10), kerapian (5) |

**Satu kalimat pitch final:** *"Kami tidak membuat dashboard yang menunjukkan udara kotor. Kami membuat dashboard yang memberi tahu Kemenkes berapa anak yang akan sakit, kapan, di RS mana, dan bagaimana mencegahnya."*

---

## 16. Checklist Eksekusi Prioritas, Risiko & Mitigasi

### 16.1 Jika waktu sangat terbatas ("Checklist 6 jam", berlaku hari deadline)

| Jam | Tugas | Wajib/opsional |
|---|---|---|
| 0–1 | Load 27 file, join master, konversi satuan, zona waktu, aturan 18 jam → tabel harian | **Wajib** |
| 1–2 | Metrik paparan: % hari > 55, ISPU, kalender heatmap, diurnal, episode | **Wajib** |
| 2–3 | Model lag sederhana per outcome (quasi-Poisson + spline waktu + suhu + DOW), pooling rata-rata tertimbang; ARC skenario 55 | **Wajib** |
| 3–4 | Halaman 1 (KPI + peta + 3 aksi), Halaman 2, Halaman 4 | **Wajib** |
| 4–5 | Halaman 5 (scorecard RS + IPS), Halaman 6 (completeness) | Wajib-ringan |
| 5–6 | Laporan PDF sesuai template, logo, uji link publik (mode incognito), submit **sebelum 23.00 WIB** | **Wajib** |
| Setelah lolos | DLNM, polar plot, slider bobot, plasebo lengkap, polishing untuk final 28 November | Opsional |

### 16.2 Risiko & mitigasi utama

- **Link tidak publik:** uji di incognito, siapkan link cadangan.
- **Konversi satuan salah (angka 1000×):** bandingkan median vs baseline_pm25 & tetangga, tampilkan log konversi.
- **Efek lag tidak signifikan:** laporkan jujur dan tetap pakai threshold regulasi untuk peringatan.
- **Double counting & bed kosong:** cek overlap `resp`; flag "tidak diketahui", jangan imputasi.
- **Dashboard lambat:** pre-aggregate di Python, jangan muat data per jam mentah ke tool BI.

---

## Caveats

- **Data sintetis:** pola di dataset belum tentu mencerminkan Indonesia nyata. Semua angka eksternal dipakai sebagai konteks, threshold, dan plausibility check, bukan input analisis.
- **Sebagian angka 2026** (283.270 kasus ISPA, >3 juta terpapar, luas karhutla Januari–Juli 2026) berasal dari pemberitaan/blog yang mengutip Kemenkes/Kemenhut/iNews.\[5\]\[24\]\[26\] Perlakukan sebagai konteks dan sebutkan sumber sekundernya. Angka luas karhutla 2023 diperdebatkan (KLHK vs Greenpeace), jadi tampilkan sebagai rentang.\[58\]
- **Baku mutu NO2/O3 dan periode rata-rata gas pada ISPU** wajib diverifikasi langsung dari Lampiran PP 22/2021 dan Permen LHK 14/2020 sebelum dipakai sebagai garis threshold.
- **Efek literatur** (Dominici 2006 untuk lansia ≥65 di AS; Nhung 2017 untuk anak <18; Orellano 2020 untuk kematian) berasal dari populasi berbeda.\[53\]\[55\]\[57\] Pakai hanya untuk pembanding, bukan untuk menggantikan estimasi dari data.
- **Simulasi review juri** adalah evaluasi terstruktur berbasis rubrik, bukan penilaian juri sebenarnya. Skor adalah perkiraan. **Intelijen kompetitor** didasarkan pada satu repositori publik; fokuslah pada pembeda substantif, bukan sekadar fitur.\[9\]

## Sumber

1. [Kasus ISPA Meningkat Jadi 200.000 di Jabodetabek hingga Agustus, akibat Polusi Udara](https://nasional.kompas.com/read/2023/08/28/12573491/kasus-ispa-meningkat-jadi-200000-di-jabodetabek-hingga-agustus-akibat-polusi)
2. [ISPA Terkait Polusi Udara Jabodetabek Naik, di Atas 200 Ribu Kasus per Bulan](https://www.liputan6.com/health/read/5382257/ispa-terkait-polusi-udara-jabodetabek-naik-di-atas-200-ribu-kasus-per-bulan)
3. [Penderita ISPA Akibat Karhutla Tembus 919 Ribu Orang](https://www.cnnindonesia.com/nasional/20190923160933-20-433052/penderita-ispa-akibat-karhutla-tembus-919-ribu-orang)
4. [Penderita ISPA Akibat Karhutla Tembus 919 Ribu Orang](https://www.iniriau.com/detail/11895/penderita-ispa-akibat-karhutla-tembus-919-ribu-orang)
5. [Kasus ISPA Akibat Karhutla, Waspadai Kabut Asap](https://human-initiative.org/kasus-ispa-akibat-karhutla/)
6. [i COVER](https://ppkl.menlhk.go.id/website/filebox/1017/250224111027LKj%20Dit%20PPU.pdf)
7. [CDC's 'Heat & Health Tracker' and 'Tracking Network': Precision Tools for Informed Climate Decision Making](https://proceedings.battelle.org/index.cfm/item/30620)
8. [Heat & Heat-related Illness](https://www.cdc.gov/environmental-health-tracking/php/data-research/heat-heat-related-illness.html)
9. [GitHub - AriyaZuhdiIsmail/napas-yang-bagus · GitHub](https://github.com/AriyaZuhdiIsmail/napas-yang-bagus)
10. [World's most polluted countries & regions](https://www.iqair.com/in-en/world-most-polluted-countries)
11. [2023 World Air Quality Report](https://www.greenpeace.org/static/planet4-india-stateless/2024/03/44a856c8-2023_world_air_quality_report.pdf)
12. [2024 World Air Quality Report](https://www.greenpeace.org/static/planet4-chile-stateless/2025/03/edf90b7a-2024_world_air_quality_report_vf.pdf)
13. [May 10, 2026: Jakarta among top 10 most polluted cities in the world](https://www.iqair.com/hk-en/newsroom/jakarta-among-top-10-most-polluted-cities-in-the-world-5-10-2026)
14. <https://aqli.epic.uchicago.edu/files/Indonesia%20FactSheet_2025.pdf>
15. [Mencari Sumber Polusi di Udara melalui Source Apportionment - Jakarta Rendah Emisi](https://rendahemisi.jakarta.go.id/article/37/mencari-sumber-polusi-di-udara-melalui-source-apportionment)
16. [Work From Home (WFH) and other gimmicks cannot clear Jakarta’s air](https://energyandcleanair.org/work-from-home-wfh-and-other-gimmicks-cannot-clear-jakartas-air/)
17. [Press release Work From Home (WFH) policy not capable of clearing Jakarta's air](https://energyandcleanair.org/wp/wp-content/uploads/2023/08/Press-release_CREA_Jakarta-AQ-WFH_08.2023_EN.pdf)
18. [New Study: Clean Air Action in Jakarta Could Protect 10,000 Lives and Save Billions in Health Expenditures - Vital Strategies](https://www.vitalstrategies.org/new-study-clean-air-action-in-jakarta-could-protect-10000-lives-and-save-billions-in-health-expenditures/)
19. [Menolak Lupa Karhutla 2015: 24 Orang Meninggal, Kerugian Negara Rp 200 Triliun](https://nasional.kompas.com/read/2026/08/11/10504551/menolak-lupa-karhutla-2015-24-orang-meninggal-kerugian-negara-rp-200-triliun?page=all)
20. [Riset Ungkap Perkiraan Kematian Dampak Asap Karhutla 2015 Capai 100 Ribu Orang](https://mongabay.co.id/2016/09/19/temuan-mencengangkan-riset-ungkap-perkiraan-kematian-dampak-asap-karhutla-2015-capai-100-ribu-orang/)
21. [Penderita ISPA Akibat Karhutla di Sumatera dan Kalimantan Mencapai 919 Ribu Orang](https://www.voaindonesia.com/a/penderita-ispa-akibat-karhutla-di-sumatera-dan-kalimantan-mencapai-919-ribu-orang-/5095381.html)
22. [Siapa Mangsa Karhutla](https://interaktif.tempo.co/elnino/dampak-karhutla-el-nino-2023-terhadap-satwa-liar)
23. [Bagai Api Dalam "Sekam" Data - Greenpeace Indonesia](https://www.greenpeace.org/indonesia/laporan/59567/karhutla-kronis/)
24. [Penyebab Kabut Asap 2026: Fenomena El Nino Kuat Menurut BMKG](https://blog.itera.ac.id/penyebab-kabut-asap-2026-fenomena-el-nino-kuat-menurut-bmkg/)
25. [Kabut asap Asia Tenggara 2026 - Wikipedia bahasa Indonesia, ensiklopedia bebas](https://id.wikipedia.org/wiki/Kabut_asap_Asia_Tenggara_2026)
26. [El Niño 2026: Apa Itu, Penyebab dan Dampaknya terhadap Cuaca Indonesia](https://blog.itera.ac.id/el-nino-2026-apa-itu-penyebab-dan-dampaknya-terhadap-cuaca-indonesia/)
27. [Langit Sumatera Berselimut Asap: Karhutla, Isu Lingkungan Paling Menonjol di Indonesia Saat Ini](https://fpips.upi.edu/langit-sumatera-berselimut-asap-karhutla-isu-lingkungan-paling-menonjol-di-indonesia-saat-ini/)
28. [Karhutla Indonesia 2026: Dampak El Nino dan Lemahnya Pencegahan](https://www.mediakompeten.co.id/karhutla-el-nino-pencegahan-lingkungan)
29. [Baku Mutu Udara Ambien Nasional & Kewajibannya](https://www.giwangkanaka.co.id/baku-mutu-udara-ambien/)
30. [KAN Mitralab Ambien - Lampiran VII Salinan PP Nomor 22 Tahun 2021](https://id.scribd.com/document/996824105/KAN-Mitralab-Ambien-Lampiran-VII-Salinan-PP-Nomor-22-Tahun-2021)
31. [Uji PM10 Udara Ambien 1 Jam: Cukup?](https://lab.id/pengukuran-debu-1-jam-di-udara-ambien-apakah-memenuhi-syarat-regulasi/)
32. [Baku Mutu Udara Ambien Nasional PP No. 22 Tahun 2021](https://lab.id/baku-mutu-udara-ambien-nasional-terbaru/)
33. [WHO Global Air Quality Guidelines 2021](https://iiasa.ac.at/sites/default/files/2025-02/WHO%20global%20air%20quality%20guidelines%202021_%20Setting%20ambitious%20goals%20for%20air%20quality%20to%20protect%20public%20health.pdf)
34. [WHO air quality guidelines](https://www.c40knowledgehub.org/s/article/WHO-Air-Quality-Guidelines?language=en_US)
35. [WHO Global Air Quality Guidelines 2021 Explained](https://airscan.org/insights/iaq-testing/new-who-air-quality-guidelines-2021/)
36. [8 Bab II Tinjauan Pustaka II.1 Parameter Pencemar Udara Partikulat](https://digilib.itb.ac.id/assets/files/2024/QkFCIElJLnBkZg46.pdf)
37. [Cara Menghitung ISPU Kualitas Udara Sesuai Permen LHK](https://argatech.com/cara-menghitung-ispu-sensor-aqms/)
38. [Permen lhk nomor 14 tahun 2020](https://www.slideshare.net/slideshow/permen-lhk-nomor-14-tahun-2020/250526280)
39. [BAB II LANDASAN TEORI](https://kc.umn.ac.id/20068/8/BAB_II.pdf)
40. [AQI Hub Indonesia (ISPU)](https://aqihub.info/indices/indonesia)
41. [RINGKASAN EKSEKUTIF PENYUSUNAN INDEKS KUALITAS LINGKUNGAN HIDUP](https://lingkunganhidup.jakarta.go.id/uploads/images/galery/iklh-2023-ringkasan_20250702125606.pdf)
42. [IKLH Provinsi Aceh Tahun 2021 - Flip eBook Pages 1-50](https://anyflip.com/dcjwg/wkaq/basic/)
43. [indeks kualitas lingkungan hidup](https://dlh.acehtimurkab.go.id/media/2024.02/iklh_20231.pdf)
44. [ISPU KHUSUS KAWASAN](https://ispu.kemenlh.go.id/kawasan/)
45. [GreenTeams dan KLHK Pasang 60 Pemantau Kualitas Udara Tambahan di Berbagai Lokasi Rawan Polusi](https://www.tempo.co/lingkungan/greenteams-dan-klhk-pasang-60-pemantau-kualitas-udara-tambahan-di-berbagai-lokasi-rawan-polusi-12801)
46. [Air Pollution in Indonesia: Understanding the Crisis and How to Protect Yourself](https://breathesafeair.com/air-pollution-in-indonesia/)
47. [Portal Belajar › FAQ - Jakarta Rendah Emisi](https://rendahemisi.jakarta.go.id/learn)
48. [Climate Change](https://www.cdc.gov/environmental-health-tracking/php/data-research/climate-change.html)
49. [eCFR :: Appendix N to Part 50, Title 40 -- Interpretation of the National Ambient Air Quality Standards for PM2.5](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-50/appendix-Appendix%20N%20to%20Part%2050)
50. [Indonesia Air Quality Alert](https://www.iqair.com/ca/newsroom/indonesia-air-quality-alert)
51. [Estimates of global mortality burden associated with short-term exposure to fine particulate matter (PM2·5) - The Lancet Planetary Health](<https://www.thelancet.com/journals/lanplh/article/PIIS2542-5196(24)00003-2/fulltext>)
52. [Health Effects of Short-Term Exposure to PM, NO2 & O3 October 2022](https://www.phfscience.nz/media/cypfq3aq/esr-environmental-health-report-health-effects-short-term-exposure-pm-no2-o3.pdf)
53. <https://web.pdx.edu/~ito/fine%20particulate.pdf>
54. [Effect of ambient air pollution on hospital admission for respiratory diseases in Hanoi children during 2007–2019 - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0013935123024374)
55. [Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1016/j.envpol.2017.07.063&amp=&pmid=28763933)
56. [Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1016%2Fj.envint.2020.105876&amp=&pmid=32590284)
57. [Google Scholar](<https://scholar.google.com/scholar_lookup?title=Short-term+exposure+to+particulate+matter+(PM10+and+PM2.5),+nitrogen+dioxide+(NO2),+and+ozone+(O3)+and+all-cause+and+cause-specific+mortality:+Systematic+review+and+meta-analysis&amp=&author=P.+Orellano&amp=&author=J.+Reynoso&amp=&author=N.+Quaranta&amp=&author=A.+Bardach&amp=&author=A.+Ciapponi&amp=&publication_year=2020&amp=&journal=Environ.+Int.&amp=&pages=105876&amp=&doi=10.1016/j.envint.2020.105876&amp=&pmid=32590284>)
58. [Klaim Penurunan Karhutla, Prestasi atau Ilusi? - Greenpeace Indonesia](https://www.greenpeace.org/indonesia/cerita/59281/klaim-penurunan-karhutla-prestasi-atau-ilusi/)
