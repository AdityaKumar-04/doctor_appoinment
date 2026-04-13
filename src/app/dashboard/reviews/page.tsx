"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Star,
  MessageSquare,
  Stethoscope,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  doctor_id: string;
  appointment_id: string;
  doctors?: {
    specialization: string;
    users?: {
      first_name: string;
      last_name: string;
    };
  };
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? "text-amber-400 fill-amber-400" : "text-slate-700"}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      // No dedicated GET /api/reviews for patient — use appointments to derive or add a patient reviews endpoint
      // Use the generic appointments endpoint and cross-reference reviews from doctor API
      const res = await fetch("/api/reviews/mine");
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchReviews();
  }, [user, fetchReviews]);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (!user) return null;

  return (
    <div className="page-enter space-y-8 text-left max-w-2xl">
      {/* Header */}
      <header className="space-y-1.5">
        <p className="text-amber-400 text-[11px] font-black uppercase tracking-[0.2em]">Feedback History</p>
        <h1 className="text-4xl font-black text-white tracking-tighter">My Reviews</h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
          {loading ? "Loading..." : `${reviews.length} reviews submitted`}
        </p>
      </header>

      {/* Stats Banner */}
      {!loading && reviews.length > 0 && (
        <div className="glass-card rounded-2xl p-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl font-black text-white">
            {avgRating}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">My Average Rating</p>
            <StarRow rating={Math.round(parseFloat(avgRating || "0"))} size={16} />
            <p className="text-xs font-bold text-slate-500 mt-1">{reviews.length} reviews total</p>
          </div>
        </div>
      )}

      {/* Review Cards */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-2.5 bg-white/5 rounded w-1/3" />
                </div>
              </div>
              <div className="h-2.5 bg-white/5 rounded w-full" />
              <div className="h-2.5 bg-white/5 rounded w-3/4" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="glass-card rounded-2xl py-24 flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <Star size={36} className="text-slate-700" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight mb-2">No Reviews Yet</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">
                Complete an appointment and leave a review on the doctor page
              </p>
            </div>
            <Link href="/doctors">
              <Button variant="outline" icon={<Stethoscope size={16} />}>
                Find Doctors
              </Button>
            </Link>
          </div>
        ) : (
          reviews.map((r) => {
            const docName = r.doctors
              ? `Dr. ${r.doctors.users?.first_name || ""} ${r.doctors.users?.last_name || ""}`.trim()
              : "Unknown Doctor";
            return (
              <div key={r.id} className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Star size={18} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-white text-sm tracking-tight">{docName}</h3>
                        {r.doctors?.specialization && (
                          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mt-0.5">
                            {r.doctors.specialization}
                          </p>
                        )}
                      </div>
                      <StarRow rating={r.rating} />
                    </div>
                  </div>
                </div>

                {r.comment && (
                  <div className="flex items-start gap-2 pl-14">
                    <MessageSquare size={12} className="text-slate-600 mt-0.5 shrink-0" />
                    <p className="text-slate-400 text-xs leading-relaxed font-medium">{r.comment}</p>
                  </div>
                )}

                <div className="pl-14 flex items-center gap-3">
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
