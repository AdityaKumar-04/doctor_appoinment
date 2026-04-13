"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function DoctorReviewsPage() {
  const { user, role } = useAuth();

  if (!user || role !== "doctor") return null;

  return (
    <>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Patient Reviews</h1>
          <p className="text-on-surface-variant font-medium">Read what patients are saying about their consultations.</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden mb-8 min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
        <span className="material-symbols-outlined text-6xl text-sky-200 mb-4 block">star_rate</span>
        <h2 className="text-2xl font-extrabold text-on-surface mb-2">Coming Soon</h2>
        <p className="text-on-surface-variant max-w-md mx-auto">
          We are currently gathering your patient reviews. Once enough data is collected, your ratings and feedback will appear here.
        </p>
      </div>
    </>
  );
}
