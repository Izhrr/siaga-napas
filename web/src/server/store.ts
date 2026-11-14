import "server-only";
import type { ChatMessage, ConversationSummary } from "@/lib/chat-types";
import { sql } from "./db";

/* Chat history (schema app). Prototype has no login, so every visitor shares one history. */
export async function ensureConversation(id: string | undefined, firstQuestion: string): Promise<string> {
  const s = sql();
  if (id) { const [r] = await s`select id from app.chat_conversation where id = ${id}`; if (r) return id; }
  const nid = crypto.randomUUID();
  await s`insert into app.chat_conversation (id, title) values (${nid}, ${firstQuestion.slice(0, 80)})`;
  return nid;
}
export async function saveMessage(conversationId: string, m: ChatMessage & { promptTokens?: number; completionTokens?: number }) {
  const s = sql();
  await s`insert into app.chat_message (id, conversation_id, role, content, artifact, tool_calls, provider, model, prompt_tokens, completion_tokens, latency_ms, route)
    values (${m.id}, ${conversationId}, ${m.role}, ${m.content}, ${m.artifact ? s.json(m.artifact as never) : null}, ${m.toolCalls ? s.json(m.toolCalls as never) : null},
            ${m.provider ?? null}, ${m.model ?? null}, ${m.promptTokens ?? null}, ${m.completionTokens ?? null}, ${m.latencyMs ?? null}, ${m.route ?? null})`;
  await s`update app.chat_conversation set updated_at = now() where id = ${conversationId}`;
}
export async function recentTurns(conversationId: string, n = 6) {
  const rows = await sql()`select role, content from app.chat_message where conversation_id = ${conversationId} order by created_at desc limit ${n}`;
  return rows.reverse().map((r) => ({ role: r.role as "user" | "assistant", content: String(r.content) }));
}
export async function listConversations(limit = 30): Promise<ConversationSummary[]> {
  const rows = await sql()`select id, title, updated_at from app.chat_conversation order by updated_at desc limit ${limit}`;
  return rows.map((r) => ({ id: r.id, title: r.title, updatedAt: new Date(r.updated_at).toISOString() }));
}
export async function getConversation(id: string): Promise<ChatMessage[]> {
  const rows = await sql()`select id, role, content, artifact, tool_calls, route, provider, model, latency_ms, created_at from app.chat_message where conversation_id = ${id} order by created_at`;
  return rows.map((r) => ({ id: r.id, role: r.role, content: r.content, artifact: r.artifact, toolCalls: r.tool_calls ?? undefined, route: r.route ?? undefined, provider: r.provider ?? undefined, model: r.model ?? undefined, latencyMs: r.latency_ms ?? undefined, createdAt: new Date(r.created_at).toISOString() }));
}
