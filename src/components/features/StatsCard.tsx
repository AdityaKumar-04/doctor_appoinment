import React from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  accent?: "teal" | "sky" | "indigo" | "amber" | "emerald" | "red";
  trend?: { value: number; label: string };
  className?: string;
}

const ACCENTS = {
  teal:    { icon: "text-teal-400",    bg: "bg-teal-500/10",    border: "border-teal-500/20",    glow: "shadow-teal-500/10" },
  sky:     { icon: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20",     glow: "shadow-sky-500/10" },
  indigo:  { icon: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/20",  glow: "shadow-indigo-500/10" },
  amber:   { icon: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   glow: "shadow-amber-500/10" },
  emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/10" },
  red:     { icon: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     glow: "shadow-red-500/10" },
};

export default function StatsCard({
  label,
  value,
  icon,
  accent = "teal",
  trend,
  className = "",
}: StatsCardProps) {
  const a = ACCENTS[accent];

  return (
    <div
      className={`
        glass-card rounded-2xl p-6 relative overflow-hidden group
        hover:scale-[1.02] transition-all duration-500 ease-out
        ${className}
      `}
    >
      {/* Background Glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${a.bg}`} />

      <div className="flex items-start justify-between mb-6">
        <div className={`w-12 h-12 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center shrink-0 shadow-lg ${a.glow}`}>
          <span
            className={`material-symbols-outlined text-2xl ${a.icon}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${trend.value >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            <span className="material-symbols-outlined text-xs">
              {trend.value >= 0 ? "trending_up" : "trending_down"}
            </span>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div>
        <h4 className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.15em] mb-1.5">{label}</h4>
        <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
        
        {trend && (
          <p className="text-[11px] text-slate-500 font-bold mt-2 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
