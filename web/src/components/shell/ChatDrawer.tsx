"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { fmt } from "@/lib/format";
import type { Artifact, ChatMessage, ChatResponse, ConversationSummary } from "@/lib/chat-types";

export interface ChatHandle { open: () => void }
const SUGGEST = ["RS mana paling tertekan saat musim asap 2026?", "Bandingkan PM2.5 Jakarta dan Palangka Raya per tahun", "Berapa kasus ISPA balita berlebih bila PM2.5 ditekan ke 25?"];

function ArtifactView({ a }: { a: Artifact }) {
  if (a.kind === "bars") {
    const max = Math.max(...a.bars.map((b) => b.value), 1);
    return (
      <figure style={{ margin: "4px 0 6px" }}>
        <figcaption className="meta" style={{ fontWeight: 700 }}>{a.title}</figcaption>
        {a.bars.map((b) => (
          <div key={b.label} style={{ display: "grid", gridTemplateColumns: "96px 1fr 64px", gap: 6, alignItems: "center", fontSize: 11, margin: "3px 0" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</span>
            <span style={{ height: 11, borderRadius: 3, background: "var(--bar)", width: `${(b.value / max) * 100}%` }} />
            <b>{fmt(b.value, b.value < 10 ? 1 : 0)} {a.unit}</b>
          </div>
        ))}
      </figure>
    );
  }
  if (a.kind === "lines") {
    const W = 380, H = 130, pad = 26, vals = a.series.flatMap((s) => s.values.filter((v): v is number => v != null)), max = Math.max(...vals, 1);
    const x = (i: number) => pad + (i / Math.max(1, a.x.length - 1)) * (W - pad * 2), y = (v: number) => H - 18 - (v / max) * (H - 30);
    const colors = ["var(--bar)", "var(--trend)", "var(--a-kronis)", "var(--a-bersih)"];
    return (
      <figure style={{ margin: "4px 0 6px" }}>
        <figcaption className="meta" style={{ fontWeight: 700 }}>{a.title} ({a.unit})</figcaption>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img" aria-label={a.title}>
          {a.series.map((s, k) => <path key={s.name} fill="none" stroke={colors[k % 4]} strokeWidth={2} d={s.values.map((v, i) => (v == null ? "" : `${i && s.values[i - 1] != null ? "L" : "M"}${x(i)},${y(v)}`)).join("")} />)}
          {a.x.map((l, i) => (i % Math.ceil(a.x.length / 6) === 0 ? <text key={l} x={x(i)} y={H - 4} fontSize={9} textAnchor="middle" fill="var(--muted)">{l}</text> : null))}
        </svg>
        <div className="legend" style={{ margin: 0 }}>{a.series.map((s, k) => <span key={s.name}><i className="sw ln" style={{ background: colors[k % 4] }} />{s.name}</span>)}</div>
      </figure>
    );
  }
  return (
    <figure style={{ margin: "4px 0 6px", overflow: "auto" }}>
      <figcaption className="meta" style={{ fontWeight: 700 }}>{a.title}</figcaption>
      <table className="t"><thead><tr>{a.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{a.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{typeof v === "number" ? fmt(v, v % 1 ? 1 : 0) : v ?? "–"}</td>)}</tr>)}</tbody></table>
    </figure>
  );
}

function Answer({ m }: { m: ChatMessage }) {
  return (
    <div className="ans">
      <p className={m.route === "error" ? "err" : undefined}>{m.content}</p>
      {m.artifact && <ArtifactView a={m.artifact} />}
      {m.route && m.route !== "error" && (
        <p className="meta">
          {m.route === "instant" ? "Jawaban langsung dari datamart" : m.route === "refused" ? "Di luar cakupan data" : `AI: ${m.provider} · ${m.model}`}
          {m.toolCalls?.length ? ` · ${m.toolCalls.length} kueri ke datamart` : ""}{m.latencyMs ? ` · ${fmt(m.latencyMs / 1000, 1)} dtk` : ""}
        </p>
      )}
    </div>
  );
}

