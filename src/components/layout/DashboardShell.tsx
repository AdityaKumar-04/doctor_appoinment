"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/utils/types";
import NotificationBell from "@/components/layout/NotificationBell";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  Stethoscope,
  Building2,
  Wallet,
  UserCircle,
  X,
  Activity,
  Heart,
  Star,
  UserCog,
  Users2,
  CreditCard,
  Clock,
  ClipboardList,
  MessageSquare,
  Headphones,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard size={20} />, roles: ["patient"] },
  { label: "My Appointments", href: "/dashboard/appointments", icon: <Calendar size={20} />, roles: ["patient"] },
  { label: "Find Doctors", href: "/doctors", icon: <Stethoscope size={20} />, roles: ["patient"] },
  { label: "Clinics", href: "/clinics", icon: <Building2 size={20} />, roles: ["patient"] },
  { label: "Wishlist", href: "/dashboard/wishlist", icon: <Heart size={20} />, roles: ["patient"] },
  { label: "My Reviews", href: "/dashboard/reviews", icon: <Star size={20} />, roles: ["patient"] },
  { label: "My Profile", href: "/dashboard/profile", icon: <UserCircle size={20} />, roles: ["patient"] },
  { label: "Support", href: "/dashboard/support", icon: <Headphones size={20} />, roles: ["patient"] },
  
  { label: "Overview", href: "/doctor-dashboard", icon: <LayoutDashboard size={20} />, roles: ["doctor"] },
  { label: "Today's Schedule", href: "/doctor-dashboard/today", icon: <Clock size={20} />, roles: ["doctor"] },
  { label: "Bookings", href: "/doctor-dashboard/appointments", icon: <ClipboardList size={20} />, roles: ["doctor"] },
  { label: "My Patients", href: "/doctor-dashboard/patients", icon: <Users size={20} />, roles: ["doctor"] },
  { label: "Schedule", href: "/doctor-dashboard/schedule", icon: <Calendar size={20} />, roles: ["doctor"] },
  { label: "Profile", href: "/doctor-dashboard/profile", icon: <UserCircle size={20} />, roles: ["doctor"] },
  { label: "Support", href: "/doctor-dashboard/support", icon: <Headphones size={20} />, roles: ["doctor"] },
  
  // ── Clinic Panel ──
  { label: "Dashboard", href: "/clinic-dashboard", icon: <LayoutDashboard size={20} />, roles: ["clinic"] },
  { label: "Doctors", href: "/clinic-dashboard/doctors", icon: <Stethoscope size={20} />, roles: ["clinic"] },
  { label: "Appointments", href: "/clinic-dashboard/appointments", icon: <Calendar size={20} />, roles: ["clinic"] },
  { label: "Treatments", href: "/clinic-dashboard/treatments", icon: <ClipboardList size={20} />, roles: ["clinic"] },
  { label: "Payments", href: "/clinic-dashboard/payments", icon: <CreditCard size={20} />, roles: ["clinic"] },
  { label: "Facility Setup", href: "/clinic-dashboard/profile", icon: <Building2 size={20} />, roles: ["clinic"] },
  { label: "Team", href: "/clinic-dashboard/team", icon: <UserCog size={20} />, roles: ["clinic"] },
  { label: "Settings", href: "/clinic-dashboard/settings", icon: <Settings size={20} />, roles: ["clinic"] },
  { label: "Support", href: "/clinic-dashboard/support", icon: <Headphones size={20} />, roles: ["clinic"] },
  
  { label: "System Admin", href: "/admin", icon: <LayoutDashboard size={20} />, roles: ["admin"] },
  { label: "Users", href: "/admin/users", icon: <Users size={20} />, roles: ["admin"] },
  { label: "Clinics", href: "/admin/clinics", icon: <Building2 size={20} />, roles: ["admin"] },
  { label: "Doctors", href: "/admin/doctors", icon: <Stethoscope size={20} />, roles: ["admin"] },
  { label: "Patients", href: "/admin/patients", icon: <Users2 size={20} />, roles: ["admin"] },
  { label: "Payments", href: "/admin/payments", icon: <Wallet size={20} />, roles: ["admin"] },
  { label: "Help Desk", href: "/admin/helpdesk", icon: <Headphones size={20} />, roles: ["admin"] },
  { label: "Complaints", href: "/admin/complaints", icon: <MessageSquare size={20} />, roles: ["admin"] },
  { label: "Settings", href: "/admin/settings", icon: <Settings size={20} />, roles: ["admin"] },
];

