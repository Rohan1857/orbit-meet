"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Settings, HelpCircle, Bell } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { format } from "date-fns";

export const Navbar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const update = () => setCurrentTime(format(new Date(), "EEE, MMM d • h:mm a"));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-15 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0e72ed] text-white shadow-sm transition-transform group-hover:scale-105">
            <Video className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-text-primary">
              OrbitMeet
            </span>
            <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
              Conferencing
            </span>
          </div>
        </Link>

        {/* Center Live Clock */}
        <div className="hidden md:flex items-center text-xs font-medium text-text-secondary bg-surface-muted px-3 py-1.5 rounded-md border border-border-subtle">
          {currentTime || "OrbitMeet Online"}
        </div>

        {/* Right utility items & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="rounded-md p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors hidden sm:inline-flex"
            title="Help & Documentation"
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-border-subtle">
            <Avatar name="Rohan" size="sm" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-text-primary leading-tight">
                Rohan
              </span>
              <span className="text-[11px] text-text-muted leading-none">
                Host Account
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
