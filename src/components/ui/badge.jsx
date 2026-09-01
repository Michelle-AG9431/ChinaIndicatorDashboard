import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-slate-900 text-white",
  outline: "border border-slate-300 text-slate-700",
  // 深色底用
  darkSolid: "bg-white text-slate-900",
  darkOutline: "border border-white/25 text-slate-200",
  warning: "border border-amber-400/40 bg-amber-400/10 text-amber-300",
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        variants[variant] ?? variants.default,
        className
      )}
      {...props}
    />
  );
}
