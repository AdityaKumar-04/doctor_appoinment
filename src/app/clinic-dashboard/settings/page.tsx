"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, Settings, Bell, Shield, Globe, Palette } from "lucide-react";

export default function ClinicSettingsPage() {
  const { user, role } = useAuth();
  const router = useRouter();

  if (!user || role !== "clinic") return null;

  const sections = [
    {
      icon: <Bell size={18} />,
      title: "Notifications",
      desc: "Configure appointment alerts, SMS and email preferences.",
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
    {
      icon: <Shield size={18} />,
      title: "Security",
      desc: "Manage passwords, two-factor authentication and session controls.",
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
    {
      icon: <Globe size={18} />,
      title: "Localization",
      desc: "Set timezone, language and regional date/time formats.",
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/20",
    },
    {
      icon: <Palette size={18} />,
      title: "Appearance",
      desc: "Customize branding colors and theme preferences.",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <>
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-6 group transition-colors"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <header className="mb-10">
        <p className="text-teal-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Configuration</p>
        <h1 className="text-3xl font-black text-white tracking-tighter">Settings</h1>
        <p className="text-slate-400 font-medium text-sm mt-1">Manage your clinic platform preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sections.map((s) => (
          <div
            key={s.title}
            className="bg-white/[0.02] border border-white/8 rounded-2xl p-6 flex items-start gap-4 hover:bg-white/[0.04] hover:border-white/15 transition-all cursor-pointer group"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${s.bg} ${s.color} group-hover:scale-110 transition-transform`}>
              {s.icon}
            </div>
            <div>
              <p className="font-black text-white text-base">{s.title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
              <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <Settings size={10} /> Coming Soon
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
