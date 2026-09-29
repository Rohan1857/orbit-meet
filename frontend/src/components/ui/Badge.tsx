import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "live" | "scheduled" | "ended" | "host";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className,
}) => {
  const variantStyles = {
    neutral: "bg-surface-muted text-text-secondary border-border-subtle",
    live: "bg-[#e6f4ea] text-[#137333] border-[#ceead6]",
    scheduled: "bg-[#e8f0fe] text-[#1967d2] border-[#d2e3fc]",
    ended: "bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]",
    host: "bg-[#fef7e0] text-[#b06000] border-[#fce8b2]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
