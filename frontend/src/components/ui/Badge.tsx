/**
 * Badge — Status indicator badge for crisis severity and state.
 */
import React from "react";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  label: string;
  variant?: Variant;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  danger: "bg-red-500/20 text-red-400 border-red-500/30",
  info: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  neutral: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const pulseColors: Record<Variant, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-sky-400",
  neutral: "bg-slate-400",
};

export function Badge({ label, variant = "neutral", pulse = false, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColors[variant]}`}
          />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColors[variant]}`} />
        </span>
      )}
      {label}
    </span>
  );
}

/** Map API crisis status strings to badge variants */
export function crisisStatusBadge(status: string): { label: string; variant: Variant; pulse: boolean } {
  switch (status?.toLowerCase()) {
    case "processing":
      return { label: "İşleniyor", variant: "warning", pulse: true };
    case "resolved":
      return { label: "Çözüldü", variant: "success", pulse: false };
    case "failed":
      return { label: "Hata", variant: "danger", pulse: false };
    case "pending":
      return { label: "Bekliyor", variant: "info", pulse: true };
    default:
      return { label: status ?? "Bilinmiyor", variant: "neutral", pulse: false };
  }
}
