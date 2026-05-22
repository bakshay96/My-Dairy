"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  TicketIcon, Plus, X, Send, Loader2, Image, ChevronDown,
  ChevronRight, Clock, CheckCircle2, Zap,
  Upload, Bold, Italic, Code, Hash,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "personal",    label: "Personal",    color: "bg-blue-500",   light: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",   text: "text-blue-700 dark:text-blue-300" },
  { value: "technical",   label: "Technical",   color: "bg-red-500",    light: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",       text: "text-red-700 dark:text-red-300" },
  { value: "improvement", label: "Improvement", color: "bg-amber-500",  light: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300" },
  { value: "feature",     label: "Feature",     color: "bg-purple-500", light: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800", text: "text-purple-700 dark:text-purple-300" },
];
const SUBJECT_OPTIONS = {
  personal: ["Account Settings", "Billing/Subscription", "Profile Update", "Other"],
  technical: ["Login/Authentication Issue", "App Crash/Bug", "Data Not Syncing", "Printer Integration", "Other"],
  improvement: ["UI Feedback", "Workflow Suggestion", "Performance Issue", "Other"],
  feature: ["New Report Idea", "Hardware Integration", "Other"],
};

const STATUS_CFG = {
  open:        { label: "Open",       icon: Clock,         cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  in_progress: { label: "In Progress",icon: Zap,           cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  resolved:    { label: "Resolved",   icon: CheckCircle2,  cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  closed:      { label: "Closed",     icon: X,             cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const catCfg = (v) => CATEGORIES.find((c) => c.value === v) || CATEGORIES[0];

// ── Tiny MD toolbar helper ─────────────────────────────────────────────────────
function insertMd(ref, wrap, set) {
  const el  = ref.current;
  if (!el) return;
  const s   = el.selectionStart, e = el.selectionEnd;
  const sel = el.value.slice(s, e) || "text";
  const next = el.value.slice(0, s) + wrap + sel + wrap + el.value.slice(e);
  set(next);
  setTimeout(() => { el.focus(); el.setSelectionRange(s + wrap.length, s + wrap.length + sel.length); }, 0);
}

function parseMarkdown(text) {
  if (!text) return { __html: "" };
  let html = String(text)
    .replace(/</g, "&lt;").replace(/>/g, "&gt;") // escape HTML
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold
    .replace(/_(.*?)_/g, "<em>$1</em>") // italic
    .replace(/```([\s\S]*?)```/g, "<pre class='bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 my-2 rounded text-xs overflow-x-auto'><code>$1</code></pre>") // multiline code
    .replace(/`(.*?)`/g, "<code class='bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded text-xs text-purple-600 dark:text-purple-400'>$1</code>"); // inline code
  // Replace newlines with <br/>, avoiding doing it inside <pre> manually by just using CSS white-space: pre-wrap on the container
  return { __html: html };
}

// ── Ticket List Item ──────────────────────────────────────────────────────────
function TicketRow({ ticket, onClick }) {
  const st  = STATUS_CFG[ticket.status] || STATUS_CFG.open;
  const cat = catCfg(ticket.category);
  return (
    <button onClick={onClick} className={cn(
      "w-full text-left rounded-xl border p-4 transition-all hover:shadow-md",
      "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
      ticket.adminUnread && "ring-2 ring-purple-400"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-[11px] font-bold text-slate-400">{ticket.ticketId}</span>
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded text-white", cat.color)}>{cat.label}</span>
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1", st.cls)}>
              <st.icon className="h-3 w-3" />{st.label}
            </span>
            {ticket.adminUnread && <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />}
          </div>
          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{ticket.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{ticket.replies?.length || 0} replies · {new Date(ticket.createdAt).toLocaleDateString()}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
// Synthesized chime via HTML5 Web Audio API
const playNotificationSound = () => {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("milkify-sound-disabled") === "true") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playTone(784, now, 0.12);        // G5
    playTone(1046.5, now + 0.08, 0.15); // C6
    playTone(1318.5, now + 0.16, 0.25); // E6
  } catch (e) {
    console.warn("Could not play synthesized sound:", e);
  }
};

export default function SupportPage() {
  const user = useAuthStore((s) => s.user);
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState("list"); // list | detail | create
  const [active, setActive]     = useState(null);
  const [filter, setFilter]     = useState("all");
  const textRef = useRef(null);

  // Create form
  const [form, setForm]     = useState({ title: "", description: "", category: "technical" });
  const [subjectMode, setSubjectMode] = useState("dropdown"); // dropdown | manual
  const [files, setFiles]   = useState([]);
  const [saving, setSaving] = useState(false);
  // Reply
  const [reply, setReply]   = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [replying, setReplying]     = useState(false);
  const replyRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (view === "detail" && active) {
      const timer = setTimeout(scrollToBottom, 80);
      return () => clearTimeout(timer);
    }
  }, [view, active?.replies?.length, active?._id, scrollToBottom]);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/tickets?t=${Date.now()}`);
      setTickets(res.data?.tickets || []);
    } catch { toast.error("Failed to load tickets"); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Socket — live updates
  useEffect(() => {
    if (!user?._id) return;
    if (!socket.connected) socket.connect();
    socket.emit("join_room", `admin:${user._id}`);
    const onUpdate = ({ ticket, replyFrom }) => {
      if (!ticket) return;
      setTickets((prev) => prev.find((t) => t._id === ticket._id)
        ? prev.map((t) => t._id === ticket._id ? ticket : t)
        : [ticket, ...prev]);
      if (active?._id === ticket._id) setActive(ticket);
      // Play premium sound on incoming master replies
      if (replyFrom === "master") {
        playNotificationSound();
      }
    };
    socket.on("ticket_created", onUpdate);
    socket.on("ticket_reply",   onUpdate);
    socket.on("ticket_updated", onUpdate);
    return () => { socket.off("ticket_created", onUpdate); socket.off("ticket_reply", onUpdate); socket.off("ticket_updated", onUpdate); };
  }, [user, active]);

  const openTicket = async (t) => {
    setActive(t); setView("detail");
    try { const r = await api.get(`/tickets/${t._id}?t=${Date.now()}`); setActive(r.data?.ticket || r.data); } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append("images", f));
      // Removed manual multipart header to avoid boundary stripping issues
      await api.post("/tickets", fd);
      toast.success("Ticket created successfully! We'll respond within 48 hours.");
      setForm({ title: "", description: "", category: "technical" });
      setSubjectMode("dropdown");
      setFiles([]); setView("list"); load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleReply = async () => {
    if (!reply.trim()) return; setReplying(true);
    try {
      const fd = new FormData();
      fd.append("message", reply);
      replyFiles.forEach((f) => fd.append("images", f));
      // Let Axios append standard boundaries automatically
      const res = await api.post(`/tickets/${active._id}/reply`, fd);
      setActive(res.data?.ticket || res.data); setReply(""); setReplyFiles([]); load();
      toast.success("Reply sent successfully!");
    } catch { toast.error("Reply failed"); }
    finally { setReplying(false); }
  };

  const handleCloseTicket = async () => {
    try {
      await api.patch(`/tickets/${active._id}/close`);
      toast.success("Ticket closed successfully!");
      setView("list");
      load();
    } catch {
      toast.error("Failed to close ticket");
    }
  };

  const handleReopenTicket = async () => {
    try {
      const res = await api.patch(`/tickets/${active._id}/reopen`);
      setActive(res.data?.ticket || res.data);
      toast.success("Ticket reopened successfully!");
      load();
    } catch {
      toast.error("Failed to reopen ticket");
    }
  };

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  // ── CREATE VIEW ───────────────────────────────────────────────────────────
  if (view === "create") return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setView("list")} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X className="h-4 w-4" /></button>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">New Support Ticket</h1>
      </div>

      <form onSubmit={handleCreate} className="space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        {/* Category Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category *</label>
          <select value={form.category} onChange={(e) => {
              setForm((f) => ({ ...f, category: e.target.value, title: "" }));
              setSubjectMode("dropdown");
            }}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Subject Dropdown / Manual */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Subject *</label>
          {subjectMode === "dropdown" ? (
            <select 
              value={SUBJECT_OPTIONS[form.category]?.includes(form.title) ? form.title : ""}
              onChange={(e) => {
                if (e.target.value === "Other") {
                  setSubjectMode("manual");
                  setForm(f => ({ ...f, title: "" }));
                } else {
                  setForm(f => ({ ...f, title: e.target.value }));
                }
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="" disabled>Select a predefined subject</option>
              {SUBJECT_OPTIONS[form.category]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <div className="flex gap-2">
              <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Brief description of the issue..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <button type="button" onClick={() => { setSubjectMode("dropdown"); setForm(f => ({ ...f, title: "" })); }}
                className="px-3 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Description with MD toolbar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description * (Markdown supported)</label>
            <div className="flex items-center gap-1">
              {[["**", Bold], ["_", Italic], ["`", Code], ["```\n", Hash]].map(([sym, Icon]) => (
                <button key={sym} type="button" onClick={() => insertMd(textRef, sym === "```\n" ? "```\n" : sym, (v) => setForm((f) => ({ ...f, description: v })))}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
          <textarea ref={textRef} required rows={6} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe the issue in detail. Use **bold**, _italic_, `code`, or ```code blocks```..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Attachments (max 5 images)</label>
          <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 hover:border-purple-400 transition-colors">
            <Upload className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">{files.length > 0 ? `${files.length} file(s) selected` : "Click to attach images"}</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))} />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => setView("list")} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit Ticket
          </button>
        </div>
      </form>
    </div>
  );

  // ── DETAIL VIEW ───────────────────────────────────────────────────────────
  if (view === "detail" && active) {
    const cat = catCfg(active.category);
    const st  = STATUS_CFG[active.status] || STATUS_CFG.open;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white">
          <ChevronDown className="h-4 w-4 rotate-90" /> Back to tickets
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-black text-purple-600">{active.ticketId}</span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded text-white", cat.color)}>{cat.label}</span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", st.cls)}>{st.label}</span>
              </div>
              <h2 className="font-black text-slate-900 dark:text-white">{active.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(active.createdAt).toLocaleString()}</p>
            </div>

            {/* Close & Reopen buttons */}
            <div className="flex items-center gap-2">
              {active.status !== "closed" ? (
                <button onClick={handleCloseTicket} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold transition-all">
                  Close Ticket
                </button>
              ) : (
                <button onClick={handleReopenTicket} className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 text-xs font-bold transition-all">
                  Reopen Ticket
                </button>
              )}
            </div>
          </div>

          {/* Chat Stream Container */}
          <div className="max-h-[480px] overflow-y-auto pr-2 flex flex-col gap-4 py-2 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
            
            {/* First bubble: Original Ticket Description */}
            <div className="flex flex-col items-end self-end max-w-[85%] group animate-fadeIn">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-medium text-slate-400">
                <span>👤 You (Original Request)</span>
                <span>·</span>
                <span>{new Date(active.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="bg-purple-600 dark:bg-purple-700 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="text-sm whitespace-pre-wrap font-sans prose prose-invert max-w-none prose-sm" dangerouslySetInnerHTML={parseMarkdown(active.description)} />
                {active.imageUrls?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {active.imageUrls.map((url, i) => (
                      <img key={i} src={url} alt="" className="h-20 rounded-lg object-cover border border-purple-500/30 shadow-inner cursor-zoom-in hover:scale-105 transition-transform" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Replies Thread */}
            {active.replies?.map((r, i) => {
              const isMaster = r.from === "master";
              return (
                <div key={i} className={cn(
                  "flex flex-col max-w-[85%] group animate-fadeIn",
                  isMaster ? "self-start items-start" : "self-end items-end"
                )}>
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-medium text-slate-400">
                    <span>{isMaster ? `🛡️ ${r.fromName || 'Support Agent'}` : "👤 You"}</span>
                    <span>·</span>
                    <span>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className={cn(
                    "px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border",
                    isMaster
                      ? "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20 border-purple-100 dark:border-purple-900/40 text-purple-950 dark:text-purple-100 rounded-tl-none"
                      : "bg-purple-600 dark:bg-purple-700 text-white border-transparent rounded-tr-none"
                  )}>
                    <div className="text-sm whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={parseMarkdown(r.message)} />
                    {r.imageUrls?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {r.imageUrls.map((url, j) => (
                          <img key={j} src={url} alt="" className={cn(
                            "h-20 rounded-lg object-cover border cursor-zoom-in hover:scale-105 transition-transform",
                            isMaster ? "border-purple-200 dark:border-purple-800" : "border-purple-500/30"
                          )} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Reply box */}
          {active.status !== "closed" && (
            <div className="border-t dark:border-slate-800 pt-4 space-y-3">
              <div className="flex items-center gap-1 mb-1">
                {[["**", Bold], ["_", Italic], ["`", Code]].map(([sym, Icon]) => (
                  <button key={sym} type="button" onClick={() => insertMd(replyRef, sym, setReply)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
              <textarea ref={replyRef} value={reply} onChange={(e) => setReply(e.target.value)} rows={3}
                placeholder="Add a reply... (Markdown supported)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono" />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                  <Image className="h-4 w-4" />
                  <span>{replyFiles.length > 0 ? `${replyFiles.length} file(s)` : "Attach images"}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setReplyFiles(Array.from(e.target.files).slice(0, 3))} />
                </label>
                <button onClick={handleReply} disabled={replying || !reply.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm disabled:opacity-60">
                  {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate dynamic tab counts
  const getCount = (st) => {
    if (st === "all") return tickets.length;
    return tickets.filter(t => t.status === st).length;
  };

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TicketIcon className="h-6 w-6 text-purple-500" /> Support
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">Report issues, request features, or get help.</p>
        </div>
        <button onClick={() => setView("create")} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 h-10 rounded-xl text-sm shrink-0 shadow-lg shadow-purple-200 dark:shadow-purple-900/30">
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit flex-wrap">
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize flex items-center gap-1.5",
            filter === s ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow" : "text-slate-500 dark:text-slate-400")}>
            <span>{s.replace("_", " ")}</span>
            <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none", 
              filter === s ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300" : "bg-slate-200 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
            )}>
              {getCount(s)}
            </span>
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div> :
        filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <TicketIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">No tickets found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => <TicketRow key={t._id} ticket={t} onClick={() => openTicket(t)} />)}
          </div>
        )
      }
    </div>
  );
}
