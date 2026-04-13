"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DoctorCard from "@/components/doctor/DoctorCard";
import { SkeletonDoctorCard } from "@/components/ui/SkeletonCard";
import { 
  Search, 
  Stethoscope, 
  Filter, 
  X, 
  TrendingUp,
  Activity,
  Heart
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { Doctor } from "@/utils/types";

const SPECIALIZATIONS = ["Cardiology", "Dermatology", "Neurology", "Pediatrics", "Orthopedics", "Psychiatry"];

export default function DoctorListingPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch("/api/doctors", { cache: "no-store" });
        const data = await res.json();
        if (data.doctors) {
          setDoctors(data.doctors);
        }
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const firstName = doc.users?.first_name || "";
    const lastName = doc.users?.last_name || "";
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const spec = (doc.specialization || "").toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch = fullName.includes(query) || spec.includes(query);
    const matchesSpec = !selectedSpec || doc.specialization === selectedSpec;
    return matchesSearch && matchesSpec;
  });

  return (
    <div className="bg-[#0b0f1a] min-h-screen font-body overflow-x-hidden">
      {/* Glow Effects */}
      <div className="fixed top-0 left-1/4 w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/2 z-0" />
      
      <Navbar />

      <main className="pt-32 px-6 md:px-12 pb-24 w-full max-w-7xl mx-auto page-enter">
        {/* Header Section */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-500/10">
                <Stethoscope size={16} />
                Global Clinical Network
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                Find your <br/>
                <span className="gradient-text">specialist</span>.
              </h1>
              <p className="text-slate-500 text-lg md:text-xl font-bold max-w-lg leading-relaxed uppercase tracking-wider">
                WORLD-CLASS MEDICAL PROFESSIONALS <br/>
                <span className="text-slate-600">CERTIFIED & VERIFIED</span>
              </p>
            </div>
            
            {/* Search Input */}
            <div className="w-full md:w-96">
               <Input 
                 placeholder="Search by name or specialization..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 icon={<Search size={20} className="text-teal-500" />}
                 className="h-16 px-6 text-base font-bold shadow-2xl shadow-black/40"
               />
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-3 space-y-8">
            <Card className="p-8 sticky top-24" glass>
              <div className="space-y-10">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                    <Filter size={14} className="text-teal-400" />
                    Specialization
                  </h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => setSelectedSpec(null)}
                      className={`
                        w-full text-left px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300
                        ${!selectedSpec 
                          ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-lg shadow-teal-500/10" 
                          : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"}
                      `}
                    >
                      All Disciplines
                    </button>
                    {SPECIALIZATIONS.map((spec) => (
                      <button
                        key={spec}
                        onClick={() => setSelectedSpec(selectedSpec === spec ? null : spec)}
                        className={`
                          w-full text-left px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300
                          ${selectedSpec === spec 
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10" 
                            : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"}
                        `}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Availability</h3>
                  <div className="space-y-3">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-5 h-5 rounded-md border-2 border-white/10 flex items-center justify-center group-hover:border-teal-500 transition-colors">
                           <div className="w-2.5 h-2.5 bg-teal-500 rounded-sm opacity-0 group-hover:opacity-100" />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Available Today</span>
                     </label>
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-5 h-5 rounded-md border-2 border-white/10 flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                           <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm opacity-0 group-hover:opacity-100" />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Instant Booking</span>
                     </label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Platform Stats Widget */}
            <div className="relative group overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-teal-500/10 to-indigo-600/10 border border-white/5 shadow-2xl">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Activity size={100} className="text-white" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Platform Health</p>
               <h4 className="text-3xl font-black text-white tracking-tighter mb-4">
                 {loading ? "..." : doctors.length} <span className="text-teal-400">Specialists</span>
               </h4>
               <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                 Live network capacity at 94%. Optimal booking windows predicted for next 48h.
               </p>
               <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-teal-400 uppercase tracking-widest">
                  <TrendingUp size={14} />
                  Top Rated Network
               </div>
            </div>
          </aside>

          {/* Doctors Grid Container */}
          <section className="lg:col-span-9">
            {/* Results Header */}
            {!loading && (
              <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
                <div className="flex items-center gap-4">
                   <div className="w-1.5 h-8 bg-teal-500 rounded-full" />
                   <p className="text-sm font-black text-white uppercase tracking-widest">
                     Verified Results: <span className="text-teal-400 ml-1">{filteredDoctors.length}</span>
                     {selectedSpec && <span className="text-slate-500 ml-2">[{selectedSpec}]</span>}
                   </p>
                </div>
                
                {(search || selectedSpec) && (
                  <button
                    onClick={() => { setSearch(""); setSelectedSpec(null); }}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all duration-300"
                  >
                    <X size={14} />
                    Reset Search Matrix
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonDoctorCard key={i} />)
              ) : filteredDoctors.length === 0 ? (
                <Card className="col-span-full py-24 text-center" glass>
                  <div className="w-24 h-24 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <Search className="text-slate-700" size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tighter mb-4">No Matrix Match Found</h3>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-10">Adjust your criteria or explore all disciplines</p>
                  <Button variant="outline" className="px-10 rounded-full h-12" onClick={() => { setSearch(""); setSelectedSpec(null); }}>
                    Restore Full Network
                  </Button>
                </Card>
              ) : (
                filteredDoctors.map((doc: Doctor) => (
                  <DoctorCard key={doc.id} doctor={doc} />
                ))
              )}
            </div>
            
            {/* Trust Footer */}
            <div className="mt-20 flex flex-col items-center gap-6 opacity-30 group cursor-default">
               <Heart className="text-rose-500 group-hover:scale-125 transition-transform duration-500" size={32} />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] text-center max-w-sm">
                 Clinical Ethereal maintains the highest standards of medical verification and data security.
               </p>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
