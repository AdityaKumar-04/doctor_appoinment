"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock,
  Pill,
} from "lucide-react";
import Link from "next/link";

interface Treatment {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  notes: string;
  followup_date: string | null;
  created_at: string;
}

interface Followup {
  id: string;
  appointment_id: string;
  treatment_id: string | null;
  doctor_id: string;
  patient_id: string;
  followup_date: string;
  status: string;
  created_at: string;
}

interface HistoryItem {
  id: string;
  type: "treatment" | "followup";
  date: string;
  data: Treatment | Followup;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PatientHistoryPage({ params }: { params: { id: string } }) {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || role !== "doctor")) {
      router.push("/login");
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/patient-history/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch history");

        const data = await res.json();

        let timeline: HistoryItem[] = [];

        if (data.treatments) {
          timeline = timeline.concat(
            data.treatments.map((t: Treatment) => ({
              id: t.id,
              type: "treatment" as const,
              date: t.created_at,
              data: t,
            }))
          );
        }

        if (data.followups) {
          timeline = timeline.concat(
            data.followups.map((f: Followup) => ({
              id: f.id,
              type: "followup" as const,
              date: f.followup_date,
              data: f,
            }))
          );
        }

        timeline.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setHistory(timeline);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user && role === "doctor") {
      fetchHistory();
    }
  }, [user, role, authLoading, params.id, router]);

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
          Loading Timeline...
        </p>
      </div>
    );
  }

  const treatments = history.filter((h) => h.type === "treatment");
  const followups = history.filter((h) => h.type === "followup");

  return (
    <div className="page-enter space-y-8 text-left">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div className="space-y-1.5">
          <Link
            href={`/doctor-dashboard/patient/${params.id}`}
            className="inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors gap-2 mb-2"
          >
            <ArrowLeft size={13} /> Back to Patient Profile
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tighter">
            Medical <span className="gradient-text">Timeline</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
            {treatments.length} treatment{treatments.length !== 1 ? "s" : ""} ·{" "}
            {followups.length} follow-up{followups.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-indigo-500/8 border border-indigo-500/15 rounded-xl">
            <Pill size={15} className="text-indigo-400" />
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Treatments</p>
              <p className="text-lg font-black text-white leading-none">{treatments.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-sky-500/8 border border-sky-500/15 rounded-xl">
            <CalendarClock size={15} className="text-sky-400" />
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Follow-ups</p>
              <p className="text-lg font-black text-white leading-none">{followups.length}</p>
            </div>
          </div>
        </div>
      </header>

      {history.length === 0 ? (
        <div className="text-center p-16 glass-card rounded-2xl border border-white/5 max-w-lg mx-auto">
          <Activity className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-black text-white">No Records Found</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
            No treatment history available for this patient.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/30 via-white/8 to-transparent" />

          <div className="space-y-5 pl-16">
            {history.map((item) => {
              const isTreatment = item.type === "treatment";
              const treatment = isTreatment ? (item.data as Treatment) : null;
              const followup = !isTreatment ? (item.data as Followup) : null;

              return (
                <div key={`${item.type}-${item.id}`} className="relative group">
                  {/* Icon on timeline */}
                  <div
                    className={`absolute -left-[2.55rem] top-5 w-9 h-9 rounded-full border-4 border-[#0d0f14] flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110 ${
                      isTreatment
                        ? "bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10"
                        : followup?.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
                        : "bg-sky-500/20 text-sky-400 shadow-lg shadow-sky-500/10"
                    }`}
                  >
                    {isTreatment ? (
                      <FileText size={15} />
                    ) : followup?.status === "completed" ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <CalendarClock size={15} />
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className={`glass-card rounded-2xl border overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl ${
                      isTreatment
                        ? "border-indigo-500/10 group-hover:border-indigo-500/25"
                        : followup?.status === "completed"
                        ? "border-emerald-500/10 group-hover:border-emerald-500/25"
                        : "border-sky-500/10 group-hover:border-sky-500/25"
                    }`}
                  >
                    {/* Card header */}
                    <div
                      className={`px-5 py-3.5 flex items-center justify-between border-b ${
                        isTreatment
                          ? "bg-indigo-500/[0.04] border-indigo-500/10"
                          : followup?.status === "completed"
                          ? "bg-emerald-500/[0.04] border-emerald-500/10"
                          : "bg-sky-500/[0.04] border-sky-500/10"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            isTreatment
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              : followup?.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          }`}
                        >
                          {isTreatment ? "Treatment Note" : `Follow-up · ${followup?.status || "pending"}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
                        <Clock size={11} />
                        {isTreatment
                          ? formatDateTime(item.date)
                          : formatDate(item.date)}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="p-5 space-y-4">
                      {isTreatment && treatment && (
                        <>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                              <FileText size={11} className="text-indigo-400" />
                              Clinical Notes
                            </p>
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                              {treatment.notes}
                            </p>
                          </div>

                          {treatment.followup_date && (
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-sky-500/8 border border-sky-500/15 rounded-xl">
                              <CalendarClock size={14} className="text-sky-400 shrink-0" />
                              <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                  Follow-up Scheduled
                                </p>
                                <p className="text-sm font-bold text-sky-300">
                                  {formatDate(treatment.followup_date)}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {!isTreatment && followup && (
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              followup.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-sky-500/10 text-sky-400"
                            }`}
                          >
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Scheduled Follow-up
                            </p>
                            <p className="text-base font-black text-white">
                              {formatDate(followup.followup_date)}
                            </p>
                            <p
                              className={`text-xs font-bold capitalize mt-0.5 ${
                                followup.status === "completed"
                                  ? "text-emerald-400"
                                  : "text-sky-400"
                              }`}
                            >
                              Status: {followup.status}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
