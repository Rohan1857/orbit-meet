"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Plus, Calendar, ScreenShare } from "lucide-react";
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
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-2 text-xs font-medium text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* 1. New Meeting */}
        <button
          onClick={handleNewMeeting}
          disabled={isCreating}
          className="group relative flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-5 text-center transition-all hover:border-[#0e72ed] hover:shadow-md disabled:opacity-60"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#0e72ed] text-white shadow-sm transition-transform group-hover:scale-105">
            {isCreating ? (
              <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Video className="h-7 w-7" />
            )}
          </div>
          <span className="text-sm font-semibold text-text-primary">New Meeting</span>
          <span className="text-xs text-text-muted mt-0.5">Start instantly</span>
        </button>

        {/* 2. Join */}
        <button
          onClick={() => router.push("/join")}
          className="group flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-5 text-center transition-all hover:border-[#0e72ed] hover:shadow-md"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-muted text-[#0e72ed] border border-border-subtle shadow-sm transition-transform group-hover:scale-105">
            <Plus className="h-7 w-7" />
          </div>
          <span className="text-sm font-semibold text-text-primary">Join</span>
          <span className="text-xs text-text-muted mt-0.5">Via code or link</span>
        </button>

        {/* 3. Schedule */}
        <button
          onClick={onScheduleClick}
          className="group flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-5 text-center transition-all hover:border-[#0e72ed] hover:shadow-md"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-muted text-text-secondary border border-border-subtle shadow-sm transition-transform group-hover:scale-105">
            <Calendar className="h-7 w-7" />
          </div>
          <span className="text-sm font-semibold text-text-primary">Schedule</span>
          <span className="text-xs text-text-muted mt-0.5">Plan for later</span>
        </button>

        {/* 4. Share Screen */}
        <button
          onClick={handleShareScreen}
          disabled={isCreating}
          className="group flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-5 text-center transition-all hover:border-[#0e72ed] hover:shadow-md disabled:opacity-60"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-muted text-text-secondary border border-border-subtle shadow-sm transition-transform group-hover:scale-105">
            <ScreenShare className="h-7 w-7" />
          </div>
          <span className="text-sm font-semibold text-text-primary">Share Screen</span>
          <span className="text-xs text-text-muted mt-0.5">Direct presentation</span>
        </button>
      </div>
    </div>
  );
};
