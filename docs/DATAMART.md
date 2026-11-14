# DATAMART · SIAGA NAPAS

Dibangun oleh `analysis/07_build_datamart.py` → `datamart/data/*.csv|parquet` → dimuat ke PostgreSQL oleh `datamart/load_postgres.py` (schema `mart`).

## Grain
| Lapis | Grain | Lokasi |
|---|---|---|
| Mentah | baris file AQMS | `Dataset…/` (tidak di-commit) |
| Bersih | stasiun × jam (grid penuh, µg/m³, WIB + jam lokal) | `analysis/out/hourly_clean.parquet` |
| **Inti** | **stasiun-RS × tanggal lokal** | `mart.fact_station_day` |
| Dashboard & chatbot | stasiun × bulan | `mart.fact_station_month`, `mart.v_station_month` |

Waktu adalah dimensi utama (`dim_month`: tahun, bulan, musim asap), karena data diperbarui bulanan dan pengguna bekerja per periode siaga.

## Tabel
| Tabel | Baris | Isi |
|---|---|---|
| `dim_station` | 27 | stasiun + sensor + RS (kelas, TT), pulau, provinsi peta, tipe wilayah, zona waktu |
| `dim_province` | 34 | provinsi peta, jumlah stasiun |
| `dim_month` | 34 | Jan 2024 – Okt 2026, flag musim asap |
| `fact_station_day` | 27.486 | PM2.5/PM10/SO2/NO2 24 jam, CO & O3 maks 8 jam, ISPU + kategori + parameter kritis, jam valid, flag hari valid & melebihi 55, cuaca, 7 outcome RS |
| `fact_station_month` | 918 | PM2.5 tertimbang hari valid, hari valid, hari > 55, hari ISPU > 200, kasus teramati |
| `fact_excess_station_month` | 23.548 | kasus berlebih per outcome × acuan (15/25/37,5/55) |
| `fact_excess_band_month` | 589 | kasus berlebih (balita + lansia, acuan 25) per pita PM2.5 |
| `agg_diurnal`, `agg_wind_sector` | 192, 216 | pola jam (lokal, hari kerja/akhir pekan), PM2.5 per arah angin |
| `model_*` | – | kurva dosis-respons, event study, % per berlipat dua, importance, tipe wilayah |
| `station_quality`, `station_pair`, `dq_log` | 27, 300, 128 | capture rate, masalah, IKU, tekanan RS; korelasi & jarak antarstasiun; log preprocessing |

## View semantik (dibaca chatbot)
- `mart.v_station_month`: satu baris per stasiun × bulan, semua ukuran aditif + atribut stasiun + kalender. Kolom kasus berlebih dipivot: `excess_{u5|o60}_t{15|25|55}`.
- `mart.v_station_profile`: atribut stasiun + kualitas + tipe wilayah.

## Definisi metrik (agregasi yang benar)
| Metrik | Rumus |
|---|---|
| PM2.5 rata-rata | Σ(pm25_mean × valid_days) / Σ valid_days |
| Kasus berlebih | Σ excess (tanpa JMB-02 & MER-01: tidak ada hari valid) |
| Porsi terkait PM2.5 | Σ excess / Σ kasus teramati × 100 (kelompok sama) |
| % hari > 55 | Σ exceed_days / Σ valid_days × 100 |
| Tekanan RS | resp / TT × 100 per hari; puncak = maks rata-rata 7 hari |

Validasi: `select sum(excess_u5_t25), sum(excess_u5_t55) from mart.v_station_month` = 56.354 dan 16.215 (sama dengan EDA).

## Aturan preprocessing
Lihat `docs/EDA.md` bagian 3 (R0–R10): string error & sentinel, timestamp 1970, clock drift, data 15 menit, konversi ppm, hanya VALID, batas fisik, grid jam penuh, **sensor macet ≥ 6 jam**, hari valid ≥ 18 jam, jam lokal untuk pola harian.
