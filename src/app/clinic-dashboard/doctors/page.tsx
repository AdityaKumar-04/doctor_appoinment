"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, Stethoscope, Plus, Users, Activity, Star, Mail, Phone, Briefcase, DollarSign, X } from "lucide-react";

interface Doctor {
  id: string;
  specialization: string;
  experience_years: number;
  consultation_fee: number | null;
  bio: string | null;
  is_active: boolean;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
}

interface AddDoctorForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialization: string;
  experience_years: number;
}

const EMPTY_FORM: AddDoctorForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  specialization: "",
  experience_years: 0,
};

export default function ClinicDoctorsPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddDoctorForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDoctors = useCallback(async () => {
    try {
      const res = await fetch("/api/clinic/doctors");
      const data = await res.json();
      if (res.ok) setDoctors(data.doctors || []);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading || !user || role !== "clinic") return;
    loadDoctors();
  }, [user, role, loading, loadDoctors]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/clinic/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Dr. ${form.first_name} ${form.last_name} added! Credentials emailed.`, "success");
      setShowModal(false);
      setForm(EMPTY_FORM);
      loadDoctors();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to add doctor", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  if (loading || dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <span className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Loading team...</p>
      </div>
    );
  }

  if (!user || role !== "clinic") return null;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          <span className="material-symbols-outlined text-base">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1220] border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-white">Add New Doctor</h3>
                <p className="text-sm text-slate-500 mt-1">Login credentials will be emailed automatically.</p>
              </div>
              <button 
                onClick={closeModal} 
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">First Name *</label>
                  <input
                    required value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="John"
                    className="w-full h-11 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Last Name *</label>
                  <input
                    required value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Smith"
                    className="w-full h-11 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Work Email *</label>
                <input
                  required type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="doctor@clinic.com"
                  className="w-full h-11 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Phone</label>
                <input
                  type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Specialization *</label>
                <input
                  required value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  placeholder="e.g. Cardiology, Pediatrics"
                  className="w-full h-11 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Years of Experience</label>
                <input
                  type="number" min="0" max="60" value={form.experience_years}
                  onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })}
                  className="w-full h-11 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 h-11 rounded-xl bg-white/[0.05] border border-white/10 text-slate-400 font-bold text-sm hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 h-11 rounded-xl bg-teal-500 text-white font-bold text-sm hover:bg-teal-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Plus size={16} /> Add Doctor</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-6 group transition-colors"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-teal-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Medical Team</p>
          <h1 className="text-3xl font-black text-white tracking-tighter">Manage Doctors</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Add and manage your clinic&apos;s medical specialists.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:bg-teal-400 active:scale-95 transition-all"
        >
          <Plus size={18} />
          Add Doctor
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Doctors", value: doctors.length, icon: <Users size={16} />, color: "text-teal-400", bg: "border-teal-500/30 bg-teal-500/[0.05]" },
          { label: "Active", value: doctors.filter(d => d.is_active).length, icon: <Activity size={16} />, color: "text-emerald-400", bg: "border-emerald-500/30 bg-emerald-500/[0.05]" },
          { label: "Specialities", value: new Set(doctors.map(d => d.specialization)).size, icon: <Star size={16} />, color: "text-sky-400", bg: "border-sky-500/30 bg-sky-500/[0.05]" },
        ].map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-5 ${stat.bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${stat.color}`}>
              {stat.icon}
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
            </div>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value.toString().padStart(2, "0")}</p>
          </div>
        ))}
      </div>

      {/* Doctors Grid */}
      {doctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white/[0.02] border border-white/8 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
            <Stethoscope size={28} className="text-teal-400" />
          </div>
          <h3 className="text-lg font-black text-white mb-2">No Doctors Yet</h3>
          <p className="text-slate-500 text-sm mb-6">Add your first specialist to start managing your clinical team.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-400 transition-all"
          >
            <Plus size={18} /> Add First Doctor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {doctors.map((doctor) => (
            <div 
              key={doctor.id} 
              className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/15 hover:scale-[1.01] transition-all duration-300 group"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-black flex items-center justify-center text-lg shrink-0 uppercase">
                  {doctor.users.first_name.charAt(0)}{doctor.users.last_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-white text-sm truncate">
                    Dr. {doctor.users.first_name} {doctor.users.last_name}
                  </h3>
                  <p className="text-xs text-teal-400 font-bold mt-0.5">{doctor.specialization}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                  doctor.is_active 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                }`}>
                  {doctor.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail size={13} className="text-slate-600 shrink-0" />
                  <span className="truncate text-xs">{doctor.users.email}</span>
                </div>
                {doctor.users.phone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={13} className="text-slate-600 shrink-0" />
                    <span className="text-xs">{doctor.users.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400">
                  <Briefcase size={13} className="text-slate-600 shrink-0" />
                  <span className="text-xs">{doctor.experience_years} yrs experience</span>
                </div>
                {doctor.consultation_fee && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <DollarSign size={13} className="text-slate-600 shrink-0" />
                    <span className="text-xs">₹{doctor.consultation_fee} / session</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
