"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  ArrowLeft,
  CreditCard,
  XCircle,
  Building2,
  User,
  AlertCircle,
  CheckCircle2,
  Star,
  MessageSquare,
  Send,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface AppointmentDetail {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  created_at: string;
  patient_id: string;
  doctor_id: string;
  doctors?: {
    id: string;
    user_id: string;
    specialization: string;
    experience_years: number;
    consultation_fee: number;
    bio?: string;
    users?: {
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string | null;
    };
    clinics?: {
      id: string;
      name: string;
      address?: string;
      phone?: string;
    };
  };
  clinics?: { name: string; address?: string };
  payments?: {
    status: "pending" | "paid" | "failed" | "refunded";
    amount: number;
    payment_method?: string;
    created_at: string;
  }[];
}

/* ─── Helpers ───────────────────────────────────────────── */
const formatDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTime = (t: string) => {
  try {
    return new Date(`1970-01-01T${t}`).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return t;
  }
};

/* ─── Interactive Star Picker ───────────────────────────── */
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-125 p-0.5"
        >
          <Star
            size={26}
            className={
              n <= (hovered || value)
                ? "text-amber-400 fill-amber-400"
                : "text-slate-700"
            }
          />
        </button>
      ))}
      <span className="ml-2 text-amber-400 font-black text-sm">
        {value}/5
      </span>
    </div>
  );
}

