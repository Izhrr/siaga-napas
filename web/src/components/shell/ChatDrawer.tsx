"use client";
import { ChevronIcon, ClockIcon, CloseButton, PlusIcon } from "../Icons";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { MON, fmt, nice } from "@/lib/format";
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
    // Sumbu y dengan 3 garis bantu + label nilai di ujung tiap seri agar grafik terbaca tanpa hover
    const W = 380, H = 150, L = 34, Rm = 54, T = 10, B = 20;
    const vals = a.series.flatMap((s) => s.values.filter((v): v is number => v != null));
    const top = nice(Math.max(...vals, 1) * 1.08);
    const x = (i: number) => L + (i / Math.max(1, a.x.length - 1)) * (W - L - Rm), y = (v: number) => H - B - (v / top) * (H - T - B);
    const colors = ["var(--bar)", "var(--trend)", "var(--a-kronis)", "var(--a-bersih)"];
    const step = Math.ceil(a.x.length / 6);
    const ends = a.series.map((s, k) => { const i = s.values.map((v, j) => (v == null ? -1 : j)).filter((j) => j >= 0).pop() ?? 0; return { k, y: y(s.values[i] ?? 0), v: s.values[i] }; })
      .sort((p, q) => p.y - q.y).map((e, i, arr) => { if (i && e.y - arr[i - 1].y < 12) e.y = arr[i - 1].y + 12; return e; });
    return (
      <figure style={{ margin: "4px 0 6px" }}>
        <figcaption className="meta" style={{ fontWeight: 700 }}>{a.title} ({a.unit})</figcaption>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img" aria-label={a.title}>
          {[0, top / 2, top].map((t) => <g key={t}><line x1={L} x2={W - Rm} y1={y(t)} y2={y(t)} stroke="var(--line)" /><text x={L - 5} y={y(t) + 3} fontSize={9} textAnchor="end" fill="var(--muted)">{fmt(t)}</text></g>)}
          {a.series.map((s, k) => <path key={s.name} fill="none" stroke={colors[k % 4]} strokeWidth={2} d={s.values.map((v, i) => (v == null ? "" : `${i && s.values[i - 1] != null ? "L" : "M"}${x(i)},${y(v)}`)).join("")} />)}
          {a.series.map((s, k) => s.values.map((v, i) => (v == null || a.x.length > 12 ? null : <circle key={`${k}-${i}`} cx={x(i)} cy={y(v)} r={2.6} fill="var(--card)" stroke={colors[k % 4]} strokeWidth={1.6} />)))}
          {ends.map((e) => <text key={e.k} x={W - Rm + 5} y={e.y + 3} fontSize={10} fontWeight={700} fill="var(--ink)">{fmt(e.v, (e.v ?? 0) < 100 ? 1 : 0)}</text>)}
          {a.x.map((l, i) => (i % step === 0 || i === a.x.length - 1 ? <text key={l} x={x(i)} y={H - 5} fontSize={9} textAnchor="middle" fill="var(--muted)">{l}</text> : null))}
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

/** Waktu riwayat ringkas: jam untuk hari ini, tanggal untuk hari lain. */
function when(iso: string) {
  const d = new Date(iso); if (isNaN(+d)) return "";
  const today = new Date().toDateString() === d.toDateString();
  return today ? `Hari ini ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}` : `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}

function Answer({ m }: { m: ChatMessage }) {
  return (
    <div className="ans">
      <p className={m.route === "error" ? "err" : undefined}>{m.content}</p>
      {m.artifact && <ArtifactView a={m.artifact} />}
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
        <h2>Tanya Data, Asisten AI</h2>
        <CloseButton label="Tutup Tanya Data" onClick={close} />
      </div>
      <div className="dr-tools dr-act">
        <button className="dr-btn" type="button" disabled={busy || (!conv && msgs.length === 0)} onClick={() => { setConv(undefined); setMsgs([]); setShowHist(false); input.current?.focus(); }}><PlusIcon />Percakapan baru</button>
        <button className="dr-btn" type="button" aria-expanded={showHist} aria-controls="chat-hist" onClick={loadHistory}><ClockIcon />Riwayat<ChevronIcon size={9} dir={showHist ? "up" : "down"} /></button>
      </div>
      {showHist && (
        <div className="hist" id="chat-hist">
          {history == null ? <p className="hist-note">Memuat riwayat…</p> : history.length === 0 ? <p className="hist-note">Belum ada percakapan tersimpan.</p> :
            history.map((h) => (
              <button key={h.id} type="button" aria-current={h.id === conv || undefined} onClick={() => openConv(h.id)}>
                <span>{h.title}</span><time dateTime={h.updatedAt}>{when(h.updatedAt)}</time>
              </button>
            ))}
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
