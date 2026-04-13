"use client";

import { useState } from "react";
import useSWR from "swr";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Search,
  Filter,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Building2,
  Star,
  Banknote,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed to fetch");
    return d;
  });

interface DoctorData {
  id: string;
  name: string;
  email: string;
  specialization: string;
  experience_years: number;
  consultation_fee: number;
  is_active: boolean;
  clinic_name: string;
  created_at: string;
}

export default function AdminDoctorsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const qs = new URLSearchParams();
  if (statusFilter !== "all") qs.append("status", statusFilter);

  const { data, isLoading: loading, mutate } = useSWR(`/api/admin/doctors?${qs.toString()}`, fetcher);
  const allDoctors: DoctorData[] = data?.doctors || [];

  const doctors = search
    ? allDoctors.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.specialization.toLowerCase().includes(search.toLowerCase()) ||
          d.clinic_name.toLowerCase().includes(search.toLowerCase())
      )
    : allDoctors;

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleStatus = async (id: string, current: boolean, name: string) => {
    const action = current ? "suspend" : "activate";
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} Dr. ${name}?`)) return;
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/doctors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: id, is_active: !current }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      showToast(`Dr. ${name} has been ${current ? "suspended" : "activated"}.`, "success");
      mutate();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const active = allDoctors.filter((d) => d.is_active).length;
  const inactive = allDoctors.filter((d) => !d.is_active).length;

  return (
    <div className="page-enter space-y-8 text-left">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-3 border ${
          toast.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-sky-400 text-[11px] font-black uppercase tracking-[0.2em]">Admin · Doctor Management</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Doctor <span className="gradient-text">Registry</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {allDoctors.length} doctors · {active} active · {inactive} suspended
          </p>
        </div>
      </header>

      {/* Stat Pills */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Doctors", value: allDoctors.length, color: "bg-sky-500/10 border-sky-500/20 text-sky-400" },
          { label: "Active", value: active, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
          { label: "Suspended", value: inactive, color: "bg-red-500/10 border-red-500/20 text-red-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.color}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{s.label}</p>
            <p className="text-3xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
          <Input
            type="text"
            placeholder="Search by name, specialization, clinic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 !rounded-xl !bg-white/[0.03] border-white/8 focus:border-sky-500/40"
          />
        </div>
        <div className="relative min-w-[160px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-12 bg-white/[0.03] border border-white/8 text-slate-300 text-xs font-bold uppercase tracking-widest rounded-xl pl-10 pr-4 focus:outline-none focus:border-sky-500/40 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0" glass>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Doctor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Specialization</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinic</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fee</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading && doctors.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-5">
                      <div className="h-10 bg-white/[0.02] rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Stethoscope className="mx-auto text-slate-700 mb-4" size={40} />
                    <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No doctors found</p>
                  </td>
                </tr>
              ) : (
                doctors.map((d) => (
                  <tr key={d.id} className="group hover:bg-white/[0.01] transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                          <Stethoscope size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Dr. {d.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
                        <Star size={11} className="text-amber-400" />
                        {d.specialization}
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5">{d.experience_years}y exp</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Building2 size={12} />
                        <span className="font-medium truncate max-w-[150px]">{d.clinic_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-emerald-400 text-sm font-black">
                        <Banknote size={14} />₹{d.consultation_fee}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        d.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {d.is_active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {d.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => toggleStatus(d.id, d.is_active, d.name)}
                        disabled={actionLoading === d.id}
                        variant="secondary"
                        className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                          d.is_active
                            ? "text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white"
                            : "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                        }`}
                      >
                        {actionLoading === d.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : d.is_active ? (
                          "Suspend"
                        ) : (
                          "Activate"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
