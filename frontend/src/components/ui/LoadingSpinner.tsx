/**
 * LoadingSpinner — Animated loading indicator with optional label.
 */
import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

export function LoadingSpinner({ size = "md", label, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full border-sky-500/30 border-t-sky-400 animate-spin`}
        role="status"
        aria-label={label ?? "Yükleniyor"}
      />
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );
}

/**
 * FullPageLoader — Centered loading overlay for page transitions.
 */
export function FullPageLoader({ label = "Yükleniyor..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sky-400 text-xl">✈️</span>
          </div>
        </div>
        <p className="text-slate-300 text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
