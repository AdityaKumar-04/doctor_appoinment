"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import StatsCard from "@/components/features/StatsCard";
import { SkeletonStatCard, SkeletonTable } from "@/components/ui/SkeletonCard";
import useSWR from "swr";
import Link from "next/link";
import { Appointment } from "@/utils/types";
import TreatmentModal from "@/components/appointment/TreatmentModal";
import {
  Calendar,
  UserCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Users,
  ChevronRight,
  Stethoscope,
  Bell,
  Zap,
} from "lucide-react";
import Card from "@/components/ui/Card";

const fetcher = (url: string) => fetch(url).then(res => res.json());

function formatTime(t: string) {
  try {
    return new Date(`1970-01-01T${t}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return t;
  }
}

export default function DoctorDashboardPage() {
  const { user, profile, role } = useAuth();
  const [toggleLoading, setToggleLoading] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);

  const { data: aptData, error: aptError, mutate: mutateApt } = useSWR(
    user && role === "doctor" ? `/api/appointments?userId=${user.id}&role=doctor` : null,
    fetcher
  );

  const { data: docData, error: docError, mutate: mutateDoc } = useSWR(
    user && role === "doctor" ? `/api/doctors/${user.id}` : null,
    fetcher
  );

  const appointments: Appointment[] = aptData?.appointments || [];
  const isActive = docData?.doctor?.is_active || false;
  const dataLoading = (!aptData && !aptError) || (!docData && !docError);

  const handleToggle = async () => {
    setToggleLoading(true);
    try {
      const res = await fetch(`/api/doctors/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (res.ok) mutateDoc();
    } catch (e) {
      console.error(e);
    } finally {
      setToggleLoading(false);
    }
  };

  if (!user || role !== "doctor") return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysAppointments = appointments
    .filter(a => a.appointment_date === todayStr)
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

  const completedToday = todaysAppointments.filter(a => a.status === "completed").length;
  const pendingToday = todaysAppointments.filter(a => a.status === "pending" || a.status === "confirmed").length;

  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const earnings = appointments
    .filter(a => a.status === "completed")
    .reduce((acc, a) => acc + (a.doctors?.consultation_fee || 0), 0);

  // Next upcoming (non-completed) appointment today
  const nextAppointment = todaysAppointments.find(
    a => a.status !== "completed" && a.status !== "cancelled"
  );

  const patientName = nextAppointment
    ? `${nextAppointment.users?.first_name || ""} ${nextAppointment.users?.last_name || "Patient"}`.trim()
    : "";

  return (
    <>
    <div className="page-enter space-y-10 text-left">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-teal-400 text-[11px] font-black uppercase tracking-[0.2em]">
            {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Good day, <span className="gradient-text">Dr. {profile?.first_name || "Doctor"}</span> 👋
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {todaysAppointments.length} patients scheduled · {completedToday} completed · {pendingToday} remaining
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pending alert badge */}
          {!dataLoading && pendingCount > 0 && (
            <Link
              href="/doctor-dashboard/appointments"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest hover:bg-amber-500/20 transition-colors"
            >
              <Bell size={14} className="animate-pulse" />
              {pendingCount} Pending
            </Link>
          )}
          <button
            onClick={handleToggle}
            disabled={toggleLoading || dataLoading}
            className={`
              flex items-center gap-3.5 px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest border transition-all duration-500
              ${isActive
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
                : "bg-white/5 border-white/10 text-slate-400 opacity-60 hover:opacity-100"}
            `}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            {toggleLoading ? "Updating..." : isActive ? "Accepting Patients" : "Currently Offline"}
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dataLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatsCard label="Today's Patients" value={todaysAppointments.length.toString().padStart(2, "0")} icon="event" accent="sky" />
            <StatsCard label="Completed Today" value={completedToday.toString().padStart(2, "0")} icon="check_circle" accent="emerald" />
            <StatsCard label="Remaining Today" value={pendingToday.toString().padStart(2, "0")} icon="pending" accent="amber" />
            <StatsCard label="Est. Earnings" value={`₹${earnings}`} icon="account_balance" accent="indigo" />
          </>
        )}
      </div>

      {/* Two-Column: Next Appointment + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Next Appointment Smart Card */}
        <div className="lg:col-span-3">
          <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Zap size={16} className="text-teal-400" />
                </div>
                <h2 className="text-base font-black text-white tracking-tight">Next Up</h2>
              </div>
              <Link
                href="/doctor-dashboard/today"
                className="text-[10px] font-black text-teal-400 uppercase tracking-widest hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                Full Calendar <ArrowRight size={12} />
              </Link>
            </div>

            {dataLoading ? (
              <div className="p-8"><SkeletonTable rows={1} /></div>
            ) : !nextAppointment ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-emerald-400" size={32} />
                </div>
                <p className="font-black text-white text-lg mb-1">All Clear!</p>
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
                  No more appointments today
                </p>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 font-black text-xl uppercase">
                    {nextAppointment.users?.first_name?.charAt(0) || "P"}{nextAppointment.users?.last_name?.charAt(0) || ""}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-white text-lg tracking-tight">{patientName}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                        nextAppointment.status === "confirmed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${nextAppointment.status === "confirmed" ? "bg-emerald-400" : "bg-amber-400"}`} />
                        {nextAppointment.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                        <Clock size={14} />
                        {formatTime(nextAppointment.appointment_time)}
                      </span>
                      {nextAppointment.notes && (
                        <span className="text-slate-400 text-xs font-medium truncate max-w-[200px]">
                          {nextAppointment.notes}
                        </span>
                      )}
                    </div>
                    {nextAppointment.clinics?.name && (
                      <p className="text-xs text-slate-500 font-bold">{nextAppointment.clinics.name}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => setShowTreatmentModal(true)}
                    className="flex-1 h-11 rounded-xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    <CheckCircle2 size={16} /> Complete &amp; Document
                  </button>
                  <Link
                    href={`/doctor-dashboard/appointments/${nextAppointment.id}`}
                    className="h-11 px-4 rounded-xl bg-white/[0.05] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 text-sm font-bold"
                  >
                    Details <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-3">
          {[
            { href: "/doctor-dashboard/appointments", label: "All Bookings", sub: "Manage all appointments", icon: <Calendar size={20} />, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
            { href: "/doctor-dashboard/patients", label: "My Patients", sub: "Patient directory", icon: <Users size={20} />, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
            { href: "/doctor-dashboard/schedule", label: "Weekly Schedule", sub: "Set availability slots", icon: <Clock size={20} />, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
            { href: "/doctor-dashboard/profile", label: "My Profile", sub: "Update professional info", icon: <UserCircle size={20} />, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-white/[0.02] border border-white/8 p-4 rounded-xl flex items-center gap-4 hover:bg-white/[0.05] hover:border-white/15 hover:scale-[1.01] transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${action.color}`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm tracking-tight">{action.label}</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">{action.sub}</p>
              </div>
              <ArrowRight className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" size={16} />
            </Link>
          ))}
        </div>
      </div>

      {/* Today Timeline Preview */}
      {!dataLoading && todaysAppointments.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <Activity size={16} className="text-teal-400" />
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">Today&apos;s Flow</h2>
            </div>
            <Link
              href="/doctor-dashboard/today"
              className="text-[10px] font-black text-teal-400 uppercase tracking-widest hover:text-teal-300 flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight size={12} />
            </Link>
          </div>

          <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {todaysAppointments.slice(0, 5).map((apt, idx) => (
                <div key={apt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <span className={`text-[10px] font-black w-5 text-center ${
                    apt.status === "completed" ? "text-slate-600" : "text-teal-400"
                  }`}>{String(idx + 1).padStart(2, "0")}</span>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/8 flex items-center justify-center text-indigo-400 shrink-0">
                    <Stethoscope size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${apt.status === "completed" ? "text-slate-500 line-through" : "text-white"}`}>
                      {apt.users?.first_name} {apt.users?.last_name}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-bold shrink-0">
                    {formatTime(apt.appointment_time)}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border shrink-0 ${
                    apt.status === "completed"
                      ? "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      : apt.status === "confirmed"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : apt.status === "cancelled"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
            {todaysAppointments.length > 5 && (
              <div className="px-5 py-3 border-t border-white/5 flex justify-center">
                <Link href="/doctor-dashboard/today" className="text-[10px] font-black text-teal-400 uppercase tracking-widest hover:text-teal-300 flex items-center gap-1">
                  +{todaysAppointments.length - 5} more <ArrowRight size={10} />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Pending Alerts */}
      {!dataLoading && pendingCount > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5 relative overflow-hidden" glass hover>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertCircle size={80} className="text-amber-500" />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <AlertCircle className="text-amber-400" size={28} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-lg font-black text-white tracking-tight">Pending Requests</h4>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">
                You have {pendingCount} appointment request{pendingCount !== 1 ? "s" : ""} awaiting review.
              </p>
            </div>
            <Link href="/doctor-dashboard/appointments">
              <button className="h-11 px-8 rounded-full border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 font-bold text-sm transition-all whitespace-nowrap">
                Review All
              </button>
            </Link>
          </div>
        </Card>
      )}
    </div>

      {/* Treatment modal — wired to next appointment */}
      {showTreatmentModal && nextAppointment && (
        <TreatmentModal
          appointmentId={nextAppointment.id}
          patientId={nextAppointment.patient_id}
          onClose={() => setShowTreatmentModal(false)}
          onSuccess={async () => {
            setShowTreatmentModal(false);
            await mutateApt();
          }}
        />
      )}
    </>
  );
}