const ADMIN_SECTIONS: { title: string; hrefs: string[] }[] = [
  { title: "Overview", hrefs: ["/admin"] },
  { title: "Users", hrefs: ["/admin/users", "/admin/clinics", "/admin/doctors", "/admin/patients"] },
  { title: "Finance", hrefs: ["/admin/payments"] },
  { title: "Support", hrefs: ["/admin/helpdesk", "/admin/complaints"] },
  { title: "System", hrefs: ["/admin/settings"] },
];

// Sections/groups for clinic sidebar
const CLINIC_SECTIONS: { title: string; hrefs: string[] }[] = [
  { title: "Core", hrefs: ["/clinic-dashboard", "/clinic-dashboard/doctors"] },
  { title: "Operations", hrefs: ["/clinic-dashboard/appointments", "/clinic-dashboard/treatments", "/clinic-dashboard/payments"] },
  { title: "Management", hrefs: ["/clinic-dashboard/profile", "/clinic-dashboard/team", "/clinic-dashboard/settings"] },
  { title: "Support", hrefs: ["/clinic-dashboard/support"] },
];

const DOCTOR_SECTIONS: { title: string; hrefs: string[] }[] = [
  { title: "Core", hrefs: ["/doctor-dashboard", "/doctor-dashboard/today"] },
  { title: "Patients & Schedule", hrefs: ["/doctor-dashboard/appointments", "/doctor-dashboard/patients", "/doctor-dashboard/schedule"] },
  { title: "Account", hrefs: ["/doctor-dashboard/profile"] },
  { title: "Support", hrefs: ["/doctor-dashboard/support"] },
];

// Map for dynamic page title from pathname
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/appointments": "My Appointments",
  "/dashboard/profile": "My Profile",
  "/dashboard/notifications": "Notifications",
  "/dashboard/wishlist": "Wishlist",
  "/dashboard/reviews": "My Reviews",
  "/doctors": "Find Doctors",
  "/clinics": "Clinics",
  "/doctor-dashboard": "Doctor Portal",
  "/doctor-dashboard/today": "Today's Schedule",
  "/doctor-dashboard/schedule": "Weekly Schedule",
  "/doctor-dashboard/appointments": "All Appointments",
  "/doctor-dashboard/patients": "Patient Directory",
  "/doctor-dashboard/profile": "My Profile",
  "/clinic-dashboard": "Clinic Dashboard",
  "/clinic-dashboard/doctors": "Doctors",
  "/clinic-dashboard/appointments": "Appointments & Patients",
  "/clinic-dashboard/payments": "Payments & Finance",
  "/clinic-dashboard/profile": "Facility Setup",
  "/clinic-dashboard/team": "Team Management",
  "/clinic-dashboard/settings": "Settings",
  "/admin": "System Admin",
  "/admin/users": "User Directory",
  "/admin/clinics": "Clinic Management",
  "/admin/doctors": "Doctor Management",
  "/admin/patients": "Patient Management",
  "/admin/payments": "Revenue & Payments",
  "/admin/helpdesk": "Help Desk",
  "/admin/complaints": "Complaints",
  "/admin/settings": "System Settings",
  "/dashboard/support": "Support Center",
  "/dashboard/support/new": "New Ticket",
  "/doctor-dashboard/support": "Support Center",
  "/doctor-dashboard/support/new": "New Ticket",
  "/clinic-dashboard/support": "Support Center",
  "/clinic-dashboard/support/new": "New Ticket",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/dashboard/appointments/")) return "Appointment Details";
  if (pathname.startsWith("/doctor-dashboard/appointments/")) return "Appointment Details";
  if (pathname.startsWith("/dashboard/support/")) return "Ticket Detail";
  if (pathname.startsWith("/doctor-dashboard/support/")) return "Ticket Detail";
  if (pathname.startsWith("/clinic-dashboard/support/")) return "Ticket Detail";
  if (pathname.startsWith("/admin/clinics/")) return "Clinic Details";
  if (pathname.startsWith("/admin/doctors/")) return "Doctor Details";
  if (pathname.startsWith("/book/")) return "Book Appointment";
  return "Dashboard";
}