/* ─── Review Section ────────────────────────────────────── */
function ReviewSection({
  appointment,
}: {
  appointment: AppointmentDetail;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Check if already reviewed
  useEffect(() => {
    fetch("/api/reviews/mine")
      .then((r) => r.json())
      .then((data) => {
        if (
          data.reviews?.some(
            (r: { appointment_id: string }) =>
              r.appointment_id === appointment.id
          )
        ) {
          setAlreadyReviewed(true);
        }
      })
      .catch(() => {});
  }, [appointment.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return setError("Please write a comment.");
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: appointment.id,
          doctor_id: appointment.doctors?.id,
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (appointment.status !== "completed") return null;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      {/* Header */}
      <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <Star size={14} className="text-amber-400" />
        Rate Your Experience
      </h2>

      {submitted || alreadyReviewed ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <div>
            <p className="font-black text-emerald-400 text-sm">
              {submitted ? "Review Submitted!" : "Already Reviewed"}
            </p>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              {submitted
                ? "Thank you for your feedback."
                : "You have already reviewed this appointment."}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {/* Auto-filled info banner */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-500/5 border border-teal-500/15 text-teal-400 text-[10px] font-black">
            <CheckCircle2 size={12} />
            Appointment auto-linked: #{appointment.id.slice(0, 8).toUpperCase()}
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Rating
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare size={11} /> Your Experience
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your consultation? Share your experience..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8 text-white text-sm font-medium focus:outline-none focus:border-teal-500/40 transition-all resize-none placeholder:text-slate-600"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-bold flex items-center gap-1.5">
              <AlertCircle size={12} /> {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={submitting}
            icon={<Send size={14} />}
            className="h-11 shadow-lg shadow-teal-500/10"
          >
            Submit Review
          </Button>
        </form>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function AppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/appointments/${params.id}`);
      const data = await res.json();
      if (res.ok && data.appointment) {
        setAppointment(data.appointment);
      } else {
        setErrorMsg(data.error || "Appointment not found.");
      }
    } catch {
      setErrorMsg("Failed to load appointment details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== "patient") return;
    fetchDetail();
  }, [authLoading, user, role, fetchDetail]);

  const handleCancel = async () => {
    if (!appointment) return;
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        setAppointment((prev) =>
          prev ? { ...prev, status: "cancelled" } : prev
        );
      } else {
        alert("Failed to cancel. Please try again.");
      }
    } catch {
      alert("An error occurred. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  /* ── States ── */
  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-xl shadow-teal-500/20">
          <Calendar className="text-white" size={26} />
        </div>
        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">
          Loading appointment...
        </p>
      </div>
    );
  }

  if (errorMsg || !appointment) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
          <AlertCircle className="text-slate-600" size={36} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Appointment Not Found
          </h2>
          <p className="text-slate-500 text-sm font-bold max-w-sm">
            {errorMsg || "This appointment does not exist or you do not have access to it."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-2 text-teal-400 font-bold hover:text-teal-300 transition-colors text-sm border border-teal-500/20 px-4 py-2 rounded-xl hover:bg-teal-500/5"
          >
            <ArrowLeft size={16} />
            My Appointments
          </Link>
          <button
            onClick={fetchDetail}
            className="text-slate-400 font-bold hover:text-white transition-colors text-sm border border-white/8 px-4 py-2 rounded-xl hover:bg-white/5"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived ── */
  const doctor = appointment.doctors;
  const doctorName = doctor
    ? `Dr. ${doctor.users?.first_name || ""} ${doctor.users?.last_name || ""}`.trim()
    : "Unknown Doctor";
  const clinic = appointment.clinics || doctor?.clinics;
  const isPaid = appointment.payments?.some((p) => p.status === "paid");
  const canCancel = ["pending", "confirmed"].includes(appointment.status);
  const canPay = appointment.status === "pending" && !isPaid;

  return (
    <div className="page-enter space-y-6 max-w-2xl text-left">

      {/* Back + Title */}
      <div className="space-y-3">
        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-[11px] font-black uppercase tracking-widest transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          All Appointments
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 space-y-1">
            <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em]">
              Appointment Record
            </p>
            <h1 className="text-3xl font-black text-white tracking-tighter">{doctorName}</h1>
          </div>
          <Badge
            variant={appointment.status as "pending" | "confirmed" | "cancelled" | "completed"}
            size="md"
          >
            {appointment.status}
          </Badge>
        </div>
      </div>

      {/* Date & Time Banner */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 border border-white/8">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Calendar size={22} className="text-teal-400" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Date</p>
            <p className="text-white font-black text-base tracking-tight">{formatDate(appointment.appointment_date)}</p>
          </div>
        </div>
        <div className="h-10 w-px bg-white/5 hidden sm:block" />
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Clock size={22} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Time</p>
            <p className="text-white font-black text-base tracking-tight">{formatTime(appointment.appointment_time)}</p>
          </div>
        </div>
      </div>

      {/* Doctor Info */}
      {doctor && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Stethoscope size={13} className="text-teal-400" /> Doctor Information
          </h2>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center text-2xl font-black text-white shrink-0">
              {doctor.users?.first_name?.charAt(0) || "D"}
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-black text-white tracking-tight">{doctorName}</h3>
              <p className="text-sm font-bold text-teal-400">{doctor.specialization}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {doctor.experience_years}+ Years Experience
              </p>
              {/* {doctor.users?.phone && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold pt-1">
                  <Phone size={11} className="text-indigo-400" />
                  {doctor.users.phone}
                </div>
              )} */}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Fee</p>
              <p className="text-2xl font-black text-white tracking-tight">₹{doctor.consultation_fee}</p>
            </div>
          </div>
        </div>
      )}

      {/* Clinic */}
      {clinic && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Building2 size={13} className="text-indigo-400" /> Clinic
          </h2>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-indigo-400" />
            </div>
            <div>
              <p className="font-black text-white text-sm">{clinic.name}</p>
              {clinic.address && (
                <div className="flex items-start gap-1.5 text-slate-400 text-xs font-bold mt-1.5">
                  <MapPin size={11} className="text-slate-500 shrink-0 mt-0.5" />
                  {clinic.address}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {appointment.notes && (
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</h2>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">{appointment.notes}</p>
        </div>
      )}

      {/* Payment */}
      {/* <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <CreditCard size={13} className="text-teal-400" /> Payment Status
        </h2>
        {isPaid ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-black text-emerald-400 text-sm">Payment Confirmed</p>
              <p className="text-xs text-slate-500 font-bold">₹{appointment.payments?.[0]?.amount} paid</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <AlertCircle size={18} className="text-amber-400 shrink-0" />
            <div>
              <p className="font-black text-amber-400 text-sm">Payment Pending</p>
              <p className="text-xs text-slate-500 font-bold">Complete payment to confirm your slot</p>
            </div>
          </div>
        )}
      </div> */}

      {/* Meta */}
      <div className="flex items-center gap-2 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
        <User size={10} />
        ID: {appointment.id.slice(0, 8).toUpperCase()}
        <span className="mx-2 opacity-40">·</span>
        Booked {new Date(appointment.created_at).toLocaleDateString("en-IN")}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {canPay && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<CreditCard size={18} />}
            onClick={() => router.push(`/checkout?appointmentId=${appointment.id}`)}
            className="shadow-xl shadow-teal-500/10"
          >
            Pay Now — ₹{doctor?.consultation_fee}
          </Button>
        )}
        {canCancel && (
          <Button
            variant="danger"
            size="lg"
            fullWidth={!canPay}
            icon={<XCircle size={18} />}
            loading={cancelling}
            onClick={handleCancel}
          >
            Cancel Appointment
          </Button>
        )}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => router.push(`/book/${doctor?.user_id || doctor?.id}`)}
          className="border border-white/5 hover:border-white/10"
        >
          Book Again
        </Button>
      </div>

      {/* ── Review Section (only for completed appointments) ── */}
      <ReviewSection appointment={appointment} />
    </div>
  );
}
