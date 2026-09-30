"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Plus, Calendar, ScreenShare, ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface ActionClusterProps {
  onScheduleClick: () => void;
}

export const ActionCluster: React.FC<ActionClusterProps> = ({ onScheduleClick }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewMeeting = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const meeting = await api.createInstantMeeting({ host_name: user?.display_name || "Host" });
      if (meeting.host_control_token) {
        sessionStorage.setItem(`host_token_${meeting.meeting_code}`, meeting.host_control_token);
      }
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create instant meeting");
      setIsCreating(false);
    }
  };

  const handleShareScreen = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const meeting = await api.createInstantMeeting({
        host_name: user?.display_name || "Host",
        title: "Screen Share Session",
      });
      if (meeting.host_control_token) {
        sessionStorage.setItem(`host_token_${meeting.meeting_code}`, meeting.host_control_token);
      }
      router.push(`/meeting/${meeting.meeting_code}?share=true`);
    } catch (err: any) {
      setError(err?.message || "Failed to start screen share");
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs font-medium text-danger">
          {error}
        </div>
      )}

      {/* Primary Action Grid with Asymmetric Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        {/* 1. New Meeting (Primary Hero Action - Spans 6 cols on md) */}
        <button
          type="button"
          onClick={handleNewMeeting}
          disabled={isCreating}
          className="md:col-span-6 group relative flex flex-col justify-between rounded-xl bg-[#0e72ed] p-6 text-left text-white shadow-sm transition-all hover:bg-[#0b5cdb] hover:shadow-md cursor-pointer select-none disabled:opacity-75"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs transition-transform group-hover:scale-105">
              {isCreating ? (
                <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Video className="h-6 w-6" />
              )}
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
              <Sparkles className="h-3 w-3" /> Instant
            </span>
          </div>

          <div className="mt-6 space-y-1">
            <h3 className="text-lg font-bold tracking-tight">New Meeting</h3>
            <p className="text-xs text-white/80 leading-relaxed max-w-sm">
              Launch a high-definition private conference room and invite participants with zero setup.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-white/95 group-hover:translate-x-0.5 transition-transform">
            <span>Start conference now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </button>

        {/* 2. Join (Secondary Action - Spans 3 cols on md) */}
        <button
          type="button"
          onClick={() => router.push("/join")}
          className="md:col-span-3 group flex flex-col justify-between rounded-xl border border-border bg-surface p-5 sm:p-6 text-left transition-all hover:border-[#0e72ed] hover:bg-surface-hover hover:shadow-xs active:scale-[0.99] cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-[#0e72ed] border border-border-subtle transition-transform group-hover:scale-105">
            <Plus className="h-5 w-5" />
          </div>

          <div className="my-3 space-y-0.5">
            <h4 className="text-sm font-bold text-text-primary">Join Meeting</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Via 10-digit room code or invite link
            </p>
          </div>

          <span className="text-xs font-medium text-[#0e72ed] flex items-center gap-1">
            Join room <ArrowRight className="h-3 w-3" />
          </span>
        </button>

        {/* 3. Schedule (Secondary Planning Action - Spans 3 cols on md) */}
        <button
          type="button"
          onClick={onScheduleClick}
          className="md:col-span-3 group flex flex-col justify-between rounded-xl border border-border bg-surface p-5 sm:p-6 text-left transition-all hover:border-[#0e72ed] hover:bg-surface-hover hover:shadow-xs active:scale-[0.99] cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-text-secondary border border-border-subtle transition-transform group-hover:scale-105">
            <Calendar className="h-5 w-5" />
          </div>

          <div className="my-3 space-y-0.5">
            <h4 className="text-sm font-bold text-text-primary">Schedule</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Plan ahead with calendar invite & agenda
            </p>
          </div>

          <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary flex items-center gap-1">
            Plan session <ArrowRight className="h-3 w-3" />
          </span>
        </button>
      </div>

      {/* 4. Tertiary Screen Share Utility Strip */}
      <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-muted/60 px-4 py-2.5 text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <ScreenShare className="h-4 w-4 text-[#0e72ed]" />
          <span className="font-medium text-text-primary">Direct Presentation:</span>
          <span className="hidden sm:inline text-text-muted">Start an instant conference with screen sharing enabled</span>
        </div>
        <button
          type="button"
          onClick={handleShareScreen}
          disabled={isCreating}
          className="inline-flex items-center gap-1 font-semibold text-[#0e72ed] hover:text-[#0b5cdb] hover:underline cursor-pointer disabled:opacity-50"
        >
          <span>Share Screen</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
