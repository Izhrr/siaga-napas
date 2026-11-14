# SIAGA NAPAS · Sistem Intelijen Antisipasi Gangguan Napas

Dashboard web untuk lomba Dashboard Analysis Gelar Rasa 2026. SIAGA NAPAS menghubungkan PM2.5 dari 27 stasiun AQMS dengan rawat inap di 27 RS rujukan, lalu menerjemahkannya menjadi aksi untuk tim surveilans kesehatan lingkungan.

> Pesan inti: sepertiga rawat inap ISPA balita dan lansia berasosiasi dengan PM2.5 di atas 25 µg/m³, dan lebih dari sepertiganya terjadi di hari yang lolos baku mutu harian 55.

## Struktur repo

| Folder | Isi |
|---|---|
| `analysis/` | Pipeline Python: profil data mentah, pembersihan, agregasi harian, model kesehatan, klaster, ekspor datamart & JSON dashboard |
| `datamart/` | `schema.sql` (PostgreSQL), `load_postgres.py`, `data/` (tabel CSV/Parquet hasil build) |
| `web/` | Aplikasi Next.js: dashboard 5 halaman + API Tanya Data (chatbot) |
| `docs/` | EDA, brainstorm, PRD, FRONTEND, BACKEND, CHATBOT, DATAMART, SETUP |
| `mockup/` | Mock HTML awal (referensi tata letak, tidak dipakai di production) |
| `assets/` | Basemap provinsi (BAKOSURTANAL) dan aset brand |

Folder yang **tidak** masuk repo (lihat `.gitignore`): `Pendaftaran/`, `Dataset DA Gelar Rasa 2026/`, `Guidebook/`, `Reference/`, `.env`.

## Mulai cepat

```bash
# 1. Dashboard saja (tanpa chatbot): data statis sudah ada di web/public/data/
cd web && npm install && npm run dev        # http://localhost:3000

# 2. Chatbot Tanya Data: butuh PostgreSQL + kunci API
#    ikuti docs/SETUP.md (datamart, .env, provider OpenAI/DeepSeek)
```

## Dokumen

- [`docs/SETUP.md`](docs/SETUP.md): setup lokal · [`docs/DEPLOY.md`](docs/DEPLOY.md): database online (Supabase) & deploy (Vercel)
- [`docs/PRD.md`](docs/PRD.md): tujuan, pengguna, ruang lingkup, kriteria sukses
- [`docs/FRONTEND.md`](docs/FRONTEND.md) · [`docs/BACKEND.md`](docs/BACKEND.md) · [`docs/CHATBOT.md`](docs/CHATBOT.md) · [`docs/DATAMART.md`](docs/DATAMART.md)
- [`docs/EDA.md`](docs/EDA.md): temuan, keputusan preprocessing, grain data

Panduan memilih grafik: https://www.datawrapper.de/blog/chart-types-guide
