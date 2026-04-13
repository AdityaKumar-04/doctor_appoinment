"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bell,
  CalendarCheck,
  Star,
  CreditCard,
  AlertCircle,
  Info,
  CheckCheck,
  X,
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TypeIcon({ type }: { type: string }) {
  const cls = "shrink-0";
  if (type === "appointment") return <CalendarCheck size={14} className={`${cls} text-teal-400`} />;
  if (type === "review") return <Star size={14} className={`${cls} text-amber-400`} />;
  if (type === "payment") return <CreditCard size={14} className={`${cls} text-emerald-400`} />;
  if (type === "alert") return <AlertCircle size={14} className={`${cls} text-red-400`} />;
  return <Info size={14} className={`${cls} text-indigo-400`} />;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on open
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Initial silent fetch for unread badge
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-lg transition-all ${
          open
            ? "text-white bg-white/10 border border-white/10"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }`}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-rose-500 rounded-full border-2 border-[#0b0f1a] flex items-center justify-center text-[9px] font-black text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-[200] rounded-2xl border border-white/8 bg-[#0d1220]/95 backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden"
          style={{ animation: "fadeInDown 0.15s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-teal-400" />
              <span className="text-sm font-black text-white tracking-tight">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-black">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={marking}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 transition-all disabled:opacity-40"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {loading ? (
              <div className="space-y-px p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-0.5">
                      <div className="h-2.5 bg-white/5 rounded w-2/3" />
                      <div className="h-2 bg-white/5 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                  <Bell size={24} className="text-slate-700" />
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  No notifications
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-px">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-default ${
                      !n.is_read
                        ? "bg-teal-500/5 border border-teal-500/10"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Type Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === "appointment"
                          ? "bg-teal-500/10"
                          : n.type === "review"
                          ? "bg-amber-500/10"
                          : n.type === "payment"
                          ? "bg-emerald-500/10"
                          : n.type === "alert"
                          ? "bg-red-500/10"
                          : "bg-indigo-500/10"
                      }`}
                    >
                      <TypeIcon type={n.type} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs font-black leading-tight tracking-tight ${
                            n.is_read ? "text-slate-300" : "text-white"
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-600 font-bold whitespace-nowrap shrink-0">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] font-medium mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      {n.action_url && (
                        <a
                          href={n.action_url}
                          className="text-[10px] font-black text-teal-400 hover:text-teal-300 uppercase tracking-widest mt-1 inline-block transition-colors"
                          onClick={() => setOpen(false)}
                        >
                          View →
                        </a>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/5 px-4 py-2.5 flex items-center justify-center">
              <a
                href="/dashboard/notifications"
                className="text-[10px] font-black text-slate-500 hover:text-teal-400 uppercase tracking-widest transition-colors"
                onClick={() => setOpen(false)}
              >
                View all notifications →
              </a>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
