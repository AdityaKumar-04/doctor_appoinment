"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserCircle, Mail, Activity } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { UserProfile } from "@/utils/types";

export default function PatientDetailsPage({ params }: { params: { id: string } }) {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [patient, setPatient] = useState<UserProfile | null>(null);
  const [profileDetails, setProfileDetails] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || role !== "doctor")) {
      router.push("/login");
      return;
    }

    const fetchPatientData = async () => {
      try {
        const [patientRes, aptRes] = await Promise.all([
          fetch(`/api/profile-details/${params.id}`), 
          fetch(`/api/appointments?userId=${user?.id}&role=doctor`) 
        ]);
        
        let pData;
        if (patientRes.ok) pData = await patientRes.json();
        if (aptRes.ok) await aptRes.json();

        if (pData?.user) {
          setPatient(pData.user);
          setProfileDetails(pData.profile_details);
        } else if (pData) {
          setPatient(pData);
          setProfileDetails(pData?.profile_details);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user && role === "doctor") {
      fetchPatientData();
    }
  }, [user, role, authLoading, params.id, router]);

  if (loading || authLoading) {
    return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse">Loading...</div>;
  }

  if (!patient) {
    // We couldn't find anything
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-xl font-black text-white mb-2">Patient Not Found</h2>
        <Link href="/doctor-dashboard/appointments" className="text-teal-400 font-bold hover:underline">
          <ArrowLeft size={16} className="inline mr-1"/> Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-8 text-left">
      <Link href="/doctor-dashboard/appointments" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors gap-2">
        <ArrowLeft size={14} /> Back to Appointments
      </Link>

      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-white/10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 shadow-lg">
            {patient?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patient.avatar_url} alt="Avatar" className="w-full h-full rounded-3xl object-cover" />
            ) : (
              <UserCircle size={40} />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">
              {patient?.first_name || "Patient"} {patient?.last_name || ""}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm font-bold text-slate-400">
              {patient?.email && <span className="flex items-center gap-1.5"><Mail size={14}/> {patient.email}</span>}
              <span className="flex items-center gap-1.5 text-indigo-400"><Activity size={14}/> ID: {params.id.split('-')[0]}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/doctor-dashboard/patient-history/${params.id}`}>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-colors">
              <Activity size={16} className="text-teal-400" /> View Medical History
            </button>
          </Link>
        </div>
      </header>
      
      
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
          Patient Profile Details
        </h2>
        
        <Card className="p-8 border border-white/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Full Name</p>
              <p className="text-sm font-bold text-white">{patient?.first_name} {patient?.last_name}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Date of Birth</p>
              <p className="text-sm font-bold text-white">{profileDetails?.dob ? new Date(profileDetails.dob as string).toLocaleDateString() : "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Contact</p>
              <p className="text-sm font-bold text-white">{(profileDetails?.contact as string) || patient?.phone || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Address</p>
              <p className="text-sm font-bold text-white">{(profileDetails?.address as string) || "Not provided"}</p>
            </div>
            {(profileDetails?.gender as string) && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Gender</p>
                <p className="text-sm font-bold text-white capitalize">{profileDetails?.gender as string}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
