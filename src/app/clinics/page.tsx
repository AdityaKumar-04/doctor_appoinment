"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  specializations: string[];
  is_active: boolean;
  doctors?: { count: number }[];
}

const SPECIALIZATION_TAGS = [
  "Cardiology", "Dermatology", "Neurology", "Pediatrics",
  "Orthopedics", "General Practice", "Psychiatry", "Oncology",
];

function ClinicCard({ clinic, doctorCount }: { clinic: Clinic; doctorCount: number }) {
  const initials = clinic.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const specializations = clinic.specializations?.slice(0, 3) || [];

  return (
    <div className="group bg-dark-card rounded-2xl border border-dark-border hover:border-teal-500/40 hover:shadow-dark-xl hover:shadow-teal-500/5 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Gradient top bar */}
      <div className="h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-teal-glow shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-text-primary font-extrabold text-base leading-tight truncate">{clinic.name}</h2>
            {doctorCount > 0 && (
              <p className="text-teal-400 text-xs font-semibold mt-0.5">
                {doctorCount} doctor{doctorCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4 flex-1">
          {clinic.address && (
            <div className="flex items-start gap-2 text-text-muted text-sm">
              <span className="material-symbols-outlined text-base mt-0.5 shrink-0 text-teal-400" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              <span className="line-clamp-2">{clinic.address}</span>
            </div>
          )}
          {clinic.phone && (
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <span className="material-symbols-outlined text-base shrink-0 text-teal-400" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
              <span>{clinic.phone}</span>
            </div>
          )}
          {specializations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {specializations.map((spec) => (
                <span
                  key={spec}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 text-[10px] font-bold border border-dark-border"
                >
                  {spec}
                </span>
              ))}
              {(clinic.specializations?.length ?? 0) > 3 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-400 text-[10px] font-bold">
                  +{(clinic.specializations?.length ?? 0) - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/clinics/${clinic.id}`}
          className="mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-400 font-bold text-sm
            hover:bg-teal-500 hover:text-white hover:border-transparent hover:shadow-teal-glow
            group-hover:bg-teal-500/20 active:scale-[0.98] transition-all duration-200"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
          View Doctors
        </Link>
      </div>
    </div>
  );
}

export default function ClinicsPage() {
  const [search, setSearch] = useState("");
  const [activeSpec, setActiveSpec] = useState<string | null>(null);

  const { data, isLoading } = useSWR("/api/clinics", fetcher);
  const clinics: Clinic[] = data?.clinics || [];
  const loading = isLoading;

  const filtered = clinics.filter((c) => {
    const matchesSearch =
      !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase());
    const matchesSpec =
      !activeSpec ||
      (c.specializations && c.specializations.includes(activeSpec));
    return matchesSearch && matchesSpec;
  });

  const getDoctorCount = (clinic: Clinic) => {
    if (!clinic.doctors || clinic.doctors.length === 0) return 0;
    return (clinic.doctors[0] as { count?: number }).count ?? 0;
  };

  return (
    <div className="bg-dark-bg min-h-screen text-text-primary">
      <Navbar />

      {/* Hero Banner */}
      <section className="pt-24 pb-14 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
            Healthcare Network
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-text-primary">
            Find a Clinic{" "}
            <span className="gradient-text-teal">Near You</span>
          </h1>
          <p className="text-text-muted text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Browse our network of verified clinics, each staffed with expert specialists ready to provide you with premium care.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by clinic name or location..."
              className="w-full h-14 pl-12 pr-5 rounded-2xl bg-dark-card border border-dark-border text-text-primary font-medium placeholder:text-text-subtle focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 shadow-dark-lg transition-all"
            />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        {/* Specialization Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveSpec(null)}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all cursor-pointer ${
              !activeSpec
                ? "bg-teal-500 text-white border-teal-500 shadow-teal-glow"
                : "bg-dark-card text-text-muted border-dark-border hover:border-teal-500/40 hover:text-teal-400"
            }`}
          >
            All Specialties
          </button>
          {SPECIALIZATION_TAGS.map((spec) => (
            <button
              key={spec}
              onClick={() => setActiveSpec(activeSpec === spec ? null : spec)}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all cursor-pointer ${
                activeSpec === spec
                  ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
                  : "bg-dark-card text-text-muted border-dark-border hover:border-teal-500/40 hover:text-teal-400"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-text-muted font-medium text-sm">
            {loading ? "Loading..." : `${filtered.length} clinic${filtered.length !== 1 ? "s" : ""} found`}
          </p>
          {(search || activeSpec) && (
            <button
              onClick={() => { setSearch(""); setActiveSpec(null); }}
              className="text-xs text-text-subtle hover:text-text-muted transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">close</span>
              Clear filters
            </button>
          )}
        </div>

        {/* Clinic Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} rows={3} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-4xl text-slate-600">local_hospital</span>
            </div>
            <p className="font-bold text-text-muted text-lg mb-2">No clinics found</p>
            <p className="text-text-subtle text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} doctorCount={getDoctorCount(clinic)} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
