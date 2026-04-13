"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardShell from "@/components/layout/DashboardShell";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Zap, 
  Activity,
  AlertCircle,
  CalendarDays,
  Lock
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardTitle } from "@/components/ui/Card";

// ── Time slots: 9 AM → 6 PM, every hour ──────────────────────────────────────
const ALL_SLOTS = [
  { label: "9:00 AM", value: "09:00:00" },
  { label: "10:00 AM", value: "10:00:00" },
  { label: "11:00 AM", value: "11:00:00" },
  { label: "12:00 PM", value: "12:00:00" },
  { label: "1:00 PM", value: "13:00:00" },
  { label: "2:00 PM", value: "14:00:00" },
  { label: "3:00 PM", value: "15:00:00" },
  { label: "4:00 PM", value: "16:00:00" },
  { label: "5:00 PM", value: "17:00:00" },
  { label: "6:00 PM", value: "18:00:00" },
];

interface DoctorInfo {
  id: string;
  user_id: string;
  specialization: string;
  experience_years: number;
  consultation_fee: number;
  bio: string;
  clinics: { name: string; address: string | null } | null;
  users: { first_name: string; last_name: string };
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDateLabel(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function BookingPage({ params }: { params: { doctorId: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);

  const [date, setDate] = useState(todayISO());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?next=/book/${params.doctorId}`);
    }
  }, [user, authLoading, router, params.doctorId]);

  // ── Fetch doctor info ────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDoctor() {
      try {
        const res = await fetch(`/api/doctors/${params.doctorId}`);
        const data = await res.json();
        if (res.ok && data.doctor) setDoctor(data.doctor);
        else setDoctor(null);
      } catch {
        setDoctor(null);
      } finally {
        setDoctorLoading(false);
      }
    }
    fetchDoctor();
  }, [params.doctorId]);

  // ── Fetch booked slots for selected date ─────────────────────────────────────
  const fetchBookedSlots = useCallback(async (selectedDate: string, doctorDbId: string) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `/api/appointments/availability?doctorId=${doctorDbId}&date=${selectedDate}`
      );
      const data = await res.json();
      setBookedSlots(data.bookedTimeSlots || []);
    } catch {
      setBookedSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (doctor?.id) {
      fetchBookedSlots(date, doctor.id);
    }
  }, [date, doctor, fetchBookedSlots]);

  // ── Submit booking ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedSlot || !doctor || !user) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: user.id,
          doctor_id: doctor.id,
          appointment_date: date,
          appointment_time: selectedSlot,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      router.push(`/checkout?appointmentId=${data.appointment.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  // ── Loading / guards ─────────────────────────────────────────────────────────
  if (authLoading || doctorLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-xl shadow-teal-500/20">
            <CalendarDays className="text-white" size={32} />
          </div>
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Portal Matrix...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!doctor) {
    return (
      <DashboardShell role="patient">
        <div className="flex flex-col items-center justify-center py-32 text-center text-left">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <AlertCircle className="text-slate-700" size={40} />
          </div>
          <h2 className="text-xl font-black text-white tracking-tighter mb-2">Specialist Record Not Found</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-10">The medical profile requested does not exist in our active directory.</p>
          <Link href="/doctors">
            <Button variant="outline" className="px-10 rounded-full h-11" icon={<ArrowLeft size={16} />}>
              Back to Directory
            </Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const bookedSet = new Set(bookedSlots);

  return (
    <DashboardShell role="patient">
      <div className="page-enter space-y-10 text-left">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5 text-left">
            <Link href="/doctors" className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group">
               <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
               Return to Directory
            </Link>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              Initiate <span className="gradient-text">Booking</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider text-left">Establish a clinical session with your preferred specialist.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-glow shadow-teal-500/20" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Active</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Left: Date + Slot picker ─────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="p-8 space-y-8 text-left" glass hover>
               {/* Step 1 — Date */}
               <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400 font-black text-sm">01</div>
                    <CardTitle className="text-xl">Select Chronology</CardTitle>
                 </div>

                 <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <input
                      type="date"
                      value={date}
                      min={todayISO()}
                      onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }}
                      className="h-14 px-5 rounded-2xl border-2 border-white/5 bg-white/[0.03] text-white focus:border-teal-500/50 focus:outline-none focus:ring-4 focus:ring-teal-500/10 font-bold text-sm transition-all"
                    />
                    {date && (
                      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-teal-500/5 border border-teal-500/10 text-teal-400 text-xs font-black uppercase tracking-widest animate-in slide-in-from-left-2 duration-500">
                        <Calendar size={16} />
                        {formatDateLabel(date)}
                      </div>
                    )}
                 </div>
               </div>

               <div className="h-px bg-white/5" />

               {/* Step 2 — Time Slots */}
               <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-sm transition-all duration-500 ${date ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-white/5 text-slate-700 border-white/5"}`}>02</div>
                    <CardTitle className="text-xl">Temporal Selection</CardTitle>
                 </div>

                 {slotsLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                       {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="h-14 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
                       ))}
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {ALL_SLOTS.map((slot) => {
                             const isBooked = bookedSet.has(slot.value);
                             const isSelected = selectedSlot === slot.value;
                             return (
                                <button
                                   key={slot.value}
                                   disabled={isBooked}
                                   onClick={() => setSelectedSlot(slot.value)}
                                   className={`h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                                      isBooked
                                      ? "bg-slate-900 border-white/5 text-slate-700 cursor-not-allowed line-through opacity-50"
                                      : isSelected
                                      ? "bg-gradient-to-br from-teal-500 to-indigo-600 text-white border-transparent shadow-xl shadow-teal-500/20 scale-[1.05] z-10"
                                      : "bg-white/[0.03] text-slate-400 border-white/5 hover:border-teal-500/30 hover:text-white hover:bg-white/[0.05]"
                                   }`}
                                >
                                   {slot.label}
                                </button>
                             );
                          })}
                       </div>
                       
                       {/* Legend */}
                       <div className="flex gap-6 pt-4 text-[10px] font-black text-slate-600 uppercase tracking-widest border-t border-white/5">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-white/5 border border-white/5" />
                             Available
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-teal-500 shadow-glow" />
                             Selected
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
                             Reserved
                          </div>
                       </div>
                    </div>
                 )}
               </div>

               <div className="h-px bg-white/5" />

               {/* Step 3 — Notes */}
               <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-sm transition-all duration-500 ${selectedSlot ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-white/5 text-slate-700 border-white/5"}`}>03</div>
                    <CardTitle className="text-xl">Additional Metadata <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 opacity-50">(Optional)</span></CardTitle>
                 </div>
                 
                 <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe your symptoms or primary directives for this medical sequence..."
                    className="w-full p-6 bg-white/[0.03] border-2 border-white/5 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 rounded-[2rem] text-sm text-white placeholder:text-slate-600 resize-none transition-all font-bold"
                 />
               </div>

               {error && (
                 <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-red-500/5 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest animate-in shake-1 duration-500">
                    <Activity size={18} />
                    {error}
                 </div>
               )}
            </Card>
          </div>

          {/* ── Right: Summary Card ──────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-8">
            <aside className="sticky top-10 space-y-8 text-left">
              <Card className="p-8" glass hover>
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Session Summary</h4>

                <div className="space-y-8">
                  {/* Doctor Info */}
                  <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all text-left">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-xl group-hover:scale-105 transition-transform duration-500">
                      {doctor.users.first_name?.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-white text-lg tracking-tight">Dr. {doctor.users.first_name} {doctor.users.last_name}</p>
                      <p className="text-teal-400 text-[10px] font-black uppercase tracking-widest mt-1">{doctor.specialization}</p>
                      {doctor.clinics && (
                        <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-[10px] font-bold">
                           <Building2 size={12} className="text-indigo-500" />
                           {doctor.clinics.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specs Grid */}
                  <div className="space-y-5 text-left">
                    {[
                      {
                        label: "Date Trace",
                        value: date ? formatDateLabel(date) : "Pending Selection",
                        icon: <Calendar size={14} />,
                        active: !!date,
                        color: "text-teal-400"
                      },
                      {
                        label: "TemporalSlot",
                        value: selectedSlot
                          ? ALL_SLOTS.find((s) => s.value === selectedSlot)?.label || "—"
                          : "Pending Selection",
                        icon: <Clock size={14} />,
                        active: !!selectedSlot,
                        color: "text-indigo-400"
                      },
                      {
                        label: "Net Fee",
                        value: `₹${doctor.consultation_fee}`,
                        icon: <Zap size={14} />,
                        active: true,
                        color: "text-sky-400"
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex gap-4 group">
                        <div className={`mt-0.5 p-2 rounded-lg bg-white/5 border border-white/5 ${item.active ? item.color : "text-slate-700"}`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{item.label}</p>
                          <p className={`text-xs font-black tracking-tight ${item.active && item.value !== "Pending Selection" ? "text-white" : "text-slate-700"}`}>
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-white/5 space-y-6">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Payable Total</p>
                      <p className="text-4xl font-black text-white tracking-tighter shadow-glow shadow-teal-500/5">₹{doctor.consultation_fee}</p>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!selectedSlot || submitting}
                      className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-black text-sm uppercase tracking-widest
                        hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-teal-500/20 disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
                    >
                      {submitting ? (
                        <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Synchronizing...</>
                      ) : (
                        <><CheckCircle2 size={18} /> Confirm Logic Matrix</>
                      )}
                    </button>
                    {!selectedSlot && (
                      <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">Awaiting temporal validation</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Trust badges */}
              <Card className="p-6 text-left" glass>
                 <div className="space-y-4">
                    {[
                      { icon: <ShieldCheck size={14} />, text: "Free cancellation 24h prior" },
                      { icon: <Activity size={14} />, text: "Instant signal confirmation" },
                      { icon: <Lock size={14} />, text: "256-bit encrypted payload" },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest group">
                         <span className="text-teal-500 opacity-40 group-hover:opacity-100 transition-opacity">
                            {item.icon}
                         </span>
                         {item.text}
                      </div>
                    ))}
                 </div>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
