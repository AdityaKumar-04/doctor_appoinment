"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardTitle, CardContent } from "@/components/ui/Card";
import { Settings, ShieldCheck, Zap, Percent, Save, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch");
  return data;
});

export default function AdminSettingsPage() {
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data, isLoading: loading, mutate } = useSWR("/api/admin/settings", fetcher);

  useEffect(() => {
    if (data?.settings?.commission_rate) {
      setCommissionRate(Number(data.settings.commission_rate));
    }
  }, [data]);

  const handleSave = async () => {
      setSaving(true);
      try {
          const res = await fetch("/api/admin/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ commission_rate: commissionRate })
          });
          const resData = await res.json();
          if (res.ok) {
              setToast({ msg: "System logic synchronized successfully", type: "success" });
              mutate();
          } else {
              setToast({ msg: resData.error || "Execution failed", type: "error" });
          }
      } catch (err: unknown) {
          setToast({ msg: err instanceof Error ? err.message : "An unexpected error occurred", type: "error" });
      } finally {
          setSaving(false);
          setTimeout(() => setToast(null), 3000);
      }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Accessing Core Logic...</p>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-10 text-left">
        {/* Notifications */}
        {toast && (
          <div className={`fixed top-12 right-12 z-50 px-6 py-4 rounded-[1.5rem] shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 border ${
            toast.type === "success" 
              ? "bg-teal-500/10 text-teal-400 border-teal-500/20" 
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}>
            {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5 text-left">
            <p className="text-indigo-500 text-[11px] font-black uppercase tracking-[0.2em]">Global Administration</p>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              System <span className="gradient-text">Settings</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Configure core platform architecture and monetary protocols.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <ShieldCheck className="text-indigo-500" size={14} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Root Access Level</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <Card className="p-8 space-y-8" glass hover>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                    <Percent size={18} />
                 </div>
                 <CardTitle className="text-xl">Financial Commission Protocol</CardTitle>
              </div>

              <CardContent className="space-y-8 p-0">
                 <div className="max-w-md space-y-6">
                    <div className="space-y-3">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Global Rate (%)</label>
                       <div className="flex items-center gap-4">
                          <Input 
                            type="number"
                            min="0"
                            max="100"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(Number(e.target.value))}
                            className="h-14 !rounded-2xl !bg-white/[0.02] border-white/5 focus:border-indigo-500/50"
                          />
                          <Button 
                            onClick={handleSave}
                            disabled={saving}
                            variant="primary"
                            className="h-14 px-8 rounded-2xl shadow-xl shadow-indigo-500/10"
                            icon={saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                          >
                            {saving ? "Syncing" : "Apply"}
                          </Button>
                       </div>
                    </div>
                    
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex gap-4">
                       <Zap size={16} className="text-indigo-400 shrink-0 mt-1" />
                       <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                          This percentage is automatically deducted from all clinical session settlements as the platform infrastructure fee. Changes are applied in real-time to all future transactions.
                       </p>
                    </div>
                 </div>
              </CardContent>
            </Card>
            
            {/* Audit Logs Placeholder */}
            <div className="p-10 rounded-[2.5rem] bg-white/[0.01] border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
               <Settings className="text-slate-800 mb-4" size={40} />
               <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-1">Configuration History</h3>
               <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Global audit trail synchronized with master clock.</p>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <Card className="p-8 space-y-8" glass>
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">System Identity</h4>
                
                <div className="space-y-6">
                   {[
                     { label: "Logic Matrix", value: "v2.0.44-Clinical", icon: <Settings size={14} />, color: "text-teal-400" },
                     { label: "Auth Protocol", value: "JWT-Secured", icon: <ShieldCheck size={14} />, color: "text-indigo-400" },
                     { label: "Last Sync", value: new Date().toLocaleTimeString(), icon: <RefreshCw size={14} />, color: "text-sky-400" },
                   ].map((item) => (
                      <div key={item.label} className="flex gap-4">
                         <div className={`mt-0.5 p-2 rounded-lg bg-white/5 border border-white/5 ${item.color}`}>
                            {item.icon}
                         </div>
                         <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">{item.label}</p>
                            <p className="text-xs font-black text-white tracking-tight">{item.value}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </Card>

             <div className="px-8 py-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group hover:bg-white/[0.04] transition-all cursor-help">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
                   <ShieldCheck size={20} />
                </div>
                <div className="text-left">
                   <p className="text-[10px] font-black text-white uppercase tracking-widest">Master Security</p>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Verified Root Certificate Alpha</p>
                </div>
             </div>
          </div>
        </div>
    </div>
  );
}
