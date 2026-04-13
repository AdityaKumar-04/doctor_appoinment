"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppointments } from "@/hooks/useAppointments";

interface AppointmentAdminData {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  patient_name: string;
  doctor_name: string;
  clinic_name: string;
}

export default function AdminAppointmentsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { appointments, isLoading, mutate } = useAppointments("admin", user?.id, statusFilter);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const updateStatus = async (id: string, currentStatus: string, newStatus: string) => {
    if (currentStatus === newStatus) return;
    if (!window.confirm(`Change appointment status from ${currentStatus} to ${newStatus}?`)) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/appointments`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id, status: newStatus, role: "admin" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Appointment status updated to ${newStatus}.`, "success");
      mutate();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "An error occurred", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 transition-all ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          <span className="material-symbols-outlined text-base">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Appointments</h2>
          <p className="text-slate-400 text-sm mt-1">Cross-clinic booking management and override console.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none min-w-[160px]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center", backgroundSize: "1.25em 1.25em" }}
        >
          <option value="all">All Appointments</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {isLoading && appointments.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">event_busy</span>
          <p className="text-slate-400 font-semibold">No appointments found.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm text-slate-400">
              <thead className="bg-slate-800/50 text-xs uppercase font-bold text-slate-300">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {appointments.map((appt: AppointmentAdminData) => (
                  <tr key={appt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-200">
                        {new Date(appt.appointment_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{appt.appointment_time}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-200">{appt.patient_name || "Unknown"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-200">{appt.doctor_name || "Unknown"}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">{appt.clinic_name || "Unknown Clinic"}</p>
                    </td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                        appt.status === "confirmed" ? "bg-teal-500/10 text-teal-400 border-teal-500/30" :
                        appt.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                        appt.status === "completed" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                        "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <select
                          value={appt.status}
                          onChange={(e) => updateStatus(appt.id, appt.status, e.target.value)}
                          disabled={actionLoading === appt.id}
                          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
