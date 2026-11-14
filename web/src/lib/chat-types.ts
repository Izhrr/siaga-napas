/** Contract shared by /api/chat and the chat drawer. Artifacts are plain JSON so history can redraw them exactly. */
export type Artifact =
  | { kind: "bars"; title: string; unit: string; bars: { label: string; value: number }[] }
  | { kind: "lines"; title: string; unit: string; x: string[]; series: { name: string; values: (number | null)[] }[] }
  | { kind: "table"; title: string; columns: string[]; rows: (string | number | null)[][] };

export interface ToolCall { tool: string; args: Record<string, unknown>; rows: number; ms: number; error?: string }
export interface ChatMessage {
  id: string; role: "user" | "assistant"; content: string; artifact?: Artifact | null;
  toolCalls?: ToolCall[]; route?: "instant" | "llm" | "refused" | "error"; provider?: string; model?: string; latencyMs?: number; createdAt?: string;
}
export interface ChatRequest { conversationId?: string; message: string; page?: string }
export interface ChatResponse { conversationId: string; message: ChatMessage }
export interface ConversationSummary { id: string; title: string; updatedAt: string }
