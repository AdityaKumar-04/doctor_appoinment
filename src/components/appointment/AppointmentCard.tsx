"use client";

import React, { useState, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Appointment, UserRole } from "@/utils/types";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Stethoscope, 
  CreditCard, 

  CheckCircle2,
  XCircle,
  Eye
} from "lucide-react";
import TreatmentModal from "./TreatmentModal";

interface AppointmentCardProps {
  role: UserRole;
  appointment: Appointment;
  onStatusUpdate?: (id: string, newStatus: string) => void;
  onAppointmentComplete?: () => void;
  showPayLink?: boolean;
  className?: string;
}

const AppointmentCard = memo(({
  role,
  appointment,
  onStatusUpdate,
  onAppointmentComplete,
  showPayLink = false,
  className = "",
}: AppointmentCardProps) => {
  const router = useRouter();
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });

  const formatTime = (t: string) => {
    try {
      return new Date(`1970-01-01T${t}`).toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit", 
        hour12: true 
      });
    } catch {
      return t;
    }
  };

  const status = appointment.status || "pending";
  
  const doctorName = role === "patient" 
    ? `Dr. ${appointment.doctors?.users?.first_name || ""} ${appointment.doctors?.users?.last_name || "Provider"}`
    : `${appointment.users?.first_name || ""} ${appointment.users?.last_name || "Patient"}`;

  const specialty = appointment.doctors?.specialization || "General Specialist";
  const clinicName = appointment.clinics?.name || appointment.doctors?.clinics?.name;
  const clinicAddress = appointment.clinics?.address || appointment.doctors?.clinics?.address;

  return (
    <>
      <Card className={`group relative overflow-hidden transition-all duration-500 ${className}`} hover>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* Left Section: Profile Info */}
          <div className="flex items-center gap-5 text-left">
            <div className={`
              w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 duration-500
              ${role === "patient" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"}
            `}>
               <Stethoscope size={28} />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-black text-white tracking-tight leading-none">{doctorName}</h4>
                <Badge variant={status as "pending" | "confirmed" | "cancelled" | "completed"} size="sm">{status}</Badge>
              </div>
              
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                {role === "patient" ? specialty : appointment.users?.email}
              </p>

              {(clinicName || clinicAddress) && (
                <div className="flex flex-col gap-1 mt-2">
                  {clinicName && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-500/80">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate max-w-[180px]">{clinicName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Time & Actions */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-end">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-white font-black text-sm tracking-tight bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <Calendar size={14} className="text-teal-400" />
                {formatDate(appointment.appointment_date)}
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs px-3 py-1">
                <Clock size={14} />
                {formatTime(appointment.appointment_time)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showPayLink && status === "pending" && role === "patient" && (
                <Button
                  size="sm"
                  variant="primary"
                  className="h-9 px-4 rounded-full"
                  icon={<CreditCard size={14} />}
                  onClick={() => router.push(`/checkout?appointmentId=${appointment.id}`)}
                >
                  Pay Now
                </Button>
              )}

              {role === "doctor" && onStatusUpdate && status === "pending" && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onStatusUpdate(appointment.id, "confirmed")}
                      className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
                      title="Confirm Appointment"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button 
                      onClick={() => onStatusUpdate(appointment.id, "cancelled")}
                      className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 border border-red-500/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                      title="Cancel Appointment"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
              )}

              {role === "doctor" && onStatusUpdate && status === "confirmed" && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowTreatmentModal(true)}
                      className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
                      title="Complete Appointment"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button 
                      onClick={() => onStatusUpdate(appointment.id, "cancelled")}
                      className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 border border-red-500/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                      title="Cancel Appointment"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
              )}

              <Link 
                href={role === "patient" ? `/dashboard/appointments/${appointment.id}` : `/doctor-dashboard/patient/${appointment.patient_id}`}
                className="w-9 h-9 rounded-full bg-white/5 text-slate-400 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
                title="View Patient Details"
              >
                <Eye size={18} />
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {showTreatmentModal && (
        <TreatmentModal
          appointmentId={appointment.id}
          patientId={appointment.patient_id}
          onClose={() => setShowTreatmentModal(false)}
          onSuccess={() => {
            setShowTreatmentModal(false);
            if (onAppointmentComplete) onAppointmentComplete();
          }}
        />
      )}
    </>
  );
});

AppointmentCard.displayName = "AppointmentCard";
export default AppointmentCard;
