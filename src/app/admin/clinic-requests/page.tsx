"use client";

import { useEffect, useState, useCallback } from "react";
interface ClinicRequest {
  id: string;
  clinic_name: string;
  doctor_name: string;
  email: string;
  phone: string;
  address: string;
  specialization: string;
  experience_years: number;
  documents_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const STATUS_TABS = ["pending", "approved", "rejected", "all"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function ClinicRequestsPage() {
  const [requests, setRequests] = useState<ClinicRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadRequests = useCallback(async (tab: StatusTab) => {
    setDataLoading(true);
    try {
      const res = await fetch(`/api/admin/clinic-requests?status=${tab}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRequests(data.requests || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to load requests", "error");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(activeTab);
  }, [activeTab, loadRequests]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/clinic-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Clinic approved and credentials emailed!", "success");
      loadRequests(activeTab);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Approval failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/clinic-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejection_reason: rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Clinic registration rejected.", "success");
      setRejectTarget(null);
      setRejectionReason("");
      loadRequests(activeTab);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Rejection failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (dataLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 transition-all ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          <span className="material-symbols-outlined text-base">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-2">Reject Registration</h3>
            <p className="text-slate-400 text-sm mb-6">Optionally provide a reason. It will be included in the rejection email.</p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Incomplete documentation, unverified credentials..."
              className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setRejectTarget(null); setRejectionReason(""); }}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectTarget)}
                disabled={!!actionLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-colors disabled:opacity-60"
              >
                {actionLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Applications", value: requests.length, icon: "folder_open", color: "from-violet-500/20 to-indigo-500/20 border-violet-500/30 text-violet-400" },
            { label: "Pending Review", value: requests.filter(r => r.status === "pending").length, icon: "pending", color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400" },
            { label: "Approved", value: requests.filter(r => r.status === "approved").length, icon: "check_circle", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400" },
            { label: "Rejected", value: requests.filter(r => r.status === "rejected").length, icon: "cancel", color: "from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400" },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`material-symbols-outlined text-xl ${stat.color.split(" ")[3]}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
              <p className="text-3xl font-extrabold text-white">{stat.value.toString().padStart(2, "0")}</p>
            </div>
          ))}
        </div>

        {/* Title + Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Clinic Registrations</h2>
            <p className="text-slate-400 text-sm mt-1">Approve or reject incoming clinic onboarding requests.</p>
          </div>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all capitalize ${activeTab === tab ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-slate-400 hover:text-slate-200"}`}
              >
                {tab}
                {tab === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-amber-500 text-slate-900 text-[10px] font-extrabold rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {dataLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">inbox</span>
            <p className="text-slate-400 font-semibold">No {activeTab === "all" ? "" : activeTab} registrations found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 hover:border-slate-600 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-white">{req.clinic_name}</h3>
                        <p className="text-xs text-slate-500 font-medium">Submitted {formatDate(req.created_at)}</p>
                      </div>
                      <span className={`ml-auto lg:ml-0 px-3 py-1 rounded-full text-xs font-bold border ${
                        req.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                        req.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                        "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 pl-1 text-sm">
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">Doctor</span>
                        <span className="text-slate-200 font-semibold">{req.doctor_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">Email</span>
                        <span className="text-slate-200 font-semibold">{req.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">Phone</span>
                        <span className="text-slate-200 font-semibold">{req.phone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">Specialization</span>
                        <span className="text-slate-200 font-semibold">{req.specialization || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">Experience</span>
                        <span className="text-slate-200 font-semibold">{req.experience_years} yrs</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">Address</span>
                        <span className="text-slate-200 font-semibold">{req.address || "—"}</span>
                      </div>
                    </div>

                    {req.documents_url && (
                      <a
                        href={req.documents_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">description</span>
                        View Submitted Document
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  {req.status === "pending" && (
                    <div className="flex gap-3 lg:flex-col lg:w-40 shrink-0">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={!!actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                      >
                        {actionLoading === req.id ? (
                          <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-base">check_circle</span>
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectTarget(req.id)}
                        disabled={!!actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-900/50 hover:bg-red-800/70 text-red-400 font-bold text-sm rounded-xl border border-red-700/50 transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">cancel</span>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
