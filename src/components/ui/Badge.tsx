import React, { memo } from "react";

type BadgeVariant =
  | "pending"
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "info"
  | "warning"
  | "success"
  | "teal"
  | "indigo"
  | "emerald"
  | "amber"
  | "sky"
  | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  icon?: string;
  className?: string;
  size?: "sm" | "md";
}

const VARIANT_STYLES: Record<BadgeVariant, { classes: string; defaultIcon?: string }> = {
  pending:   { classes: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",   defaultIcon: "pending" },
  scheduled: { classes: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",   defaultIcon: "pending" },
  confirmed: { classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5", defaultIcon: "check_circle" },
  completed: { classes: "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-sky-500/5",         defaultIcon: "task_alt" },
  cancelled: { classes: "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5",         defaultIcon: "cancel" },
  success:   { classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5", defaultIcon: "check_circle" },
  warning:   { classes: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",   defaultIcon: "warning" },
  info:      { classes: "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-sky-500/5",         defaultIcon: "info" },
  teal:      { classes: "bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-teal-500/5",       defaultIcon: "verified" },
  indigo:    { classes: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/5", defaultIcon: "bolt" },
  emerald:   { classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5", defaultIcon: "check" },
  amber:     { classes: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",   defaultIcon: "priority_high" },
  sky:       { classes: "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-sky-500/5",         defaultIcon: "info" },
  default:   { classes: "bg-white/5 text-slate-400 border-white/10",          defaultIcon: undefined },
};

const Badge = memo(({
  variant = "default",
  children,
  icon,
  className = "",
  size = "sm",
}: BadgeProps) => {
  const config = VARIANT_STYLES[variant];
  const iconName = icon ?? config.defaultIcon;
  const textSize = size === "sm" ? "text-[10px]" : "text-[11px]";
  const padding = size === "sm" ? "px-2.5 py-1" : "px-3.5 py-1.5";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 ${padding} rounded-full
        ${textSize} font-black uppercase tracking-[0.1em] border shadow-sm
        ${config.classes}
        ${className}
      `}
    >
      {iconName && (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: size === "sm" ? "12px" : "14px", fontVariationSettings: "'FILL' 1" }}
        >
          {iconName}
        </span>
      )}
      {children}
    </span>
  );
});

Badge.displayName = "Badge";
export default Badge;
