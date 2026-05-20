"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  TicketIcon, X, Send, Loader2, Image, ChevronDown,
  ChevronRight, Clock, CheckCircle2, AlertTriangle, Zap,
  Tag, Upload, Bold, Italic, Code, Hash, Search, Filter,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "personal",    label: "Personal",    color: "bg-blue-500",   light: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",   text: "text-blue-700 dark:text-blue-300" },
  { value: "technical",   label: "Technical",   color: "bg-red-500",    light: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",       text: "text-red-700 dark:text-red-300" },
  { value: "improvement", label: "Improvement", color: "bg-amber-500",  light: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300" },
  { value: "feature",     label: "Feature",     color: "bg-purple-500", light: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800", text: "text-purple-700 dark:text-purple-300" },
];
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
      ticket.masterUnread && "ring-2 ring-purple-400"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-[11px] font-bold text-slate-400">{ticket.ticketId}</span>
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded text-white", cat.color)}>{cat.label}</span>
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1", st.cls)}>
              <st.icon className="h-3 w-3" />{st.label}
            </span>
            {ticket.masterUnread && <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />}
          </div>
          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{ticket.title}</p>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ticket.adminId?.shopName || ticket.adminName || "Admin"}</span>
             <span className="text-xs text-slate-400">· {ticket.replies?.length || 0} replies · {new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
      </div>
    </button>
  );
}

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

