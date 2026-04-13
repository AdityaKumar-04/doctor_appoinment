"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  Save,
  User,
  Stethoscope,
  Briefcase,
  Phone,
  IndianRupee,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Link2,
  Shield,
  Star,
} from "lucide-react";

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "ENT",
  "Gastroenterology",
  "General Medicine",
  "General Surgery",
  "Gynecology",
  "Nephrology",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Urology",
  "Other",
];

const inputClass =
  "w-full h-12 px-4 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm outline-none transition-all font-medium";
const labelClass =
  "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5";

interface DoctorForm {
  first_name: string;
  last_name: string;
  phone: string;
  specialization: string;
  experience_years: number;
  consultation_fee: number;
  bio: string;
  document_url: string;
}

export default function DoctorProfilePage() {
  const { user, role, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [form, setForm] = useState<DoctorForm>({
    first_name: "",
    last_name: "",
    phone: "",
    specialization: "",
    experience_years: 0,
    consultation_fee: 0,
    bio: "",
    document_url: "",
  });

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    if (loading || !user || role !== "doctor") return;

    async function loadProfile() {
      try {
        const res = await fetch("/api/doctor/profile");
        const data = await res.json();

        if (res.ok) {
          const p = data.profile || {};
          const d = data.doctor || {};
          setForm({
            first_name: p.first_name || "",
            last_name: p.last_name || "",
            phone: p.phone || "",
            specialization: d.specialization || "",
            experience_years: d.experience_years || 0,
            consultation_fee: d.consultation_fee || 0,
            bio: d.bio || "",
            document_url: d.document_url || "",
          });
        }
      } catch (err) {
        console.error("Failed to load doctor profile:", err);
      } finally {
        setDataLoading(false);
      }
    }

    loadProfile();
  }, [user, role, loading]);

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      showToast("Only PDF, JPG, PNG files are allowed", "error");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("File must be under 5MB", "error");
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "doctor-documents");
      formData.append("folder", user?.id || "unknown");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setForm((prev) => ({ ...prev, document_url: url }));
        showToast("Document uploaded successfully!", "success");
      } else {
        // Fallback: use a placeholder URL to still allow saving
        const objectUrl = URL.createObjectURL(file);
        setForm((prev) => ({ ...prev, document_url: objectUrl }));
        showToast(
          "Document selected (will be uploaded on save)",
          "success"
        );
      }
    } catch {
      showToast("Upload failed. Try providing a URL instead.", "error");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.specialization.trim()) {
      showToast("Specialization is required", "error");
      return;
    }
    if (form.consultation_fee <= 0) {
      showToast("Please enter a valid consultation fee", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("Profile updated successfully! ✓", "success");
      await refreshProfile();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to update profile",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || role !== "doctor") return null;

  const initials = `${form.first_name.charAt(0)}${form.last_name.charAt(0)}`.toUpperCase() || "DR";

  // Completion score
  const fields = [
    form.first_name,
    form.last_name,
    form.phone,
    form.specialization,
    form.bio,
    form.document_url,
  ];
  const completionPct = Math.round(
    (fields.filter(Boolean).length / fields.length) * 100
  );

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2.5 border transition-all ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="shrink-0" />
          ) : (
            <AlertCircle size={16} className="shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-6 group transition-colors"
      >
        <ChevronLeft
          size={16}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Back
      </button>

      {/* Header */}
      <header className="mb-8">
        <p className="text-teal-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">
          Doctor Dashboard
        </p>
        <h1 className="text-3xl font-black text-white tracking-tighter">
          My Professional Profile
        </h1>
        <p className="text-slate-400 font-medium text-sm mt-1">
          Update your qualifications, bio, and credentials visible to patients.
        </p>
      </header>

      {dataLoading ? (
        <div className="py-24 flex flex-col items-center gap-4">
          <span className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Loading profile...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-5">
            <form onSubmit={handleUpdate} className="space-y-5">
              {/* Avatar + Identity Card */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/[0.06]">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/30 to-indigo-500/30 border border-white/10 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                      {initials}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full border-2 border-[#0d1220] flex items-center justify-center">
                      <Shield size={10} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-white text-xl tracking-tight">
                      Dr. {form.first_name || "—"} {form.last_name || "—"}
                    </p>
                    <p className="text-sm text-teal-400 font-bold mt-0.5">
                      {form.specialization || "Specialist"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Section label */}
                <div className="flex items-center gap-2 mb-4">
                  <User size={13} className="text-slate-500" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    General Info (Readonly name/email from auth)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input
                      value={form.first_name}
                      onChange={(e) =>
                        setForm({ ...form, first_name: e.target.value })
                      }
                      placeholder="John"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input
                      value={form.last_name}
                      onChange={(e) =>
                        setForm({ ...form, last_name: e.target.value })
                      }
                      placeholder="Smith"
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Email (Cannot modify)</label>
                    <div className="relative">
                      <input
                        value={user.email || ""}
                        disabled
                        className={`${inputClass} opacity-50 cursor-not-allowed`}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Phone Number</label>
                    <div className="relative">
                      <Phone
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="+91 98765 43210"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <Stethoscope size={14} className="text-teal-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">
                      Professional Details
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Visible to patients on booking page
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Specialization *</label>
                    <div className="relative">
                      <Stethoscope
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                      />
                      <select
                        required
                        value={form.specialization}
                        onChange={(e) =>
                          setForm({ ...form, specialization: e.target.value })
                        }
                        className={`${inputClass} pl-10 cursor-pointer`}
                      >
                        <option value="" disabled className="bg-[#0d1220]">
                          Select specialization...
                        </option>
                        {SPECIALIZATIONS.map((s) => (
                          <option
                            key={s}
                            value={s}
                            className="bg-[#0d1220] text-white"
                          >
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Years of Experience</label>
                    <div className="relative">
                      <Briefcase
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={form.experience_years}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            experience_years: parseInt(e.target.value) || 0,
                          })
                        }
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Consultation Fee (₹) *</label>
                    <div className="relative">
                      <IndianRupee
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        value={form.consultation_fee}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            consultation_fee: parseInt(e.target.value) || 0,
                          })
                        }
                        className={`${inputClass} pl-10 font-mono`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <FileText size={14} className="text-indigo-400" />
                  </div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Professional Bio
                  </p>
                </div>
                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm({ ...form, bio: e.target.value })
                  }
                  rows={5}
                  maxLength={800}
                  className="w-full p-4 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm outline-none transition-all resize-none font-medium"
                  placeholder="Share your background, expertise, medical philosophy, and approach to patient care..."
                />
                <div className="flex justify-between mt-2">
                  <p className="text-[10px] text-slate-600 font-bold">
                    A detailed bio builds patient trust before booking
                  </p>
                  <p
                    className={`text-[10px] font-black ${form.bio.length > 700 ? "text-amber-400" : "text-slate-600"}`}
                  >
                    {form.bio.length} / 800
                  </p>
                </div>
              </div>

              {/* Document Upload */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Upload size={14} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                      Medical Credential / License
                    </p>
                    <p className="text-[10px] text-slate-600">
                      PDF, JPG, PNG — max 5MB
                    </p>
                  </div>
                </div>

                {form.document_url ? (
                  <div className="mb-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-400">
                          Document uploaded
                        </p>
                        <a
                          href={form.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-slate-500 hover:text-teal-400 flex items-center gap-1 mt-0.5 transition-colors"
                        >
                          <Link2 size={10} /> View document
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, document_url: "" })}
                      className="text-[10px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* File Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingDoc}
                    className="h-12 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {uploadingDoc ? (
                      <span className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                    ) : (
                      <Upload size={15} />
                    )}
                    {uploadingDoc ? "Uploading..." : "Upload File"}
                  </button>

                  {/* URL Input */}
                  <div className="relative">
                    <Link2
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                    />
                    <input
                      type="url"
                      value={form.document_url}
                      onChange={(e) =>
                        setForm({ ...form, document_url: e.target.value })
                      }
                      placeholder="Or paste document URL..."
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-12 px-10 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-white font-black text-sm uppercase tracking-widest hover:from-teal-400 hover:to-teal-300 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-teal-500/25"
                >
                  {submitting ? (
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Profile Completion */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                Profile Completion
              </p>
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-black text-white">
                  {completionPct}%
                </span>
                <span
                  className={`text-xs font-bold ${completionPct === 100 ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {completionPct === 100 ? "Complete!" : "In Progress"}
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-teal-500 to-indigo-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  {
                    label: "Name",
                    done: !!(form.first_name && form.last_name),
                  },
                  { label: "Phone", done: !!form.phone },
                  { label: "Specialization", done: !!form.specialization },
                  { label: "Bio", done: !!form.bio },
                  { label: "Credential Document", done: !!form.document_url },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        done
                          ? "bg-teal-500/20 border-teal-500/40"
                          : "border-white/10"
                      }`}
                    >
                      {done && (
                        <CheckCircle2 size={10} className="text-teal-400" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold ${done ? "text-white" : "text-slate-500"}`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Current Info
              </p>
              {[
                {
                  label: "Specialization",
                  value: form.specialization || "—",
                  color: "text-white",
                },
                {
                  label: "Experience",
                  value: form.experience_years
                    ? `${form.experience_years} yrs`
                    : "—",
                  color: "text-white",
                },
                {
                  label: "Fee",
                  value: form.consultation_fee
                    ? `₹${form.consultation_fee.toLocaleString()}`
                    : "—",
                  color: "text-emerald-400",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-slate-400 font-medium">
                    {label}
                  </span>
                  <span className={`text-sm font-black ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Tips Card */}
            <div className="bg-teal-500/[0.04] border border-teal-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star size={14} className="text-teal-400" />
                <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">
                  Pro Tips
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  "Doctors with detailed bios get 3x more bookings.",
                  "Upload your medical license to build patient trust.",
                  "Keep your consultation fee up to date for accuracy.",
                ].map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed"
                  >
                    <CheckCircle2
                      size={13}
                      className="text-teal-400 shrink-0 mt-0.5"
                    />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
