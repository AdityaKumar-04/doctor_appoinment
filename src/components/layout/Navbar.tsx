"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

// Pages where logged-in patients use the Sidebar — Navbar must be hidden
const PATIENT_SHELL_ROUTES = [
  "/dashboard",
  "/appointments",
  "/book",
  "/checkout",
];

function isPatientShellRoute(pathname: string) {
  return PATIENT_SHELL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

// Dashboard routes where Navbar should be hidden entirely (sidebar is shown instead)
const DASHBOARD_ROUTES = [
  "/doctor-dashboard",
  "/clinic-dashboard",
  "/admin",
];

function isDashboardRoute(pathname: string) {
  return DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, loading, signOut } = useAuth();

  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <nav className="fixed top-0 w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-dark-border h-16 flex items-center px-6 md:px-10">
         <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
      </nav>
    );
  }

  // Hide Navbar on patient portal pages (Sidebar handles nav)
  if (user && role === "patient" && isPatientShellRoute(pathname)) {
    return null;
  }

  // Hide Navbar on all dashboard/panel pages (DashboardShell handles nav)
  if (user && isDashboardRoute(pathname)) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");  
  };

  const renderNavLinks = () => {
    if (loading) return null;

    if (!user) {
      return (
        <>
          <Link href="/" className={`font-medium ${pathname === "/" ? "text-brand-teal border-b-2 border-brand-teal pb-1" : "text-slate-400 hover:text-white transition-colors"}`}>
            Home
          </Link>
          <Link href="/clinics" className={`font-medium ${pathname.startsWith("/clinics") ? "text-brand-teal border-b-2 border-brand-teal pb-1" : "text-slate-400 hover:text-white transition-colors"}`}>
            Clinics
          </Link>
          <Link href="/doctors" className={`font-medium ${pathname.startsWith("/doctors") ? "text-brand-teal border-b-2 border-brand-teal pb-1" : "text-slate-400 hover:text-white transition-colors"}`}>
            Doctors
          </Link>
          <Link href="/register-clinic" className={`font-medium ${pathname === "/register-clinic" ? "text-brand-teal border-b-2 border-brand-teal pb-1" : "text-slate-400 hover:text-white transition-colors"}`}>
            Register Clinic
          </Link>
        </>
      );
    }

    if (role === "admin") {
      return (
        <Link href="/admin" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">
          Admin Dashboard
        </Link>
      );
    }

    if (role === "clinic") {
      return (
        <Link href="/clinic-dashboard" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
          Clinic Dashboard
        </Link>
      );
    }

    if (role === "doctor") {
      return (
        <Link href="/doctor-dashboard" className="font-medium text-sky-400 hover:text-sky-300 transition-colors">
          Doctor Dashboard
        </Link>
      );
    }

    // Logged-in patient on public pages
    return (
      <>
        <Link href="/" className={`font-medium ${pathname === "/" ? "text-brand-teal border-b-2 border-brand-teal pb-1" : "text-slate-400 hover:text-white transition-colors"}`}>
          Home
        </Link>
        <Link href="/clinics" className={`font-medium ${pathname.startsWith("/clinics") ? "text-brand-teal border-b-2 border-brand-teal pb-1" : "text-slate-400 hover:text-white transition-colors"}`}>
          Clinics
        </Link>
        <Link href="/doctors" className={`font-medium ${pathname.startsWith("/doctors") ? "text-brand-teal border-b-2 border-brand-teal pb-1" : "text-slate-400 hover:text-white transition-colors"}`}>
          Find a Doctor
        </Link>
        <Link href="/dashboard" className={`font-medium ${pathname === "/dashboard" ? "text-brand-teal border-b-2 border-brand-teal pb-1" : "text-slate-400 hover:text-white transition-colors"}`}>
          My Portal
        </Link>
      </>
    );
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-dark-border h-16 flex items-center justify-between px-6 md:px-10">
      <div className="flex items-center gap-8">
        <Link
          href={
            role === "doctor"
              ? "/doctor-dashboard"
              : role === "clinic"
              ? "/clinic-dashboard"
              : role === "admin"
              ? "/admin"
              : "/"
          }
          className="text-xl font-extrabold text-text-primary tracking-tight font-headline flex items-center gap-2"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/20">
            <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
          </span>
          <span className="gradient-text-teal font-black">MediCare</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold font-headline">
          {renderNavLinks()}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!user ? (
          <>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm font-semibold transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold hover:from-teal-400 hover:to-teal-500 transition-all hover:scale-[1.02] shadow-teal-glow"
            >
              Get Started
            </Link>
          </>
        ) : (
          <>
            <button
              onClick={handleSignOut}
              className="text-sm font-bold text-slate-400 hover:text-red-400 transition-colors hidden sm:flex items-center gap-1 cursor-pointer"
            >
              Sign Out
            </button>
            <div
              className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center font-bold text-xs uppercase text-white cursor-pointer ring-2 ring-teal-500/30"
              title={user.email}
            >
              {profile?.first_name?.charAt(0) || user.email?.charAt(0) || "U"}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
