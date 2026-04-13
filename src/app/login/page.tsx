"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  PlusCircle, 
  ShieldCheck, 
  Activity, 
  AlertCircle 
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function SmartLoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    const { data: initialProfile, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    let profileData = initialProfile;

    if (roleError && roleError.code === "PGRST116") {
      const { error: insertError } = await supabase.from("users").upsert({
        id: data.user.id,
        email: data.user.email!,
        role: "patient",
      }, { onConflict: "id" });

      if (insertError) {
        await supabase.auth.signOut();
        setError("User profile not found. Recovery failed. Contact support.");
        setLoading(false);
        return;
      }

      const { data: retryProfile } = await supabase.from("users").select("role").eq("id", data.user.id).single();
      profileData = retryProfile;
    } else if (roleError || !initialProfile) {
      await supabase.auth.signOut();
      setError("User profile not available. Please contact support.");
      setLoading(false);
      return;
    }

    router.refresh();
    const role = profileData?.role;
    if (role === "patient") router.push("/dashboard");
    else if (role === "doctor") router.push("/doctor-dashboard");
    else if (role === "clinic") router.push("/clinic-dashboard");
    else if (role === "admin") router.push("/admin");
    else {
      await supabase.auth.signOut();
      setError("Unknown user role access restriction.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0b0f1a] px-4 py-8">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

      <div className="max-w-lg w-full relative z-10">
        <div className="mb-8 flex justify-center">
           <Link href="/" className="group flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-teal-500/20 group-hover:scale-110 transition-transform duration-500">
                 <Activity className="text-white" size={26} />
              </div>
              <div className="text-left">
                 <h2 className="text-lg font-black text-white tracking-tighter leading-none">Clinical <span className="text-teal-400">Ethereal</span></h2>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Advanced Care Portal</p>
              </div>
           </Link>
        </div>

        <Card className="p-8 md:p-12 relative overflow-hidden" glass>
          {/* Decorative Corner Glow */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-teal-500/10 blur-2xl rounded-full" />

          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Welcome back</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Access your healthcare dashboard</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
              <p className="text-rose-400 text-sm font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Professional Email"
              type="email"
              placeholder="name@example.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1.5">
               <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Security Password</label>
                  <Link href="/forgot-password text-[11px] font-black text-teal-500 uppercase tracking-widest hover:text-teal-400 transition-colors" className="text-[11px] font-black text-teal-500 uppercase tracking-widest">
                     Recover Access
                  </Link>
               </div>
               <div className="relative">
                 <Input
                   type={showPassword ? "text" : "password"}
                   placeholder="••••••••••••"
                   icon={<Lock size={18} />}
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                   className="pr-12"
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-4 top-[14px] text-slate-600 hover:text-slate-400 transition-colors"
                 >
                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
               </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={<ArrowRight size={18} />}
              className="h-14 mt-4 shadow-2xl"
            >
              Verify & Authorize
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 space-y-6">
             <p className="text-center text-sm font-bold text-slate-500 uppercase tracking-wider">
               New to the platform?{" "}
               <Link href="/signup" className="text-white hover:text-teal-400 transition-colors ml-1 border-b-2 border-teal-500/30">
                 Request Invitation
               </Link>
             </p>

             <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <PlusCircle className="text-indigo-400" size={20} />
                   </div>
                   <div>
                      <p className="text-xs font-black text-white tracking-tight">Facility Owner?</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Register Your Clinic</p>
                   </div>
                </div>
                <Link href="/register-clinic">
                   <Button variant="ghost" size="sm" className="rounded-full px-4 text-[10px]">Onboard &rarr;</Button>
                </Link>
             </div>
          </div>
        </Card>

        {/* Security Badges */}
        <div className="flex items-center justify-center gap-8 mt-10">
           {[
              { label: "AES-256", icon: <ShieldCheck size={14} /> },
              { label: "HIPAA Compliant", icon: <ShieldCheck size={14} /> },
              { label: "SSL Secure", icon: <ShieldCheck size={14} /> }
           ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                 <span className="text-teal-500/60">{badge.icon}</span>
                 {badge.label}
              </div>
           ))}
        </div>
      </div>
    </main>
  );
}
