import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "meeting";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variantStyles = {
      primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
      secondary: "bg-surface-muted text-text-primary hover:bg-surface-hover border border-border-subtle",
      outline: "border border-border bg-surface hover:bg-surface-hover text-text-primary",
      ghost: "hover:bg-surface-hover text-text-secondary hover:text-text-primary",
      danger: "bg-danger text-white hover:bg-danger-hover shadow-sm",
      meeting: "bg-[#252830] text-[#e1e4ea] hover:bg-[#323642] border border-[#3a3f4d]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-sm gap-1.5",
      md: "h-10 px-4 text-sm rounded-md gap-2",
      lg: "h-12 px-6 text-base rounded-lg gap-2.5",
      icon: "h-10 w-10 rounded-md p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
