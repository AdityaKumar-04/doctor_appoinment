"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Stethoscope,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed to fetch");
    return d;
  });

interface ClinicData {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  doctorCount: number;
  appointmentCount: number;
}

export default function AdminClinicsPage() {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const qs = new URLSearchParams();
  if (search) qs.append("search", search);

  const { data, isLoading: loading, mutate } = useSWR(`/api/admin/clinics?${qs.toString()}`, fetcher, {
    revalidateOnFocus: false,
  });

  const clinics: ClinicData[] = data?.clinics || [];
  const active = clinics.filter((c) => c.is_active).length;
  const inactive = clinics.filter((c) => !c.is_active).length;

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleStatus = useCallback(
    async (id: string, current: boolean, name: string) => {
      const action = current ? "disable" : "enable";
      if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} clinic "${name}"?`)) return;
      setActionLoading(id);
      try {
        const res = await fetch(`/api/admin/clinics/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !current }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        showToast(`"${name}" has been ${current ? "disabled" : "enabled"}.`, "success");
        mutate();
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Action failed", "error");
      } finally {
        setActionLoading(null);
      }
    },
    [mutate]
  );

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
          <p className="text-teal-400 text-[11px] font-black uppercase tracking-[0.2em]">Admin · Clinic Management</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Clinic <span className="gradient-text">Registry</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {clinics.length} clinics · {active} active · {inactive} disabled
          </p>
        </div>
      </header>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Clinics",  value: clinics.length, cls: "bg-teal-500/10 border-teal-500/20 text-teal-400" },
          { label: "Active",         value: active,          cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
          { label: "Disabled",       value: inactive,        cls: "bg-red-500/10 border-red-500/20 text-red-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.cls}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{s.label}</p>
            <p className="text-3xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
        <Input
          type="text"
          placeholder="Search by clinic name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-12 !rounded-xl !bg-white/[0.03] border-white/8 focus:border-teal-500/40"
        />
      </div>

      {/* Grid */}
      {loading && clinics.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : clinics.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 opacity-40">
          <Building2 size={40} className="mx-auto mb-4" />
          <p className="text-sm font-black uppercase tracking-widest">No clinics found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clinics.map((clinic) => (
            <Card key={clinic.id} glass hover className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    clinic.is_active ? "bg-teal-500/10 border-teal-500/20 text-teal-400" : "bg-white/[0.03] border-white/5 text-slate-600"
                  }`}>
                    <Building2 size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white tracking-tight truncate max-w-[150px]">{clinic.name}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{clinic.email}</p>
                  </div>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  clinic.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {clinic.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                  {clinic.is_active ? "Active" : "Disabled"}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
                    <Stethoscope size={11} />Doctors
                  </div>
                  <p className="text-xl font-black text-white">{clinic.doctorCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
                    <Calendar size={11} />Appts
                  </div>
                  <p className="text-xl font-black text-white">{clinic.appointmentCount}</p>
                </div>
              </div>

              {/* Action */}
              <Button
                onClick={() => toggleStatus(clinic.id, clinic.is_active, clinic.name)}
                disabled={actionLoading === clinic.id}
                variant="secondary"
                className={`w-full h-10 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                  clinic.is_active
                    ? "text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white"
                    : "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                }`}
                icon={actionLoading === clinic.id ? <Loader2 size={14} className="animate-spin" /> : clinic.is_active ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
              >
                {actionLoading === clinic.id ? "Processing..." : clinic.is_active ? "Disable Clinic" : "Enable Clinic"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
