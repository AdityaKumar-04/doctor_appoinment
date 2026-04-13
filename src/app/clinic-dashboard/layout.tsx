"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardShell from "@/components/layout/DashboardShell";

export default function ClinicDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || role !== "clinic")) {
      router.push("/login");
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-lg">
            <span className="material-symbols-outlined text-white text-2xl">local_hospital</span>
          </div>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Initializing Clinic Control...</p>
        </div>
      </div>
    );
  }

  if (!user || role !== "clinic") return null;

  return (
    <DashboardShell role="clinic">
      {children}
    </DashboardShell>
  );
}
