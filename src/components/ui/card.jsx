import React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, dark = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border",
        dark
          ? "border-white/10 bg-white/5 text-slate-100"
          : "border-slate-200 bg-white text-slate-900",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("p-6 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("text-base font-semibold leading-tight", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
  );
}
