import React from "react";
import Link from "next/link";
import {
  Star,
  Building2,
  CalendarCheck,
  Clock,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card, { CardContent } from "@/components/ui/Card";
import { Doctor } from "@/utils/types";

interface DoctorCardProps {
  doctor: Doctor;
  reviews?: number;
}

export default function DoctorCard({ doctor, reviews = 124 }: DoctorCardProps) {
  const doctorId = doctor.user_id || doctor.id;
  const firstName = doctor.users?.first_name || "Doctor";
  const lastName = doctor.users?.last_name || "";
  const initial = firstName.charAt(0);

  return (
    <Card
      className="group relative h-[360px] w-full flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/5"
      glass
    >
      {/* Top Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600 opacity-60 group-hover:opacity-100 transition-opacity" />

      <CardContent className="p-5 flex flex-col flex-1 gap-4">
        {/* Profile Row */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-600/20 flex items-center justify-center border border-white/10 group-hover:border-teal-500/20 transition-colors shadow-lg">
              <span className="text-2xl font-black text-white">{initial}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0b0f1a] rounded-full flex items-center justify-center border border-white/5">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Name + Spec */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* Stars */}
            <div className="flex items-center gap-0.5 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={10} className={i < 4 ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
              ))}
              <span className="text-[9px] font-black text-slate-600 ml-1">({reviews})</span>
            </div>
            <h3 className="text-sm font-black text-white tracking-tight leading-tight group-hover:text-teal-400 transition-colors truncate">
              Dr. {firstName} {lastName}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge variant="indigo" className="text-[9px] px-2 py-0.5 font-black uppercase tracking-wide">
                {doctor.specialization}
              </Badge>
              <Badge variant="teal" className="text-[9px] px-2 py-0.5 font-black uppercase tracking-wide">
                <Clock size={9} className="mr-0.5 inline" />
                {doctor.experience_years}y exp
              </Badge>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.04] transition-all h-[70px]">
            <p className="text-[11px] font-medium text-slate-400 line-clamp-2 leading-relaxed">
              {doctor.bio || "World-class medical professional specializing in advanced treatments."}
            </p>
          </div>

          {doctor.clinics && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.04] transition-all">
              <Building2 size={13} className="text-indigo-400 shrink-0" />
              <p className="text-xs font-bold text-white truncate">{doctor.clinics.name}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link href={`/book/${doctorId}`} className="flex-1">
            <Button
              variant="primary"
              fullWidth
              className="h-10 text-[10px] font-black uppercase tracking-widest shadow-md shadow-teal-500/10"
              icon={<CalendarCheck size={13} />}
            >
              Book
            </Button>
          </Link>
          <Link href={`/doctors/${doctorId}`}>
            <Button
              variant="ghost"
              className="h-10 px-3 text-[10px] font-black border-white/8 hover:border-white/15"
            >
              Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