export default function DashboardShell({ children, role }: { children: React.ReactNode, role: UserRole }) {
  const pathname = usePathname();
  const { signOut, user, profile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(role));
  const userName = profile?.first_name || user?.email?.split('@')[0] || "User";
  const pageTitle = getPageTitle(pathname);

  // Deduplicate clinic nav for display (Patients and Appointments share the same href)
  const deduplicatedNav = filteredNav.filter((item, index, self) =>
    index === self.findIndex(t => t.href === item.href && t.label === item.label)
  );
    const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  // For clinic, split into sections; for others just show flat
  const renderSectionedNav = (sections: { title: string; hrefs: string[] }[], basePath: string) => {
    return (
      <nav className="flex-1 space-y-4">
        {sections.map((section) => {
          const sectionItems = deduplicatedNav.filter(item => section.hrefs.includes(item.href));
          if (!sectionItems.length) return null;
          return (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {sectionItems.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== basePath && pathname.startsWith(item.href + "/"));
                  return (
                    <Link
                      key={`${item.href}-${item.label}`}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                        ${isActive 
                          ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm shadow-teal-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"}
                      `}
                    >
                      <span className={`shrink-0 transition-colors ${isActive ? "text-teal-400" : "text-slate-500"}`}>
                        {item.icon}
                      </span>
                      {item.label}
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    );
  };

  const renderClinicNav = () => {
    if (role !== "clinic") return null;
    return renderSectionedNav(CLINIC_SECTIONS, "/clinic-dashboard");
  };

  const renderDefaultNav = () => {
    if (role === "clinic") return null;
    if (role === "doctor") return renderSectionedNav(DOCTOR_SECTIONS, "/doctor-dashboard");
    if (role === "admin") return renderSectionedNav(ADMIN_SECTIONS, "/admin");
    return (
      <nav className="flex-1 space-y-1">
        {deduplicatedNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${isActive 
                  ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm shadow-teal-500/10" 
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"}
              `}
            >
              <span className={`shrink-0 transition-colors ${isActive ? "text-teal-400" : "text-slate-500"}`}>
                {item.icon}
              </span>
              {item.label}
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white flex overflow-x-hidden">
      {/* ── Mobile Sidebar Overlay ── */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0d1220] border-r border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Heart size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">MediCare</span>
              <p className="text-[9px] font-bold text-teal-400 uppercase tracking-[0.15em]">Health Platform</p>
            </div>
            {/* Mobile close */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="ml-auto p-1.5 text-slate-500 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Role Label */}
          <div className="mx-2 mb-6 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              {role === "patient" ? "Patient Portal" : role === "doctor" ? "Doctor Portal" : role === "admin" ? "Admin Panel" : "Clinic Panel"}
            </p>
          </div>

          {/* Nav Items */}
          {renderClinicNav()}
          {renderDefaultNav()}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-white/5 p-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-black text-xs uppercase shrink-0">
              {profile?.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{role}</p>
            </div>
          </div>
          <button
            onClick={() => handleSignOut()}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all border border-transparent"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 sticky top-0 z-30 bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-teal-500" />
              <h2 className="text-sm font-bold text-white">{pageTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            
            <div className="h-7 w-[1px] bg-white/5" />

            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none text-white">{userName}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-black text-xs uppercase">
                {profile?.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-8 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
