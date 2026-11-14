# Setup JERNIH

Tiga lapis: **pipeline data** (Python) → **datamart** (PostgreSQL) → **web** (Next.js, dashboard + API chatbot).
Dashboard bisa jalan tanpa database; chatbot Tanya Data butuh database dan kunci API.

## 0. Prasyarat

| Alat | Versi | Untuk |
|---|---|---|
| Node.js | 20+ (diuji 22) | web |
| Python + [uv](https://docs.astral.sh/uv/) | 3.12 | pipeline data |
| PostgreSQL | 15+ (diuji 16) | datamart & riwayat chat |

## 1. Pipeline data (hanya bila data mentah berubah)

Letakkan folder `Dataset DA Gelar Rasa 2026/` di root repo (tidak ikut di-commit).

```bash
cd analysis
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python pandas numpy scipy statsmodels scikit-learn pyarrow "psycopg[binary]"
.venv/bin/python 01_clean.py            # data per jam bersih  -> out/hourly_clean.parquet, out/dq_log.csv
.venv/bin/python 02_daily.py            # grain stasiun-RS x hari -> out/fact_station_day.parquet
.venv/bin/python 03_health_model.py     # Poisson GLM, kasus berlebih -> out/attributable.parquet
.venv/bin/python 04_network_cluster.py  # jarak, redundansi, k-means tipe wilayah
.venv/bin/python 06_export_dashboard.py # JSON dashboard -> web/public/data/dashboard.json
.venv/bin/python 07_build_datamart.py   # tabel datamart -> datamart/data/*.csv|parquet
```

Alur pembaruan bulanan: tambahkan file AQMS dan kesehatan baru → jalankan ulang 01–07 → muat ulang datamart (langkah 2) → deploy ulang web.

## 2. Datamart (PostgreSQL)

**Lokal (Homebrew/apt):**
```bash
createdb jernih
export DATABASE_URL=postgresql://$USER@localhost:5432/jernih
analysis/.venv/bin/python datamart/load_postgres.py   # buat schema mart & app, isi 17 tabel
psql jernih -c "select count(*) from mart.v_station_month;"   # 918
```

**Production (gratis):** buat database di [Neon](https://neon.tech) atau Supabase, salin connection string (pakai `sslmode=require`), lalu jalankan `load_postgres.py` dengan `DATABASE_URL` tersebut dari laptop.

`load_postgres.py` idempoten: mengosongkan schema `mart` lalu mengisi ulang, tanpa menyentuh riwayat chat di schema `app`.

## 3. Web (Next.js)

```bash
cd web
npm install
cp .env.example .env      # lalu isi sendiri; file .env tidak di-commit
npm run dev               # http://localhost:3000
```

Isi `.env`:

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | untuk chatbot | sama dengan langkah 2 |
| `LLM_PROVIDER` | untuk chatbot | `openai` atau `deepseek` |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | bila `openai` | model chat yang mendukung tool calling di akun Anda |
| `DEEPSEEK_API_KEY` | bila `deepseek` | `DEEPSEEK_MODEL` default `deepseek-chat`, `DEEPSEEK_BASE_URL` default `https://api.deepseek.com` |

Ganti provider cukup dengan mengubah `LLM_PROVIDER` lalu restart server.

**Logo panitia:** simpan sebagai `web/public/brand/logo-gelar-rasa.png`. Tanpa file ini sidebar menampilkan `[LOGO]` dan browser mencatat 404 untuk logo.

### Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build && npm start` | build & jalankan production |
| `npm run typecheck` | cek TypeScript |
| `npm run lint` | ESLint |
| `DATABASE_URL=... npm run test:tools` | uji semua tool semantic layer ke database (tanpa LLM) |

## 4. Deploy (Vercel)

1. Push repo ke GitHub (pastikan `.gitignore` root aktif; cek `git status` tidak memuat `Pendaftaran/`, `Dataset…/`, `Reference/`, `.env`).
2. Di Vercel: **New Project → import repo → Root Directory = `web`**.
3. Tambahkan Environment Variables yang sama dengan `.env` (Production + Preview).
4. Deploy. Dashboard bersifat statis; `/api/chat*` berjalan sebagai serverless function.
5. Uji di jendela incognito: buka `/ringkasan`, lalu Tanya Data → “RS mana paling tertekan saat musim asap 2026?”.

## 5. Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| “Data gagal dimuat” | `web/public/data/dashboard.json` tidak ada | jalankan `06_export_dashboard.py` |
| Tanya Data: “DATABASE_URL belum diatur” | env kosong | isi `.env`, restart |
| Tanya Data: “OPENAI_API_KEY belum diatur” | provider `openai` tanpa kunci | isi kunci atau ganti `LLM_PROVIDER=deepseek` |
| `relation "mart.v_station_month" does not exist` | datamart belum dimuat | langkah 2 |
