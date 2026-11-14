# CLAUDE.md · Konteks proyek SIAGA NAPAS (Gelar Rasa 2026, Dashboard Analysis)

Baca file ini dulu, lalu `docs/EDA.md`, `docs/BRAINSTORM.md`, dan `docs/SETUP.md`. Bahasa kerja dengan pemilik: **Indonesia**.

## 1. Apa ini
Lomba Dashboard Analysis Gelar Rasa 2026 (guidebook di `Guidebook/`). Data sintetis: PM2.5 & polutan per jam dari 27 stasiun AQMS + rawat inap harian 27 RS (1:1 dengan stasiun), Jan 2024 – 14 Okt 2026. **Dilarang memakai data eksternal** (basemap provinsi hanya latar visual).
Rubrik: dashboard 70 (kualitas informasi 25, visualisasi 20, fungsionalitas & interaktivitas 25) + laporan 30. Selalu cek keputusan terhadap rubrik.

Nama dashboard: **SIAGA NAPAS = Sistem Intelijen Antisipasi Gangguan Napas** (SIAGA = status kesiapsiagaan surveilans, NAPAS = dampak yang dijaga; nama ketiga setelah JERNIH dan SIGAP, keduanya ditolak pemilik karena terlalu umum). Nama ada di `web/src/lib/brand.ts`. Nama DB lokal (`jernih`), key localStorage (`jernih-theme`), dan folder repo tetap memakai nama lama; tidak perlu diubah. Pengguna primer: tim surveilans kesehatan lingkungan (Kemenkes/Dinkes); sekunder: KLH/DLH.

## 2. Status (14 Nov 2026)
| Tahap | Status |
|---|---|
| EDA + pipeline data (`analysis/`) | selesai |
| Datamart PostgreSQL (`datamart/`) | selesai, dimuat ke DB lokal `jernih` |
| Mock HTML (`mockup/`) | selesai, **sudah digantikan** oleh `web/` (jangan dikembangkan lagi) |
| App Next.js (`web/`): 5 halaman, filter, Poin Kunci, Panduan, mode gelap | selesai, lolos build/lint/typecheck, dicek 1366/1440/1920/ponsel |
| Chatbot Tanya Data (API + semantic layer + riwayat) | **teruji 14 Nov** dengan `gpt-5.6-terra` (3 pertanyaan: peringkat RS, tren 2 kota, di luar cakupan → semua benar). Butuh `LLM_REASONING_EFFORT=none` + ID model tanpa awalan `openai.`. Biaya uji: 18.988 token input + 332 output ≈ US$0,042 (≈ US$0,014/pertanyaan; tarif $2 / $12 per 1 juta token). Screenshot di `docs/screenshots/tanya-data-*.png` |
| Laporan lomba (PDF, 30 poin) | **belum** (dikerjakan terakhir; lihat guidebook untuk template) |

Repo GitHub: `origin` = Izhrr/jernih-gelarrasa (sudah dibuat pemilik). **Supabase: sudah dimuat & teruji 14 Nov** (project region **Tokyo ap-northeast-1** menurut host pooler; Vercel Function Region sebaiknya `hnd1`; 17 tabel, validasi 56354|16215; uji chat end-to-end OK, riwayat tersimpan di `app`). `web/.env` pemilik: `DATABASE_URL` = Transaction pooler (port 6543, sslmode=require), teruji; untuk perintah lokal pakai `node web/scripts/with-supabase.mjs session -- <cmd>` (memuat env tanpa mencetak rahasia). Vercel: belum; panduan di `docs/DEPLOY.md` (**Supabase** Singapura: Session pooler untuk memuat data, Transaction pooler untuk Vercel; Vercel root `web`; loader tanpa Python `datamart/load_psql.sh`, teruji). Berikutnya: deploy, lalu laporan.

