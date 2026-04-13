"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  Building2,
  Phone,
  MapPin,
  CheckCircle,
  CheckCircle2,
  Clock,
  Mail,
  Save,
  AlertCircle,
  Shield,
  Lock,
} from "lucide-react";

interface ClinicData {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  medical_license: string | null;
  license_verified: boolean | null;
}

const inputClass =
  "w-full h-12 px-4 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all text-sm font-medium";
const labelClass =
  "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5";
const readonlyClass =
  "w-full h-12 px-4 rounded-xl bg-white/[0.02] border border-white/5 text-slate-500 text-sm font-medium cursor-not-allowed select-none";

export default function ClinicProfilePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    if (loading || !user || role !== "clinic") return;

    async function loadProfile() {
      try {
        const res = await fetch("/api/clinic/profile");
        const data = await res.json();
        if (res.ok && data.clinic) {
          setClinic(data.clinic);
          setForm({
            name: data.clinic.name || "",
            address: data.clinic.address || "",
            phone: data.clinic.phone || "",
            email: data.clinic.email || "",
          });
        }
      } catch (err) {
        console.error("Failed to load clinic profile:", err);
      } finally {
        setDataLoading(false);
      }
    }

    loadProfile();
  }, [user, role, loading]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;

    if (!form.name.trim()) {
      showToast("Clinic name is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/clinic/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.clinic) setClinic(data.clinic);
      showToast("Clinic profile updated successfully! ✓", "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to update clinic profile",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || role !== "clinic") return null;

  const verificationStatusLabel = clinic?.license_verified
    ? "Verified"
    : "Pending Verification";

  const verificationBadgeClass = clinic?.license_verified
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    : "bg-amber-500/10 border-amber-500/20 text-amber-400";

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
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
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
        <p className="text-teal-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">
          Clinic Dashboard
        </p>
        <h1 className="text-3xl font-black text-white tracking-tighter">
          Clinic Profile
        </h1>
        <p className="text-slate-400 font-medium text-sm mt-1">
          Manage your clinic&apos;s public contact details and information.
        </p>
      </header>

      {dataLoading ? (
        <div className="py-24 flex flex-col items-center gap-4">
          <span className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
            Loading clinic data...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* General Info Section */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <Building2 size={16} className="text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">
                      General Information
                    </h2>
                    <p className="text-xs text-slate-500">
                      Editable — shown to patients on the platform
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>Clinic Name *</label>
                  <div className="relative">
                    <Building2
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                    />
                    <input
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="City Health Clinic"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="+91 98765 43210"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="clinic@hospital.com"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Full Address</label>
                  <div className="relative">
                    <MapPin
                      size={14}
                      className="absolute left-3.5 top-3.5 text-slate-600"
                    />
                    <textarea
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      rows={3}
                      placeholder="123 Medical Street, City, State - 000001"
                      className="w-full p-4 pl-10 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all text-sm font-medium resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-white font-black hover:from-teal-400 hover:to-teal-300 transition-all disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95"
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={15} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Verification Info — READ ONLY */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Shield size={16} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-black text-white">
                      Verification Information
                    </h2>
                    <p className="text-xs text-slate-500">
                      Read-only — managed by admin
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${verificationBadgeClass}`}
                  >
                    <Lock size={9} />
                    {verificationStatusLabel}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>
                    Medical License Number (Read-only)
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                    />
                    <div className={`${readonlyClass} pl-10 flex items-center`}>
                      {clinic?.medical_license || (
                        <span className="text-slate-600 italic">
                          No license on file
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Verification Status (Read-only)
                  </label>
                  <div
                    className={`h-12 px-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
                      clinic?.license_verified
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/5 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    {clinic?.license_verified ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                    <span className="font-bold">
                      {clinic?.license_verified
                        ? "Verified — Clinic is listed and accepting bookings"
                        : "Pending — Awaiting admin verification"}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-600 font-medium bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  🔒 License number and verification status are managed by the admin
                  team. Contact support if you need to update these.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Account Status Card */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    clinic?.is_active
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-slate-500/10 border-slate-500/20 text-slate-500"
                  }`}
                >
                  {clinic?.is_active ? (
                    <CheckCircle size={22} />
                  ) : (
                    <Clock size={22} />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Account Status
                  </p>
                  <p
                    className={`text-lg font-black ${clinic?.is_active ? "text-emerald-400" : "text-slate-400"}`}
                  >
                    {clinic?.is_active ? "Active & Listed" : "Under Review"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {clinic?.is_active
                  ? "Your clinic is visible to patients and accepting bookings."
                  : "Your clinic requires admin approval before it can be listed."}
              </p>
            </div>

            {/* Registered Since */}
            {clinic?.created_at && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  Registered Since
                </p>
                <p className="text-white font-bold">
                  {new Date(clinic.created_at).toLocaleDateString("en-IN", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* What You Can Edit */}
            <div className="bg-teal-500/[0.04] border border-teal-500/20 rounded-2xl p-6">
              <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4">
                What You Can Edit
              </p>
              <ul className="space-y-3">
                {["Clinic Name", "Phone Number", "Email Address", "Address"].map(
                  (item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-xs text-slate-300 font-medium"
                    >
                      <CheckCircle2
                        size={13}
                        className="text-teal-400 shrink-0"
                      />
                      {item}
                    </li>
                  )
                )}
              </ul>

              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  Admin Only
                </p>
                <ul className="space-y-3">
                  {["Medical License", "Verification Status"].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-xs text-slate-600 font-medium"
                    >
                      <Lock size={12} className="text-slate-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="font-black text-white mb-2 text-sm">
                Need Help?
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Contact the admin team to update license or verification details.
              </p>
              <button className="w-full py-3 bg-white/[0.05] border border-white/10 text-teal-400 rounded-xl font-bold text-sm hover:bg-teal-500/10 hover:border-teal-500/20 transition-colors flex items-center justify-center gap-2">
                <Mail size={14} />
                Contact Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
