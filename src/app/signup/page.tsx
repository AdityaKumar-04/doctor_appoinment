"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Activity, 
  MailWarning, 
  ChevronRight,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          gender: formData.gender,
          role: "patient",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "A system error occurred during registration.");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to complete registration. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0b0f1a] px-4">
        {/* Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <Card className="max-w-md w-full p-10 text-center relative z-10 overflow-hidden" glass>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-indigo-600" />
          
          <div className="w-24 h-24 bg-teal-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-teal-500/20 shadow-2xl shadow-teal-500/10">
            <MailWarning className="text-teal-400" size={40} />
          </div>
          
          <h2 className="text-3xl font-black text-white tracking-tighter mb-4">Check your inbox</h2>
          <p className="text-slate-400 font-bold text-sm tracking-normal mb-10 leading-relaxed px-4">
            We&apos;ve sent a secure verification link to <span className="text-teal-400">{formData.email}</span>. 
            Access your account once verified.
          </p>
          
          <div className="space-y-4">
            <Button variant="primary" fullWidth size="lg" onClick={() => router.push("/login")}>
              Back to Secure Login
            </Button>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Clinical Ethereal Security Protocol</p>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0b0f1a] px-4 py-16">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        <div className="mb-10 flex justify-center">
           <Link href="/" className="group flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-teal-500/20 group-hover:scale-110 transition-transform duration-500">
                 <Activity className="text-white" size={30} />
              </div>
              <div className="text-left">
                 <h2 className="text-xl font-black text-white tracking-tighter leading-none">Clinical <span className="text-teal-400">Ethereal</span></h2>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5">Join the Network</p>
              </div>
           </Link>
        </div>

        <Card className="p-8 md:p-12" glass>
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-3">Create Account</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Experience premium healthcare at your fingertips</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                 <MailWarning className="text-rose-400" size={16} />
              </div>
              <p className="text-rose-400 text-sm font-bold leading-relaxed pt-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                name="firstName"
                placeholder="Jane"
                required
                value={formData.firstName}
                onChange={handleChange}
                icon={<User size={18} />}
              />
              <Input
                label="Last Name"
                name="lastName"
                placeholder="Doe"
                required
                value={formData.lastName}
                onChange={handleChange}
                icon={<User size={18} />}
              />
            </div>

            <Input
              label="Secure Email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail size={18} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Primary Phone"
                name="phone"
                type="tel"
                required
                placeholder="+91 00000 00000"
                value={formData.phone}
                onChange={handleChange}
                icon={<Phone size={18} />}
              />
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Identity/Gender</label>
                <div className="relative group">
                  <select
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 hover:border-white/20 transition-all appearance-none"
                  >
                    <option value="" className="bg-[#1a1f2e]">Select Entity</option>
                    <option value="male" className="bg-[#1a1f2e]">Male</option>
                    <option value="female" className="bg-[#1a1f2e]">Female</option>
                    <option value="other" className="bg-[#1a1f2e]">Other / Preferred Not to Say</option>
                  </select>
                  <ChevronRight 
                    className="absolute right-4 top-[14px] text-slate-500 group-hover:text-teal-400 rotate-90 pointer-events-none transition-colors" 
                    size={18} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <Input
                  label="Security Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  icon={<Lock size={18} />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Input
                label="Verify Password"
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={<Lock size={18} />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={<UserPlus size={18} />}
              className="h-14 mt-6 shadow-2xl"
            >
              Initialize Account
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-8">
               Already part of the network?{" "}
               <Link href="/login" className="text-white hover:text-teal-400 transition-colors ml-1 border-b-2 border-teal-500/30">
                 System Access
               </Link>
             </p>

             <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                   <ShieldCheck size={14} className="text-teal-500/50" />
                   Fully Encrypted
                </div>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/5" />
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-teal-500/50" />
                    Global Support
                </div>
             </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
