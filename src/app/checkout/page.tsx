"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardShell from "@/components/layout/DashboardShell";
import Badge from "@/components/ui/Badge";
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, X, Lock, Building2, Calendar, Clock, Timer, Stethoscope } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface AppointmentDetail {
  id: string;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
  status: string;
  patient_id: string;
  doctor_id: string;
  doctors: {
    id: string;
    user_id: string;
    specialization: string;
    consultation_fee: number;
    clinic_id: string;
    clinics: { name: string; address: string | null } | null;
    users: { first_name: string; last_name: string };
  };
}

type PayState = "idle" | "processing" | "success" | "error";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(timeStr: string) {
  return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

// ── Dark Payment Modal ─────────────────────────────────────────────────────────
function PaymentModal({
  fee,
  doctorName,
  onSuccess,
  onCancel,
}: {
  fee: number;
  doctorName: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"form" | "processing" | "done">("form");
  const [upi, setUpi] = useState("");
  const [upiError, setUpiError] = useState("");

  const handlePay = () => {
    if (!upi.trim() || !upi.includes("@")) {
      setUpiError("Enter a valid UPI ID (e.g. yourname@upi)");
      return;
    }
    setUpiError("");
    setStep("processing");
    setTimeout(() => {
      setStep("done");
      setTimeout(onSuccess, 1200);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-left">
      <div className="glass-card rounded-[2.5rem] border-white/10 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500/20 to-indigo-600/20 px-8 py-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center border border-teal-500/20">
              <CreditCard className="text-teal-400" size={20} />
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-tight">Clinical Pay</p>
              <p className="text-teal-400/60 text-[10px] font-bold uppercase tracking-widest">Secure Gateway</p>
            </div>
          </div>
          {step === "form" && (
            <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/5">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-8">
          {step === "form" && (
            <>
              {/* Amount */}
              <div className="text-center mb-8">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Amount</p>
                <div className="flex items-center justify-center gap-1.5">
                   <span className="text-2xl font-black text-teal-500/50">₹</span>
                   <p className="text-5xl font-black text-white tracking-tighter">{fee}</p>
                </div>
                <p className="text-slate-400 text-xs font-bold mt-2 px-4 py-1.5 rounded-full bg-white/5 inline-block">Dr. {doctorName}</p>
              </div>

              {/* UPI Input */}
              <div className="mb-6">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">UPI ID</label>
                <input
                  type="text"
                  value={upi}
                  onChange={(e) => { setUpi(e.target.value); setUpiError(""); }}
                  placeholder="yourname@upi"
                  className={`w-full h-14 px-5 rounded-2xl border-2 text-sm font-bold focus:outline-none transition-all bg-white/[0.03] text-white placeholder:text-slate-600 ${
                    upiError ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-teal-500/50"
                  }`}
                />
                {upiError && (
                  <p className="text-red-400 text-[11px] font-bold mt-2 px-1">
                    {upiError}
                  </p>
                )}
              </div>

              <button
                onClick={handlePay}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-3 cursor-pointer mb-6"
              >
                <Lock size={18} />
                Pay ₹{fee} Securely
              </button>
              
              <div className="flex items-center justify-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={14} className="text-teal-500" />
                AES-256 Bit Encrypted
              </div>
            </>
          )}

          {step === "processing" && (
            <div className="text-center py-10">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="w-20 h-20 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CreditCard className="text-teal-400" size={24} />
                </div>
              </div>
              <p className="font-black text-white text-lg tracking-tight">Validating Sequence</p>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-2">Connecting to UPI Matrix...</p>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border-2 border-teal-500/20 flex items-center justify-center mx-auto mb-8 animate-in zoom-in-50">
                <CheckCircle2 className="text-teal-400" size={40} />
              </div>
              <p className="font-black text-white text-xl tracking-tight">Payment confirmed.</p>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-2">Sequence complete.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Checkout Page ──────────────────────────────────────────────────────────────
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const { user, loading: authLoading } = useAuth();

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [payState, setPayState] = useState<PayState>("idle");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?next=/checkout");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!appointmentId) return;
    async function fetchAppointment() {
      try {
        const res = await fetch(`/api/checkout?appointmentId=${appointmentId}`);
        const data = await res.json();
        if (res.ok && data.appointment) setAppointment(data.appointment);
      } catch (err) {
        console.error("Checkout fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointment();
  }, [appointmentId]);

  const handlePaymentSuccess = async () => {
    setPayState("processing");
    setShowModal(false);
    try {
      const res = await fetch("/api/checkout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Confirmation failed");
      }
      setPayState("success");
      setTimeout(() => router.push("/dashboard/appointments"), 2000);
    } catch (err: unknown) {
      console.error("Checkout confirm error:", err);
      setPayState("error");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-xl shadow-teal-500/20">
            <CreditCard className="text-white" size={32} />
          </div>
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Checkout Matrix...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!appointment || !appointmentId) {
    return (
      <DashboardShell role="patient">
        <div className="flex flex-col items-center justify-center py-32 text-center text-left">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CreditCard className="text-slate-700" size={40} />
          </div>
          <h2 className="text-xl font-black text-white tracking-tighter mb-2">No appointment sequence detected</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-10">The requested session logs were not found in the matrix.</p>
          <Link href="/dashboard/appointments">
            <Button variant="outline" className="px-10 rounded-full h-11" icon={<ArrowLeft size={16} />}>
              Back to Schedule
            </Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const alreadyConfirmed = appointment.status === "confirmed";
  const doctor = appointment.doctors;
  const doctorName = `${doctor.users.first_name} ${doctor.users.last_name}`;

  return (
    <DashboardShell role="patient">
      {showModal && (
        <PaymentModal
          fee={doctor.consultation_fee}
          doctorName={doctorName}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="page-enter max-w-4xl mx-auto space-y-10 text-left">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5 text-left">
            <Link href="/dashboard/appointments" className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group">
               <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
               Return to Schedule
            </Link>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              Session <span className="gradient-text">Settlement</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Review booking protocol and finalize transaction.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-glow shadow-teal-500/20" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference: #{appointmentId.slice(0, 8).toUpperCase()}</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Order Summary */}
           <div className="lg:col-span-8 space-y-8">
              {/* Success state */}
              {(payState === "success" || alreadyConfirmed) && (
                <Card className="bg-emerald-500/[0.03] border-emerald-500/20 p-10 text-center animate-in slide-in-from-top-4 duration-700" glass hover>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-emerald-400" size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tighter mb-2">
                    {alreadyConfirmed ? "Sequence Confirmed" : "Signal Synchronized"}
                  </h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">
                    {alreadyConfirmed ? "This session record has already been validated." : "Payment successful. Syncing records..."}
                  </p>
                  <Link href="/dashboard/appointments">
                    <Button variant="primary" size="lg" className="px-10 rounded-full" icon={<Calendar size={18} />}>
                      View My Schedule
                    </Button>
                  </Link>
                </Card>
              )}

              {/* Error state */}
              {payState === "error" && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4 text-red-400 animate-in shake-1 duration-500">
                  <X className="shrink-0" />
                  <p className="text-xs font-black uppercase tracking-widest">Transaction link decapitated. Please reboot the process or contact hub support.</p>
                </div>
              )}

              <Card className="overflow-hidden" glass hover>
                {/* Doctor banner */}
                <div className="bg-gradient-to-r from-teal-500/20 to-indigo-600/20 px-8 py-8 flex items-center gap-6 border-b border-white/5 text-left">
                  <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white font-black text-4xl shrink-0 shadow-2xl">
                    {doctor.users.first_name?.charAt(0) || "D"}
                  </div>
                  <div className="flex-1 text-left">
                    <h2 className="text-2xl font-black text-white tracking-tighter">Dr. {doctorName}</h2>
                    <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{doctor.specialization}</p>
                    {doctor.clinics && (
                      <div className="flex items-center gap-2 mt-4 text-slate-500">
                         <div className="p-1 px-2.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                           <Building2 size={12} className="text-indigo-400" />
                           {doctor.clinics.name}
                         </div>
                         <p className="text-[10px] font-bold tracking-tight opacity-40">{doctor.clinics.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="p-8 space-y-8 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Date Trace", value: formatDate(appointment.appointment_date), icon: <Calendar size={18} />, color: "text-teal-400" },
                      { label: "Temporal Slot", value: formatTime(appointment.appointment_time), icon: <Clock size={18} />, color: "text-indigo-400" },
                      { label: "Duration", value: "60 minutes", icon: <Timer size={18} />, color: "text-sky-400" },
                      { label: "Logic", value: "In-person Protocol", icon: <Stethoscope size={18} />, color: "text-teal-400" },
                    ].map((item) => (
                      <div key={item.label} className="group flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all duration-300">
                        <div className={`mt-0.5 p-2 rounded-xl bg-white/5 border border-white/5 ${item.color} group-hover:scale-110 transition-transform`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">{item.label}</p>
                          <p className="text-sm font-black text-white tracking-tight">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {appointment.notes && (
                    <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-left">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">User Payload Notes</p>
                      <p className="text-sm font-bold text-slate-400 leading-relaxed italic">&quot;{appointment.notes}&quot;</p>
                    </div>
                  )}
                </div>
              </Card>
           </div>

           {/* Sidebar Price breakdown */}
           <div className="lg:col-span-4 space-y-8">
              <Card className="p-8 text-left" glass hover>
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                   <Lock size={14} className="text-teal-400" />
                   Security Protocol Checkout
                </h4>
                
                <div className="space-y-6 mb-10">
                  {[
                    { l: "Consul Fee", v: `₹${doctor.consultation_fee}`, bold: false },
                    { l: "Platform", v: "FREE", color: "text-teal-400", bold: true },
                    { l: "Network GST", v: "INCLUSIVE", bold: false },
                  ].map(({ l, v, color, bold }) => (
                    <div key={l} className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{l}</span>
                      <span className={`text-xs font-black tracking-widest ${color || "text-white"} ${bold ? "" : "opacity-60"}`}>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-white/5 text-left">
                   <div className="flex justify-between items-end mb-10">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Net Payable</p>
                      <p className="text-4xl font-black text-white tracking-tighter">₹{doctor.consultation_fee}</p>
                   </div>

                   {!alreadyConfirmed && payState !== "success" && (
                    <button
                      onClick={() => setShowModal(true)}
                      disabled={payState === "processing"}
                      className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-black text-sm uppercase tracking-widest
                        hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-teal-500/20
                        flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                    >
                      {payState === "processing" ? (
                        <><span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Syncing...</>
                      ) : (
                        <><Lock size={18} /> PAY</>
                      )}
                    </button>
                  )}
                </div>
              </Card>

              {/* Status & Trust */}
              <div className="space-y-4">
                 <div className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Status</span>
                    <Badge variant={appointment.status === "confirmed" ? "confirmed" : "pending"}>
                      {appointment.status === "pending" ? "Awaiting Signal" : appointment.status.toUpperCase()}
                    </Badge>
                 </div>
                 
                 <div className="p-6 space-y-4">
                    {["256-bit Encryption", "Instant Confirmation", "Secure Settlement"].map((t) => (
                      <div key={t} className="flex items-center gap-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-teal-500/40" />
                        {t}
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-xl shadow-teal-500/20">
            <span className="text-white font-black text-xs">PAY</span>
          </div>
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Matrix...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
