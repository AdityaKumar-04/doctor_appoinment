"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Send,
  MessageSquare,
  Headphones,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Flag,
  FileText,
  CreditCard,
  Calendar,
  Wrench,
  HelpCircle,
  ChevronRight,
  X,
} from "lucide-react";

interface NewTicketFormProps {
  basePath: string;
  role: "patient" | "doctor" | "clinic";
}

// ─── FAQ Suggestions ───────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "How do I reschedule or cancel my appointment?",
    answer: "Go to My Appointments, click the appointment, and use the Cancel or Reschedule option.",
  },
  {
    q: "Why was my payment charged but appointment not confirmed?",
    answer: "Payments may take up to 5 minutes to reflect. If it isn't confirmed in 30 minutes, raise a payment issue ticket.",
  },
  {
    q: "How do I update my profile information?",
    answer: "Navigate to Profile from the sidebar and click Edit to update your details.",
  },
  {
    q: "I can't log into my account",
    answer: "Try resetting your password using the 'Forgot Password' link on the login page.",
  },
];

// ─── Issue Categories ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "payment",     label: "Payment Issue",     icon: <CreditCard size={16} />,  cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { id: "appointment", label: "Appointment",       icon: <Calendar size={16} />,    cls: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { id: "technical",   label: "Technical",         icon: <Wrench size={16} />,      cls: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { id: "other",       label: "Other",             icon: <HelpCircle size={16} />,  cls: "text-slate-400 bg-white/5 border-white/10" },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

const ROLE_PLACEHOLDERS = {
  patient: {
    complaint: "E.g., Doctor was unprofessional, billing issue, missed appointment...",
    help:      "E.g., Can't book appointment, profile update issue, payment problem...",
  },
  doctor: {
    complaint: "E.g., Incorrect payment received, clinic-related dispute...",
    help:      "E.g., Can't update schedule, profile settings issue, system bug...",
  },
  clinic: {
    complaint: "E.g., Doctor misconduct, platform billing dispute...",
    help:      "E.g., Can't manage appointments, payment not received, setup issue...",
  },
};

const ROLE_ACCENTS = {
  patient: { ring: "focus-within:border-indigo-500/40" },
  doctor:  { ring: "focus-within:border-sky-500/40" },
  clinic:  { ring: "focus-within:border-teal-500/40" },
};

export default function NewTicketForm({ basePath, role }: NewTicketFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"faq" | "form">("faq");
  const [form, setForm] = useState({
    type: "help" as "complaint" | "help",
    category: "" as CategoryId | "",
    subject: "",
    message: "",
    priority: "medium" as "low" | "medium" | "high",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const accent = ROLE_ACCENTS[role];

  // Auto-fill subject from category selection
  const selectCategory = (catId: CategoryId) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    setForm((f) => ({
      ...f,
      category: catId,
      subject: f.subject || (cat ? `${cat.label} Issue` : ""),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Subject and message are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          subject: form.subject,
          message: form.message,
          priority: form.priority,
          // category stored in subject context
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      router.push(`${basePath}/${data.ticket.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 1: FAQ ──────────────────────────────────────────────────────────────
  if (step === "faq") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card glass className="p-6 space-y-5">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Before you submit</p>
            <h2 className="text-xl font-black text-white">Common Questions</h2>
            <p className="text-[12px] text-slate-500 mt-1">
              Check if your issue is already answered below. If not, create a ticket.
            </p>
          </div>

          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/8 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <p className="text-sm font-bold text-slate-300 pr-4">{item.q}</p>
                  <ChevronRight
                    size={16}
                    className={`text-slate-600 shrink-0 transition-transform ${openFaq === i ? "rotate-90" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-slate-400 leading-relaxed border-l-2 border-white/10 pl-3">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <p className="text-[11px] text-slate-600 font-bold">Issue not listed above?</p>
            <Button
              onClick={() => setStep("form")}
              variant="primary"
              className="w-full sm:w-auto px-6 h-11 rounded-xl font-black text-sm uppercase tracking-widest"
              icon={<ChevronRight size={16} />}
            >
              Create a Ticket
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Step 2: Form ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => setStep("faq")}
        className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-5 hover:text-slate-400 transition-colors"
      >
        <X size={12} />Back to FAQ
      </button>

      <Card glass className="p-8 space-y-7">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Ticket Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["help", "complaint"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`flex items-center gap-3 px-5 py-4 rounded-2xl border font-black text-sm uppercase tracking-widest transition-all ${
                    form.type === t
                      ? t === "complaint"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        : "bg-sky-500/10 border-sky-500/30 text-sky-400"
                      : "bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10"
                  }`}
                >
                  {t === "complaint" ? <MessageSquare size={18} /> : <Headphones size={18} />}
                  {t === "help" ? "Help Request" : "Complaint"}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Category */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Issue Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                    form.category === cat.id
                      ? cat.cls
                      : "bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10"
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Priority
            </label>
            <div className="relative">
              <Flag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={15} />
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as "low" | "medium" | "high" }))}
                className="w-full h-12 bg-white/[0.03] border border-white/8 text-slate-300 text-sm font-bold pl-11 pr-10 rounded-xl focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
              >
                <option value="low" className="bg-[#0d1220]">Low Priority</option>
                <option value="medium" className="bg-[#0d1220]">Medium Priority</option>
                <option value="high" className="bg-[#0d1220]">High Priority</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Subject *
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
              <Input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Brief summary of your issue..."
                maxLength={120}
                className="pl-11 h-12 !rounded-xl !bg-white/[0.03] border-white/8"
                required
              />
            </div>
            <p className="text-[10px] text-slate-700 font-bold text-right">{form.subject.length}/120</p>
          </div>

          {/* Message */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Description *
            </label>
            <div className={`rounded-xl border border-white/8 ${accent.ring} bg-white/[0.03] transition-colors`}>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder={ROLE_PLACEHOLDERS[role][form.type]}
                rows={6}
                maxLength={2000}
                className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-600 p-4 focus:outline-none resize-none leading-relaxed"
                required
              />
              <div className="px-4 pb-3 text-right">
                <span className="text-[10px] text-slate-700 font-bold">{form.message.length}/2000</span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* What happens next */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">What happens next?</p>
            {[
              "Your ticket is assigned a unique ID immediately",
              "Support team reviews within 24 hours",
              "Track status and chat from your ticket page",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 size={13} className="text-emerald-500/50 shrink-0" />
                <p className="text-[11px] text-slate-600 font-medium">{step}</p>
              </div>
            ))}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest"
            icon={loading ? undefined : <Send size={18} />}
          >
            {loading ? "Submitting..." : "Submit Ticket"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
