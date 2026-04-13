"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAppointments } from "@/hooks/useAppointments";
import { ChevronLeft, Receipt, TrendingUp, Wallet, ArrowDownRight, Calendar } from "lucide-react";

interface Appointment {
  id: string;
  consultation_fee: number;
  created_at: string;
  doctors: {
    consultation_fee: number;
    users: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function ClinicPaymentsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const { appointments, isLoading } = useAppointments("clinic", user?.id, "completed");

  const dataLoading = authLoading || isLoading;

  if (!user || role !== "clinic") return null;

  // Financial calculations
  const totalGross = appointments.reduce((sum: number, apt: Appointment) => sum + (apt.doctors.consultation_fee || 0), 0);
  const platformCommission = totalGross * 0.10;
  const netEarnings = totalGross - platformCommission;

  // Monthly revenue (current month)
  const now = new Date();
  const monthlyGross = appointments
    .filter((apt: Appointment) => {
      const d = new Date(apt.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, apt: Appointment) => sum + (apt.doctors.consultation_fee || 0), 0);

  const stats = [
    {
      label: "Gross Revenue",
      value: `₹${totalGross.toLocaleString()}`,
      sub: "Total consultation fees",
      icon: <Receipt size={20} />,
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/20",
    },
    {
      label: "Monthly Revenue",
      value: `₹${(monthlyGross - monthlyGross * 0.1).toLocaleString()}`,
      sub: `${now.toLocaleString("default", { month: "long" })} net earnings`,
      icon: <TrendingUp size={20} />,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
    {
      label: "Platform Fee (10%)",
      value: `₹${platformCommission.toLocaleString()}`,
      sub: "Deducted automatically",
      icon: <ArrowDownRight size={20} />,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Net Earnings",
      value: `₹${netEarnings.toLocaleString()}`,
      sub: "Available for payout",
      icon: <Wallet size={20} />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <>
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-6 group transition-colors"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <header className="mb-8">
        <p className="text-teal-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Financial Core</p>
        <h1 className="text-3xl font-black text-white tracking-tighter">Payments & Finance</h1>
        <p className="text-slate-400 font-medium text-sm mt-1">Track revenue, platform fees, and net payouts.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-white/[0.03] border rounded-2xl p-6 ${stat.bg}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
            <p className="text-xs text-slate-600 mt-1.5 font-medium">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white">Completed Appointments</h2>
            <p className="text-xs text-slate-500 mt-0.5">Breakdown of session revenues</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            {appointments.length} sessions
          </div>
        </div>

        {dataLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <span className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Loading transactions...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-center mx-auto mb-4">
              <Receipt size={28} className="text-slate-600" />
            </div>
            <p className="font-black text-white text-lg mb-2">No completed appointments yet</p>
            <p className="text-slate-500 text-sm">Earnings appear here once consultations are complete.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4 text-right">Gross Fee</th>
                  <th className="px-4 py-4 text-right">Platform (10%)</th>
                  <th className="px-6 py-4 text-right">Net Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {appointments.map((apt: Appointment) => {
                  const gross = apt.doctors.consultation_fee || 0;
                  const fee = gross * 0.10;
                  const net = gross - fee;
                  
                  return (
                    <tr key={apt.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white text-sm">
                          Dr. {apt.doctors.users.first_name} {apt.doctors.users.last_name}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                          <Calendar size={13} className="text-slate-600" />
                          {new Date(apt.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-slate-300 font-semibold text-sm">₹{gross.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-amber-400 text-sm font-semibold">-₹{fee.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-emerald-400 font-black text-sm">₹{net.toLocaleString()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
