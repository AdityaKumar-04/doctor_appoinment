import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  indigo?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className = "",
  hover = false,
  glass = true, // Default to glass for SaaS look
  indigo = false,
  padding = "md",
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border transition-all duration-300
        ${glass ? "glass-card" : "bg-[#161d2e] border-white/5"}
        ${indigo ? "bg-indigo-600/10 border-indigo-500/20 shadow-indigo-500/5 shadow-xl" : ""}
        ${hover ? "hover:scale-[1.01] hover:border-white/20 cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${PADDING[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-lg font-bold text-white tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm text-slate-400 font-medium ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-6 pt-6 border-t border-white/5 flex items-center gap-4 ${className}`}>
      {children}
    </div>
  );
}
