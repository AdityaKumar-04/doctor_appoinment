import React, { memo } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "glass" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-lg shadow-teal-500/20 hover:scale-[1.02] hover:shadow-teal-500/30",
  secondary: "bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:border-white/20",
  glass: "glass-card text-white hover:bg-white/10 active:scale-[0.98]",
  outline: "bg-transparent border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:border-teal-500",
  ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
  danger: "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs rounded-lg gap-2",
  md: "h-11 px-6 text-sm rounded-xl gap-2.5",
  lg: "h-14 px-8 text-base rounded-2xl gap-3",
  icon: "h-11 w-11 rounded-xl p-0",
};

const Button = memo(({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-bold tracking-tight
        transition-all duration-300 ease-out active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0 inline-flex items-center justify-center">{icon}</span>
      )}
      <span className={loading ? "hidden" : "inline-flex items-center gap-2"}>{children}</span>
      {iconRight && !loading && (
        <span className="shrink-0 inline-flex items-center justify-center">{iconRight}</span>
      )}
    </button>
  );
});

Button.displayName = "Button";
export default Button;
