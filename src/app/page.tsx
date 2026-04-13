import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="pt-16 bg-dark-bg">
        {/* ── Hero Section ── */}
        <section className="relative min-h-[90vh] flex items-center px-8 md:px-16 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 dot-grid opacity-40" />
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-semibold mb-8">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Premium Healthcare Experience
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-text-primary leading-[1.08] mb-6 tracking-tight">
              Healthcare at your{" "}
              <span className="gradient-text-teal">fingertips</span>
            </h1>

            <p className="text-lg text-text-muted mb-10 leading-relaxed max-w-lg">
              Experience a new standard of medical care where clinical excellence meets modern convenience. Connect with top-tier specialists instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <Link
                href="/doctors"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-teal-400 hover:to-teal-500 active:scale-[0.98] transition-all shadow-teal-glow hover:shadow-lg hover:scale-[1.02]"
              >
                Book Appointment
                <span className="material-symbols-outlined">calendar_today</span>
              </Link>
              <Link
                href="/doctors"
                className="inline-flex items-center justify-center gap-2 border border-dark-border text-text-primary px-8 py-4 rounded-xl font-bold text-lg hover:border-teal-500/40 hover:text-brand-teal hover:bg-teal-500/5 active:scale-[0.98] transition-all"
              >
                Find Doctors
                <span className="material-symbols-outlined">person_search</span>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {["teal", "sky", "indigo"].map((c, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full border-2 border-dark-bg flex items-center justify-center font-bold text-sm
                      ${c === "teal" ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white" : c === "sky" ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white" : "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"}`}
                  >
                    {["D", "M", "S"][i]}
                  </div>
                ))}
              </div>
              <div className="text-sm text-text-muted">
                <span className="text-brand-teal font-bold">500+</span> Specialized Doctors Online
              </div>
            </div>
          </div>

          {/* Right: floating stat cards */}
          <div className="absolute right-8 lg:right-24 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4">
            {[
              { icon: "calendar_today", label: "Appointments Today", value: "248", color: "from-teal-500 to-teal-600" },
              { icon: "star", label: "Average Rating", value: "4.9★", color: "from-indigo-500 to-indigo-600" },
              { icon: "medical_services", label: "Specializations", value: "40+", color: "from-sky-500 to-sky-600" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 w-52 hover:scale-[1.02] transition-transform cursor-default">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {stat.icon}
                  </span>
                </div>
                <p className="text-xs text-text-muted font-medium mb-0.5">{stat.label}</p>
                <p className="text-2xl font-extrabold text-text-primary">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Services Section ── */}
        <section className="py-24 px-8 md:px-16 bg-slate-900/50">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
              Our Services
            </div>
            <h2 className="text-4xl font-extrabold text-text-primary mb-3">World-Class Care</h2>
            <p className="text-text-muted max-w-lg mx-auto">Everything you need for comprehensive healthcare management in one elegant platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: "medical_services",
                title: "Consultation",
                desc: "In-depth medical evaluations with leading specialists across 40+ medical disciplines.",
                color: "from-teal-500 to-teal-600",
                bg: "from-teal-500/10 to-teal-600/5",
                border: "border-teal-500/20",
                href: "/doctors",
                linkLabel: "Book Now",
                linkColor: "text-teal-400",
              },
              {
                icon: "emergency",
                title: "Emergency",
                desc: "Rapid response healthcare services available 24/7 for critical medical needs.",
                color: "from-red-500 to-rose-600",
                bg: "from-red-500/10 to-red-600/5",
                border: "border-red-500/20",
                href: "#",
                linkLabel: "Immediate Help",
                linkColor: "text-red-400",
              },
              {
                icon: "videocam",
                title: "Online Care",
                desc: "Secure video consultations from home. Prescription refills and ongoing monitoring.",
                color: "from-indigo-500 to-indigo-600",
                bg: "from-indigo-500/10 to-indigo-600/5",
                border: "border-indigo-500/20",
                href: "/doctors",
                linkLabel: "Start Call",
                linkColor: "text-indigo-400",
              },
            ].map((svc) => (
              <div
                key={svc.title}
                className={`bg-gradient-to-br ${svc.bg} border ${svc.border} rounded-2xl p-8 flex flex-col gap-4 hover:scale-[1.02] transition-all hover:shadow-dark-xl group`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${svc.color} flex items-center justify-center shadow-lg`}>
                  <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {svc.icon}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-text-primary">{svc.title}</h3>
                <p className="text-text-muted leading-relaxed text-sm flex-1">{svc.desc}</p>
                <Link
                  href={svc.href}
                  className={`${svc.linkColor} font-semibold flex items-center gap-1 text-sm hover:gap-2 transition-all`}
                >
                  {svc.linkLabel}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features Section ── */}
        <section className="py-24 px-8 md:px-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider mb-6">
                Smart Diagnostics
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-8 leading-tight">
                Smart diagnostics with a{" "}
                <span className="gradient-text-teal">human touch</span>
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: "check_circle",
                    title: "Precision AI Integration",
                    desc: "Advanced algorithms to help our doctors identify risks earlier.",
                    color: "text-teal-400",
                  },
                  {
                    icon: "sync",
                    title: "Seamless Health Data",
                    desc: "Sync your wearables and health records in one secure hub.",
                    color: "text-indigo-400",
                  },
                  {
                    icon: "shield",
                    title: "Bank-Level Security",
                    desc: "All data encrypted with 256-bit SSL. HIPAA compliant infrastructure.",
                    color: "text-sky-400",
                  },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4 items-start">
                    <div className={`w-10 h-10 rounded-xl bg-slate-800 border border-dark-border flex items-center justify-center shrink-0 mt-0.5`}>
                      <span
                        className={`material-symbols-outlined ${f.color}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {f.icon}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary mb-1">{f.title}</h4>
                      <p className="text-text-muted text-sm">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="relative hidden lg:block">
              <div className="bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-dark-border rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: "calendar_today", label: "Appointments", value: "1,248", accent: "teal" },
                    { icon: "star", label: "Avg Rating", value: "4.9 / 5", accent: "yellow" },
                    { icon: "group", label: "Doctors", value: "500+", accent: "sky" },
                    { icon: "location_city", label: "Clinics", value: "120+", accent: "indigo" },
                  ].map((s) => (
                    <div key={s.label} className="bg-dark-card border border-dark-border rounded-2xl p-5">
                      <span
                        className={`material-symbols-outlined text-2xl mb-2 block
                          ${s.accent === "teal" ? "text-teal-400" : s.accent === "yellow" ? "text-yellow-400" : s.accent === "sky" ? "text-sky-400" : "text-indigo-400"}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {s.icon}
                      </span>
                      <p className="text-xs text-text-muted mb-1">{s.label}</p>
                      <p className="text-xl font-extrabold text-text-primary">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="py-20 px-8 md:px-16 bg-slate-900/50">
          <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-indigo-700" />
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="relative z-10 p-12 md:p-20 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-6">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Trusted by 10,000+ Patients
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                Ready to prioritize your health?
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
                Join Clinical Ethereal today and get access to premier medical care from anywhere in the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="bg-white text-teal-700 px-10 py-4 rounded-xl font-extrabold text-lg hover:bg-slate-50 active:scale-[0.98] transition-all hover:scale-[1.02] shadow-xl"
                >
                  Create Patient Account
                </Link>
                <Link
                  href="/register-clinic"
                  className="bg-white/10 border border-white/30 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/20 active:scale-[0.98] transition-all flex items-center gap-2 justify-center"
                >
                  <span className="material-symbols-outlined text-xl">local_hospital</span>
                  Register Your Clinic
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
