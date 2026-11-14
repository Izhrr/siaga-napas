# CHATBOT · Tanya Data

Asisten AI yang menjawab pertanyaan bebas tentang udara dan rawat inap, **hanya dari datamart JERNIH**, lengkap dengan grafik. Arsitektur meniru Egypt Market Intelligence: *model bahasa boleh meminta data, tetapi tidak pernah mengambilnya sendiri*.

## Alur
```
pertanyaan
  → gerbang (panjang, prompt injection)            → tolak dengan pesan ramah
  → cek konfigurasi provider (503 bila belum ada)
  → simpan pesan pengguna (app.chat_message)
  → LLM + tool (maks 5 langkah, temperature 0)
       tool = fungsi semantic layer -> SQL berparameter ke mart.v_station_month / v_station_profile / model_*
  → artefak grafik dibuat KODE dari hasil tool terakhir (bukan oleh LLM)
  → number guard: hitung angka di jawaban yang cocok dengan hasil tool ("3/3 angka ditelusuri")
  → simpan jawaban + artefak JSON + tool_calls + token + latensi
```

## Semantic layer (tool)
| Tool | Isi | Artefak |
|---|---|---|
| `kpi_summary` | kasus berlebih, porsi terkait PM2.5, PM2.5 rata-rata, % hari > 55 | tabel |
| `rank` | peringkat stasiun/provinsi/pulau/tipe wilayah per metrik | batang |
| `trend` | deret bulanan/tahunan, nasional atau ≤ 4 stasiun | garis |
| `hospital_pressure` | admisi per 100 TT: normal vs puncak 7 hari | batang |
| `exposure_response` | kurva risiko model Poisson | batang |
| `station_profile` | profil satu stasiun | tabel |
| `data_quality` | % jam valid, masalah, layak | tabel |
| `cannot_answer` | jalur resmi untuk menolak | – |

Filter bersama setiap tool: `years`, `months`, `islands`, `archetypes`, `stations`, `group` (u5/o60/both), `threshold` (15/25/55).
Metrik: `pm25`, `excess_cases`, `share_attributable`, `exceed_days_pct`, `very_unhealthy_days` (definisi di `docs/DATAMART.md`).

## Artefak (disimpan sebagai JSON di riwayat)
```ts
type Artifact =
  | { kind: "bars";  title: string; unit: string; bars: { label: string; value: number }[] }
  | { kind: "lines"; title: string; unit: string; x: string[]; series: { name: string; values: (number|null)[] }[] }
  | { kind: "table"; title: string; columns: string[]; rows: (string|number|null)[][] };
```
Kolom `app.chat_message.artifact jsonb` menyimpan objek ini apa adanya, sehingga membuka riwayat menggambar ulang grafik yang sama persis.

## Provider
| `LLM_PROVIDER` | Variabel | Catatan |
|---|---|---|
| `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL` | model chat dengan tool calling |
| `deepseek` | `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` (`deepseek-chat`), `DEEPSEEK_BASE_URL` | API kompatibel OpenAI; SDK yang sama |

## Prompt sistem (ringkas)
Angka harus dari tool; di luar cakupan → `cannot_answer`; tulis "berasosiasi"; bahasa Indonesia ≤ 80 kata; format angka Indonesia; katalog 27 stasiun disisipkan agar nama kota bisa dipetakan ke kode.

## Uji
```bash
cd web && DATABASE_URL=... npm run test:tools   # semua tool tanpa LLM
```
Uji manual setelah kunci API diisi: "RS mana paling tertekan saat musim asap 2026?", "Bandingkan PM2.5 Jakarta dan Palangka Raya per tahun", "Berapa kasus ISPA balita berlebih bila PM2.5 ditekan ke 25?", lalu pertanyaan di luar cakupan ("harga saham?") harus ditolak.

## Rencana berikutnya
Router deterministik untuk pertanyaan umum (0 token), cache jawaban harian, evaluasi otomatis (set pertanyaan + jebakan), umpan balik 👍/👎 (kolom `rating` sudah ada), login per pengguna.
