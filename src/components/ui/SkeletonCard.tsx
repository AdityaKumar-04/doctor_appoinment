import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = "", width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton animate-pulse bg-white/5 rounded-lg ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-5">
        <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-2/5 rounded-full" />
          <Skeleton className="h-3.5 w-1/4 rounded-full" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === rows - 1 ? "w-2/3" : "w-full"} rounded-full`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-1/2 rounded-full opacity-60" />
        <Skeleton className="h-8 w-2/3 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="glass-card rounded-xl p-5 flex items-center gap-5"
        >
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-4 w-1/3 rounded-full" />
            <Skeleton className="h-3 w-1/4 rounded-full opacity-60" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDoctorCard() {
  return (
    <div className="glass-card rounded-3xl p-8 space-y-6">
      <div className="flex gap-6">
        <Skeleton className="w-24 h-24 rounded-3xl shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <Skeleton className="h-6 w-3/4 rounded-full" />
          <Skeleton className="h-8 w-1/2 rounded-lg" />
          <Skeleton className="h-5 w-1/3 rounded-md" />
        </div>
      </div>
      <div className="space-y-4 pt-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-12 flex-1 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
