import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = "md", className }) => {
  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (n.slice(0, 2) || "U").toUpperCase();
  };

  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base font-medium",
    xl: "h-20 w-20 text-2xl font-semibold",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-[#0e72ed] text-white flex items-center justify-center select-none font-medium shadow-sm",
        sizeClasses[size],
        className
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
};
