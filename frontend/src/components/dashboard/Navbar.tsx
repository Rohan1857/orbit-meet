"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Video,
  Settings,
  HelpCircle,
  LogOut,
  LogIn,
  Mic,
  VideoOff,
  Keyboard,
  ShieldCheck,
  Server,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Settings preferences stored in localStorage
  const [defaultMute, setDefaultMute] = useState(false);
  const [defaultVideoOff, setDefaultVideoOff] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setCurrentTime(format(new Date(), "EEE, MMM d • h:mm a"));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load preferences
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDefaultMute(localStorage.getItem("orbitmeet_default_mute") === "true");
      setDefaultVideoOff(localStorage.getItem("orbitmeet_default_video_off") === "true");
    }
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

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("orbitmeet_default_mute", defaultMute ? "true" : "false");
      localStorage.setItem("orbitmeet_default_video_off", defaultVideoOff ? "true" : "false");
    }
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
      setIsSettingsOpen(false);
    }, 800);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur-xs">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
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
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-md p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="rounded-md p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors hidden sm:inline-flex cursor-pointer"
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
                  className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-surface-hover transition-colors focus:outline-hidden cursor-pointer"
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
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsSettingsOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover rounded-md transition-colors text-left"
                    >
                      <Settings className="h-3.5 w-3.5 text-text-secondary" />
                      <span>Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsHelpOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover rounded-md transition-colors text-left"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-text-secondary" />
                      <span>Help & Shortcuts</span>
                    </button>

                    <div className="my-1 border-t border-border-subtle" />

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

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Application Settings"
        description="Configure meeting defaults, hardware preferences, and system connectivity."
      >
        <div className="space-y-5">
          {/* Section 1: Meeting Joining Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Meeting Join Defaults
            </h4>
            <div className="space-y-2.5 rounded-lg border border-border-subtle bg-surface-muted p-3.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-text-primary font-medium">
                  <Mic className="h-4 w-4 text-[#0e72ed]" />
                  <span>Always mute microphone when joining</span>
                </div>
                <input
                  type="checkbox"
                  checked={defaultMute}
                  onChange={(e) => setDefaultMute(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-[#0e72ed] focus:ring-[#0e72ed] cursor-pointer"
                />
              </label>

              <div className="border-t border-border-subtle/60" />

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-text-primary font-medium">
                  <VideoOff className="h-4 w-4 text-[#0e72ed]" />
                  <span>Always turn off camera when joining</span>
                </div>
                <input
                  type="checkbox"
                  checked={defaultVideoOff}
                  onChange={(e) => setDefaultVideoOff(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-[#0e72ed] focus:ring-[#0e72ed] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Infrastructure Diagnostics */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Live Infrastructure
            </h4>
            <div className="space-y-2 rounded-lg border border-border-subtle bg-surface-muted p-3.5 text-xs text-text-secondary">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-text-muted" />
                  <span>Realtime Media SFU:</span>
                </span>
                <span className="font-mono text-[11px] text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded font-semibold">
                  LiveKit Cloud Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-text-muted" />
                  <span>Backend Environment:</span>
                </span>
                <span className="font-mono text-[11px] text-[#1967d2] bg-[#e8f0fe] px-2 py-0.5 rounded font-semibold">
                  Railway Production
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            {settingsSaved ? (
              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved!
              </span>
            ) : (
              <span className="text-[11px] text-text-muted">Saved to browser profile</span>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSettings}
                className="text-xs font-semibold"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Help & Documentation Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Help & Conferencing Guide"
        description="Quick navigation, keyboard shortcuts, and conferencing controls."
      >
        <div className="space-y-5">
          {/* Section 1: Meeting Basics */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Meeting Controls
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border-subtle bg-surface-muted p-3 space-y-1">
                <p className="font-semibold text-text-primary">Instant Meetings</p>
                <p className="text-text-secondary text-[11px] leading-relaxed">
                  Click <strong>New Meeting</strong> on your dashboard to instantly launch a private 10-digit conference.
                </p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface-muted p-3 space-y-1">
                <p className="font-semibold text-text-primary">Guest Joining</p>
                <p className="text-text-secondary text-[11px] leading-relaxed">
                  Guests join freely via your invite link or meeting code with zero login requirement.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Shortcuts */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Keyboard className="h-3.5 w-3.5" />
              <span>Keyboard Shortcuts</span>
            </h4>
            <div className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface-muted text-xs">
              <div className="flex items-center justify-between p-2.5">
                <span className="text-text-secondary">Toggle Mute / Unmute</span>
                <kbd className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-primary font-semibold shadow-2xs">
                  Alt + A
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-text-secondary">Start / Stop Camera</span>
                <kbd className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-primary font-semibold shadow-2xs">
                  Alt + V
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-text-secondary">Toggle Screen Sharing</span>
                <kbd className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-primary font-semibold shadow-2xs">
                  Alt + S
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-text-secondary">Close Panels / Modals</span>
                <kbd className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-primary font-semibold shadow-2xs">
                  Escape
                </kbd>
              </div>
            </div>
          </div>

          {/* Section 3: Links */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
            <a
              href="https://github.com/Rohan1857/orbit-meet"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#0e72ed] hover:underline font-medium"
            >
              <span>GitHub Documentation</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <Button
              size="sm"
              onClick={() => setIsHelpOpen(false)}
              className="text-xs font-semibold"
            >
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
