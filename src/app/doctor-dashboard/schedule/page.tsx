"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import Button from "@/components/ui/Button";

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface AvailabilityRow {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_AVAILABILITY: Record<DayOfWeek, AvailabilityRow> = {
  0: { day_of_week: 0, start_time: "09:00", end_time: "17:00", slot_duration: 30, is_active: false },
  1: { day_of_week: 1, start_time: "09:00", end_time: "17:00", slot_duration: 30, is_active: true },
  2: { day_of_week: 2, start_time: "09:00", end_time: "17:00", slot_duration: 30, is_active: true },
  3: { day_of_week: 3, start_time: "09:00", end_time: "17:00", slot_duration: 30, is_active: true },
  4: { day_of_week: 4, start_time: "09:00", end_time: "17:00", slot_duration: 30, is_active: true },
  5: { day_of_week: 5, start_time: "09:00", end_time: "17:00", slot_duration: 30, is_active: true },
  6: { day_of_week: 6, start_time: "09:00", end_time: "14:00", slot_duration: 30, is_active: false },
};

type RawAvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
};

export default function DoctorSchedulePage() {
  const { user, role, loading } = useAuth();
  const [schedule, setSchedule] = useState<Record<DayOfWeek, AvailabilityRow>>(DEFAULT_AVAILABILITY);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (loading || !user || role !== "doctor") return;

    async function loadSchedule() {
      try {
        const res = await fetch("/api/doctor/availability");
        const data = await res.json();
        if (res.ok && data.availability?.length > 0) {
          const newSchedule = { ...DEFAULT_AVAILABILITY };
          (data.availability as RawAvailabilityRow[]).forEach((row) => {
            const st = row.start_time.substring(0, 5);
            const et = row.end_time.substring(0, 5);
            const dow = row.day_of_week as DayOfWeek;
            newSchedule[dow] = {
              day_of_week: dow,
              start_time: st,
              end_time: et,
              slot_duration: row.slot_duration,
              is_active: row.is_active,
            };
          });
          setSchedule(newSchedule);
        }
      } catch (err) {
        console.error("Failed to load availability:", err);
      } finally {
        setDataLoading(false);
      }
    }

    loadSchedule();
  }, [user, role, loading]);

  const handleUpdate = (day: DayOfWeek, field: keyof AvailabilityRow, value: string | number | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const payload = Object.values(schedule).filter(s => s.is_active);
      const res = await fetch("/api/doctor/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Schedule updated successfully", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save schedule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || role !== "doctor") return null;

  const activeCount = Object.values(schedule).filter(r => r.is_active).length;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm border animate-in slide-in-from-right-4 duration-300 ${
          toast.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <div className="page-enter space-y-8 text-left">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em]">Availability Management</p>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              Weekly <span className="gradient-text">Schedule</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
              {activeCount} day{activeCount !== 1 ? "s" : ""} active · Patients book during these hours
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={submitting}
            icon={<Save size={16} />}
            className="h-12 px-8 rounded-2xl shadow-xl shadow-teal-500/10"
          >
            Save Schedule
          </Button>
        </header>

        {/* Loading */}
        {dataLoading ? (
          <div className="glass-card rounded-2xl p-16 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading schedule...</p>
          </div>
        ) : (
          <>
            {/* Weekly overview chips */}
            <div className="flex gap-2 flex-wrap">
              {Object.values(schedule).map((row) => (
                <button
                  key={row.day_of_week}
                  onClick={() => handleUpdate(row.day_of_week, "is_active", !row.is_active)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 border ${
                    row.is_active
                      ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                      : "bg-white/[0.02] text-slate-600 border-white/5 hover:text-slate-400 hover:border-white/10"
                  }`}
                >
                  {DAY_ABBR[row.day_of_week]}
                </button>
              ))}
              <span className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center">
                Click to toggle
              </span>
            </div>

            {/* Schedule Cards */}
            <div className="space-y-3">
              {Object.values(schedule).map((row) => (
                <div
                  key={row.day_of_week}
                  className={`glass-card rounded-2xl transition-all duration-300 ${
                    row.is_active ? "border-white/8" : "opacity-50"
                  }`}
                >
                  <div className={`flex flex-col sm:flex-row sm:items-center gap-5 p-5 ${!row.is_active ? "grayscale" : ""}`}>
                    {/* Day Toggle + Label */}
                    <div className="flex items-center gap-4 sm:w-44 shrink-0">
                      <button
                        onClick={() => handleUpdate(row.day_of_week, "is_active", !row.is_active)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
                          row.is_active ? "bg-teal-500" : "bg-white/10"
                        }`}
                        title={row.is_active ? "Disable this day" : "Enable this day"}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                            row.is_active ? "left-7" : "left-1"
                          }`}
                        />
                      </button>
                      <div>
                        <p className={`font-black text-sm tracking-tight ${row.is_active ? "text-white" : "text-slate-500"}`}>
                          {DAYS[row.day_of_week]}
                        </p>
                        {!row.is_active && (
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Unavailable</p>
                        )}
                      </div>
                    </div>

                    {/* Time + Duration inputs (only when active) */}
                    {row.is_active ? (
                      <div className="flex flex-wrap items-center gap-4 flex-1">
                        {/* Start time */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                            <Clock size={14} className="text-teal-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Start</p>
                            <input
                              type="time"
                              value={row.start_time}
                              onChange={(e) => handleUpdate(row.day_of_week, "start_time", e.target.value)}
                              className="h-9 px-3 rounded-xl bg-white/5 border border-white/8 text-white text-sm font-bold focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all"
                            />
                          </div>
                        </div>

                        <span className="text-slate-600 font-bold text-sm">→</span>

                        {/* End time */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                            <Clock size={14} className="text-indigo-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">End</p>
                            <input
                              type="time"
                              value={row.end_time}
                              onChange={(e) => handleUpdate(row.day_of_week, "end_time", e.target.value)}
                              className="h-9 px-3 rounded-xl bg-white/5 border border-white/8 text-white text-sm font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            />
                          </div>
                        </div>

                        {/* Separator */}
                        <div className="h-8 w-px bg-white/5 hidden sm:block" />

                        {/* Slot Duration */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                            <Calendar size={14} className="text-sky-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Slot</p>
                            <select
                              value={row.slot_duration}
                              onChange={(e) => handleUpdate(row.day_of_week, "slot_duration", parseInt(e.target.value))}
                              className="h-9 px-3 rounded-xl bg-white/5 border border-white/8 text-white text-sm font-bold focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10 transition-all appearance-none cursor-pointer pr-7"
                            >
                              <option value={15} className="bg-[#0d1220]">15 min</option>
                              <option value={20} className="bg-[#0d1220]">20 min</option>
                              <option value={30} className="bg-[#0d1220]">30 min</option>
                              <option value={45} className="bg-[#0d1220]">45 min</option>
                              <option value={60} className="bg-[#0d1220]">60 min</option>
                            </select>
                          </div>
                        </div>

                        {/* Computed slot info */}
                        {row.start_time && row.end_time && (
                          <div className="ml-auto px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:flex items-center gap-1.5">
                            <Clock size={10} className="text-teal-400" />
                            {row.start_time} – {row.end_time}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm font-bold italic flex-1 pl-1">Not available this day</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Save CTA bottom */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={handleSave}
                loading={submitting}
                icon={<Save size={16} />}
                className="h-12 px-8 rounded-2xl"
              >
                Save Schedule
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
