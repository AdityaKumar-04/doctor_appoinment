"use client";

import { useState } from "react";
import useSWR from "swr";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import {
  Search,
  Users2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed to fetch");
    return d;
  });

interface PatientData {
  id: string;
  name: string;
  email: string;
  created_at: string;
  appointment_count: number;
}

export default function AdminPatientsPage() {
  const [search, setSearch] = useState("");
  const [toast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const qs = new URLSearchParams();
  if (search) qs.append("search", search);

  const { data, isLoading: loading } = useSWR(`/api/admin/patients?${qs.toString()}`, fetcher);
  const patients: PatientData[] = data?.patients || [];

  const frequent = patients.filter((p) => p.appointment_count >= 3).length;
  const newPatients = patients.filter((p) => {
    const d = new Date(p.created_at);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length;

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
          <p className="text-purple-400 text-[11px] font-black uppercase tracking-[0.2em]">Admin · Patient Management</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Patient <span className="gradient-text">Database</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {patients.length} registered patients
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Patients", value: patients.length, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
          { label: "New (30 days)", value: newPatients, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
          { label: "Frequent (3+)", value: frequent, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.bg}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest ${s.color} opacity-70 mb-1`}>{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
        <Input
          type="text"
          placeholder="Search patients by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-12 !rounded-xl !bg-white/[0.03] border-white/8 focus:border-purple-500/40"
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0" glass>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Registered</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Appointments</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading && patients.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-5">
                      <div className="h-10 bg-white/[0.02] rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Users2 className="mx-auto text-slate-700 mb-4" size={40} />
                    <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No patients found</p>
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const isNew = (() => {
                    const diff = (new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
                    return diff <= 30;
                  })();
                  const isFrequent = p.appointment_count >= 3;
                  return (
                    <tr key={p.id} className="group hover:bg-white/[0.01] transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black uppercase text-sm">
                            {p.name.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{p.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold">
                          <Calendar size={11} />
                          {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300 text-sm font-black">
                          <Activity size={13} className="text-purple-400" />
                          {p.appointment_count}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {isFrequent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Frequent
                            </span>
                          )}
                          {isNew && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              New
                            </span>
                          )}
                          {!isNew && !isFrequent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 text-slate-500 border border-white/5">
                              Regular
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
