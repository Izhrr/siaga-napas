import "server-only";
import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { Artifact, ToolCall } from "@/lib/chat-types";
import { runTool, stationCatalog, TOOL_DEFS } from "./semantic";

/** Provider switch: LLM_PROVIDER=openai | deepseek. DeepSeek is OpenAI-compatible, so one SDK serves both. */
export function provider() {
  const p = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
  if (p === "deepseek") {
    if (!process.env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY belum diatur");
    return { name: "deepseek", model: process.env.DEEPSEEK_MODEL || "deepseek-chat", client: new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com" }) };
  }
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY belum diatur");
  if (!process.env.OPENAI_MODEL) throw new Error("OPENAI_MODEL belum diatur");
  return { name: "openai", model: process.env.OPENAI_MODEL, client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL || undefined }) };
}

const SYSTEM = (catalog: string, page?: string) => `Kamu adalah "Tanya Data", asisten AI dashboard SIAGA NAPAS (Sistem Intelijen Antisipasi Gangguan Napas).
Data: PM2.5 dan polutan dari 27 stasiun AQMS (Jan 2024 – 14 Okt 2026) dan rawat inap harian 27 RS rujukan yang berpasangan dengan stasiun. Data sintetis kompetisi.
Aturan:
1. Setiap angka di jawaban HARUS berasal dari hasil tool. Jangan menebak atau memakai pengetahuan luar.
2. Bila pertanyaan di luar cakupan data, panggil cannot_answer. Jangan menjawab dengan metrik lain yang mirip.
3. "Kasus berlebih" = rawat inap ISPA yang berasosiasi dengan PM2.5 di atas acuan (default ambang 25 µg/m³). Tulis "berasosiasi", bukan "disebabkan".
4. Jawab dalam bahasa Indonesia yang ringkas: kalimat pertama berisi jawaban, lalu 1–2 angka pendukung, lalu satu catatan bila perlu. Maksimal 80 kata. Tanpa markdown tabel; grafik dibuat otomatis dari hasil tool.
5. Gunakan format angka Indonesia (koma desimal, titik ribuan).
Katalog stasiun (kode: kota, provinsi, pulau, tipe wilayah):
${catalog}
${page ? `Pengguna sedang membuka halaman: ${page}.` : ""}`;

export interface LlmResult { text: string; artifact: Artifact | null; calls: ToolCall[]; provider: string; model: string; usage: { prompt: number; completion: number }; refused: boolean; numbers: number[] }

export async function answer(question: string, history: { role: "user" | "assistant"; content: string }[], page?: string): Promise<LlmResult> {
  const p = provider();
  const tools: ChatCompletionTool[] = TOOL_DEFS.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters as unknown as Record<string, unknown> } }));
  const messages: ChatCompletionMessageParam[] = [{ role: "system", content: SYSTEM(await stationCatalog(), page) }, ...history.slice(-6), { role: "user", content: question }];
  const calls: ToolCall[] = []; let artifact: Artifact | null = null; let refused = false; const numbers: number[] = [];
  const usage = { prompt: 0, completion: 0 };
  for (let step = 0; step < 5; step++) {
    // LLM_TEMPERATURE kosong = tidak dikirim (sebagian model terbaru hanya menerima nilai default)
    const temp = process.env.LLM_TEMPERATURE;
    // LLM_REASONING_EFFORT: model reasoning (mis. gpt-5.6-terra) hanya menerima tool di Chat Completions bila diisi "none"
    // Default "none" untuk seri gpt-5.x (wajib agar tool diterima di Chat Completions); env tetap bisa menimpa
    const effort = process.env.LLM_REASONING_EFFORT || (p.name === "openai" && /^gpt-5/.test(p.model) ? "none" : "");
    const res = await p.client.chat.completions.create({
      model: p.model, messages, tools,
      ...(temp !== undefined && temp !== "" ? { temperature: Number(temp) } : {}),
      ...(effort ? { reasoning_effort: effort as never } : {}),
    });
    usage.prompt += res.usage?.prompt_tokens ?? 0; usage.completion += res.usage?.completion_tokens ?? 0;
    const msg = res.choices[0].message;
    const toolCalls = (msg.tool_calls ?? []).filter((c) => c.type === "function");
    if (!toolCalls.length) return { text: msg.content?.trim() || "Maaf, belum ada jawaban.", artifact, calls, provider: p.name, model: p.model, usage, refused, numbers };
    messages.push(msg);
    for (const tc of toolCalls) {
      const t0 = Date.now(); let content: string;
      try {
        const args = JSON.parse(tc.function.arguments || "{}");
        const out = await runTool(tc.function.name, args);
        if (out.refusal) refused = true;
        if (out.artifact) artifact = out.artifact;
        collectNumbers(out.rows, numbers);
        calls.push({ tool: tc.function.name, args, rows: out.rows.length, ms: Date.now() - t0 });
        content = JSON.stringify(out.refusal ?? out.rows).slice(0, 12000);
      } catch (e) {
        calls.push({ tool: tc.function.name, args: {}, rows: 0, ms: Date.now() - t0, error: (e as Error).message });
        content = JSON.stringify({ error: (e as Error).message });
      }
      messages.push({ role: "tool", tool_call_id: tc.id, content });
    }
  }
  return { text: "Pertanyaan ini butuh terlalu banyak langkah. Coba persempit, misalnya pilih satu stasiun atau satu tahun.", artifact, calls, provider: p.name, model: p.model, usage, refused, numbers };
}

function collectNumbers(rows: Record<string, unknown>[], out: number[]) {
  for (const r of rows) for (const v of Object.values(r)) if (typeof v === "number" && isFinite(v)) out.push(v);
}

/** Number guard: share of figures in the answer that trace to a tool value (or a simple derivation of one). */
export function traceFigures(text: string, values: number[]): { checked: number; traced: number } {
  // Tanggal ("14 Oktober") dan konstanta domain (27 stasiun, per 100 TT, ambang 15/25/55) bukan hasil kueri, jadi tidak diperiksa
  const clean = text.replace(/\b\d{1,2}\s+(Jan\w*|Feb\w*|Mar\w*|Apr\w*|Mei|Jun\w*|Jul\w*|Agu\w*|Sep\w*|Okt\w*|Nov\w*|Des\w*)/gi, "");
  const CONST = new Set([15, 25, 27, 55, 100]);
  const found = [...clean.matchAll(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?/g)].map((m) => Number(m[1].replace(/\./g, "") + (m[2] ? "." + m[2] : "")));
  const nums = found.filter((n) => !(n >= 2000 && n <= 2035) && n > 12 && !CONST.has(n)); // tahun dan angka kecil (bulan, jam) tidak diperiksa
  const cands = new Set<number>();
  values.forEach((a) => { cands.add(a); cands.add(a * 100); cands.add(a / 1000); });
  for (let i = 0; i < Math.min(values.length, 120); i++) for (let j = 0; j < Math.min(values.length, 120); j++) if (values[j]) { cands.add((values[i] / values[j] - 1) * 100); cands.add(values[i] / values[j]); }
  const ok = (n: number) => [...cands].some((c) => Math.abs(c - n) <= Math.max(0.051 * Math.max(1, Math.abs(n) / 100), Math.abs(n) * 0.006));
  return { checked: nums.length, traced: nums.filter(ok).length };
}
