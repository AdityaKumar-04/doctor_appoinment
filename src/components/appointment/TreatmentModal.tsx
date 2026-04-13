"use client";

import { useState } from "react";
import { X, FileText, Calendar as CalendarIcon, Save, Stethoscope, CheckCircle2, Loader2 } from "lucide-react";

interface TreatmentModalProps {
  appointmentId: string;
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TreatmentModal({
  appointmentId,
  patientId,
  onClose,
  onSuccess,
}: TreatmentModalProps) {
  const [notes, setNotes] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Treatment notes are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          patientId,
          notes: notes.trim(),
          followupDate: followupDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save treatment");

      setSuccessMsg("Appointment completed & saved!");
      setTimeout(() => {
        onSuccess();
      }, 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const canSubmit = !loading && !successMsg && notes.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0d0f14] border border-white/8 rounded-2xl w-full max-w-md shadow-[0_32px_64px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative">

        {/* Success Toast */}
        {successMsg && (
          <div className="absolute inset-x-0 top-0 z-50 p-3 animate-in slide-in-from-top-3 duration-300">
            <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2.5 font-bold text-sm">
              <CheckCircle2 size={17} />
              {successMsg}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Stethoscope size={17} />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">Complete Appointment</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Document treatment & follow-up
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading || !!successMsg}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Treatment Notes */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} className="text-indigo-400" />
              Treatment Notes
              <span className="text-red-400 ml-0.5">*</span>
            </label>
            <textarea
              className="w-full h-36 bg-[#161920] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 resize-none leading-relaxed transition-all placeholder:text-slate-600 disabled:opacity-50"
              placeholder="Diagnosis, prescription, recommendations, and post-consultation notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading || !!successMsg}
              autoFocus
            />
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
              {notes.trim().length} characters
            </p>
          </div>

          {/* Follow-up Date */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon size={14} className="text-indigo-400" />
              Follow-up Date
              <span className="text-[10px] font-bold bg-white/[0.04] border border-white/[0.08] text-slate-500 px-2 py-0.5 rounded-full ml-1">
                Optional
              </span>
            </label>
            <input
              type="date"
              className="w-full bg-[#161920] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 cursor-pointer transition-all disabled:opacity-50 [color-scheme:dark]"
              value={followupDate}
              min={today}
              onChange={(e) => setFollowupDate(e.target.value)}
              disabled={loading || !!successMsg}
            />
            {followupDate && (
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                Follow-up scheduled for {new Date(followupDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/8 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl font-bold flex items-start gap-2">
              <X size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || !!successMsg}
              className="px-5 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-40 border border-white/[0.06]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                canSubmit
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                  : successMsg
                  ? "bg-emerald-600/60 text-white cursor-not-allowed"
                  : "bg-white/[0.04] text-slate-600 cursor-not-allowed border border-white/[0.06]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving...
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle2 size={15} />
                  Saved!
                </>
              ) : (
                <>
                  <Save size={15} />
                  Complete &amp; Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