/** Tanya Data: asisten AI. Riwayat percakapan tersimpan di server (tanpa login pada prototipe, jadi riwayat dibagi bersama). */
export const ChatDrawer = forwardRef<ChatHandle, { page: string }>(function ChatDrawer({ page }, ref) {
  const [open, setOpen] = useState(false);
  const [conv, setConv] = useState<string | undefined>();
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<ConversationSummary[] | null>(null);
  const [showHist, setShowHist] = useState(false);
  const input = useRef<HTMLInputElement>(null), log = useRef<HTMLDivElement>(null), opener = useRef<HTMLElement | null>(null);
  useImperativeHandle(ref, () => ({ open: () => { opener.current = document.activeElement as HTMLElement; setOpen(true); } }));
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape" && open) close(); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); });
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [msgs, busy]);
  const close = () => { setOpen(false); opener.current?.focus(); };

  async function loadHistory() {
    setShowHist((s) => !s);
    try { const r = await fetch("/api/chat/conversations"); setHistory(r.ok ? await r.json() : []); } catch { setHistory([]); }
  }
  async function openConv(id: string) {
    const r = await fetch(`/api/chat/conversations/${id}`); if (!r.ok) return;
    const j = (await r.json()) as { id: string; messages: ChatMessage[] }; setConv(j.id); setMsgs(j.messages); setShowHist(false);
  }
  async function ask(q: string) {
    if (!q.trim() || busy) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: q };
    setMsgs((m) => [...m, userMsg]); setBusy(true); if (input.current) input.current.value = "";
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ conversationId: conv, message: q, page }) });
      const j = (await r.json()) as ChatResponse | { error: string };
      if (!r.ok || "error" in j) throw new Error("error" in j ? j.error : `HTTP ${r.status}`);
      setConv(j.conversationId); setMsgs((m) => [...m, j.message]);
    } catch (e) {
      setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "assistant", route: "error", content: `Tanya Data belum bisa menjawab: ${(e as Error).message}. Periksa koneksi database dan kunci API (lihat docs/SETUP.md).` }]);
    } finally { setBusy(false); }
  }
  return (
    <aside id="chat-drawer" className={`drawer${open ? " open" : ""}`} aria-label="Tanya Data" aria-hidden={!open} inert={!open}>
      <div className="dr-h">
        <div><h2>Tanya Data · Asisten AI</h2><small>Jawaban dihitung dari datamart JERNIH, lengkap dengan grafik</small></div>
        <button className="x" type="button" aria-label="Tutup Tanya Data" onClick={close}>×</button>
      </div>
      <div className="dr-tools">
        <button className="chip" type="button" onClick={() => { setConv(undefined); setMsgs([]); }}>+ Percakapan baru</button>
        <button className="chip" type="button" aria-pressed={showHist} onClick={loadHistory}>Riwayat</button>
      </div>
      {showHist && (
        <div className="hist">
          {history == null ? <p className="meta">Memuat riwayat…</p> : history.length === 0 ? <p className="meta">Belum ada percakapan tersimpan.</p> :
            history.map((h) => <button key={h.id} type="button" onClick={() => openConv(h.id)}>{h.title}</button>)}
        </div>
      )}
      <div className="log" ref={log} aria-live="polite">
        {msgs.length === 0 && <div className="empty">Tanyakan apa saja tentang udara dan rawat inap di 27 wilayah. Contoh pertanyaan ada di bawah.</div>}
        {msgs.map((m) => (m.role === "user" ? <div className="bub" key={m.id}>{m.content}</div> : <Answer key={m.id} m={m} />))}
        {busy && <div className="ans"><p className="meta">Menghitung dari datamart…</p></div>}
      </div>
      <div className="dr-tools">{SUGGEST.map((s) => <button key={s} className="chip" type="button" onClick={() => ask(s)} disabled={busy}>{s}</button>)}</div>
      <form className="dr-f" onSubmit={(e) => { e.preventDefault(); ask(input.current?.value ?? ""); }}>
        <label htmlFor="q" className="sr">Pertanyaan</label>
        <input id="q" ref={input} placeholder="Tanya tentang udara dan pasien" autoComplete="off" disabled={busy} />
        <button type="submit" disabled={busy}>Kirim</button>
      </form>
    </aside>
  );
});
