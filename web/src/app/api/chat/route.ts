import { NextResponse } from "next/server";
import type { ChatMessage, ChatRequest, ChatResponse } from "@/lib/chat-types";
import { answer, provider, traceFigures } from "@/server/llm";
import { ensureConversation, recentTurns, saveMessage } from "@/server/store";

const INJECTION = /(ignore (all|previous|the above)|abaikan (semua|instruksi)|system prompt|you are now|jailbreak|developer mode|drop\s+table|delete\s+from)/i;

/** POST /api/chat: gate -> LLM tool loop over the semantic layer -> number guard -> save both turns. */
export async function POST(req: Request) {
  const t0 = Date.now();
  let body: ChatRequest;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 }); }
  const q = (body.message ?? "").trim();
  if (q.length < 2 || q.length > 600) return NextResponse.json({ error: "Pertanyaan harus 2–600 karakter" }, { status: 400 });
  if (!INJECTION.test(q)) {
    try { provider(); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 503 }); } // konfigurasi LLM dicek sebelum menulis riwayat
  }
  try {
    const conversationId = await ensureConversation(body.conversationId, q);
    const history = body.conversationId ? await recentTurns(conversationId) : [];
    await saveMessage(conversationId, { id: crypto.randomUUID(), role: "user", content: q });
    let msg: ChatMessage & { promptTokens?: number; completionTokens?: number };
    if (INJECTION.test(q)) {
      msg = { id: crypto.randomUUID(), role: "assistant", route: "refused", content: "Pertanyaan ini tidak bisa diproses. Tanya Data hanya menjawab pertanyaan tentang udara dan rawat inap di dataset SIAGA NAPAS." };
    } else {
      const r = await answer(q, history, body.page);
      const guard = traceFigures(r.text, r.numbers);
      const note = guard.checked && !r.refused ? `\n\n${guard.traced}/${guard.checked} angka ditelusuri ke hasil kueri.` : "";
      msg = { id: crypto.randomUUID(), role: "assistant", route: r.refused ? "refused" : "llm", content: r.text + note, artifact: r.artifact, toolCalls: r.calls,
        provider: r.provider, model: r.model, promptTokens: r.usage.prompt, completionTokens: r.usage.completion };
    }
    msg.latencyMs = Date.now() - t0;
    await saveMessage(conversationId, msg);
    const { promptTokens, completionTokens, ...message } = msg; void promptTokens; void completionTokens;
    return NextResponse.json({ conversationId, message } satisfies ChatResponse);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