export default function MasterTicketsPage() {
  const user = useAuthStore((s) => s.user);
  const [tickets, setTickets]   = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState("list"); // list | detail
  const [active, setActive]     = useState(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCat, setFilterCat]       = useState("");
  const [search, setSearch]             = useState("");

  // Reply
  const [reply, setReply]   = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [replying, setReplying]     = useState(false);
  const replyRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (filterStatus) q.append("status", filterStatus);
      if (filterCat)    q.append("category", filterCat);
      if (search)       q.append("search", search);
      q.append("t", Date.now());

      const [res, statsRes] = await Promise.all([
        api.get(`/tickets/master?${q.toString()}`),
        api.get(`/tickets/master/stats?t=${Date.now()}`)
      ]);
      setTickets(res.data?.tickets || []);
      setStats(statsRes.data || {});
    } catch { toast.error("Failed to load tickets"); }
    finally  { setLoading(false); }
  }, [filterStatus, filterCat, search]);

  useEffect(() => { load(); }, [load]);

  // Socket — live updates
  useEffect(() => {
    if (!user?._id) return;
    if (!socket.connected) socket.connect();
    socket.emit("join_master_room", user._id);
    
    const onUpdate = ({ ticket, replyFrom }) => {
      if (!ticket) return;
      setTickets((prev) => {
        const idx = prev.findIndex((t) => t._id === ticket._id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = ticket;
          return next;
        }
        return [ticket, ...prev];
      });
      if (active?._id === ticket._id) setActive(ticket);
      
      // Update stats on socket event
      api.get(`/tickets/master/stats?t=${Date.now()}`).then(r => setStats(r.data || {})).catch(() => {});

      // Play chime if the interaction is from admin or brand new ticket
      if (!replyFrom || replyFrom === "admin") {
        playNotificationSound();
      }
    };
    
    socket.on("ticket_created", onUpdate);
    socket.on("ticket_reply",   onUpdate);
    socket.on("ticket_updated", onUpdate);
    return () => { socket.off("ticket_created", onUpdate); socket.off("ticket_reply", onUpdate); socket.off("ticket_updated", onUpdate); };
  }, [user, active]);

  const openTicket = async (t) => {
    setActive(t); setView("detail"); setReplyStatus(t.status);
    try { const r = await api.get(`/tickets/master/${t._id}?t=${Date.now()}`); setActive(r.data?.ticket || r.data); } catch {}
  };

  const handleReply = async () => {
    if (!reply.trim()) return; setReplying(true);
    try {
      const fd = new FormData();
      fd.append("message", reply);
      if (replyStatus && replyStatus !== active.status) fd.append("status", replyStatus);
      replyFiles.forEach((f) => fd.append("images", f));
      // Let Axios automatically manage multi-part boundaries
      const res = await api.post(`/tickets/master/${active._id}/reply`, fd);
      setActive(res.data?.ticket || res.data); setReply(""); setReplyFiles([]); load();
      toast.success("Reply sent successfully!");
    } catch { toast.error("Reply failed"); }
    finally { setReplying(false); }
  };

  const handleStatusChange = async (status) => {
     try {
         const res = await api.patch(`/tickets/master/${active._id}/status`, { status });
         setActive(res.data?.ticket || res.data); load();
         toast.success("Status updated");
     } catch { toast.error("Failed to update status"); }
  }


  // ── DETAIL VIEW ───────────────────────────────────────────────────────────
  if (view === "detail" && active) {
    const cat = catCfg(active.category);
    const st  = STATUS_CFG[active.status] || STATUS_CFG.open;
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => { setView("list"); load(); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white">
          <ChevronDown className="h-4 w-4 rotate-90" /> Back to tickets
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-black text-purple-600">{active.ticketId}</span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded text-white", cat.color)}>{cat.label}</span>
                <div className="relative group">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1", st.cls)}>
                    <st.icon className="h-3 w-3" />{st.label} <ChevronDown className="h-3 w-3" />
                  </span>
                  <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-xl rounded-lg overflow-hidden z-10 w-32">
                     {Object.entries(STATUS_CFG).map(([k, v]) => (
                         <button key={k} onClick={() => handleStatusChange(k)} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                             <v.icon className={cn("h-3 w-3", v.cls.split(' ')[1])} /> {v.label}
                         </button>
                     ))}
                  </div>
                </div>
              </div>
              <h2 className="font-black text-lg text-slate-900 dark:text-white">{active.title}</h2>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                 <span>Reported by: <span className="font-bold text-slate-700 dark:text-slate-300">{active.adminId?.name || "Admin"}</span> ({active.adminId?.shopName})</span>
                 <span>·</span>
                 <span>{active.adminId?.mobile}</span>
                 <span>·</span>
                 <span>{active.adminId?.email}</span>
                 <span>·</span>
                 <span>{new Date(active.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1.5 flex items-center gap-1">
                <span className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">Assigned: {active.assignedName || "Support Team"}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={parseMarkdown(active.description)} />
            {active.imageUrls?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {active.imageUrls.map((url, i) => <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt="" className="h-24 rounded-lg object-cover border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity" /></a>)}
              </div>
            )}
          </div>

          {/* Replies thread */}
          {active.replies?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conversation</p>
              {active.replies.map((r, i) => (
                <div key={i} className={cn("rounded-xl p-4", r.from === "admin"
                  ? "bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  : "bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 ml-8")}>
                  <p className="text-xs font-bold text-slate-500 mb-2 flex justify-between">
                      <span>{r.from === "master" ? `🛡 ${r.fromName} (Support)` : `👤 ${r.fromName}`}</span>
                      <span className="font-normal text-[10px]">{new Date(r.createdAt).toLocaleString()}</span>
                  </p>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={parseMarkdown(r.message)} />
                  {r.imageUrls?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {r.imageUrls.map((url, j) => <a key={j} href={url} target="_blank" rel="noreferrer"><img src={url} alt="" className="h-20 rounded-lg object-cover" /></a>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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
              <textarea ref={replyRef} value={reply} onChange={(e) => setReply(e.target.value)} rows={4}
                placeholder="Write your response... (Markdown supported)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono" />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                    <Image className="h-4 w-4" />
                    <span>{replyFiles.length > 0 ? `${replyFiles.length} file(s)` : "Attach images"}</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setReplyFiles(Array.from(e.target.files).slice(0, 3))} />
                    </label>
                    <select value={replyStatus} onChange={e=>setReplyStatus(e.target.value)} className="h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>Update Status: {v.label}</option>)}
                    </select>
                </div>
                <button onClick={handleReply} disabled={replying || !reply.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm disabled:opacity-60 shadow-lg shadow-purple-200 dark:shadow-purple-900/30">
                  {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TicketIcon className="h-6 w-6 text-purple-500" /> Support Desk
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">Manage incoming tickets from admins.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: "Total",    value: stats.total || 0,      color: "text-slate-600 dark:text-slate-300" },
          { label: "Unread",   value: stats.unread || 0,     color: "text-purple-600 dark:text-purple-400" },
          { label: "Open",     value: stats.open || 0,       color: "text-blue-600 dark:text-blue-400" },
          { label: "InProgress", value: stats.inProgress || 0, color: "text-amber-600 dark:text-amber-400" },
          { label: "Resolved", value: stats.resolved || 0,   color: "text-green-600 dark:text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-center">
             <p className={`text-xl font-black leading-none ${s.color}`}>{s.value}</p>
             <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit flex-wrap">
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => {
          const getStatCount = (st) => {
            if (st === "all") return stats.total || 0;
            if (st === "open") return stats.open || 0;
            if (st === "in_progress") return stats.inProgress || 0;
            if (st === "resolved") return stats.resolved || 0;
            if (st === "closed") return stats.closed || 0;
            return 0;
          };
          const isSelected = (filterStatus || "all") === s;
          return (
            <button key={s} onClick={() => setFilterStatus(s === "all" ? "" : s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize flex items-center gap-1.5",
              isSelected ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow" : "text-slate-500 dark:text-slate-400")}>
              <span>{s.replace("_", " ")}</span>
              <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none", 
                isSelected ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300" : "bg-slate-200 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
              )}>
                {getStatCount(s)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search by ID, subject, or admin..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
        </div>
        <div className="flex gap-2">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none dark:text-white">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div> :
        tickets.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <TicketIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">No tickets found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => <TicketRow key={t._id} ticket={t} onClick={() => openTicket(t)} />)}
          </div>
        )
      }
    </div>
  );
}
