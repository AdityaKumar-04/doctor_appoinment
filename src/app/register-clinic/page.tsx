"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function RegisterClinicPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/clinic/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
      } else {
        setSuccess(true);
        form.reset();
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full h-12 px-4 rounded-xl bg-slate-800 text-text-primary border border-dark-border focus:border-brand-teal focus:outline-none focus:ring-4 focus:ring-teal-500/10 font-medium text-sm transition-all placeholder:text-text-subtle custom-scrollbar`;

  return (
    <div className="min-h-screen bg-dark-bg font-body page-enter">
      <Navbar />
      
      {/* Background Decorators */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-bg/80 to-dark-bg" />
      </div>

      <main className="pt-32 pb-20 px-4 md:px-8 max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold rounded-full uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-sm">local_hospital</span>
            Provider Registration
          </span>
          <h1 className="text-4xl font-extrabold text-text-primary tracking-tight mb-3">Register Your Clinic</h1>
          <p className="text-text-muted max-w-lg mx-auto text-sm">
            Join Clinical Ethereal&apos;s verified provider network. After review, your clinic will be activated and you&apos;ll receive full platform access.
          </p>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="mb-8 p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div>
              <p className="font-extrabold text-emerald-400 text-xl mb-2">Application Submitted!</p>
              <p className="text-emerald-400/80 text-sm mb-6 max-w-md mx-auto">Our team will review your application within 2–3 business days. You&apos;ll receive an email notification once approved.</p>
              <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-all font-bold text-white text-sm shadow-lg">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Return to Homepage
              </Link>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold flex items-center gap-3">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="bg-dark-card rounded-3xl shadow-dark-2xl border border-dark-border p-8 md:p-10 space-y-8">
            {/* Clinic Info */}
            <div>
              <div className="flex items-center gap-3 border-b border-dark-border pb-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-teal-400">business</span>
                </div>
                <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Clinic Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Clinic Name <span className="text-teal-400">*</span></label>
                  <input name="clinic_name" required placeholder="e.g. Sunrise Medical Center" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Doctor Name <span className="text-teal-400">*</span></label>
                  <input name="doctor_name" required placeholder="e.g. Dr. Sarah Johnson" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Email Address <span className="text-teal-400">*</span></label>
                  <input name="email" type="email" required placeholder="doctor@clinic.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input name="phone" type="tel" placeholder="+1 (555) 000-0000" className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Clinic Address</label>
                  <input name="address" placeholder="123 Medical Plaza, City, State, ZIP" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div>
              <div className="flex items-center gap-3 border-b border-dark-border pb-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-teal-400">medical_services</span>
                </div>
                <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Professional Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Specialization</label>
                  <input name="specialization" placeholder="e.g. Cardiology, General Practice" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Years of Experience</label>
                  <input name="experience_years" type="number" min="0" max="60" placeholder="e.g. 10" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <div className="flex items-center gap-3 border-b border-dark-border pb-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-teal-400">upload_file</span>
                </div>
                <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Verification Documents</h2>
              </div>
              
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Medical License / Credentials (PDF)</label>
              
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-dark-border bg-slate-800/30 rounded-2xl p-8 text-center hover:border-teal-500/50 hover:bg-teal-500/5 transition-all cursor-pointer group"
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="w-14 h-14 bg-slate-800 border border-dark-border rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-500/20 group-hover:border-teal-500/30 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-text-muted group-hover:text-teal-400 transition-colors">backup</span>
                  </div>
                  <p className="text-sm font-bold text-text-primary">Click to upload your medical credentials</p>
                  <p className="text-xs text-text-subtle mt-1 font-medium">PDF format only, maximum 10MB</p>
                </div>
              ) : (
                <div className="bg-slate-800/80 border border-teal-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-teal-500/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-500/15 border border-teal-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-teal-400 text-2xl">picture_as_pdf</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-white truncate max-w-[180px] sm:max-w-[300px]">{selectedFile.name}</p>
                      <p className="text-xs text-teal-400/80 font-medium mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              )}
              
              <input 
                ref={fileRef} 
                name="document" 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }} 
              />
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-dark-border">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-extrabold rounded-xl shadow-teal-glow hover:from-teal-400 hover:to-teal-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
              >
                {loading ? (
                  <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting Application...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span> Submit Registration</>
                )}
              </button>
              <p className="text-center text-xs font-medium text-text-muted mt-5">
                Already approved?{" "}
                <Link href="/login" className="text-teal-400 font-bold hover:text-teal-300 transition-colors ml-1">
                  Sign in to Provider Portal →
                </Link>
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
