/**
 * Button — Accessible, styled button with multiple variants.
 */
import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-600 hover:bg-sky-500 text-white border border-sky-500/50 shadow-sky-500/20",
  secondary:
    "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600/50",
  danger:
    "bg-red-600/80 hover:bg-red-500 text-white border border-red-500/50 shadow-red-500/20",
  ghost:
    "bg-transparent hover:bg-slate-800 text-slate-300 border border-transparent",
  outline:
    "bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150 shadow-lg
        focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-1 focus:ring-offset-slate-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
