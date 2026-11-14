# AGENTS.md

Seluruh konteks proyek (status, temuan, struktur repo, perintah, preferensi pemilik, cara verifikasi) ada di **[`CLAUDE.md`](CLAUDE.md)**. Baca itu terlebih dahulu.

Ringkas:
- Proyek: dashboard **SIAGA NAPAS** untuk lomba Dashboard Analysis Gelar Rasa 2026. App production di `web/` (Next.js 16; baca juga `web/AGENTS.md`), pipeline data di `analysis/`, datamart PostgreSQL di `datamart/`, dokumen di `docs/`.
- Berikutnya: iterasi UI di `web/`, uji chatbot Tanya Data setelah pemilik mengisi `web/.env`, lalu laporan lomba.
- Jangan membuka file `.env`. Jangan commit `Pendaftaran/`, `Dataset DA Gelar Rasa 2026/`, `Guidebook/`, `Reference/`.
- Bahasa kerja: Indonesia. Gunakan skill antislop (mode DURING) dan dataviz untuk pekerjaan UI.
