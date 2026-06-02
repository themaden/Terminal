/**
 * Card — Glass-morphism card container for dashboard panels.
 */
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
  id?: string;
}

export function Card({ children, className = "", title, subtitle, headerAction, noPadding, id }: CardProps) {
  return (
    <div
      id={id}
      className={`
        relative rounded-xl border border-slate-700/50
        bg-slate-900/60 backdrop-blur-md
        shadow-xl shadow-black/20
        ${className}
      `}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-700/50">
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}

/**
 * StatCard — Compact metric display card for the stats grid.
 */
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: { value: number; isUp: boolean };
  variant?: "default" | "danger" | "success" | "warning";
  id?: string;
}

const variantBorder: Record<string, string> = {
  default: "border-slate-700/50",
  danger: "border-red-500/30",
  success: "border-emerald-500/30",
  warning: "border-amber-500/30",
};

export function StatCard({ label, value, icon, trend, variant = "default", id }: StatCardProps) {
  return (
    <div
      id={id}
      className={`
        rounded-xl border ${variantBorder[variant]}
        bg-slate-900/60 backdrop-blur-md p-5
        shadow-xl shadow-black/20
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="text-3xl font-bold text-slate-100">{value}</div>
      {trend && (
        <div className={`mt-2 text-xs font-medium ${trend.isUp ? "text-emerald-400" : "text-red-400"}`}>
          {trend.isUp ? "↑" : "↓"} {Math.abs(trend.value)}% son 24 saat
        </div>
      )}
    </div>
  );
}
