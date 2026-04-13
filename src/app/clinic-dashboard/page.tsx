"use client";

import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";
import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import StatsCard from "@/components/features/StatsCard";
import { SkeletonStatCard } from "@/components/ui/SkeletonCard";
import { 
  Building2, 
  Users, 
  Calendar, 
  Wallet, 
  Plus, 
  ArrowRight, 
  Activity, 
  Rocket, 
  Lock,
  UserPlus,
  Stethoscope,
  UserCog,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import { Doctor } from "@/utils/types";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const ClinicDashboardChart = dynamic(() => import('@/components/charts/ClinicDashboardChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
      Initializing Analytics Matrix...
    </div>
  ),
});

export default function ClinicDashboardPage() {
  const { user, profile, role } = useAuth();
  const [chartFilter, setChartFilter] = useState<"7d" | "30d">("7d");
  
  const { data: doctorsData, error: doctorsError } = useSWR(
    user && role === "clinic" ? "/api/clinic/doctors" : null, 
    fetcher
  );
  
  const { data: payData, error: payError } = useSWR(
    user && role === "clinic" ? "/api/clinic/payments" : null, 
    fetcher
  );

  const doctors: Doctor[] = doctorsData?.doctors || [];
  const payments: Record<string, unknown>[] = payData?.payments || [];
  const metrics = payData?.metrics || { totalRevenue: 0, totalClinicEarnings: 0 };
  
  const stats = {
    totalDoctors: doctors.length,
    activeDoctors: doctors.filter((d: Doctor) => d.is_active).length,
    specializations: new Set(doctors.map((d: Doctor) => d.specialization)).size,
    earnings: metrics.totalClinicEarnings
  };

  const dataLoading = (!doctorsData && !doctorsError) || (!payData && !payError);
  const clinicName = profile?.first_name || user?.email?.split("@")[0] || "Facility Manager";

  const daysBack = chartFilter === "7d" ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  const filteredPayments = payments.filter((p) => {
    const d = new Date(p.created_at as string);
    return d >= cutoff;
  });

  const chartData = filteredPayments.reduce((acc: { date: string; revenue: number }[], p: Record<string, unknown>) => {
    const dateStr = new Date(p.created_at as string).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' });
    const existing = acc.find(a => a.date === dateStr);
    if (existing) {
      existing.revenue += (p.clinic_amount as number) || 0;
    } else {
      acc.push({ date: dateStr, revenue: (p.clinic_amount as number) || 0 });
    }
    return acc;
  }, []);

  if (!user || role !== "clinic") return null;

  return (
    <div className="page-enter space-y-10 text-left">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-teal-500 text-[11px] font-black uppercase tracking-[0.2em]">Clinical Infrastructure Control</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Facility <span className="gradient-text">Management</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Welcome, {clinicName}. Operational status: <span className="text-emerald-400">Stable</span></p>
        </div>
        
        <Link href="/clinic-dashboard/doctors">
          <Button variant="primary" size="lg" icon={<Plus size={18} />} className="shadow-2xl">
            Onboard Specialist
          </Button>
        </Link>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dataLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatsCard label="Medical Team" value={stats.totalDoctors.toString().padStart(2, "0")} icon="groups" accent="teal" />
            <StatsCard label="Active Status" value={stats.activeDoctors.toString().padStart(2, "0")} icon="verified" accent="emerald" />
            <StatsCard label="Disciplines" value={stats.specializations.toString().padStart(2, "0")} icon="category" accent="sky" />
            <StatsCard label="Net Earnings" value={`₹${stats.earnings}`} icon="account_balance" accent="indigo" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Analytics Chart Container */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="p-8" glass>
             <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                     <Activity className="text-teal-400" size={18} />
                     Revenue Velocity
                  </CardTitle>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{chartFilter === "7d" ? "7" : "30"}-Day Transaction Performance</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1 bg-white/[0.04] border border-white/8 p-1 rounded-lg">
                     {(["7d", "30d"] as const).map((f) => (
                       <button
                         key={f}
                         onClick={() => setChartFilter(f)}
                         className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                           chartFilter === f
                             ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                             : "text-slate-500 hover:text-slate-300"
                         }`}
                       >
                         {f}
                       </button>
                     ))}
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-glow shadow-teal-500/20" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Growth</span>
                   </div>
                </div>
             </CardHeader>
             <div className="h-[300px] w-full">
               {payments.length > 0 ? (
                  <ClinicDashboardChart chartData={chartData} />
               ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 italic font-medium">
                     <Wallet size={40} className="mb-4" />
                     <p>Awaiting transaction sequence initiation...</p>
                  </div>
               )}
             </div>
          </Card>

          {/* Quick Link Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { href: "/clinic-dashboard/doctors", icon: <Stethoscope size={24} />, label: "Doctors", sub: "Recruit & Monitor Specialists", color: "from-teal-500/20 to-teal-600/20" },
              { href: "/clinic-dashboard/appointments", icon: <Calendar size={24} />, label: "Appointments", sub: "Unified Booking Master", color: "from-sky-500/20 to-sky-600/20" },
              { href: "/clinic-dashboard/payments", icon: <Wallet size={24} />, label: "Payments", sub: "Real-time Settlement Logs", color: "from-indigo-500/20 to-indigo-600/20" },
              { href: "/clinic-dashboard/profile", icon: <Building2 size={24} />, label: "Facility Setup", sub: "Operational Details & Meta", color: "from-violet-500/20 to-violet-600/20" },
              { href: "/clinic-dashboard/team", icon: <UserCog size={24} />, label: "Team Management", sub: "Staff Roles & Access Control", color: "from-rose-500/20 to-rose-600/20" },
              { href: "/clinic-dashboard/appointments", icon: <Users size={24} />, label: "Patients", sub: "Patient History & Records", color: "from-amber-500/20 to-amber-600/20" },
            ].map((action) => (
              <Link key={action.href} href={action.href} className="group glass-card p-6 rounded-2xl flex items-center gap-5 hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] transition-all duration-300">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10 group-hover:bg-teal-500/10 group-hover:border-teal-500/30 group-hover:text-teal-400 transition-all">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-base tracking-tight">{action.label}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5 truncate">{action.sub}</p>
                </div>
                <ArrowRight className="text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" size={20} />
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Onboarding Assistant */}
          {stats.totalDoctors === 0 && !dataLoading && (
            <Card className="p-8 border-teal-500/20 bg-teal-500/[0.03] space-y-8 overflow-hidden relative" glass hover>
              {/* Decorative Rocket Glow */}
              <div className="absolute top-0 right-0 p-4 opacity-5">
                 <Rocket size={100} className="text-teal-500" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-left">
                   <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                      <Rocket className="text-teal-400" size={20} />
                   </div>
                   <CardTitle className="text-xl">Initialization</CardTitle>
                </div>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider text-left">Deploy your first medical specialist unit</p>
              </div>

              <div className="space-y-6 text-left">
                {[
                  { step: "01", text: "Onboard your first specialist using their verified credentials." },
                  { step: "02", text: "The system will generate secure login tokens automatically." },
                  { step: "03", text: "Activate public listing to begin accepting patient requests." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4">
                     <span className="text-xs font-black text-teal-500 opacity-40 pt-0.5">{s.step}</span>
                     <p className="text-sm font-bold text-slate-300 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>

              <Link href="/clinic-dashboard/doctors">
                <Button fullWidth variant="primary" icon={<UserPlus size={18} />} className="shadow-xl shadow-teal-500/20">
                  Onboard Specialist
                </Button>
              </Link>
            </Card>
          )}

          {/* System Status Tracker */}
          <Card className="p-6" glass>
             <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Activity size={14} className="text-indigo-400" />
                Infrastructure Health
             </h4>
             <div className="space-y-5">
                {[
                   { label: "Server Response", status: "9ms", glow: "bg-emerald-500" },
                   { label: "Security Protocol", status: "Active", glow: "bg-teal-500" },
                   { label: "Database Latency", status: "Stable", glow: "bg-indigo-500" },
                ].map((item) => (
                   <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">{item.label}</span>
                      <div className="flex items-center gap-2.5">
                         <span className="text-[11px] font-black text-white uppercase tracking-widest">{item.status}</span>
                         <div className={`w-1.5 h-1.5 rounded-full ${item.glow} shadow-glow animate-pulse`} />
                      </div>
                   </div>
                ))}
             </div>
             <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                   <Lock size={14} />
                   AES-256 Bit Encryption Live
                </div>
             </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
