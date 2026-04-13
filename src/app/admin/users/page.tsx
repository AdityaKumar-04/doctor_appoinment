"use client";

import { useState } from "react";
import useSWR from "swr";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { 
  Users, 
  Search, 
  UserPlus, 
  Trash2, 
  Filter, 
  ShieldCheck, 
  Building2, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Calendar,
  Stethoscope,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch");
  return data;
});

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

const ROLE_STYLES: Record<string, string> = {
  admin:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  clinic:  "bg-teal-500/10 text-teal-400 border-teal-500/20",
  doctor:  "bg-sky-500/10 text-sky-400 border-sky-500/20",
  patient: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const qs = new URLSearchParams();
  if (search) qs.append("search", search);
  if (roleFilter !== "all") qs.append("role", roleFilter);

  const { data, isLoading: loading, mutate: fetchUsers } = useSWR(
    `/api/admin/users?${qs.toString()}`,
    fetcher
  );
  const users: UserData[] = data?.users || [];

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Deletion failed");
      showToast(`User ${name} deleted.`, "success");
      fetchUsers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    setActionLoading(id + "-role");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Role update failed");
      showToast(`Role updated to ${newRole}.`, "success");
      fetchUsers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Role update failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="page-enter space-y-8 text-left">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-3 border transition-all ${
          toast.type === "success"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-violet-400 text-[11px] font-black uppercase tracking-[0.2em]">Admin · User Management</p>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            User <span className="gradient-text">Directory</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {users.length} users · Search + filter + role assignment
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
          <ShieldCheck className="text-violet-400" size={15} />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Root Access</span>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 !rounded-xl !bg-white/[0.03] border-white/8 focus:border-violet-500/40"
          />
        </div>
        <div className="relative min-w-[160px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full h-12 bg-white/[0.03] border border-white/8 text-slate-300 text-xs font-bold uppercase tracking-widest rounded-xl pl-10 pr-4 focus:outline-none focus:border-violet-500/40 appearance-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="clinic">Clinics</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <Button variant="secondary" className="h-12 px-5 rounded-xl border-white/8 hover:bg-violet-500/10 hover:text-violet-400">
          <UserPlus size={18} />
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0" glass>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading && users.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-5">
                      <div className="h-10 bg-white/[0.02] rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Users className="mx-auto text-slate-700 mb-4" size={40} />
                    <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="group hover:bg-white/[0.01] transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase border ${ROLE_STYLES[u.role] || "bg-white/5 text-slate-400 border-white/10"}`}>
                          {u.role === "admin" ? <ShieldCheck size={16} /> : u.role === "clinic" ? <Building2 size={16} /> : u.role === "doctor" ? <Stethoscope size={16} /> : <User size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight">
                            {u.first_name || ""} {u.last_name || ""}
                            {!u.first_name && !u.last_name && <span className="text-slate-500">Unnamed</span>}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.role === "admin" || actionLoading === u.id + "-role"}
                        className={`text-[10px] font-black uppercase tracking-widest border rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer bg-transparent disabled:opacity-50 ${ROLE_STYLES[u.role] || "text-slate-400 border-white/10"}`}
                      >
                        <option value="patient" className="bg-[#0d1220]">Patient</option>
                        <option value="doctor" className="bg-[#0d1220]">Doctor</option>
                        <option value="clinic" className="bg-[#0d1220]">Clinic</option>
                        <option value="admin" className="bg-[#0d1220]">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                        <Calendar size={11} />
                        {new Date(u.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.role !== "admin" && (
                          <Button
                            onClick={() => handleDelete(u.id, u.first_name || "user")}
                            disabled={actionLoading === u.id}
                            variant="secondary"
                            className="w-9 h-9 p-0 rounded-xl bg-red-500/5 text-red-400 border-red-500/10 hover:bg-red-500 hover:text-white"
                          >
                            {actionLoading === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {users.length > 0 && (
        <p className="text-center text-[10px] font-black text-slate-700 uppercase tracking-widest">
          {users.length} user{users.length !== 1 ? "s" : ""} shown · Role changes apply immediately
        </p>
      )}
    </div>
  );
}
