"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  Search,
  Users,
  Calendar,
  TrendingUp,
  ChevronRight,
  UserX,
} from "lucide-react";

interface PatientData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_visits: number;
  last_visit_date: string;
  upcoming_appointments: boolean;
}

type FilterKey = "all" | "recent" | "frequent";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Patients" },
  { key: "recent", label: "Recent (30d)" },
  { key: "frequent", label: "Frequent (3+)" },
];

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function DoctorPatientsPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const loadPatients = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/appointments?userId=${user.id}&role=doctor`);
      const data = await res.json();

      if (data.appointments) {
        const patientMap = new Map<string, PatientData>();

        data.appointments.forEach((apt: {
          patient_id?: string;
          appointment_date: string;
          status: string;
          users?: { first_name: string; last_name: string; email: string };
        }) => {
          if (!apt.patient_id) return;

          const existing = patientMap.get(apt.patient_id);
          const aptDate = new Date(apt.appointment_date);
          const isFuture = aptDate >= new Date();

          if (existing) {
            existing.total_visits += 1;
            if (aptDate > new Date(existing.last_visit_date)) {
              existing.last_visit_date = apt.appointment_date;
            }
            if (isFuture && apt.status === "confirmed") {
              existing.upcoming_appointments = true;
            }
          } else {
            patientMap.set(apt.patient_id, {
              id: apt.patient_id,
              first_name: apt.users?.first_name || "Unknown",
              last_name: apt.users?.last_name || "Patient",
              email: apt.users?.email || "",
              total_visits: 1,
              last_visit_date: apt.appointment_date,
              upcoming_appointments: isFuture && apt.status === "confirmed",
            });
          }
        });

        setPatients(Array.from(patientMap.values()));
      }
    } catch (error) {
      console.error("Patients Directory failed to load:", error);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading || !user || role !== "doctor") return;
    loadPatients();
  }, [user, role, loading, loadPatients]);

  if (loading || (!patients.length && dataLoading)) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <span className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading patient directory...</p>
      </div>
    );
  }

  if (!user || role !== "doctor") return null;

  // Apply filter + search
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q);

    const matchesFilter =
      filter === "all" ||
      (filter === "recent" && new Date(p.last_visit_date) >= thirtyDaysAgo) ||
      (filter === "frequent" && p.total_visits >= 3);

    return matchesSearch && matchesFilter;
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
          <p className="text-teal-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Patient Management</p>
          <h1 className="text-3xl font-black text-white tracking-tighter">Patient Directory</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">
            {patients.length} total registered patient{patients.length !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Patients", value: patients.length, icon: <Users size={16} />, color: "text-teal-400", bg: "bg-teal-500/[0.05] border-teal-500/20" },
          {
            label: "Active (upcoming)",
            value: patients.filter(p => p.upcoming_appointments).length,
            icon: <Calendar size={16} />,
            color: "text-sky-400",
            bg: "bg-sky-500/[0.05] border-sky-500/20",
          },
          {
            label: "Frequent (3+ visits)",
            value: patients.filter(p => p.total_visits >= 3).length,
            icon: <TrendingUp size={16} />,
            color: "text-violet-400",
            bg: "bg-violet-500/[0.05] border-violet-500/20",
          },
        ].map(stat => (
          <div key={stat.label} className={`border rounded-xl p-5 ${stat.bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${stat.color}`}>
              {stat.icon}
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
            </div>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value.toString().padStart(2, "0")}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-600 text-sm outline-none focus:border-teal-500/50 transition-all"
          />
        </div>
        <div className="flex gap-1.5 bg-white/[0.03] border border-white/8 p-1.5 rounded-xl">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filter === f.key
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
        {dataLoading ? (
          <div className="p-16 flex flex-col items-center gap-4">
            <span className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
              <UserX size={28} className="text-slate-600" />
            </div>
            <p className="font-black text-white text-lg mb-2">
              {search || filter !== "all" ? "No patients match your filter" : "No Patients Yet"}
            </p>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
              {search || filter !== "all"
                ? "Try adjusting your search or changing the filter."
                : "Patients will appear here once they book with you."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-4 py-4 text-center">Visits</th>
                  <th className="px-4 py-4">Last Visit</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((patient) => (
                  <tr key={patient.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm uppercase shrink-0">
                          {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{patient.first_name} {patient.last_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{patient.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black border ${
                        patient.total_visits >= 3
                          ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                          : "bg-white/[0.04] text-slate-400 border-white/8"
                      }`}>
                        {patient.total_visits}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                        <Calendar size={13} className="text-slate-600" />
                        {formatDate(patient.last_visit_date)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {patient.upcoming_appointments ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/10 text-slate-500 text-[10px] font-black rounded-full border border-slate-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-all"
                        onClick={() => router.push(`/doctor-dashboard/patient/${patient.id}`)}
                        title="View patient timeline"
                      >
                        View History <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && !dataLoading && (
        <p className="text-center text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4">
          {filtered.length} patient{filtered.length !== 1 ? "s" : ""} shown
        </p>
      )}
    </>
  );
}
