"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { 
  TrendingUp, 
  Wallet, 
  CalendarDays, 
  Clock4, 
  Filter, 
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  User,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

const AdminPaymentsChart = dynamic(
  () => import("@/components/charts/AdminPaymentsChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex items-center justify-center text-slate-600 text-xs">
        Loading chart...
      </div>
    ),
  }
);

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed to fetch");
    return d;
  });

interface PaymentRow {
  id: string;
  amount_total: number;
  platform_commission: number;
  clinic_amount: number;
  status: string;
  created_at: string;
  clinic_name: string;
  patient_name: string;
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading: loading } = useSWR("/api/admin/payments", fetcher);
  const allPayments: PaymentRow[] = useMemo(() => data?.payments || [], [data?.payments]);
  const metrics = data?.metrics || { totalRevenue: 0, totalCommission: 0, totalClinicEarnings: 0 };

  // TODAY revenue
  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return allPayments.filter((p) => p.status === "completed" && new Date(p.created_at).toDateString() === today)
      .reduce((sum, p) => sum + p.amount_total, 0);
  }, [allPayments]);

  // MONTHLY revenue
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    return allPayments.filter((p) => {
      const d = new Date(p.created_at);
      return p.status === "completed" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, p) => sum + p.amount_total, 0);
  }, [allPayments]);

  // Filter for table
  const payments = useMemo(() => {
    return allPayments.filter((p) => {
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchSearch =
        !search ||
        p.clinic_name.toLowerCase().includes(search.toLowerCase()) ||
        p.patient_name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [allPayments, statusFilter, search]);

  // Chart Data
  const chartData = useMemo(() => {
    if (!allPayments.length) return { trends: [], topClinics: [] };
    const trendsMap: Record<string, { date: string; revenue: number; commission: number }> = {};
    const clinicsMap: Record<string, number> = {};
    allPayments.forEach((p) => {
      if (p.status === "completed") {
        const dateStr = new Date(p.created_at).toLocaleDateString();
        if (!trendsMap[dateStr]) trendsMap[dateStr] = { date: dateStr, revenue: 0, commission: 0 };
        trendsMap[dateStr].revenue += p.amount_total;
        trendsMap[dateStr].commission += p.platform_commission;
        clinicsMap[p.clinic_name] = (clinicsMap[p.clinic_name] || 0) + p.amount_total;
      }
    });
    const trends = Object.values(trendsMap).reverse();
    const topClinics = Object.entries(clinicsMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    return { trends, topClinics };
  }, [allPayments]);

  const STATUS_CFG: Record<string, { cls: string; icon: React.ReactNode }> = {
    completed: { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 size={11} /> },
    pending:   { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",   icon: <Clock4 size={11} /> },
    failed:    { cls: "bg-red-500/10 text-red-400 border-red-500/20",          icon: <XCircle size={11} /> },
  };

  return (
    <div className="page-enter space-y-8 text-left">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-violet-400 text-[11px] font-black uppercase tracking-[0.2em]">Admin · Finance</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Revenue <span className="gradient-text">&amp; Payments</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {allPayments.length} transactions · Platform financial overview
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-widest">
            <Loader2 size={14} className="animate-spin" />Loading...
          </div>
        )}
      </header>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: `₹${metrics.totalRevenue.toLocaleString("en-IN")}`,
            sub: "All time",
            icon: <TrendingUp size={20} />,
            cls: "from-violet-500/20 to-indigo-500/20 border-violet-500/30 text-violet-300",
          },
          {
            label: "This Month",
            value: `₹${monthlyRevenue.toLocaleString("en-IN")}`,
            sub: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }),
            icon: <CalendarDays size={20} />,
            cls: "from-sky-500/20 to-cyan-500/20 border-sky-500/30 text-sky-300",
          },
          {
            label: "Today",
            value: `₹${todayRevenue.toLocaleString("en-IN")}`,
            sub: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            icon: <Clock4 size={20} />,
            cls: "from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-300",
          },
          {
            label: "Platform Fees",
            value: `₹${metrics.totalCommission.toLocaleString("en-IN")}`,
            sub: "Commission collected",
            icon: <Wallet size={20} />,
            cls: "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300",
          },
        ].map((card) => (
          <div key={card.label} className={`p-5 rounded-2xl border bg-gradient-to-br ${card.cls}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-black uppercase tracking-widest opacity-70">{card.label}</p>
              <div className="opacity-60">{card.icon}</div>
            </div>
            <p className="text-3xl font-black">{card.value}</p>
            <p className="text-[11px] opacity-50 mt-1 font-bold uppercase tracking-widest">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {allPayments.length > 0 && <AdminPaymentsChart chartData={chartData} />}

      {/* Table header */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
          <Input
            type="text"
            placeholder="Search by clinic, patient or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 !rounded-xl !bg-white/[0.03] border-white/8 focus:border-violet-500/40"
          />
        </div>
        <div className="relative min-w-[160px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-12 bg-white/[0.03] border border-white/8 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-xl pl-10 pr-4 focus:outline-none focus:border-violet-500/40 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="overflow-hidden p-0" glass>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinic</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Gross</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Fee</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Net</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading && payments.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-5">
                      <div className="h-10 bg-white/[0.02] rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Wallet className="mx-auto text-slate-700 mb-4" size={40} />
                    <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No transactions found</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const s = STATUS_CFG[p.status] || STATUS_CFG.pending;
                  return (
                    <tr key={p.id} className="group hover:bg-white/[0.01] transition-all">
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-200 tracking-tighter font-mono">
                          #{p.id.split("-").pop()?.toUpperCase()}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {new Date(p.created_at).toLocaleString("en-IN", {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={13} className="text-slate-600 shrink-0" />
                          <span className="text-sm font-bold text-slate-200 truncate max-w-[140px]">{p.clinic_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-slate-600 shrink-0" />
                          <span className="text-sm text-slate-400 truncate max-w-[130px]">{p.patient_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-200 text-sm">₹{p.amount_total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-black text-rose-400 text-sm">₹{p.platform_commission.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-400 text-sm">₹{p.clinic_amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${s.cls}`}>
                          {s.icon}{p.status}
                        </span>
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
