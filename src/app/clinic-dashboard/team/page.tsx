"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ChevronLeft, UserCog, Plus, Mail, Phone, Briefcase, 
  Shield, Stethoscope, UserCheck, X, Search, Users
} from "lucide-react";

interface TeamMember {
  id: string;
  specialization: string;
  experience_years: number;
  consultation_fee: number | null;
  is_active: boolean;
  role: "doctor" | "admin" | "receptionist";
  users: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
}

interface InviteForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialization: string;
  experience_years: number;
  role: "doctor";
}

const EMPTY_FORM: InviteForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  specialization: "",
  experience_years: 0,
  role: "doctor",
};

const ROLE_CONFIG = {
  doctor: {
    label: "Doctor",
    icon: <Stethoscope size={14} />,
    bg: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  },
  admin: {
    label: "Admin",
    icon: <Shield size={14} />,
    bg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  receptionist: {
    label: "Receptionist",
    icon: <UserCheck size={14} />,
    bg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
};

const inputClass =
  "w-full h-11 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm outline-none transition-all";
const labelClass =
  "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5";

export default function ClinicTeamPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<InviteForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "doctor" | "admin" | "receptionist">("all");

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/clinic/doctors");
      const data = await res.json();
      if (res.ok) {
        const docs: TeamMember[] = (data.doctors || []).map((d: TeamMember) => ({
          ...d,
          role: "doctor" as const,
        }));
        setMembers(docs);
      }
    } catch (err) {
      console.error("Failed to load team:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading || !user || role !== "clinic") return;
    loadTeam();
  }, [user, role, loading, loadTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/clinic/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`${form.first_name} ${form.last_name} invited! Credentials emailed.`, "success");
      setShowModal(false);
      setForm(EMPTY_FORM);
      loadTeam();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to invite member", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  if (!user || role !== "clinic") return null;

  const filteredMembers = members.filter((m) => {
    const name = `${m.users.first_name} ${m.users.last_name}`.toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase()) || m.users.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: members.length,
    active: members.filter((m) => m.is_active).length,
    doctors: members.filter((m) => m.role === "doctor").length,
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Invite Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1220] border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-white">Invite Team Member</h3>
                <p className="text-sm text-slate-500 mt-1">Login credentials will be emailed automatically.</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="John"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input
                    required
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Smith"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Work Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="member@clinic.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["doctor"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, role: r })}
                      className={`h-11 rounded-xl border text-xs font-bold capitalize transition-all flex items-center justify-center gap-1.5 ${
                        form.role === r
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                          : "bg-white/[0.03] text-slate-400 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <Stethoscope size={13} /> Doctor
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled
                    className="h-11 rounded-xl border text-xs font-bold capitalize bg-white/[0.02] text-slate-600 border-white/5 flex items-center justify-center gap-1.5 cursor-not-allowed"
                    title="Coming soon"
                  >
                    <Shield size={13} /> Admin
                  </button>
                  <button
                    type="button"
                    disabled
                    className="h-11 rounded-xl border text-xs font-bold capitalize bg-white/[0.02] text-slate-600 border-white/5 flex items-center justify-center gap-1.5 cursor-not-allowed"
                    title="Coming soon"
                  >
                    <UserCheck size={13} /> Reception
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-2">Admin & Receptionist roles coming soon.</p>
              </div>

              <div>
                <label className={labelClass}>Specialization *</label>
                <input
                  required
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  placeholder="e.g. Cardiology"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={form.experience_years}
                  onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 h-11 rounded-xl bg-white/[0.05] border border-white/10 text-slate-400 font-bold text-sm hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-11 rounded-xl bg-teal-500 text-white font-bold text-sm hover:bg-teal-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Plus size={16} /> Invite Member</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-6 group transition-colors"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-teal-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Administration</p>
          <h1 className="text-3xl font-black text-white tracking-tighter">Team Management</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Manage clinic staff, roles, and access control.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:bg-teal-400 active:scale-95 transition-all"
        >
          <Plus size={18} />
          Invite Member
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Staff", value: stats.total, icon: <Users size={16} />, color: "text-teal-400", bg: "border-teal-500/20 bg-teal-500/[0.05]" },
          { label: "Active", value: stats.active, icon: <UserCheck size={16} />, color: "text-emerald-400", bg: "border-emerald-500/20 bg-emerald-500/[0.05]" },
          { label: "Doctors", value: stats.doctors, icon: <Stethoscope size={16} />, color: "text-sky-400", bg: "border-sky-500/20 bg-sky-500/[0.05]" },
        ].map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-5 ${stat.bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${stat.color}`}>
              {stat.icon}
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
            </div>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value.toString().padStart(2, "0")}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-600 text-sm outline-none focus:border-teal-500/50 transition-all"
          />
        </div>

        <div className="flex gap-1.5 bg-white/[0.03] border border-white/8 p-1.5 rounded-xl">
          {(["all", "doctor", "admin", "receptionist"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                roleFilter === r
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
        {dataLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <span className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Loading team...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <UserCog size={28} className="text-teal-400" />
            </div>
            <p className="font-black text-white text-lg mb-2">
              {search || roleFilter !== "all" ? "No members match your filter" : "No Team Members Yet"}
            </p>
            <p className="text-slate-500 text-sm mb-6">
              {search || roleFilter !== "all"
                ? "Try adjusting your search or filter."
                : "Invite your first team member to get started."}
            </p>
            {!search && roleFilter === "all" && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-400 transition-all"
              >
                <Plus size={18} /> Invite First Member
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-6 py-4">Member</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Specialization</th>
                  <th className="px-4 py-4">Contact</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredMembers.map((member) => {
                  const roleCfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.doctor;
                  return (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-black text-sm uppercase shrink-0">
                            {member.users.first_name.charAt(0)}{member.users.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">
                              {member.role === "doctor" ? "Dr. " : ""}{member.users.first_name} {member.users.last_name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Mail size={11} /> {member.users.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${roleCfg.bg}`}>
                          {roleCfg.icon}
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                          <Stethoscope size={13} className="text-slate-600" />
                          {member.specialization}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Briefcase size={11} /> {member.experience_years} yrs
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {member.users.phone && (
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Phone size={11} className="text-slate-600" />
                            {member.users.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          member.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? "bg-emerald-400" : "bg-slate-500"}`} />
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 text-xs font-bold transition-all"
                          title="Remove from team"
                          onClick={() => showToast("Contact admin to remove team members", "error")}
                        >
                          <X size={12} /> Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
