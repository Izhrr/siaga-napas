# FRONTEND · JERNIH (web/)

## Stack
Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, TypeScript, Zustand (state filter), Tailwind v4 (preflight saja; gaya utama di `globals.css` berbasis token CSS), SVG buatan sendiri untuk grafik (tanpa library chart: kontrol penuh atas label, batas, dan animasi).

## Struktur
```
src/
  app/
    layout.tsx               font Plus Jakarta Sans, metadata
    globals.css              token warna (terang/gelap), komponen, kartu, peta, dialog
    (dash)/layout.tsx        DataProvider + Shell (dipakai semua halaman)
    (dash)/<halaman>/page.tsx  ringkasan, waktu, pemicu, dampak, jaringan
    api/chat/...             lihat BACKEND.md
  components/
    DataProvider.tsx         fetch /data/dashboard.json, status loading/error, useCtx(), useTheme
    Chart.tsx                kontainer SVG: gambar ulang saat resize, ganti tema, atau data berubah
    Card.tsx                 kartu grafik: header merah, tombol i, keterangan, legenda, strip Insight
    shell/                   Shell (skala kanvas), Sidebar, Filters, KpiRow, KeyPoints, Guide, ChatDrawer
    pages/                   satu komponen per halaman (susunan kartu + fungsi gambar)
  lib/
    types.ts  format.ts  store.ts (filter global, sessionStorage)  select.ts (agregasi stasiun × bulan)
    content.ts (judul, banner, KPI, poin kunci, teks tombol i)  guide.ts (isi Panduan)
    charts/core.ts (helper SVG, tooltip, animasi)  charts/kit.ts (hbars, combo, lines, scatter, mapBase)
```

## Prinsip tata letak
- **Kanvas 1440 px diskalakan ke layar** (`Shell.useFitStage`): lebar mengisi layar, tinggi mengikuti rasio (min 790). Hasilnya satu layar tanpa scroll dan tidak ada elemen yang lewat batas. Di bawah 900 px: tata letak tumpuk dan boleh scroll.
- Urutan baca: Judul → **Temuan Kritis** → KPI → grafik; **Poin Kunci & Aksi** di kolom kanan setinggi layar sebagai fokus utama.
- Grid grafik 18 kolom × 2 baris; posisi tiap kartu ditulis langsung (`gridArea`) di komponen halaman.

## Menambah grafik
1. Hitung data dari `useCtx()` (sudah memuat filter: `c.idx`, `c.codes`, `c.group`, `c.f.c0`) dengan `aggCtx`.
2. Bungkus dengan `<Card area="r1 / c1 / r2 / c2" title how sub legend insight>`; tambahkan teks tombol i di `HOW` (`lib/content.ts`).
3. Gambar di `<Chart deps={[c, ...]} draw={(box) => hbars(box, ...)}/>`. Pakai `cssVar('--token')` untuk warna, jangan hex mentah.
4. Tangani kosong: `empty(box, "pesan yang menyebut penyebab")`.

## Warna
| Peran | Token | Catatan |
|---|---|---|
| Chrome (sidebar, header kartu) | `--red-side`, `--red` | tone Previous Winner |
| Data utama / konteks | `--bar` / `--bar-soft`, `--bar-gray` | satu aksen, sisanya redup |
| Tipe wilayah (4) | `--a-ekstrem --a-gambut --a-kronis --a-bersih` | divalidasi skrip palet dataviz (CVD, kontras) untuk terang & gelap |
| Sekuensial (peta, kalender) | `--s1` … `--s6` | satu hue merah |
| Garis acuan | `.thr25` (emas = ambang 25), `.std55` (putus-putus = baku 55) | motif berulang di semua grafik PM2.5 |

## Aksesibilitas
Tombol & tautan native, `aria-current` di navigasi, `<details>` untuk dropdown (Escape menutup), dialog native (`showModal`), fokus terlihat, provinsi peta bisa dipilih dengan Enter, animasi dimatikan saat `prefers-reduced-motion`.

## Data
`web/public/data/dashboard.json` (≈ 190 KB) dibuat oleh `analysis/06_export_dashboard.py`: stasiun, poligon provinsi (sudah diproyeksikan), grain **stasiun × bulan** (PM2.5, hari valid, hari > 55, kasus teramati, kasus berlebih per acuan, per pita PM2.5), kurva model, event study, angin.
