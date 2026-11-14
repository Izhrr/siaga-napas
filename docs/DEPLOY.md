# Panduan Database (Supabase) & Deployment (Vercel) · SIAGA NAPAS

Dari nol sampai link publik. Perkiraan waktu ±30 menit. Semua gratis untuk skala lomba.

```
Browser ──► Vercel (Next.js: halaman dashboard statis + /api/chat)
                 │                                   │
                 │ DATABASE_URL (Transaction pooler) │ OPENAI_API_KEY
                 ▼                                   ▼
        Supabase PostgreSQL                      OpenAI API
        schema mart = datamart (dibaca)
        schema app  = riwayat chat (dibaca/ditulis)
```

Dashboard tetap tampil walau database atau OpenAI bermasalah. Yang membutuhkan keduanya hanya **Tanya Data AI**.

Yang perlu disiapkan: akun GitHub (repo `jernih-gelarrasa` sudah ada), kunci OpenAI, dan `psql` di laptop (`brew install libpq && brew link --force libpq`, atau pakai Postgres Homebrew yang sudah terpasang).

---

## Bagian A · Supabase

### A1. Buat project
1. Buka https://supabase.com → **Start your project** → login dengan GitHub.
2. Buat **Organization** bila diminta (nama bebas, plan **Free**).
3. **New project**:
   - Name: `siaga-napas`
   - Database Password: klik **Generate a password**, lalu **simpan di password manager**. Password ini tidak bisa dilihat lagi (hanya bisa di-reset).
   - Region: **Southeast Asia (Singapore)**.
4. Klik **Create new project** dan tunggu ±2 menit sampai statusnya hijau.

### A2. Ambil connection string
Klik tombol **Connect** di bagian atas dashboard project → tab **Connection String** → tipe **URI**. Ada tiga pilihan; yang dipakai **dua**:

| Pilihan | Host & port | Dipakai untuk | Alasan |
|---|---|---|---|
| Direct connection | `db.<ref>.supabase.co:5432` | boleh untuk laptop **bila jaringan Anda mendukung IPv6**; **tidak untuk Vercel** | hanya IPv6 di plan gratis; fungsi Vercel tidak punya IPv6 |
| **Session pooler** | `aws-0-ap-southeast-1.pooler.supabase.com:5432` | memuat datamart dari laptop (A3) | IPv4, mendukung `\copy` dan transaksi panjang |
| **Transaction pooler** | `aws-0-ap-southeast-1.pooler.supabase.com:6543` | Vercel (B3) | cocok untuk serverless; aplikasi sudah mematikan prepared statement (`prepare: false`) |

Bentuknya:
```
postgresql://postgres.<ref>:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```
- Ganti `[YOUR-PASSWORD]` dengan password dari A1.
- Tambahkan `?sslmode=require` di akhir.
- Bila password mengandung karakter `@ : / ? # %`, ganti dengan versi URL-encoded (`@` → `%40`, `#` → `%23`, `%` → `%25`) atau reset password menjadi huruf dan angka saja (Project Settings → Database → Reset database password).

Simpan dua string ini sementara di terminal (jangan di file yang di-commit):
```bash
export SB_SESSION='postgresql://postgres.<ref>:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require'
export SB_TX='postgresql://postgres.<ref>:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require'
psql "$SB_SESSION" -c "select version();"     # harus menampilkan PostgreSQL 15/17 ...
```

### A3. Muat datamart
Dari root repo (data sudah ada di `datamart/data/`, 17 tabel ±7 MB):
```bash
DATABASE_URL="$SB_SESSION" bash datamart/load_psql.sh
```
Skrip membuat schema `mart` dan `app`, mengisi 17 tabel, lalu mencetak jumlah baris dan validasi. Hasil yang benar diakhiri:
```
Validasi (harus 56354 | 16215):
56354|16215
```
Bila connection string disimpan di `web/.env` sebagai `CONNECTION_STRING`, jalankan tanpa menyalin rahasia ke terminal: `cd web && node scripts/with-supabase.mjs session -- bash ../datamart/load_psql.sh`.
Skrip aman diulang: isi `mart` diganti, riwayat chat di `app` tidak disentuh. (Alternatif dengan Python: `DATABASE_URL="$SB_SESSION" analysis/.venv/bin/python datamart/load_postgres.py`.)

### A4. Cek di Supabase
- **Table Editor** → dropdown schema di kiri atas → pilih `mart`: terlihat 17 tabel.
- **SQL Editor** → jalankan:
  ```sql
  select count(*) from mart.v_station_month;  -- 918
  select count(*) from app.chat_message;      -- 0
  ```

### A5. Keamanan (cukup dicek, tidak perlu diubah)
- Schema `mart` dan `app` **tidak** diekspos ke Data API Supabase (yang diekspos hanya `public`), jadi data hanya bisa diakses lewat connection string. Jangan menambahkan keduanya di Project Settings → API → Exposed schemas.
- Peringatan RLS di Security Advisor untuk schema `public` bisa diabaikan: aplikasi tidak memakai `public`.
- Opsional untuk production: buat role khusus baca untuk datamart (contoh di akhir `datamart/schema.sql`).

---

## Bagian B · Vercel

