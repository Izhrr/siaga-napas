# BACKEND · JERNIH

Backend berada di dalam aplikasi Next.js (Route Handlers) agar satu kali deploy. Database: PostgreSQL.

## Komponen
| Berkas | Peran |
|---|---|
| `web/src/server/db.ts` | klien `postgres` (pool 5) dari `DATABASE_URL` |
| `web/src/server/semantic.ts` | semantic layer: definisi tool + SQL berparameter ke view `mart.*` + pembuat artefak grafik |
| `web/src/server/llm.ts` | pemilih provider (OpenAI / DeepSeek), loop tool calling, number guard |
| `web/src/server/store.ts` | riwayat percakapan di schema `app` |
| `web/src/app/api/chat/route.ts` | `POST /api/chat` |
| `web/src/app/api/chat/conversations/route.ts` | `GET` daftar percakapan |
| `web/src/app/api/chat/conversations/[id]/route.ts` | `GET` isi percakapan (untuk menggambar ulang artefak) |

## API
```
POST /api/chat
  body  { conversationId?: string, message: string (2–600), page?: string }
  200   { conversationId, message: ChatMessage }
  400   pertanyaan kosong/terlalu panjang · 503 provider LLM belum dikonfigurasi · 500 galat lain

GET /api/chat/conversations            -> [{ id, title, updatedAt }]
GET /api/chat/conversations/:id        -> { id, messages: ChatMessage[] }
```
Kontrak tipe ada di `web/src/lib/chat-types.ts` (`ChatMessage`, `Artifact`, `ToolCall`).

## Keamanan
- Kunci API hanya dibaca di server (`process.env`), tidak pernah dikirim ke browser.
- LLM tidak menulis SQL. Tool memakai identifier dari daftar putih dan nilai sebagai parameter.
- Disarankan: role database read-only untuk schema `mart` (contoh di akhir `datamart/schema.sql`).
- Gerbang prompt injection sederhana sebelum LLM; pertanyaan > 600 karakter ditolak.
- Prototipe tanpa login: riwayat chat dibagi bersama. Login direncanakan untuk versi berikutnya.

## Caching & runtime
Halaman dashboard statis (prerender). `/api/chat*` dinamis (`connection()` pada GET, POST selalu dinamis). Dashboard tidak bergantung pada database.
