"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AppointmentCard from "@/components/appointment/AppointmentCard";
import StatsCard from "@/components/features/StatsCard";
import { SkeletonStatCard, SkeletonCard } from "@/components/ui/SkeletonCard";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { Appointment } from "@/utils/types";
import { Plus, ArrowRight, Activity, Users, Clock, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { user, role, profile } = useAuth();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error, mutate } = useSWR(
    user && role === "patient" ? `/api/appointments?userId=${user.id}&role=patient` : null,
    fetcher
  );

  const appointments: Appointment[] = data?.appointments || [];
  
  const stats = data
    ? {
        totalVisits: appointments.length,
        specialistsSeen: new Set(appointments.map((a: Appointment) => a.doctors?.specialization)).size,
        pending: appointments.filter((a: Appointment) => a.status === "pending").length,
        confirmed: appointments.filter((a: Appointment) => a.status === "confirmed").length,
      }
    : { totalVisits: 0, specialistsSeen: 0, pending: 0, confirmed: 0 };

  const dataLoading = !data && !error;

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("patient_appointments_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `patient_id=eq.${user.id}`,
        },
        () => { mutate(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, mutate, supabase]);

  if (!user || role !== "patient") return null;

  const recentAppointments = appointments.slice(0, 3);
  const firstName = profile?.first_name || user.email?.split("@")[0] || "Patient";

  return (
    <div className="page-enter space-y-10">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-teal-500 text-[11px] font-black uppercase tracking-[0.2em]">
            {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Welcome back, <span className="gradient-text">{firstName}</span> 👋
          </h1>
        </div>
        <Link href="/doctors">
          <Button variant="primary" size="lg" icon={<Plus size={18} />} className="shadow-2xl">
            Book Appointment
          </Button>
        </Link>
      </header>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dataLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatsCard label="Total Visits" value={stats.totalVisits.toString().padStart(2, "0")} icon="event_note" accent="sky" />
            <StatsCard label="Specialties" value={stats.specialistsSeen.toString().padStart(2, "0")} icon="stethoscope" accent="teal" />
            <StatsCard label="Pending" value={stats.pending.toString().padStart(2, "0")} icon="pending" accent="amber" />
            <StatsCard label="Confirmed" value={stats.confirmed.toString().padStart(2, "0")} icon="check_circle" accent="emerald" />
          </>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { href: "/clinics", label: "Browse Clinics", sub: "Find the nearest facility", icon: <Activity size={24} />, color: "teal" },
          { href: "/doctors", label: "Find a Doctor", sub: "Search for top specialists", icon: <Users size={24} />, color: "indigo" },
          { href: "/dashboard/appointments", label: "My History", sub: "View previous records", icon: <Clock size={24} />, color: "purple" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="glass-card p-6 rounded-2xl flex items-center gap-5 hover:bg-white/[0.05] hover:scale-[1.02] hover:border-white/20 transition-all group"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/5 group-hover:border-teal-500/30 group-hover:bg-teal-500/10 group-hover:text-teal-400 transition-all`}>
              {action.icon}
            </div>
            <div className="flex-1">
              <p className="font-black text-white text-base tracking-tight">{action.label}</p>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mt-1">{action.sub}</p>
            </div>
            <ArrowRight className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" size={20} />
          </Link>
        ))}
      </div>

      {/* ── Recent Appointments ── */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <CheckCircle2 className="text-teal-500" size={18} />
             </div>
             <h2 className="text-xl font-black text-white tracking-tight">Upcoming Appointments</h2>
          </div>
          <Link href="/dashboard/appointments" className="text-[11px] font-black text-teal-500 uppercase tracking-widest hover:text-teal-400 transition-colors flex items-center gap-1.5">
            View Schedule
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="space-y-4">
          {dataLoading ? (
            Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} rows={2} />)
          ) : recentAppointments.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center border-dashed border-white/10">
              <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Clock className="text-slate-600" size={40} />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight mb-2">No active appointments</h3>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-8">Ready to book your next consultation?</p>
              <Link href="/doctors">
                <Button variant="outline" className="px-10 rounded-full">Explore Doctors</Button>
              </Link>
            </div>
          ) : (
            recentAppointments.map((apt: Appointment) => (
              <AppointmentCard key={apt.id} role="patient" appointment={apt} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
