"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Card from "@/components/ui/Card";
import {
  Ticket,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Headphones,
  ArrowRight,
  Calendar,
  Flag,
  Search,
  X,
  Filter,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed");
    return d;
  });

export type TicketStatus = "open" | "in_progress" | "resolved";
export type TicketType   = "complaint" | "help";
export type TicketPriority = "low" | "medium" | "high";

export interface SupportTicket {
  id: string;
  type: TicketType;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  role: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CFG: Record<TicketStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  open:        { label: "Open",        cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",       icon: <AlertTriangle size={11} /> },
  in_progress: { label: "In Progress", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20",             icon: <Clock size={11} /> },
  resolved:    { label: "Resolved",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 size={11} /> },
};

const PRIORITY_CFG: Record<TicketPriority, string> = {
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low:    "text-slate-400 bg-white/5 border-white/10",
};

const TYPE_CFG: Record<TicketType, { label: string; icon: React.ReactNode; cls: string }> = {
  complaint: { label: "Complaint", icon: <MessageSquare size={13} />, cls: "text-rose-400" },
  help:      { label: "Help",      icon: <Headphones size={13} />,    cls: "text-sky-400" },
};

interface TicketListProps {
  basePath: string;
}

export default function TicketList({ basePath }: TicketListProps) {
  const { data, isLoading: loading } = useSWR("/api/support", fetcher, {
    revalidateOnFocus: true,
  });
  const allTickets: SupportTicket[] = data?.tickets || [];

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TicketType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");

  // Apply client-side filters
  const tickets = allTickets.filter((t) => {
    const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const open       = allTickets.filter((t) => t.status === "open").length;
  const inProgress = allTickets.filter((t) => t.status === "in_progress").length;
  const resolved   = allTickets.filter((t) => t.status === "resolved").length;

  const hasFilters = search || typeFilter !== "all" || statusFilter !== "all";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-12 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open",        value: open,        cls: "bg-amber-500/10 border-amber-500/20 text-amber-400",   cursor: "open" as TicketStatus },
          { label: "In Progress", value: inProgress,  cls: "bg-sky-500/10 border-sky-500/20 text-sky-400",         cursor: "in_progress" as TicketStatus },
          { label: "Resolved",    value: resolved,    cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", cursor: "resolved" as TicketStatus },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(statusFilter === s.cursor ? "all" : s.cursor)}
            className={`rounded-2xl border p-4 text-left transition-all hover:brightness-110 active:scale-[0.98] ${s.cls} ${statusFilter === s.cursor ? "ring-2 ring-white/10" : ""}`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{s.label}</p>
            <p className="text-3xl font-black">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
          <input
            type="text"
            placeholder="Search tickets by subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-9 bg-white/[0.03] border border-white/8 text-slate-300 text-sm rounded-xl focus:outline-none focus:border-white/20 placeholder-slate-600"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-600 shrink-0" />
          {(["all", "help", "complaint"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                typeFilter === t
                  ? t === "complaint"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : t === "help"
                      ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                      : "bg-white/[0.06] border-white/15 text-white"
                  : "bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10"
              }`}
            >
              {t === "all" ? "All" : t === "help" ? "Help" : "Complaint"}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter indicator */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Showing {tickets.length} of {allTickets.length} tickets
          </span>
          <button
            onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
            className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Ticket List */}
      {allTickets.length === 0 ? (
        /* True empty state — no tickets at all */
        <div className="flex flex-col items-center justify-center py-24 gap-5 rounded-2xl border border-dashed border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
            <Ticket size={28} className="text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No tickets yet</p>
            <p className="text-[11px] text-slate-700 font-bold mt-1 uppercase tracking-widest">
              Click &quot;New Ticket&quot; above to raise an issue
            </p>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        /* Filtered empty state */
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-dashed border-white/10">
          <Search size={28} className="text-slate-700" />
          <div className="text-center">
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No tickets match your filter</p>
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
              className="text-[11px] text-slate-600 font-bold mt-1 uppercase tracking-widest hover:text-slate-400 underline"
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const s = STATUS_CFG[ticket.status] || STATUS_CFG.open;
            const p = PRIORITY_CFG[ticket.priority] || PRIORITY_CFG.medium;
            const t = TYPE_CFG[ticket.type] || TYPE_CFG.help;
            return (
              <Link key={ticket.id} href={`${basePath}/${ticket.id}`}>
                <Card
                  className="group p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 cursor-pointer transition-all"
                  glass
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${
                      ticket.type === "complaint"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-sky-500/10 border-sky-500/20 text-sky-400"
                    }`}>
                      {t.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white tracking-tight group-hover:text-slate-100 truncate max-w-[320px]">
                        {ticket.subject}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ticket.message}</p>
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.cls}`}>
                          {s.icon}{s.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${p}`}>
                          <Flag size={8} className="inline mr-0.5" />{ticket.priority}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${t.cls}`}>
                          {t.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-slate-600 text-[10px] font-bold justify-end">
                        <Calendar size={10} />
                        {new Date(ticket.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </div>
                      {ticket.status === "in_progress" && (
                        <p className="text-[9px] text-sky-500 font-bold uppercase tracking-widest mt-0.5">
                          Team replied
                        </p>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
