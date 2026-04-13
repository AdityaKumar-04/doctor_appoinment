"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  Headphones,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronRight,
  User,
  Tag,
  Send,
  Loader2,
  Building2,
  Stethoscope,
  RefreshCw,
  ShieldCheck,
  Filter,
  X,
  AlertCircle,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
const msgFetcher = (url: string) => fetch(url).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });

type TicketStatus = "open" | "in_progress" | "resolved";

interface AdminTicket {
  id: string;
  user_id: string;
  role: string;
  type: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: string;
  created_at: string;
  users: { first_name: string | null; last_name: string | null; email: string | null } | null;
}

interface TicketMsg {
  id: string;
  message: string;
  sender_id: string;
  sender_role: string;
  created_at: string;
}

const STATUS_CFG: Record<TicketStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  open:        { label: "Open",        icon: <AlertTriangle size={11} />, cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  in_progress: { label: "In Progress", icon: <Clock size={11} />,         cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  resolved:    { label: "Resolved",    icon: <CheckCircle2 size={11} />,  cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

const PRIORITY_CFG: Record<string, string> = {
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low:    "text-slate-400 bg-white/5 border-white/10",
};

const ROLE_ICON: Record<string, React.ReactNode> = {
  patient: <User size={14} />,
  doctor:  <Stethoscope size={14} />,
  clinic:  <Building2 size={14} />,
};

const ROLE_COLOR: Record<string, string> = {
  patient: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  doctor:  "text-sky-400 bg-sky-500/10 border-sky-500/20",
  clinic:  "text-teal-400 bg-teal-500/10 border-teal-500/20",
};

/**
 * Message avatar config keyed by sender_role.
 * Admin → RIGHT side (violet), everyone else → LEFT side.
 */
const MSG_AVATAR: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  admin:   { icon: <ShieldCheck size={12} />, cls: "bg-violet-500/10 border-violet-500/20 text-violet-400", label: "You (Admin)" },
  patient: { icon: <User size={12} />,        cls: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400", label: "Patient" },
  doctor:  { icon: <Stethoscope size={12} />, cls: "bg-sky-500/10 border-sky-500/20 text-sky-400",           label: "Doctor" },
  clinic:  { icon: <Building2 size={12} />,   cls: "bg-teal-500/10 border-teal-500/20 text-teal-400",        label: "Clinic" },
};

export default function AdminHelpdeskPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<AdminTicket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Build query string
  const qs = new URLSearchParams({ type: "help" });
  if (statusFilter !== "all") qs.set("status", statusFilter);
  if (roleFilter !== "all") qs.set("role", roleFilter);
  if (search) qs.set("search", search);

  const { data, isLoading: loading, mutate } = useSWR(`/api/admin/support?${qs.toString()}`, fetcher, {
    revalidateOnFocus: true,
  });
  const allTickets: AdminTicket[] = data?.tickets || [];

  // Poll thread every 5 seconds for near-real-time updates
  const { data: threadData, mutate: mutateThread, isValidating: threadLoading } = useSWR(
    selected ? `/api/support/${selected.id}` : null,
    msgFetcher,
    { refreshInterval: 5000, revalidateOnFocus: true }
  );
  const messages: TicketMsg[] = threadData?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const open     = allTickets.filter((t) => t.status === "open").length;
  const inProg   = allTickets.filter((t) => t.status === "in_progress").length;
  const resolved = allTickets.filter((t) => t.status === "resolved").length;

  const sendReply = async () => {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/support/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to send reply");
      setReply("");
      // Optimistically mark as in_progress if currently open
      if (selected.status === "open") {
        setSelected((prev) => prev ? { ...prev, status: "in_progress" } : prev);
      }
      await mutateThread();
      mutate();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (id: string, status: TicketStatus) => {
    setUpdatingStatus(true);
    try {
      await fetch(`/api/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setSelected((prev) => prev?.id === id ? { ...prev, status } : prev);
      mutate();
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="page-enter space-y-8 text-left">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-teal-400 text-[11px] font-black uppercase tracking-[0.2em]">Admin · Support</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Help <span className="gradient-text">Desk</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {open} open · {inProg} in progress · {resolved} resolved
          </p>
        </div>
        {open > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{open} Needs Attention</span>
          </div>
        )}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open",        value: open,     cls: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
          { label: "In Progress", value: inProg,   cls: "bg-sky-500/10 border-sky-500/20 text-sky-400" },
          { label: "Resolved",    value: resolved,  cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.cls}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{s.label}</p>
            <p className="text-3xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ticket list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input
              type="text"
              placeholder="Search by subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 bg-white/[0.03] border border-white/8 text-slate-300 text-xs rounded-xl focus:outline-none placeholder-slate-600"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filters row */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter size={11} className="text-slate-600" />
              {(["all", "open", "in_progress", "resolved"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                    statusFilter === s
                      ? "bg-white/[0.08] border-white/20 text-white"
                      : "bg-white/[0.02] border-white/5 text-slate-600 hover:text-slate-400"
                  }`}
                >
                  {s === "all" ? "All" : s === "in_progress" ? "Active" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", "patient", "doctor", "clinic"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                  roleFilter === r
                    ? r === "all"
                      ? "bg-white/[0.08] border-white/20 text-white"
                      : (ROLE_COLOR[r] || "bg-white/[0.08] border-white/20 text-white")
                    : "bg-white/[0.02] border-white/5 text-slate-600 hover:text-slate-400"
                }`}
              >
                {r !== "all" && ROLE_ICON[r]}
                {r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
            ))
          ) : allTickets.length === 0 ? (
            <div className="text-center py-16 opacity-40">
              <Headphones size={32} className="mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">No help tickets</p>
            </div>
          ) : (
            allTickets.map((t) => {
              const s = STATUS_CFG[t.status] || STATUS_CFG.open;
              return (
                <button
                  key={t.id}
                  onClick={() => { setSelected(t); setSendError(null); setReply(""); }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all hover:border-teal-500/30 ${
                    selected?.id === t.id ? "bg-teal-500/5 border-teal-500/30" : "bg-white/[0.02] border-white/5"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="text-sm font-bold text-white line-clamp-1">{t.subject}</p>
                    <ChevronRight size={14} className="text-slate-600 shrink-0 mt-0.5" />
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2 truncate">
                    {t.users?.first_name || ""} {t.users?.last_name || ""} · {t.users?.email || t.user_id}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.cls}`}>
                      {s.icon}{s.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${ROLE_COLOR[t.role] || "text-slate-400 border-white/10 bg-white/5"}`}>
                      {ROLE_ICON[t.role]}{t.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${PRIORITY_CFG[t.priority] || ""}`}>
                      {t.priority}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <Card glass className="p-6 space-y-5 sticky top-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    #{selected.id.split("-").pop()?.toUpperCase()} · Help Request
                  </p>
                  <h2 className="text-lg font-black text-white leading-snug">{selected.subject}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${STATUS_CFG[selected.status]?.cls || STATUS_CFG.open.cls}`}>
                    {STATUS_CFG[selected.status]?.icon}
                    {STATUS_CFG[selected.status]?.label}
                  </span>
                </div>
              </div>

              {/* User info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
                  <User size={14} className="text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Filed By</p>
                    <p className="text-sm font-bold text-white truncate">
                      {selected.users?.first_name || ""} {selected.users?.last_name || "User"}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{selected.users?.email || "—"}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
                  <Tag size={14} className="text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Details</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest border px-1.5 py-0.5 rounded ${ROLE_COLOR[selected.role] || "text-slate-400 border-white/10 bg-white/5"}`}>
                        {selected.role}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-widest border px-1.5 py-0.5 rounded ${PRIORITY_CFG[selected.priority] || ""}`}>
                        {selected.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Original message */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MessageSquare size={11} />Original Message
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{selected.message}</p>
              </div>

              {/* Chat thread */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    Thread · {messages.length} {messages.length === 1 ? "message" : "messages"}
                  </p>
                  <button
                    onClick={() => mutateThread()}
                    disabled={threadLoading}
                    className="text-slate-700 hover:text-slate-400 transition-colors"
                    title="Refresh thread"
                  >
                    <RefreshCw size={12} className={threadLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                {messages.length > 0 && (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {messages.map((msg) => {
                      /**
                       * Admin view alignment:
                       * - sender_role === "admin" → RIGHT (admin's own messages)
                       * - any other role (patient/doctor/clinic) → LEFT (user messages)
                       */
                      const isAdminMsg = msg.sender_role === "admin";
                      const cfg = MSG_AVATAR[msg.sender_role] || MSG_AVATAR.patient;
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isAdminMsg ? "flex-row-reverse" : "flex-row"}`}>
                          <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center border ${cfg.cls}`}>
                            {cfg.icon}
                          </div>
                          <div className={`max-w-[80%] ${isAdminMsg ? "items-end" : "items-start"} flex flex-col`}>
                            <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                              isAdminMsg
                                ? "bg-violet-500/10 border border-violet-500/20 text-violet-100 rounded-tr-sm"
                                : "bg-white/[0.04] border border-white/5 text-slate-300 rounded-tl-sm"
                            }`}>
                              {msg.message}
                            </div>
                            <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest mt-0.5 px-0.5">
                              {cfg.label} · {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Status actions */}
              {selected.status !== "resolved" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateStatus(selected.id, "in_progress")}
                    disabled={selected.status === "in_progress" || updatingStatus}
                    variant="secondary"
                    className="flex-1 h-9 rounded-xl text-sky-400 border-sky-500/20 hover:bg-sky-500 hover:text-white font-black text-[10px] uppercase tracking-widest"
                    icon={<Clock size={12} />}
                  >
                    In Progress
                  </Button>
                  <Button
                    onClick={() => updateStatus(selected.id, "resolved")}
                    disabled={updatingStatus}
                    variant="secondary"
                    className="flex-1 h-9 rounded-xl text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white font-black text-[10px] uppercase tracking-widest"
                    icon={<CheckCircle2 size={12} />}
                  >
                    Resolve
                  </Button>
                </div>
              )}

              {/* Admin reply box */}
              {selected.status !== "resolved" && (
                <div className="space-y-2">
                  <div className="rounded-xl border border-white/8 focus-within:border-teal-500/30 bg-white/[0.02] transition-colors">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendReply(); }}
                      placeholder="Type admin reply... (Ctrl+Enter to send)"
                      rows={3}
                      className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-600 p-3 focus:outline-none resize-none"
                    />
                  </div>
                  {sendError && (
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle size={13} />
                      {sendError}
                    </div>
                  )}
                  <Button
                    onClick={sendReply}
                    disabled={!reply.trim() || sending}
                    variant="primary"
                    className="w-full h-10 rounded-xl font-black text-xs uppercase tracking-widest"
                    icon={sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  >
                    {sending ? "Sending..." : "Send Admin Reply"}
                  </Button>
                </div>
              )}

              {selected.status === "resolved" && (
                <div className="flex items-center justify-center gap-2 py-4 text-emerald-400 text-sm font-black uppercase tracking-widest border border-emerald-500/20 rounded-xl bg-emerald-500/5">
                  <CheckCircle2 size={18} />Ticket Resolved
                </div>
              )}
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 opacity-40">
              <Headphones size={40} />
              <p className="text-sm font-black uppercase tracking-widest">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
