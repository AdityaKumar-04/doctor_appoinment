"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart,
  Stethoscope,
  CalendarCheck,
  Building2,
  Wallet,
  Trash2,
  User,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface WishlistItem {
  doctor_id: string;
  doctors: {
    id: string;
    user_id: string;
    specialization: string;
    experience_years?: number;
    consultation_fee?: number;
    users: {
      first_name: string;
      last_name: string;
    };
    clinics?: {
      name: string;
    } | null;
  };
}

export default function WishlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlists");
      const data = await res.json();
      if (data.wishlists) setItems(data.wishlists);
    } catch (err) {
      console.error("Failed to load wishlist", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetch_();
  }, [user, fetch_]);

  const remove = async (doctorId: string) => {
    setRemoving(doctorId);
    try {
      await fetch(`/api/wishlists?doctor_id=${doctorId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.doctor_id !== doctorId));
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(null);
    }
  };

  if (!user) return null;

  return (
    <div className="page-enter space-y-8 text-left">
      {/* Header */}
      <header className="space-y-1.5">
        <p className="text-rose-400 text-[11px] font-black uppercase tracking-[0.2em]">Saved Specialists</p>
        <h1 className="text-4xl font-black text-white tracking-tighter">My Wishlist</h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
          {loading ? "Loading..." : `${items.length} saved doctors`}
        </p>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse space-y-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-white/5 rounded-xl" />
              <div className="h-10 bg-white/5 rounded-xl" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="col-span-full glass-card rounded-2xl py-24 flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <Heart size={36} className="text-slate-700" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight mb-2">No Saved Doctors</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Browse specialists and click the heart icon to save them</p>
            </div>
            <Link href="/doctors">
              <Button variant="primary" icon={<Stethoscope size={16} />}>Browse Doctors</Button>
            </Link>
          </div>
        ) : (
          items.map((item) => {
            const doc = item.doctors;
            const firstName = doc?.users?.first_name || "Doctor";
            const lastName = doc?.users?.last_name || "";
            const initial = firstName.charAt(0);
            const bookId = doc?.user_id || doc?.id;

            return (
              <div key={item.doctor_id} className="relative glass-card rounded-2xl p-6 flex flex-col gap-5 group hover:border-white/10 transition-all duration-300">
                {/* Top Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-transparent rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity" />

                {/* Profile */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-600/20 border border-white/10 flex items-center justify-center text-2xl font-black text-white shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-white tracking-tight truncate group-hover:text-teal-400 transition-colors">
                      Dr. {firstName} {lastName}
                    </h3>
                    <Badge variant="indigo" className="mt-1 text-[9px] px-2 py-0.5">
                      {doc?.specialization}
                    </Badge>
                  </div>
                  <button
                    onClick={() => remove(item.doctor_id)}
                    disabled={removing === item.doctor_id}
                    className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:border hover:border-rose-500/20 transition-all disabled:opacity-40"
                    title="Remove from wishlist"
                  >
                    {removing === item.doctor_id ? (
                      <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>

                {/* Info rows */}
                <div className="space-y-2.5">
                  {doc?.consultation_fee && (
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                      <Wallet size={14} className="text-teal-400 shrink-0" />
                      ₹{doc.consultation_fee} consultation fee
                    </div>
                  )}
                  {doc?.experience_years && (
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                      <User size={14} className="text-indigo-400 shrink-0" />
                      {doc.experience_years}+ years experience
                    </div>
                  )}
                  {doc?.clinics?.name && (
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                      <Building2 size={14} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{doc.clinics.name}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-auto">
                  <Link href={`/doctors/${bookId}`} className="flex-1">
                    <Button variant="outline" fullWidth className="h-10 text-[10px] font-black uppercase tracking-widest border-white/10">
                      View Profile
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    fullWidth
                    className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/10"
                    icon={<CalendarCheck size={14} />}
                    onClick={() => router.push(`/book/${bookId}`)}
                  >
                    Book
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
