"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AppointmentCard from "@/components/appointment/AppointmentCard";
import StatsCard from "@/components/features/StatsCard";
import { SkeletonStatCard, SkeletonTable } from "@/components/ui/SkeletonCard";
import { 
  Calendar, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  History,
  LayoutGrid,
  ChevronRight,
  TrendingUp,
  LucideIcon
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { Appointment } from "@/utils/types";

type FilterTab = "all" | "pending" | "confirmed" | "completed" | "cancelled";

const normStatus = (s: string) => (s === "scheduled" ? "pending" : s);

const TABS: { key: FilterTab; label: string; icon: LucideIcon }[] = [
  { key: "all",       label: "All Records",   icon: LayoutGrid },
  { key: "pending",   label: "Pending",       icon: Clock },
  { key: "confirmed", label: "Confirmed",     icon: CheckCircle2 },
  { key: "completed", label: "History",       icon: History },
  { key: "cancelled", label: "Cancelled",     icon: XCircle },
];

export default function AppointmentsPage() {
  const { user, role } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  const fetchAppointments = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/appointments?userId=${userId}&role=patient`, { cache: "no-store" });
      const data = await res.json();
      if (data.appointments) setAppointments(data.appointments);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && role === "patient") {
      fetchAppointments(user.id);
    }
  }, [user, role, fetchAppointments]);

  const counts = {
    all:       appointments.length,
    pending:   appointments.filter((a) => normStatus(a.status) === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const filtered = appointments.filter((a) => {
    const matchesTab   = activeTab === "all" || normStatus(a.status) === activeTab;
    const searchLow = search.toLowerCase();
    const docFirstName = a.doctors?.users?.first_name?.toLowerCase() || "";
    const docLastName = a.doctors?.users?.last_name?.toLowerCase() || "";
    const docSpec = a.doctors?.specialization?.toLowerCase() || "";
    const clinicName = a.clinics?.name?.toLowerCase() || "";
    
    const matchesSearch = !search.trim() || 
      docFirstName.includes(searchLow) || 
      docLastName.includes(searchLow) || 
      docSpec.includes(searchLow) || 
      clinicName.includes(searchLow);
      
    return matchesTab && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
    const statusDiff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleTabChange = (tab: FilterTab) => { setActiveTab(tab); setCurrentPage(1); };
  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1); };

  if (!user || role !== "patient") return null;

  return (
    <div className="page-enter space-y-10 text-left overflow-x-hidden">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-teal-500 text-[11px] font-black uppercase tracking-[0.2em]">Patient Medical Records</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Clinical <span className="gradient-text">Schedule</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {loading ? "Synchronizing logs..." : `${counts.all} Active sessions detected`}
          </p>
        </div>
        <Link href="/doctors">
          <Button variant="primary" size="lg" icon={<Plus size={18} />} className="shadow-2xl">
            New Booking
          </Button>
        </Link>
      </header>

      {/* Dynamic Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
           Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatsCard label="Total Log" value={counts.all.toString().padStart(2, "0")} icon="calendar_month" accent="indigo" />
            <StatsCard label="Pending" value={counts.pending.toString().padStart(2, "0")} icon="pending" accent="amber" />
            <StatsCard label="Confirmed" value={counts.confirmed.toString().padStart(2, "0")} icon="check_circle" accent="emerald" />
            <StatsCard label="History" value={counts.completed.toString().padStart(2, "0")} icon="task_alt" accent="teal" />
          </>
        )}
      </div>

      {/* Main List Section */}
      <div className="space-y-8">
         {/* Controls Bar */}
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Tab Navigation */}
            <div className="flex bg-white/[0.03] border border-white/5 rounded-2xl p-1.5 overflow-x-auto scrollbar-hide gap-1 min-w-0 w-full md:w-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`
                      flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 shrink-0
                      ${isActive 
                        ? "bg-white/10 text-white shadow-lg border border-white/5" 
                        : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"}
                    `}
                  >
                    <Icon size={14} className={isActive ? "text-teal-400" : "text-slate-600"} />
                    {tab.label}
                    {counts[tab.key] > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? "bg-teal-500/20 text-teal-400" : "bg-white/5 text-slate-600"}`}>
                        {counts[tab.key]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Matrix */}
             <div className="w-full lg:w-80">
               <Input 
                 placeholder="Search appointment matrix..."
                 value={search}
                 onChange={(e) => handleSearch(e.target.value)}
                 icon={<Search size={18} className="text-teal-500/50" />}
                 className="h-12 !rounded-2xl"
               />
             </div>
         </div>

         {/* Appointment Grid */}
          <div className="space-y-5">
           {loading ? (
              <SkeletonTable rows={4} />
           ) : sorted.length === 0 ? (
              <Card className="py-24 text-center" glass hover>
                <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Calendar className="text-slate-700" size={40} />
                </div>
                <h3 className="text-xl font-black text-white tracking-tighter mb-2">No Active Sequences Found</h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-10">Clear filters or initiate a new booking sequence</p>
                <Link href="/doctors">
                  <Button variant="outline" className="px-10 rounded-full h-11">Book Specialist</Button>
                </Link>
              </Card>
           ) : (
              <div className="space-y-4">
                {paginated.map((apt) => (
                  <AppointmentCard key={apt.id} role="patient" appointment={apt} showPayLink={true} className="animate-in fade-in slide-in-from-bottom-2 duration-500" />
                ))}
              </div>
           )}
         </div>

         {/* Pagination */}
         {sorted.length > PAGE_SIZE && !loading && (
           <div className="flex items-center justify-center gap-2 pt-4">
             <button
               onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
               disabled={safePage === 1}
               className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-white/8 text-slate-400 hover:text-white hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
             >
               ← Prev
             </button>
             <div className="flex items-center gap-1.5">
               {Array.from({ length: totalPages }).map((_, i) => (
                 <button
                   key={i}
                   onClick={() => setCurrentPage(i + 1)}
                   className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${
                     safePage === i + 1
                       ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                       : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"
                   }`}
                 >
                   {i + 1}
                 </button>
               ))}
             </div>
             <button
               onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
               disabled={safePage === totalPages}
               className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-white/8 text-slate-400 hover:text-white hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
             >
               Next →
             </button>
           </div>
         )}
      </div>

      {/* Next Global Notice */}
      {!loading && (counts.confirmed > 0 || counts.pending > 0) && (() => {
        const next = appointments
          .filter((a) => a.status === "confirmed" || normStatus(a.status) === "pending")
          .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())[0];
        if (!next) return null;
        const fmt = (d: string) =>
          new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
        const fmtTime = (t: string) =>
          new Date(`1970-01-01T${t}`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
          
        return (
          <Card className="bg-gradient-to-r from-teal-500/10 via-indigo-600/10 to-transparent border-teal-500/20 p-6 relative overflow-hidden" glass hover>
            {/* Glow pulses */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <TrendingUp size={100} className="text-teal-400" />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0 shadow-glow shadow-teal-500/5">
                <Calendar className="text-teal-400" size={30} />
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] mb-1">Upcoming Priority Session</p>
                <h4 className="text-2xl font-black text-white tracking-tighter truncate">
                  Dr. {next.doctors?.users?.first_name} {next.doctors?.users?.last_name}
                </h4>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                   <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} className="text-teal-500" />
                      {fmt(next.appointment_date)} · {fmtTime(next.appointment_time)}
                   </div>
                   {next.clinics && (
                      <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                         <LayoutGrid size={12} className="text-indigo-500" />
                         {next.clinics.name}
                      </div>
                   )}
                </div>
              </div>
              <Link href={`/doctors/${next.doctors?.user_id ?? next.doctors?.id}`}>
                <Button variant="ghost" className="h-12 px-10 rounded-full border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition-all uppercase tracking-widest font-black text-[11px]">
                   View Details <ChevronRight size={14} className="ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