### B1. Push ke GitHub
```bash
git status --short     # TIDAK boleh muncul: Pendaftaran/, Dataset DA…/, Guidebook/, Reference/, web/.env
git add -A && git commit -m "feat: dashboard SIAGA NAPAS" && git push
```
Yang **harus** ikut: `web/public/data/dashboard.json`, `web/public/brand/`, `web/public/guide/`, `datamart/`.

### B2. Import project
1. https://vercel.com → **Continue with GitHub** → izinkan akses ke repo `jernih-gelarrasa`.
2. **Add New… → Project** → pilih repo → **Import**.
3. **Root Directory → Edit → `web`** (wajib).
4. Framework Preset terdeteksi **Next.js**; Build & Install Command biarkan default.

### B3. Environment Variables
Di layar yang sama buka **Environment Variables**, tambahkan (berlaku untuk Production dan Preview):

| Key | Value |
|---|---|
| `DATABASE_URL` | isi `$SB_TX` (**Transaction pooler**, port 6543) |
| `LLM_PROVIDER` | `openai` |
| `OPENAI_API_KEY` | kunci OpenAI Anda |
| `OPENAI_MODEL` | `gpt-5.6-terra` |
| `LLM_REASONING_EFFORT` | (opsional; otomatis `none` untuk gpt-5.x) |

Jangan isi `NEXT_DIST_DIR` (hanya untuk verifikasi lokal). `LLM_TEMPERATURE` dan `OPENAI_BASE_URL` tidak perlu.

### B4. Deploy
Klik **Deploy**. Build ±1–2 menit. Setelah selesai:
1. **Settings → Functions → Function Region**: samakan dengan region di host pooler Supabase (`ap-southeast-1` → **Singapore sin1**, `ap-northeast-1` → **Tokyo hnd1**), lalu **Deployments → ⋯ → Redeploy**.
2. **Settings → Deployment Protection → Vercel Authentication → Disabled** (untuk Production). Tanpa ini juri diminta login.
3. **Settings → Domains**: ganti ke nama yang mudah dibaca, mis. `siaga-napas.vercel.app`.

### B5. Uji di jendela incognito
1. Buka `https://<domain>.vercel.app` → otomatis ke `/ringkasan`; logo, peta, dan filter tampil.
2. Buka **Panduan** → screenshot tiap halaman tampil.
3. **Tanya Data AI** → klik "RS mana paling tertekan saat musim asap 2026?" → jawaban dan grafik dalam ±5 detik.
4. Tutup panel, buka lagi → **Riwayat** memuat percakapan tadi. Cek juga di Supabase: `select count(*) from app.chat_message;` bertambah 2.

---

## Bagian C · Operasional

### Supabase gratis "tidur" setelah 7 hari tanpa aktivitas
Project yang tidak dipakai 7 hari akan di-pause dan harus di-**Restore** manual dari dashboard Supabase (±2 menit). Selama masa penilaian:
- Buka dashboard dan tanya satu pertanyaan di Tanya Data minimal sekali seminggu, **atau**
- cek dashboard Supabase H-1 sebelum penjurian/presentasi.

### Pembaruan data
```bash
# 1. pipeline (docs/SETUP.md bagian 1) -> memperbarui web/public/data/ dan datamart/data/
DATABASE_URL="$SB_SESSION" bash datamart/load_psql.sh   # 2. muat ulang datamart
git add -A && git commit -m "data: pembaruan" && git push  # 3. Vercel deploy otomatis
```

### Biaya & batas
| Komponen | Biaya |
|---|---|
| Vercel Hobby | gratis |
| Supabase Free (database 500 MB; datamart ±20 MB) | gratis |
| OpenAI `gpt-5.6-terra` | ±US$0,014 per pertanyaan (uji 14 Nov: 3 pertanyaan = US$0,042) |

Pasang batas di OpenAI → **Settings → Limits** (mis. US$5/bulan). Kalau kunci bocor: cabut di **API keys**, buat baru, ganti di Vercel, lalu Redeploy.

### Troubleshooting
| Gejala | Penyebab | Solusi |
|---|---|---|
| `psql: could not translate host name` / timeout ke `db.<ref>.supabase.co` | memakai Direct connection (IPv6) | pakai **Session pooler** (A2) |
| `password authentication failed` | password salah / ada karakter khusus belum di-encode | URL-encode atau reset password (A2) |
| `Tenant or user not found` | username bukan `postgres.<ref>` | salin ulang URI dari tombol Connect |
| `prepared statement "..." already exists` | driver lain dipakai lewat Transaction pooler | aplikasi ini sudah `prepare: false`; pastikan memakai kode terbaru |
| Build Vercel gagal "No Next.js version detected" | Root Directory salah | `web` (B2) |
| Tanya Data: `DATABASE_URL belum diatur` | env belum ada | isi di Vercel, lalu **Redeploy** |
| `relation "mart.v_station_month" does not exist` | datamart belum dimuat ke project ini | ulangi A3 |
| `model_not_found` | `OPENAI_MODEL` salah | `gpt-5.6-terra` tanpa awalan `openai.` |
| `Function tools with reasoning_effort…` | env reasoning belum diisi | `LLM_REASONING_EFFORT=none` |
| Semua query gagal setelah lama tidak dibuka | project Supabase di-pause | Restore dari dashboard Supabase |
| Juri diminta login Vercel | Deployment Protection aktif | B4 langkah 2 |
