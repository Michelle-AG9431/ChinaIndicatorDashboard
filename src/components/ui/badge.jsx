import React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "outline"
          ? "border border-slate-300 text-slate-700"
          : "bg-slate-900 text-white",
        className
      )}
      {...props}
    />
  );
}
