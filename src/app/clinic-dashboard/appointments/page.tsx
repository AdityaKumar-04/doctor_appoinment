"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAppointments } from "@/hooks/useAppointments";
import { ChevronLeft, Calendar, Clock, CheckCircle2, XCircle, CheckCheck } from "lucide-react";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  doctors: {
    id: string;
    specialization: string;
    consultation_fee: number;
    users: {
      first_name: string;
      last_name: string;
    };
  };
}

const STATUS_CONFIG = {
  confirmed: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  pending: { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  completed: { bg: "bg-sky-500/10 text-sky-400 border-sky-500/20", dot: "bg-sky-400" },
  cancelled: { bg: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
};

export default function ClinicAppointmentsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  
  const { appointments, totalPages, isLoading, mutate } = useAppointments("clinic", user?.id, filter, page);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const dataLoading = authLoading || isLoading;

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status, role: "clinic" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Appointment status updated", "success");
      mutate();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    }
  };

  if (!user || role !== "clinic") return null;

  const filters = ["all", "pending", "confirmed", "completed", "cancelled"];

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          <span className="material-symbols-outlined text-base">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-6 group transition-colors"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-teal-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Clinic Operations</p>
          <h1 className="text-3xl font-black text-white tracking-tighter">Appointments</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Manage and review all patient bookings.</p>
        </div>
        
        <div className="flex gap-1.5 bg-white/[0.03] border border-white/8 p-1.5 rounded-xl overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${
                filter === f 
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* Appointments Table */}
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
        {dataLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <span className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-slate-600" />
            </div>
            <p className="font-black text-white text-lg mb-2">No appointments found</p>
            <p className="text-slate-500 text-sm">No bookings for <span className="text-slate-300 font-bold">{filter}</span> status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-4 py-4">Doctor</th>
                  <th className="px-4 py-4">Date & Time</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {appointments.map((apt: Appointment) => {
                  const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={apt.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white text-sm">
                          {apt.users.first_name} {apt.users.last_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{apt.users.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-white text-sm">
                          Dr. {apt.doctors.users.first_name} {apt.doctors.users.last_name}
                        </p>
                        <p className="text-xs text-teal-400 mt-0.5">{apt.doctors.specialization}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-white text-sm font-medium mb-1">
                          <Calendar size={13} className="text-sky-400" />
                          {new Date(apt.appointment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Clock size={12} />
                          {apt.appointment_time.slice(0, 5)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusCfg.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {apt.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(apt.id, "confirmed")}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
                                title="Confirm"
                              >
                                <CheckCircle2 size={13} /> Confirm
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(apt.id, "cancelled")}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                title="Cancel"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {apt.status === "confirmed" && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, "completed")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 text-xs font-bold transition-colors"
                            >
                              <CheckCheck size={13} /> Complete
                            </button>
                          )}
                        </div>
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
