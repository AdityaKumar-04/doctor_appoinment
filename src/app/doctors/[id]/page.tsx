"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  Star,
  ArrowLeft,
  CalendarCheck,
  Building2,
  Clock,
  Heart,
  Stethoscope,
  Award,
  MapPin,
  Phone,
  User,
  CheckCircle2,
} from "lucide-react";
import Badge from "@/components/ui/Badge";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  patient_name: string;
}

interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  experience_years: number;
  consultation_fee: number;
  bio: string;
  is_active: boolean;
  clinic_id: string | null;
  clinics: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  } | null;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
}

export default function DoctorProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<string | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/doctors/${params.id}`);
        const data = await res.json();
        if (res.ok && data.doctor) {
          setDoctor(data.doctor);
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating);
          setTotalReviews(data.totalReviews || 0);

          if (user) {
            const wRes = await fetch(`/api/wishlists/check?doctor_id=${data.doctor.id}`);
            if (wRes.ok) {
              const wData = await wRes.json();
              setIsWishlisted(wData.isWishlisted);
            }
          }
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id, user]);


  const handleBookClick = () => {
    const doctorId = doctor?.user_id || doctor?.id;
    if (!user) {
      router.push(`/login?next=/book/${doctorId}`);
    } else {
      router.push(`/book/${doctorId}`);
    }
  };

  const toggleWishlist = async () => {
    if (!user) return router.push(`/login?next=/doctors/${params.id}`);
    if (!doctor) return;
    setIsWishlisted(!isWishlisted);
    try {
      if (!isWishlisted) {
        await fetch("/api/wishlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doctor_id: doctor.id }),
        });
      } else {
        await fetch(`/api/wishlists?doctor_id=${doctor.id}`, { method: "DELETE" });
      }
    } catch (err) {
      console.error(err);
      setIsWishlisted(isWishlisted);
    }
  };


  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-xl shadow-teal-500/20">
            <Stethoscope className="text-white" size={28} />
          </div>
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (notFound || !doctor) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
          <User className="text-slate-600" size={36} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Doctor Not Found</h2>
        <Link href="/doctors" className="text-teal-400 font-bold hover:text-teal-300 transition-colors flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to Doctors
        </Link>
      </div>
    );
  }

  const { users, clinics } = doctor;

  return (
    <div className="bg-[#0b0f1a] min-h-screen text-white">
      {/* Glow Effect */}
      <div className="fixed top-0 left-1/4 w-[50%] h-[40%] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
      
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-0 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 relative">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-[11px] font-black uppercase tracking-widest mb-8 transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            All Doctors
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-teal-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center text-white font-black text-5xl shadow-2xl">
                {users.first_name?.charAt(0) || "D"}
              </div>
              {doctor.is_active && (
                <div className="absolute -bottom-2 -right-2 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Available
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-3">
                  {averageRating && (
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.round(parseFloat(averageRating)) ? "text-amber-400 fill-amber-400" : "text-slate-700"}
                        />
                      ))}
                      <span className="text-amber-400 font-black text-sm ml-1">{averageRating}</span>
                      <span className="text-slate-500 text-xs font-bold">({totalReviews} reviews)</span>
                    </div>
                  )}

                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
                    Dr. {users.first_name} {users.last_name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="teal" size="md">{doctor.specialization}</Badge>
                    <Badge variant="indigo" size="md">
                      <Clock size={11} className="mr-1" />
                      {doctor.experience_years}+ Years Exp
                    </Badge>
                  </div>

                  {clinics && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Building2 size={14} className="text-indigo-400" />
                      {clinics.name}
                      {clinics.address && <span className="text-slate-600">· {clinics.address}</span>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col gap-3 shrink-0">
                  <button
                    onClick={toggleWishlist}
                    className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                      isWishlisted
                        ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5"
                    }`}
                    title={isWishlisted ? "Remove from saved" : "Save Doctor"}
                  >
                    <Heart size={20} className={isWishlisted ? "fill-rose-400" : ""} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <section className="glass-card rounded-2xl p-8">
            <h2 className="text-lg font-black text-white tracking-tight mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <User size={16} className="text-teal-400" />
              </div>
              About Dr. {users.last_name}
            </h2>
            <p className="text-slate-400 leading-relaxed font-medium">
              {doctor.bio ||
                `Dr. ${users.first_name} ${users.last_name} is a dedicated ${doctor.specialization} specialist with ${doctor.experience_years}+ years of clinical experience. Committed to delivering empathetic, precision-focused care using the latest evidence-based practices.`}
            </p>
          </section>

          {/* Credentials */}
          <section className="glass-card rounded-2xl p-8">
            <h2 className="text-lg font-black text-white tracking-tight mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Award size={16} className="text-indigo-400" />
              </div>
              Board Certification
            </h2>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-indigo-600/10 border border-teal-500/15 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-32 h-32 border-4 border-white/5 rounded-full" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-teal-400/60 text-[10px] font-black uppercase tracking-widest mb-2">Certificate of Specialization</p>
                  <h3 className="text-2xl font-black text-white tracking-tight">Dr. {users.first_name} {users.last_name}</h3>
                  <p className="text-teal-400 text-sm font-bold mt-1">{doctor.specialization}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-teal-400" />
                </div>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section className="glass-card rounded-2xl p-8" id="reviews">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Star size={16} className="text-amber-400" />
                </div>
                Patient Reviews
                <span className="text-slate-500 font-medium text-sm">({totalReviews})</span>
              </h2>
              {role === "patient" && (
                <Link
                  href="/dashboard/appointments"
                  className="text-xs font-black text-teal-400 hover:text-teal-300 border border-teal-500/20 px-4 py-2 rounded-xl bg-teal-500/5 hover:bg-teal-500/10 transition-all uppercase tracking-widest"
                >
                  Review via Appointments →
                </Link>
              )}
            </div>

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-10 opacity-40">
                  <Star size={36} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-sm font-bold text-slate-500">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white text-sm">{r.patient_name}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={13} className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{r.comment}</p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Sticky */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-4">
            {/* Book Box */}
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Book a Consultation</p>
                <h3 className="text-xl font-black text-white tracking-tight">Dr. {users.first_name}</h3>
                <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wide">{doctor.specialization}</p>
              </div>

              <div className="flex items-end justify-between py-4 border-y border-white/5">
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Consultation Fee</p>
                  <p className="text-4xl font-black text-white tracking-tighter">₹{doctor.consultation_fee || "—"}</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {doctor.is_active ? "Available" : "Offline"}
                </div>
              </div>

              <button
                onClick={handleBookClick}
                disabled={!doctor.is_active}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-teal-500/20 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <CalendarCheck size={18} />
                Book Appointment
              </button>
            </div>

            {/* Clinic Info */}
            {clinics && (
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <Building2 size={16} className="text-teal-400" />
                  Clinic Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-black text-white text-sm">{clinics.name}</p>
                  </div>
                  {clinics.address && (
                    <div className="flex items-start gap-2 text-slate-400 text-xs font-bold">
                      <MapPin size={12} className="text-indigo-400 mt-0.5 shrink-0" />
                      {clinics.address}
                    </div>
                  )}
                  {clinics.phone && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                      <Phone size={12} className="text-teal-400 shrink-0" />
                      {clinics.phone}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trust */}
            <div className="p-5 space-y-3">
              {["Free cancellation 24h prior", "Instant booking confirmation", "Secure & encrypted"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  <CheckCircle2 size={12} className="text-teal-500/40" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
