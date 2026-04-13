"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Activity,
  FileText,
  User,
  Stethoscope,
  ChevronRight,
  ClipboardList
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(async (r) => {
  const d = await r.json();
  if (!r.ok) throw new Error(d.error);
  return d;
});

// Data types based on our schemas
type TimelineItem = {
  type: "appointment" | "treatment" | "followup";
  date: Date;
  data: any; // specific data for each type
};

export default function PatientHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const { data, error, isLoading } = useSWR(`/api/patients/${id}/history`, fetcher);

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  useEffect(() => {
    if (data) {
      const items: TimelineItem[] = [];

      // Combine all events into one timeline
      data.appointments?.forEach((apt: any) => {
        items.push({
          type: "appointment",
          date: new Date(apt.appointment_date + "T" + (apt.appointment_time || "00:00:00")),
          data: apt,
        });
      });

      data.treatments?.forEach((treat: any) => {
        items.push({
          type: "treatment",
          date: new Date(treat.created_at),
          data: treat,
        });
      });

      data.followups?.forEach((fup: any) => {
        items.push({
          type: "followup",
          date: new Date(fup.created_at),
          data: fup,
        });
      });

      // Sort descending (newest first)
      items.sort((a, b) => b.date.getTime() - a.date.getTime());
      setTimeline(items);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <span className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading history...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 font-bold mb-2">Failed to load patient data</p>
        <p className="text-sm text-slate-500">{error?.message || "Internal error"}</p>
        <Button className="mt-6" variant="secondary" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const { patient } = data;

  return (
    <div className="page-enter space-y-8 text-left max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-2 group transition-colors"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Directory
      </button>

      {/* Header */}
      <Card glass className="p-6 md:p-8 flex items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/10 blur-3xl rounded-full" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-black text-3xl uppercase shadow-xl">
            {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-teal-400 tracking-widest mb-1.5 flex items-center gap-1.5">
              <User size={13} /> Patient Record
            </p>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-slate-400 text-sm font-bold flex items-center gap-2">
               {patient.email} {patient.phone && `• ${patient.phone}`}
            </p>
          </div>
        </div>
      </Card>

      {/* Timeline Section */}
      <section>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
          <HistoryIcon /> Medical History Timeline
        </h2>
        
        {timeline.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
             <ClipboardList size={32} className="mx-auto text-slate-600 mb-4" />
             <p className="text-sm font-bold text-white mb-1">No medical records found</p>
             <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">
               Activity will appear here after their first appointment.
             </p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {timeline.map((item, i) => (
              <TimelineEvent key={i} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HistoryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
  );
}

function TimelineEvent({ item }: { item: TimelineItem }) {
  const isApt = item.type === "appointment";
  const isTreat = item.type === "treatment";
  const isFup = item.type === "followup";

  const dateStr = item.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = item.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  let Icon = Calendar;
  let bgColors = "bg-sky-500/10 text-sky-400 border-sky-500/20";
  let title = "Appointment";

  if (isTreat) {
    Icon = FileText;
    bgColors = "bg-violet-500/10 text-violet-400 border-violet-500/20";
    title = "Treatment Assigned";
  } else if (isFup) {
    Icon = Activity;
    bgColors = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    title = "Follow-up Scheduled";
  }

  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      {/* Icon Node */}
      <div className={`flex items-center justify-center w-10 h-10 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 bg-[#0f1115] z-10 ${bgColors}`}>
        <Icon size={16} />
      </div>
      
      {/* Content */}
      <Card glass hover className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-5 text-left border border-white/5 transition-all">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${bgColors}`}>
            {title}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-white flex items-center justify-end gap-1"><Calendar size={10} />{dateStr}</p>
            <p className="text-[9px] text-slate-500 mt-0.5 flex items-center justify-end gap-1"><Clock size={10} />{timeStr}</p>
          </div>
        </div>

        {isApt && (
          <div className="space-y-1.5 text-sm text-slate-300">
             <p className="font-bold text-white flex items-center gap-1.5"><Stethoscope size={14} className="text-teal-500" /> Consulted at {item.data.clinics?.name || "Clinic"}</p>
             <p className="text-xs">Status: <span className="capitalize text-slate-400">{item.data.status}</span></p>
          </div>
        )}

        {isTreat && (
          <div className="space-y-2">
            <p className="text-xs text-slate-300 leading-relaxed font-mono bg-white/[0.03] p-3 rounded-lg border border-white/5">
              {item.data.notes}
            </p>
            {item.data.followup_date && (
              <p className="text-[10px] text-violet-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                 <ChevronRight size={10} /> Follow-up suggested for {new Date(item.data.followup_date).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {isFup && (
          <div>
            <p className="text-xs text-slate-300 font-medium">Follow-up registered in system.</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 mt-1">Status: {item.data.status}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