## 3. Temuan inti (angka dari data, jangan diubah tanpa menjalankan ulang pipeline)
- ~1/3 rawat inap ISPA balita (33%) & lansia (31%) berasosiasi dengan PM2.5 > 25 µg/m³ (56.354 kasus balita, 64.883 lansia).
- Efek mulai **25 µg/m³** (baku nasional 55). 36% kasus berlebih terjadi di hari "legal" 25–55. Patuh baku 55 hanya mencegah ±29%.
- Dua wajah polusi: **kronis** kota (lalu lintas, ρ 0,76) vs **episodik** gambut Agu–Okt yang makin parah tiap tahun (nasional Jan–Okt 35,3 → 47,1; KTG Okt 2026 = 867 µg/m³).
- Pasien datang di **hari yang sama** dengan lonjakan (bukan H+2). Balita ≈ lansia (+57% vs +55% per PM2.5 berlipat dua).
- Jaringan: 5 stasiun tidak layak (JMB-02 0,5% valid, MER-01 20%, MDN-01 68%, BJB-01 macet 9 bulan tapi berlabel VALID, PLB-01 80%), KTG-01/02 kembar, 13/34 provinsi tanpa stasiun, IKU buta PM2.5.
- PM2.5 = parameter kritis ISPU pada 99,7% hari valid (alasan fokus PM2.5).
- ML yang dipakai: Poisson GLM + spline (kasus berlebih), k-means 4 tipe wilayah (kronis, gambut, ekstrem, bersih), deteksi sensor macet, GBM importance. Forecasting sengaja **tidak** dipakai.

## 4. Struktur repo
```
analysis/   01_clean → 02_daily → 03_health_model → 04_network_cluster → 06_export_dashboard → 07_build_datamart (Python, venv: analysis/.venv via uv)
datamart/   schema.sql (schema mart + app), load_postgres.py (butuh env DATABASE_URL), data/*.csv|parquet
web/        Next.js 16 (App Router, cacheComponents), React 19, Zustand, CSS murni dengan token di src/app/globals.css (Tailwind sengaja DIHAPUS: loader Tailwind-Turbopack membuat HMR CSS tertinggal satu versi)
docs/       EDA, BRAINSTORM, PRD, FRONTEND, BACKEND, CHATBOT, DATAMART, SETUP, reference/egypt-extraction.md
mockup/     mock HTML lama (referensi saja)
assets/     geo/ (GeoJSON BAKOSURTANAL 34 provinsi), brand/
```
Tidak masuk git (lihat `.gitignore`): `Pendaftaran/` (KTM, data pribadi), `Dataset DA Gelar Rasa 2026/`, `Guidebook/`, `Reference/` (ada dokumen internal Paragon), `.env`.

## 5. Web app: peta kode
- `src/components/shell/Shell.tsx`: kanvas desain **1440 px diskalakan** ke layar (min tinggi 790) → satu layar tanpa scroll; < 900 px = tata letak tumpuk. Header (judul, rentang data, Panduan, saklar tema ikon). **Tanya Data** = pil putih `.ai-dock` di bawah sidebar (versi melayang ditolak pemilik: menutupi grafik & efek berlebihan); efek minimal: kedip sekali saat dimuat, terangkat sedikit saat hover → **CriticalBanner** (Temuan Kritis + 4 angka Poin Kunci yang bisa diklik → dialog Poin Kunci & Aksi) → KPI → grid grafik 18×2. Klik provinsi di peta → `ProvinceDialog`. (Kolom Poin Kunci di kanan sudah dihapus: terlalu makan ruang.)
- `src/lib/content.ts`: judul, banner, KPI, teks tombol i (`HOW`), dan `keyPoints()` = 4 poin kunci per halaman berbentuk `{fig, head, what, why, action, who, chart}`; angka dinamis mengikuti filter pada grain besar (periode, wilayah, kelompok, acuan), hasil model tetap statis. `chart` harus sama persis dengan judul kartu (dipakai tombol "Lihat grafik" yang menyorot kartu).
- Panduan (`components/shell/Guide.tsx` + `lib/guide.ts`): 8 halaman bergaya dokumentasi Paragon (Gambaran umum, 5 cara membaca dengan screenshot berpenanda bernomor, Tanya Data AI, Istilah & metodologi). Screenshot + posisi penanda dibuat oleh `web/scripts/guide_shots.py` (→ `public/guide/*.jpg`, `src/lib/guide-shots.json`); **jalankan ulang setiap tata letak berubah**. Kunci penanda = `filter|crit|kpi|ai` atau judul kartu.
- Ikon tombol (tutup, chevron, info) memakai SVG di `components/Icons.tsx`, bukan karakter teks, agar presisi di tengah.
- `src/lib/select.ts`: agregasi grain stasiun × bulan (`agg`, `makeCtx`, `growth`). `src/lib/store.ts`: filter global (sessionStorage).
- `src/lib/charts/core.ts` + `kit.ts`: grafik SVG imperatif (hbars, combo batang+garis, lines, scatter, mapBase). `src/components/Chart.tsx` menggambar ulang saat resize/tema/data.
- `src/components/pages/*.tsx`: satu komponen per halaman (posisi kartu via `gridArea`).
- Chatbot: `src/server/semantic.ts` (tool + SQL berparameter ke `mart.v_station_month`/`v_station_profile`; LLM **tidak pernah** menulis SQL), `llm.ts` (OpenAI/DeepSeek via SDK openai, loop tool, number guard), `store.ts` (riwayat schema `app`), `app/api/chat/*`. Kontrak di `src/lib/chat-types.ts`; artefak grafik disimpan sebagai JSON.
- Data dashboard: `web/public/data/dashboard.json` (dari `06_export_dashboard.py`). Logo: `web/public/brand/logo-gelar-rasa.png` (belum ada → placeholder `[LOGO]` + 404 di console, wajar).
- **Next.js 16 berbeda dari pengetahuan umum**: baca `web/AGENTS.md` dan `web/node_modules/next/dist/docs/` sebelum mengubah API Next.

