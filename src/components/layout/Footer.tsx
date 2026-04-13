import React from "react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-dark-border py-10 px-8 md:px-16">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_hospital
            </span>
          </div>
          <span className="font-extrabold text-text-primary tracking-tight">Clinical Ethereal</span>
        </div>
        <p className="text-text-muted text-sm">
          © {new Date().getFullYear()} Clinical Ethereal. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-slate-500">
          <span className="hover:text-brand-teal cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-brand-teal cursor-pointer transition-colors">Terms</span>
          <span className="hover:text-brand-teal cursor-pointer transition-colors">Support</span>
        </div>
      </div>
    </footer>
  );
}
