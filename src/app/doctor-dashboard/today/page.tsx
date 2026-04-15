"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import useSWR from "swr";
import Link from "next/link";
import { Appointment } from "@/utils/types";
import {
  ChevronLeft,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then(res => res.json());

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

const STATUS_MAP: Record<string, { bg: string, dot: string, label: string }> = {
  completed:  { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400", label: "Completed" },
  confirmed:  { bg: "bg-sky-500/10 text-sky-400 border-sky-500/20", dot: "bg-sky-400", label: "Confirmed" },
  pending:    { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400 animate-pulse", label: "Pending" },
  cancelled:  { bg: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400", label: "Cancelled" },
  scheduled:  { bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", dot: "bg-indigo-400", label: "Scheduled" },
  rescheduled: { bg: "bg-purple-500/10 text-purple-400 border-purple-500/20", dot: "bg-purple-400", label: "Rescheduled" },
};

export default function DoctorTodayPage() {
  const { user, profile, role } = useAuth();
  const router = useRouter();
  const [completing, setCompleting] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    user && role === "doctor" ? `/api/appointments?userId=${user.id}&role=doctor` : null,
    fetcher,
    { refreshInterval: 60_000 }
  );

  const handleComplete = useCallback(async (appointmentId: string) => {
    setCompleting(appointmentId);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status: "completed", role: "doctor" }),
      });
      if (res.ok) await mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(null);
    }
  }, [mutate]);

  if (!user || role !== "doctor") return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const allAppointments: Appointment[] = data?.appointments || [];

  const todaysAppointments = allAppointments
    .filter(a => a.appointment_date === todayStr)
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

  const completedCount = todaysAppointments.filter(a => a.status === "completed").length;
  const remainingCount = todaysAppointments.filter(
    a => a.status !== "completed" && a.status !== "cancelled"
  ).length;

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-6 group transition-colors"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-teal-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Today&apos;s Schedule</p>
          <h1 className="text-3xl font-black text-white tracking-tighter">
            {todayFormatted}
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-1">
            Dr. {profile?.first_name} {profile?.last_name} · {todaysAppointments.length} appointment{todaysAppointments.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live stats */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-xs font-black text-emerald-400">{completedCount} done</span>
            <span className="text-slate-600 text-xs">·</span>
            <Clock size={14} className="text-amber-400" />
            <span className="text-xs font-black text-amber-400">{remainingCount} left</span>
          </div>
          <button
            onClick={() => mutate()}
            className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/8 flex items-center justify-center text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-all"
            title="Refresh"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Progress bar */}
      {todaysAppointments.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            <span>Progress</span>
            <span>{completedCount} / {todaysAppointments.length} completed</span>
          </div>
          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${todaysAppointments.length ? (completedCount / todaysAppointments.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading schedule...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <p className="font-black text-white">Failed to load appointments</p>
          <button onClick={() => mutate()} className="mt-4 text-teal-400 text-sm font-bold hover:underline">
            Try again
          </button>
        </div>
      ) : todaysAppointments.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/8 rounded-2xl">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-5">
            <Calendar size={40} className="text-slate-600" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight mb-2">No Appointments Today</h3>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-6">
            Your schedule is free for today.
          </p>
          <Link
            href="/doctor-dashboard/schedule"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-400 transition-all text-sm"
          >
            <Clock size={16} /> Update Availability
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[28px] top-0 bottom-0 w-px bg-white/[0.06] hidden sm:block" />

          <div className="space-y-3">
            {todaysAppointments.map((apt, idx) => {
              const statusCfg = STATUS_MAP[apt.status] || STATUS_MAP.pending;
              const isCompleted = apt.status === "completed";
              const isCancelled = apt.status === "cancelled";
              const isNext = !isCompleted && !isCancelled &&
                todaysAppointments.findIndex(a => a.status !== "completed" && a.status !== "cancelled") === idx;

              return (
                <div key={apt.id} className="flex gap-4 sm:gap-5">
                  {/* Timeline dot */}
                  <div className="hidden sm:flex flex-col items-center shrink-0 w-14">
                    <div className={`w-4 h-4 rounded-full border-2 mt-5 shrink-0 z-10 transition-all ${
                      isCompleted
                        ? "border-emerald-500 bg-emerald-500"
                        : isNext
                        ? "border-teal-400 bg-teal-400/20 shadow-lg shadow-teal-400/30"
                        : isCancelled
                        ? "border-red-500/50 bg-transparent"
                        : "border-white/20 bg-transparent"
                    }`} />
                  </div>

                  {/* Card */}
                  <div className={`flex-1 border rounded-2xl transition-all group ${
                    isCompleted
                      ? "bg-white/[0.01] border-white/5 opacity-60"
                      : isNext
                      ? "bg-teal-500/[0.04] border-teal-500/20 shadow-lg shadow-teal-500/5"
                      : "bg-white/[0.02] border-white/8 hover:bg-white/[0.04]"
                  }`}>
                    <div className="flex items-center gap-4 p-4 sm:p-5">
                      {/* Time */}
                      <div className="text-center shrink-0 w-16">
                        <p className={`text-sm font-black ${isCompleted ? "text-slate-600" : "text-teal-400"}`}>
                          {formatTime(apt.appointment_time)}
                        </p>
                        {isNext && (
                          <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mt-0.5">Next</p>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="h-10 w-px bg-white/[0.06] shrink-0" />

                      {/* Patient */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm uppercase ${
                          isCompleted
                            ? "bg-slate-700/30 text-slate-500"
                            : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        }`}>
                          {apt.users?.first_name?.charAt(0) || "?"}
                          {apt.users?.last_name?.charAt(0) || ""}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-black text-sm truncate ${isCompleted ? "text-slate-500 line-through" : "text-white"}`}>
                            {apt.users?.first_name} {apt.users?.last_name}
                          </p>
                          {apt.notes && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">{apt.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black border shrink-0 ${statusCfg.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!isCompleted && !isCancelled && (
                          <button
                            onClick={() => handleComplete(apt.id)}
                            disabled={completing === apt.id}
                            className="h-9 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-60"
                          >
                            {completing === apt.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <><CheckCircle2 size={13} /> Complete</>
                            )}
                          </button>
                        )}
                        <Link
                          href={`/doctor-dashboard/appointments/${apt.id}`}
                          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                          title="View details"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>

                    {/* Clinic info strip if available */}
                    {(apt.clinics?.name || apt.doctors?.clinics?.name) && !isCompleted && (
                      <div className="px-5 pb-3 flex items-center gap-1.5">
                        <Stethoscope size={11} className="text-slate-600" />
                        <span className="text-[10px] text-slate-600 font-bold">
                          {apt.clinics?.name || apt.doctors?.clinics?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All done state */}
      {!isLoading && todaysAppointments.length > 0 && remainingCount === 0 && completedCount === todaysAppointments.length && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-black text-sm">
            <CheckCircle2 size={18} />
            All appointments completed for today! Great work.
          </div>
        </div>
      )}
    </>
  );
}
