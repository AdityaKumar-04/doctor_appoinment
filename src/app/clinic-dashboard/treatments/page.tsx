"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, Calendar, FileText, Activity } from "lucide-react";

interface Treatment {
  id: string;
  notes: string;
  followup_date: string | null;
  created_at: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
}

export default function ClinicTreatmentsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchTreatments() {
      if (role !== "clinic") return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/treatments?role=clinic&page=${page}`);
        if (!res.ok) throw new Error("Failed to fetch treatments");
        const data = await res.json();
        setTreatments(data.treatments || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.count || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) fetchTreatments();
  }, [role, authLoading, page]);

  const dataLoading = authLoading || isLoading;

  if (!user || role !== "clinic") return null;

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  return (
    <>
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-6 group transition-colors"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-teal-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Clinic Records</p>
          <h1 className="text-3xl font-black text-white tracking-tighter">Treatments & Follow-ups</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Review patient medical records and scheduled follow-ups.</p>
        </div>
      </header>

      <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
        {dataLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <span className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Loading records...</p>
          </div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-center mx-auto mb-4">
              <Activity size={28} className="text-slate-600" />
            </div>
            <p className="font-black text-white text-lg mb-2">No treatments found</p>
            <p className="text-slate-500 text-sm">Treatments logged by doctors will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-4 py-4">Patient</th>
                  <th className="px-4 py-4">Doctor</th>
                  <th className="px-6 py-4 w-1/3">Treatment Notes</th>
                  <th className="px-6 py-4 text-right">Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {treatments.map((treatment) => {
                  const todayFollowup = treatment.followup_date ? isToday(treatment.followup_date) : false;

                  return (
                    <tr key={treatment.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-white text-sm font-medium mb-1">
                          <Calendar size={13} className="text-sky-400" />
                          {new Date(treatment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-xs ring-1 ring-teal-500/20">
                            {(treatment.patientName || treatment.patientEmail)?.charAt(0)?.toUpperCase() || "P"}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">
                              {treatment.patientName}
                            </p>
                            <p className="text-xs text-slate-500">{treatment.patientEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-white text-sm">
                          {treatment.doctorName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 text-sm text-slate-300 bg-white/[0.03] p-3 rounded-lg border border-white/5">
                          <FileText size={14} className="text-teal-500 mt-0.5 shrink-0" />
                          <p className="line-clamp-2" title={treatment.notes}>{treatment.notes}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {treatment.followup_date ? (
                          <div className="flex flex-col items-end gap-1.5">
                            {todayFollowup ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Today Followup
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                Scheduled
                              </span>
                            )}
                            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                              {new Date(treatment.followup_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-white/[0.02] text-slate-500 border-white/5">
                            No Followup
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Showing Data • Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-xs font-bold text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-xs font-bold text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
