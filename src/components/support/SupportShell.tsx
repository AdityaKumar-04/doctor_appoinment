"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headphones, Plus, ArrowLeft } from "lucide-react";

interface SupportShellProps {
  children: React.ReactNode;
  basePath: string; // e.g. "/dashboard/support" | "/doctor-dashboard/support" | "/clinic-dashboard/support"
  role: "patient" | "doctor" | "clinic";
}

const ROLE_ACCENTS = {
  patient: { text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/10" },
  doctor:  { text: "text-sky-400",    border: "border-sky-500/30",    bg: "bg-sky-500/10" },
  clinic:  { text: "text-teal-400",   border: "border-teal-500/30",   bg: "bg-teal-500/10" },
};

export default function SupportShell({ children, basePath, role }: SupportShellProps) {
  const pathname = usePathname();
  const accent = ROLE_ACCENTS[role];
  const isDetail = pathname !== basePath && pathname !== `${basePath}/new`;
  const isNew = pathname === `${basePath}/new`;

  return (
    <div className="page-enter space-y-8 text-left">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          {isDetail && (
            <Link
              href={basePath}
              className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2 ${accent.text} hover:opacity-70 transition-opacity`}
            >
              <ArrowLeft size={12} />Back to Tickets
            </Link>
          )}
          <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${accent.text}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)} · Support
          </p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            {isNew ? (
              <>New <span className="gradient-text">Ticket</span></>
            ) : isDetail ? (
              <>Ticket <span className="gradient-text">Detail</span></>
            ) : (
              <>Support <span className="gradient-text">Center</span></>
            )}
          </h1>
          {!isDetail && !isNew && (
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
              Raise issues · Track status · Chat with support
            </p>
          )}
        </div>

        {!isNew && !isDetail && (
          <Link href={`${basePath}/new`}>
            <button className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border ${accent.text} ${accent.border} ${accent.bg} hover:brightness-125 active:scale-95`}>
              <Plus size={18} />
              New Ticket
            </button>
          </Link>
        )}

        {!isNew && !isDetail && (
          <div className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl ${accent.bg} border ${accent.border}`}>
            <Headphones size={15} className={accent.text} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${accent.text}`}>24/7 Support</span>
          </div>
        )}
      </header>

      {children}
    </div>
  );
}
