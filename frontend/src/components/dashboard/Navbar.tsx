"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video, Settings, HelpCircle, LogOut, User as UserIcon, LogIn } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setCurrentTime(format(new Date(), "EEE, MMM d • h:mm a"));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    router.push("/login");
  };

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

        {/* Right utility items & User Profile / Login */}
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

          {/* User state */}
          {isLoading ? (
            <div className="h-8 w-24 rounded bg-surface-muted animate-pulse" />
          ) : user ? (
            <div className="relative pl-2 border-l border-border-subtle" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-surface-hover transition-colors focus:outline-hidden"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
              >
                <Avatar name={user.display_name} src={user.avatar_url} size="sm" />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-text-primary leading-tight">
                    {user.display_name}
                  </span>
                  <span className="text-[11px] text-text-muted leading-none truncate max-w-[130px]">
                    {user.email}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-surface p-2 shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-border-subtle mb-1">
                    <p className="text-xs font-semibold text-text-primary">{user.display_name}</p>
                    <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 rounded-md transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="pl-2 border-l border-border-subtle">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0e72ed] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0c63ce] transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
