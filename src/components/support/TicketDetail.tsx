"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Headphones,
  Send,
  Loader2,
  AlertCircle,
  User,
  ShieldCheck,
  Flag,
  Calendar,
  RefreshCw,
  Stethoscope,
  Building2,
} from "lucide-react";
import type { TicketStatus, TicketPriority, TicketType } from "./TicketList";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed");
    return d;
  });

const STATUS_CFG: Record<TicketStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  open:        { label: "Open",        cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",       icon: <AlertTriangle size={13} /> },
  in_progress: { label: "In Progress", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20",             icon: <Clock size={13} /> },
  resolved:    { label: "Resolved",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 size={13} /> },
};

const PRIORITY_CFG: Record<TicketPriority, string> = {
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low:    "text-slate-400 bg-white/5 border-white/10",
};

const ROLE_AVATAR: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  admin:   { icon: <ShieldCheck size={14} />, cls: "bg-violet-500/10 border-violet-500/20 text-violet-400", label: "Support Team" },
  patient: { icon: <User size={14} />,        cls: "bg-white/[0.04] border-white/8 text-slate-400",         label: "Patient" },
  doctor:  { icon: <Stethoscope size={14} />, cls: "bg-sky-500/10 border-sky-500/20 text-sky-400",           label: "Doctor" },
  clinic:  { icon: <Building2 size={14} />,   cls: "bg-teal-500/10 border-teal-500/20 text-teal-400",        label: "Clinic" },
};

interface TicketMessage {
  id: string;
  message: string;
  sender_id: string;
  sender_role: string;
  created_at: string;
}

interface TicketDetailData {
  id: string;
  subject: string;
  message: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  role: string;
  created_at: string;
  updated_at: string;
}

interface TicketDetailProps {
  ticketId: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function formatDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TicketDetail({ ticketId }: TicketDetailProps) {
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Refresh every 5 seconds for near-real-time feel
  const { data, isLoading: loading, mutate, isValidating } = useSWR(
    ticketId ? `/api/support/${ticketId}` : null,
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: true }
  );

  const ticket: TicketDetailData | null = data?.ticket || null;
  const messages: TicketMessage[] = data?.messages || [];

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/support/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to send");
      setReply("");
      // Immediately refetch to show the new message
      await mutate();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      sendReply();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="h-44 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
        <div className="h-72 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-dashed border-white/10">
        <AlertCircle className="text-red-400" size={36} />
        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Ticket not found</p>
        <p className="text-[11px] text-slate-700 font-bold">The ticket may have been removed or you don&apos;t have access.</p>
      </div>
    );
  }

  const s = STATUS_CFG[ticket.status] || STATUS_CFG.open;
  const isResolved = ticket.status === "resolved";

  // Group messages by day
  type MessageGroup = { day: string; msgs: TicketMessage[] };
  const grouped = messages.reduce<MessageGroup[]>((acc, msg) => {
    const day = formatDay(msg.created_at);
    const last = acc[acc.length - 1];
    if (last && last.day === day) {
      last.msgs.push(msg);
    } else {
      acc.push({ day, msgs: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Ticket Overview */}
      <Card glass className="p-6 space-y-5">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 shrink-0 rounded-2xl border flex items-center justify-center ${
              ticket.type === "complaint"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-sky-500/10 border-sky-500/20 text-sky-400"
            }`}>
              {ticket.type === "complaint" ? <MessageSquare size={20} /> : <Headphones size={20} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                #{ticket.id.split("-").pop()?.toUpperCase()} · {ticket.type === "complaint" ? "Complaint" : "Help Request"}
              </p>
              <h2 className="text-xl font-black text-white mt-0.5 leading-snug">{ticket.subject}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border ${s.cls}`}>
              {s.icon}{s.label}
            </span>
            <button
              onClick={() => mutate()}
              disabled={isValidating}
              title="Refresh"
              className="w-8 h-8 rounded-xl border border-white/8 bg-white/[0.02] flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RefreshCw size={13} className={isValidating ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 pb-5 border-b border-white/5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${PRIORITY_CFG[ticket.priority] || PRIORITY_CFG.medium}`}>
            <Flag size={10} />{ticket.priority} priority
          </span>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <Calendar size={11} />
            Opened {new Date(ticket.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric"
            })}
          </div>
          {ticket.updated_at !== ticket.created_at && (
            <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-bold">
              <Clock size={11} />
              Updated {new Date(ticket.updated_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short"
              })}
            </div>
          )}
        </div>

        {/* Original message */}
        <div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2.5">Your Original Message</p>
          <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.02] border border-white/5 p-4 rounded-xl">
            {ticket.message}
          </p>
        </div>
      </Card>

      {/* Conversation Thread */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Conversation Thread · {messages.length} {messages.length === 1 ? "reply" : "replies"}
          </p>
          {isValidating && (
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
              <RefreshCw size={9} className="animate-spin" />Syncing
            </span>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="py-12 rounded-2xl border border-dashed border-white/10 text-center space-y-2">
            <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
              No replies yet
            </p>
            <p className="text-[10px] text-slate-800 font-bold">Our support team will respond within 24 hours</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.day} className="space-y-3">
                {/* Day separator */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{group.day}</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {group.msgs.map((msg) => {
                  /**
                   * Alignment strategy (from the user's perspective):
                   * - Messages the current user sent → RIGHT (isOwn = true)
                   * - Messages from admin (support team) → LEFT + violet bubble
                   * - Messages from other users (edge case) → LEFT
                   */
                  const isOwn = msg.sender_id === user?.id;
                  const isAdminMsg = msg.sender_role === "admin";
                  const avatarCfg = ROLE_AVATAR[msg.sender_role] || ROLE_AVATAR.patient;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${avatarCfg.cls}`}>
                        {avatarCfg.icon}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[75%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          isOwn
                            ? "bg-white/[0.06] border border-white/8 text-slate-200 rounded-tr-md"
                            : isAdminMsg
                              ? "bg-violet-500/10 border border-violet-500/20 text-violet-100 rounded-tl-md"
                              : "bg-white/[0.04] border border-white/5 text-slate-300 rounded-tl-md"
                        }`}>
                          {msg.message}
                        </div>
                        <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest px-1">
                          {isOwn ? "You" : avatarCfg.label} · {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Reply box — disabled if resolved */}
      {!isResolved ? (
        <Card glass className="p-5 space-y-3">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Add a Reply · <span className="text-slate-700">Ctrl+Enter to send</span>
          </p>
          <div className="rounded-xl border border-white/8 focus-within:border-white/20 bg-white/[0.02] transition-colors">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Provide more details or ask a follow-up question..."
              rows={4}
              className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-600 p-4 focus:outline-none resize-none leading-relaxed"
            />
            <div className="px-4 pb-2 text-right">
              <span className="text-[9px] text-slate-700 font-bold">{reply.length}/2000</span>
            </div>
          </div>
          {sendError && (
            <div className="flex items-center gap-2 text-red-400 text-sm font-bold p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} />
              {sendError}
            </div>
          )}
          <Button
            onClick={sendReply}
            disabled={!reply.trim() || sending}
            variant="primary"
            className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest"
            icon={sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          >
            {sending ? "Sending..." : "Send Reply"}
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <CheckCircle2 size={28} className="text-emerald-400" />
          <div className="text-center">
            <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Ticket Resolved</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              Thank you for your patience. If your issue persists, please open a new ticket.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
