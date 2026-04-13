"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/features/StatsCard";
import Card, { CardContent } from "@/components/ui/Card";
import { SkeletonStatCard } from "@/components/ui/SkeletonCard";
import {
  Building2,
  Stethoscope,
  Users,
  Wallet,
  History,
  Zap,
  ArrowRight,
  ShieldCheck,
  Users2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Headphones,
  MessageSquare,
  Settings,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface AdminStats {
  users: number;
  clinics: number;
  doctors: number;
  appointments: number;
  revenue: number;
  recentActivity: Array<{ id: string; action: string; created_at: string }>;
}

const QUICK_ACTIONS = [
  { label: "Clinic Registry",   href: "/admin/clinics",    icon: <Building2 size={18} />,    color: "hover:bg-teal-500/10 hover:border-teal-500/30 hover:text-teal-400" },
  { label: "Doctor Management", href: "/admin/doctors",    icon: <Stethoscope size={18} />,  color: "hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-400" },
  { label: "Patient Database",  href: "/admin/patients",   icon: <Users2 size={18} />,       color: "hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400" },
  { label: "User Directory",    href: "/admin/users",      icon: <Users size={18} />,        color: "hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400" },
  { label: "Revenue & Payments",href: "/admin/payments",   icon: <Wallet size={18} />,       color: "hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-400" },
  { label: "Help Desk",         href: "/admin/helpdesk",   icon: <Headphones size={18} />,   color: "hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400" },
  { label: "Complaints",        href: "/admin/complaints", icon: <MessageSquare size={18} />,color: "hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400" },
  { label: "System Settings",   href: "/admin/settings",   icon: <Settings size={18} />,     color: "hover:bg-white/5 hover:border-white/10 hover:text-white" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="h-10 w-64 bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="h-48 bg-white/[0.02] rounded-2xl animate-pulse border border-white/5" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-10 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
        <AlertTriangle className="mx-auto text-red-400 mb-4" size={40} />
        <h2 className="text-red-400 font-black text-lg">Failed to load system statistics</h2>
        <Button variant="ghost" className="mt-4" onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-10 text-left">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-violet-400 text-[11px] font-black uppercase tracking-[0.2em]">Admin · System Controller</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Platform <span className="gradient-text">Overview</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            Real-time metrics · Infrastructure health
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">System Live</span>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        <StatsCard label="Total Users"   value={stats.users.toString()}         icon="group"          accent="sky" />
        <StatsCard label="Active Clinics" value={stats.clinics.toString()}       icon="local_hospital" accent="teal" />
        <StatsCard label="Doctors"       value={stats.doctors.toString()}        icon="stethoscope"    accent="indigo" />
        <StatsCard label="Appointments"  value={stats.appointments.toString()}   icon="event"          accent="amber" />
        <StatsCard label="Revenue"       value={`₹${stats.revenue.toLocaleString("en-IN")}`} icon="payments" accent="emerald" />
      </div>

      {/* System Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending Approvals</p>
            <p className="text-xl font-black text-white mt-0.5">—</p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No queue available</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Failed Payments</p>
            <p className="text-xl font-black text-white mt-0.5">—</p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Monitoring active</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Today Revenue</p>
            <p className="text-xl font-black text-white mt-0.5">Live</p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              <Link href="/admin/payments" className="hover:text-teal-400 transition-colors">View →</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Log */}
        <Card className="lg:col-span-2 overflow-hidden" glass hover>
          <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                <History className="text-slate-400" size={18} />
              </div>
              <p className="font-black text-white text-sm uppercase tracking-wide">Recent Activity</p>
            </div>
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm" className="text-[10px] uppercase tracking-widest font-black">
                View Settings
              </Button>
            </Link>
          </div>
          <CardContent className="p-6">
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-5">
                {stats.recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Zap className="text-violet-400 opacity-60" size={14} />
                    </div>
                    <div className="flex-1 border-b border-white/5 pb-4 group-last:border-0 group-last:pb-0">
                      <p className="text-sm font-bold text-white tracking-tight">{log.action}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <History size={36} className="mx-auto mb-4 text-slate-700" />
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No activity logged yet</p>
                <p className="text-[10px] text-slate-700 font-bold mt-1 uppercase tracking-widest">
                  Activity logs appear when admin actions are performed
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 mb-4">Administrative Actions</p>
          {QUICK_ACTIONS.map((btn) => (
            <Link key={btn.label} href={btn.href} className="block group">
              <div className={`flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 transition-all duration-200 ${btn.color}`}>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 group-hover:scale-110 transition-transform">{btn.icon}</span>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white tracking-tight">{btn.label}</span>
                </div>
                <ArrowRight size={14} className="text-slate-700 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}

          {/* Security Note */}
          <div className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-violet-400" />
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Fraud Detection</p>
            </div>
            <p className="text-[10px] text-violet-200/40 leading-relaxed font-medium">
              Advanced fraud monitoring and suspicious activity detection is coming soon.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/5">
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Activity Logs</p>
            <p className="text-[10px] text-slate-800 font-bold">Full audit trail — requires <code className="text-slate-600">admin_logs</code> table</p>
          </div>
        </div>
      </div>
    </div>
  );
}
