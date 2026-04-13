"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AppointmentCard from "@/components/appointment/AppointmentCard";
import { Appointment } from "@/utils/types";
import { useAppointments } from "@/hooks/useAppointments";
import { SkeletonTable } from "@/components/ui/SkeletonCard";
import {

  Clock,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  History,
  Search,
  AlertCircle,
} from "lucide-react";
import Input from "@/components/ui/Input";

const FILTERS = [
  { key: "all",       label: "All",        icon: LayoutGrid },
  { key: "pending",   label: "Pending",    icon: Clock },
  { key: "confirmed", label: "Confirmed",  icon: CheckCircle2 },
  { key: "completed", label: "History",    icon: History },
  { key: "cancelled", label: "Cancelled",  icon: XCircle },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

export default function DoctorAppointmentsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<FilterKey>("confirmed");
  const [search, setSearch] = useState("");

  const { appointments, isLoading, mutate } = useAppointments("doctor", user?.id, "all");
  
  const dataLoading = authLoading || isLoading;

  if (!user || role !== "doctor") return null;

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status, role: "doctor" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      mutate();
    } catch (err: unknown) {
      console.error("Failed to update status:", err);
      alert(err instanceof Error ? err.message : "Failed to update appointment status");
    }
  };

  const counts = {
    all:       appointments.length,
    pending:   appointments.filter((a: Appointment) => a.status === "pending").length,
    confirmed: appointments.filter((a: Appointment) => a.status === "confirmed").length,
    completed: appointments.filter((a: Appointment) => a.status === "completed").length,
    cancelled: appointments.filter((a: Appointment) => a.status === "cancelled").length,
  };

  const filtered = appointments
    .filter((apt: Appointment) => filter === "all" ? true : apt.status === filter)
    .filter((apt: Appointment) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = `${apt.users?.first_name || ""} ${apt.users?.last_name || ""}`.toLowerCase();
      const email = (apt.users?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });

  return (
    <div className="page-enter space-y-8 text-left">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em]">Patient Bookings</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            All <span className="gradient-text">Appointments</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {dataLoading ? "Loading..." : `${counts.all} total · ${counts.pending} pending`}
          </p>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending", count: counts.pending, color: "amber" },
          { label: "Confirmed", count: counts.confirmed, color: "emerald" },
          { label: "Completed", count: counts.completed, color: "sky" },
          { label: "Cancelled", count: counts.cancelled, color: "red" },
        ].map(({ label, count, color }) => (
          <div key={label} className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full blur-2xl opacity-10 ${
              color === "amber" ? "bg-amber-500" : color === "emerald" ? "bg-emerald-500" : color === "sky" ? "bg-sky-500" : "bg-red-500"
            }`} />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
            <p className={`text-3xl font-black tracking-tighter ${
              color === "amber" ? "text-amber-400" : color === "emerald" ? "text-emerald-400" : color === "sky" ? "text-sky-400" : "text-red-400"
            }`}>
              {dataLoading ? "—" : count.toString().padStart(2, "0")}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Filter Tabs */}
        <div className="flex bg-white/[0.03] border border-white/5 rounded-2xl p-1.5 overflow-x-auto gap-1 shrink-0">
          {FILTERS.map(({ key, label, icon: Icon }) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap shrink-0
                  ${isActive
                    ? "bg-white/10 text-white border border-white/10 shadow-sm"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"}
                `}
              >
                <Icon size={13} className={isActive ? "text-indigo-400" : "text-slate-600"} />
                {label}
                {counts[key] > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-slate-600"}`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex-1 lg:max-w-xs">
          <Input
            placeholder="Search patient name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} className="text-indigo-500/50" />}
            className="h-11 !rounded-2xl"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {dataLoading ? (
          <SkeletonTable rows={4} />
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center border border-white/5">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-6">
               <AlertCircle className="text-slate-600" size={36} />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight mb-2">No Appointments Found</h3>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
              {search ? "Try adjusting your search" : `No ${filter === "all" ? "" : filter} appointments yet`}
            </p>
          </div>
        ) : (
          filtered.map((apt: Appointment) => (
            <AppointmentCard
              key={apt.id}
              role="doctor"
              appointment={apt}
              onStatusUpdate={handleStatusUpdate}
              onAppointmentComplete={() => mutate()}
            />
          ))
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && !dataLoading && (
        <div className="flex items-center justify-center pt-4 gap-6 opacity-30">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>
      )}
    </div>
  );
}
