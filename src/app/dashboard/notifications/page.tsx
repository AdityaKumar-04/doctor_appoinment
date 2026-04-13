"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  CheckCheck,
  CalendarCheck,
  Star,
  CreditCard,
  Info,
  AlertCircle,
  Dot,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  created_at: string;
  action_url?: string | null;
}

function NotifIcon({ type }: { type: string }) {
  const base = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border";
  if (type === "appointment") return <div className={`${base} bg-teal-500/10 border-teal-500/20`}><CalendarCheck size={18} className="text-teal-400" /></div>;
  if (type === "review") return <div className={`${base} bg-amber-500/10 border-amber-500/20`}><Star size={18} className="text-amber-400" /></div>;
  if (type === "payment") return <div className={`${base} bg-emerald-500/10 border-emerald-500/20`}><CreditCard size={18} className="text-emerald-400" /></div>;
  if (type === "alert") return <div className={`${base} bg-red-500/10 border-red-500/20`}><AlertCircle size={18} className="text-red-400" /></div>;
  return <div className={`${base} bg-indigo-500/10 border-indigo-500/20`}><Info size={18} className="text-indigo-400" /></div>;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await fetch("/api/notifications/mark-read", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!user) return null;

  return (
    <div className="page-enter space-y-8 text-left max-w-2xl">
      {/* Header */}
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em]">Activity Center</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Notifications
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {loading ? "Loading..." : `${unreadCount} unread`}
          </p>
        </div>
        {unreadCount > 0 && !loading && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-teal-400 hover:border-teal-500/20 hover:bg-teal-500/5 transition-all text-[11px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            <CheckCheck size={14} />
            {marking ? "Marking..." : "Mark all read"}
          </button>
        )}
      </header>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 flex items-start gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-2/3" />
                <div className="h-2.5 bg-white/5 rounded w-full" />
                <div className="h-2 bg-white/5 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="glass-card rounded-2xl py-24 flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <Bell size={36} className="text-slate-700" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">All Caught Up</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`glass-card rounded-2xl p-5 flex items-start gap-4 transition-all duration-300 ${
                !n.is_read ? "border-l-2 border-l-teal-500/50" : ""
              }`}
            >
              <NotifIcon type={n.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-black tracking-tight leading-tight ${n.is_read ? "text-slate-300" : "text-white"}`}>
                    {n.title}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.is_read && (
                      <Dot size={24} className="text-teal-400 -mr-2" />
                    )}
                    <span className="text-[10px] text-slate-600 font-bold whitespace-nowrap">{timeAgo(n.created_at)}</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs font-medium mt-1 leading-relaxed">{n.message}</p>
                {n.action_url && (
                  <a
                    href={n.action_url}
                    className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-teal-400 hover:text-teal-300 uppercase tracking-widest transition-colors"
                  >
                    View →
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
