import React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, dark = false, ...props }) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-colors",
        "focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        dark
          ? "border-white/25 bg-white/5 text-white placeholder:text-slate-400 focus:ring-white/40"
          : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-slate-400",
        className
      )}
      {...props}
    />
  );
}
