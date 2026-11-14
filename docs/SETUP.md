# Setup SIAGA NAPAS

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

**Production (gratis):** Supabase, ikuti `docs/DEPLOY.md` bagian A.

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
| `OPENAI_API_KEY`, `OPENAI_MODEL` | bila `openai` | `OPENAI_MODEL` = **ID API persis** dari halaman Models OpenAI (bukan nama pemasaran), harus mendukung Chat Completions + tool calling |
| `LLM_REASONING_EFFORT` | untuk gpt-5.x | isi `none`; tanpa ini model reasoning menolak tool di Chat Completions |
| `LLM_TEMPERATURE` | opsional | kosongkan untuk model reasoning yang menolak `temperature`; isi `0` bila model mendukung |
| `OPENAI_BASE_URL` | opsional | gateway kompatibel OpenAI |
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

## 4. Database online & deploy

Langkah lengkap (Supabase + Vercel, env, uji incognito, biaya, troubleshooting): **[`docs/DEPLOY.md`](DEPLOY.md)**.
Tanpa Python, datamart bisa dimuat dengan `DATABASE_URL=... bash datamart/load_psql.sh`.

## 5. Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| “Data gagal dimuat” | `web/public/data/dashboard.json` tidak ada | jalankan `06_export_dashboard.py` |
| Tanya Data: “DATABASE_URL belum diatur” | env kosong | isi `.env`, restart |
| Tanya Data: “OPENAI_API_KEY belum diatur” | provider `openai` tanpa kunci | isi kunci atau ganti `LLM_PROVIDER=deepseek` |
| Galat `model_not_found` / 404 | `OPENAI_MODEL` bukan ID API yang tersedia di akun | salin ID persis dari halaman Models |
| Galat `Function tools with reasoning_effort are not supported` | model reasoning | `LLM_REASONING_EFFORT=none` |
| Galat `Unsupported parameter: 'temperature'` | model hanya menerima suhu default | kosongkan `LLM_TEMPERATURE` |
| `relation "mart.v_station_month" does not exist` | datamart belum dimuat | langkah 2 |
