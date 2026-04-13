"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  experience_years: number;
  consultation_fee: number;
  bio: string;
  is_active: boolean;
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  specializations: string[];
  is_active: boolean;
}

export default function ClinicDetailPage({ params }: { params: { id: string } }) {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClinic() {
      try {
        const res = await fetch(`/api/clinics/${params.id}`);
        const data = await res.json();
        if (data.clinic) setClinic(data.clinic);
        if (data.doctors) setDoctors(data.doctors);
      } catch (err) {
        console.error("Failed to fetch clinic:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClinic();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Loading clinic...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-surface">
        <span className="material-symbols-outlined text-6xl text-slate-300">local_hospital</span>
        <h2 className="text-2xl font-bold text-slate-600">Clinic Not Found</h2>
        <Link href="/clinics" className="text-teal-600 font-bold hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Clinics
        </Link>
      </div>
    );
  }

  const initials = clinic.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-slate-50 min-h-screen text-on-surface">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-0 bg-gradient-to-br from-teal-700 to-teal-900 text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-8 pb-14">
          <Link href="/clinics" className="inline-flex items-center gap-1.5 text-teal-200 hover:text-white text-sm font-semibold mb-6 transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            All Clinics
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Clinic Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white font-extrabold text-3xl backdrop-blur-sm border border-white/20 shadow-lg shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{clinic.name}</h1>
              <div className="flex flex-wrap gap-4 text-teal-100 text-sm">
                {clinic.address && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    {clinic.address}
                  </span>
                )}
                {clinic.phone && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">call</span>
                    {clinic.phone}
                  </span>
                )}
                {clinic.email && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">mail</span>
                    {clinic.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Specialty Tags */}
          {clinic.specializations && clinic.specializations.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {clinic.specializations.map((spec) => (
                <span key={spec} className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 border border-white/20 text-white backdrop-blur-sm">
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap gap-8">
          {[
            { label: "Doctors", value: doctors.length, icon: "stethoscope" },
            { label: "Specializations", value: clinic.specializations?.length || 0, icon: "medical_services" },
            { label: "Status", value: "Active", icon: "verified" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-teal-500" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              <div>
                <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                <p className="font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doctors Section */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Available Doctors</h2>
            <p className="text-slate-400 text-sm mt-1">
              {doctors.length} specialist{doctors.length !== 1 ? "s" : ""} at this clinic
            </p>
          </div>
        </div>

        {doctors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">person_off</span>
            <p className="text-slate-400 font-semibold">No doctors listed yet</p>
            <p className="text-slate-300 text-sm mt-1">Check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctors.map((doctor) => (
              <ClinicDoctorCard key={doctor.user_id || doctor.id} doctor={doctor} clinicName={clinic.name} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ClinicDoctorCard({ doctor, clinicName }: { doctor: Doctor; clinicName: string }) {
  const doctorId = doctor.user_id || doctor.id;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="p-6 flex gap-5 flex-1">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-extrabold text-xl shrink-0 shadow-md">
          {doctor.users?.first_name?.charAt(0) || "D"}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-0.5">
            Dr. {doctor.users?.first_name} {doctor.users?.last_name}
          </h3>
          <p className="text-teal-600 font-bold text-sm">{doctor.specialization}</p>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span className="material-symbols-outlined text-base text-slate-300">work</span>
              <span>{doctor.experience_years} yrs experience</span>
            </div>
            {doctor.consultation_fee && (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="material-symbols-outlined text-base text-slate-300">payments</span>
                <span>₹{doctor.consultation_fee} consultation fee</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span className="material-symbols-outlined text-base text-slate-300">local_hospital</span>
              <span className="truncate">{clinicName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-5 pt-0 flex gap-3">
        <Link
          href={`/doctors/${doctorId}`}
          className="flex-1 text-center py-2.5 rounded-xl border-2 border-teal-200 text-teal-700 font-bold text-sm hover:bg-teal-50 transition-all"
        >
          View Profile
        </Link>
        <Link
          href={`/book/${doctorId}`}
          className="flex-1 text-center py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 active:scale-[0.98] transition-all shadow-sm"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
