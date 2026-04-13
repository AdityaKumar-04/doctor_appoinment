"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle,
  AlertCircle,
  Calendar,
  Heart,
  Shield,
  Sparkles,
} from "lucide-react";

interface PatientProfileState {
  full_name: string;
  phone: string;
  gender: string;
  dob: string;
  address: string;
  city: string;
  pincode: string;
  blood_group: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["male", "female", "other", "prefer_not_to_say"];

const inputClass =
  "w-full h-12 px-4 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all text-sm font-medium";
const labelClass =
  "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5";

const EMPTY_FORM: PatientProfileState = {
  full_name: "",
  phone: "",
  gender: "",
  dob: "",
  address: "",
  city: "",
  pincode: "",
  blood_group: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

export default function PatientProfilePage() {
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState<PatientProfileState>(EMPTY_FORM);
  const [userEmail, setUserEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const set = (field: keyof PatientProfileState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Load profile from patient_profiles table
  useEffect(() => {
    if (authLoading || !user) return;

    async function loadProfile() {
      try {
        const res = await fetch("/api/patient/profile");
        const data = await res.json();

        if (res.ok) {
          const p = data.profile || {};
          setUserEmail(data.user?.email || user?.email || "");
          setForm({
            full_name: p.full_name || "",
            phone: p.phone || "",
            gender: p.gender || "",
            dob: p.dob || "",
            address: p.address || "",
            city: p.city || "",
            pincode: p.pincode || "",
            blood_group: p.blood_group || "",
            emergency_contact_name: p.emergency_contact_name || "",
            emergency_contact_phone: p.emergency_contact_phone || "",
          });
        }
      } catch (err) {
        console.error("Failed to load patient profile:", err);
      } finally {
        setDataLoading(false);
      }
    }

    loadProfile();
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/patient/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      showToast("Profile updated successfully! ✓", "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // Calculate completion
  const completionFields = [
    { field: form.full_name, label: "Full Name" },
    { field: form.phone, label: "Phone" },
    { field: form.gender, label: "Gender" },
    { field: form.dob, label: "Date of Birth" },
    { field: form.blood_group, label: "Blood Group" },
    { field: form.address, label: "Address" },
    { field: form.city, label: "City" },
    { field: form.emergency_contact_name, label: "Emergency Contact" },
    { field: form.emergency_contact_phone, label: "Emergency Phone" },
  ];
  const filled = completionFields.filter((f) => !!f.field).length;
  const totalFields = completionFields.length;
  const pct = Math.round((filled / totalFields) * 100);

  const initials = form.full_name
    ? form.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("")
    : "U";

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-600/20 flex items-center justify-center border border-white/10">
          <User className="text-teal-400" size={22} />
        </div>
        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm border transition-all ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {toast.msg}
        </div>
      )}

      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <header>
          <p className="text-teal-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">
            Account
          </p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            My Profile
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">
            Complete your health profile for a better experience
          </p>
        </header>

        {/* Avatar + Progress Card */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-5 mb-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/30 to-indigo-600/30 border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0d1220] rounded-full border border-white/5 flex items-center justify-center">
                <div
                  className={`w-3 h-3 rounded-full ${pct === 100 ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
                />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {form.full_name || "Complete your profile"}
              </h2>
              <p className="text-sm font-bold text-teal-400 uppercase tracking-widest mt-0.5">
                Patient
              </p>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mt-1.5">
                <Mail size={11} />
                {userEmail}
              </div>
            </div>

            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                pct === 100
                  ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/5 border-amber-500/15 text-amber-400"
              }`}
            >
              <Shield size={12} />
              {pct === 100 ? "Complete" : `${pct}% Done`}
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Profile Completion
              </span>
              <span
                className={`text-[10px] font-black ${pct === 100 ? "text-emerald-400" : "text-amber-400"}`}
              >
                {filled}/{totalFields} fields filled
              </span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  pct === 100
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-teal-500 to-indigo-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct < 100 && (
              <p className="text-[10px] text-slate-600 mt-1.5 font-medium">
                Missing:{" "}
                {completionFields
                  .filter((f) => !f.field)
                  .map((f) => f.label)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Personal Info Form */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <User size={14} className="text-teal-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                Personal Information
              </h2>
              <p className="text-[10px] text-slate-500">
                Basic details and contact info
              </p>
            </div>
          </div>

          {/* Email (readonly) */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <Mail size={15} className="text-teal-400" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Email (cannot change)
              </p>
              <p className="text-sm font-bold text-slate-400 mt-0.5">
                {userEmail}
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Full Name *</label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
              />
              <input
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="John Doe"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Date of Birth</label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                />
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className={`${inputClass} pl-10 text-white [color-scheme:dark]`}
                />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className={labelClass}>Gender</label>
            <div className="flex gap-2.5 flex-wrap">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => set("gender", g)}
                  className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                    form.gender === g
                      ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                      : "bg-white/[0.03] text-slate-500 border-white/5 hover:text-slate-300 hover:border-white/10"
                  }`}
                >
                  {g.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <MapPin size={14} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Address</h2>
              <p className="text-[10px] text-slate-500">
                Where can you be reached?
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Street Address</label>
            <div className="relative">
              <MapPin
                size={14}
                className="absolute left-3.5 top-3.5 text-slate-600"
              />
              <textarea
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                rows={2}
                placeholder="123 Main Street, Apartment 4B..."
                className="w-full p-4 pl-10 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all text-sm font-medium resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>City</label>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Mumbai"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Pincode</label>
              <input
                value={form.pincode}
                onChange={(e) => set("pincode", e.target.value)}
                placeholder="400001"
                maxLength={6}
                pattern="\d{6}"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Health Info */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Heart size={14} className="text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Health Info</h2>
              <p className="text-[10px] text-slate-500">
                Critical info for medical emergencies
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Blood Group</label>
            <div className="flex gap-2.5 flex-wrap">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => set("blood_group", bg)}
                  className={`w-14 h-12 rounded-xl text-sm font-black transition-all border ${
                    form.blood_group === bg
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : "bg-white/[0.03] text-slate-500 border-white/5 hover:text-slate-300 hover:border-white/10"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Shield size={14} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                Emergency Contact
              </h2>
              <p className="text-[10px] text-slate-500">
                Who should we contact in an emergency?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contact Name</label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                />
                <input
                  value={form.emergency_contact_name}
                  onChange={(e) => set("emergency_contact_name", e.target.value)}
                  placeholder="Jane Doe"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Contact Phone</label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                />
                <input
                  type="tel"
                  value={form.emergency_contact_phone}
                  onChange={(e) =>
                    set("emergency_contact_phone", e.target.value)
                  }
                  placeholder="+91 99999 00000"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-12 px-10 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-white font-black text-sm uppercase tracking-widest hover:from-teal-400 hover:to-teal-300 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-teal-500/20"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={16} />
                Save Profile
              </>
            )}
          </button>

          {pct === 100 && (
            <div className="flex items-center gap-2 px-4 h-12 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-xs font-black uppercase tracking-widest">
              <Sparkles size={14} />
              Profile Complete!
            </div>
          )}
        </div>
      </div>
    </>
  );
}