## 6. Perintah
```bash
cd web && npm run dev | npm run build | npm run lint | npm run typecheck
DATABASE_URL=postgresql://$USER@localhost:5432/jernih npm run test:tools   # uji semua tool chatbot tanpa LLM
DATABASE_URL=... analysis/.venv/bin/python datamart/load_postgres.py       # muat ulang datamart
```
`.env` (dibuat sendiri oleh pemilik dari `web/.env.example`): `DATABASE_URL`, `LLM_PROVIDER` (openai|deepseek), `LLM_TEMPERATURE` (kosong = tidak dikirim), `OPENAI_API_KEY`, `OPENAI_MODEL` (ID API persis, mis. `gpt-5.6-terra`), `LLM_REASONING_EFFORT` (`none` untuk seri gpt-5.x + tool), `OPENAI_BASE_URL` (opsional), `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_BASE_URL`. **Jangan pernah membuka/membaca file `.env`**; untuk tes, berikan env lewat command line.

## 7. Preferensi pemilik (wajib diikuti)
- **Less is more**, value creation & mudah dipahami dalam 10 detik; satu layar desktop tanpa scroll; tidak ada elemen yang lewat batas; visibilitas & keterbacaan.
- Gaya visual mengikuti **Previous Winner Dashboard2_2** (`Reference/Previous Winner/`): sidebar merah berisi filter, header kartu berlatar merah, strip **Insight** kuning, ornamen tematik samar (opacity rendah) + shadow lembut. Copywriting gaya pemenang: judul singkat, angka dulu, "Temuan Kritis", "Insight:". Hindari keterangan teknis berlebihan di kartu (taruh di tombol i / Panduan). Hindari kotak di dalam kotak.
- Filter: ≥ 3 opsi → dropdown multi-pilih dengan "Pilih semua"; ≤ 2 opsi boleh tombol. Tiap filter harus punya alasan kebutuhan di Panduan.
- Grafik: beban kognitif rendah (panduan Datawrapper https://www.datawrapper.de/blog/chart-types-guide); batang sering disertai garis tren (sumbu sama, **tanpa dual axis**); peta choropleth Indonesia.
- Tanya Data harus terlihat jelas sebagai **agen AI**.
- Insight hard-coded/terhitung (bukan LLM) di dashboard. ML hanya bila menambah insight.
- **Anti AI slop**: pakai skill `antislop` + `antislop-ui` (mode **DURING**, dipilih pemilik) dan skill `dataviz` (validasi palet dengan skripnya). Tanpa em dash (—) di teks UI.
- Aset yang kurang (logo, warna resmi panitia) → tanya pemilik di akhir, pakai placeholder jujur.
- Commit/push hanya bila diminta; pemilik akan menyiapkan repo GitHub sendiri.

## 8. Verifikasi sebelum menyerahkan perubahan UI
**Jangan `next build` ke `.next` saat dev server pemilik berjalan** (merusak watcher/HMR-nya). Pakai folder terpisah: `NEXT_DIST_DIR=.next-check npx next build` lalu `NEXT_DIST_DIR=.next-check npx next start -p 3100`; hapus `.next-check` sesudahnya.
Build + lint + typecheck, lalu render di headless Chrome (Playwright Python di `analysis/.venv`, `channel="chrome"`) pada 1366×768, 1440×900, 1920×1080, 390×844 dan mode gelap; cek tidak ada teks SVG keluar viewBox, teks terpotong, kartu/sidebar overflow, overflow horizontal di ponsel, dan error console selain 404 logo.
