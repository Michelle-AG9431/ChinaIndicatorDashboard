import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  ghost: "text-slate-900 hover:bg-slate-100",
  // 深色背景專用
  darkOutline:
    "border border-white/25 bg-white/5 text-white hover:bg-white/15 hover:border-white/40",
  darkGhost: "text-slate-200 hover:bg-white/10 hover:text-white",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 text-xs",
  lg: "h-11 px-6 text-base",
  icon: "h-10 w-10",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant] ?? variants.default,
        sizes[size] ?? sizes.default,
        className
      )}
      {...props}
    />
  );
}
