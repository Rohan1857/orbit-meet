"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/dashboard/Navbar";
import { ActionCluster } from "@/components/dashboard/ActionCluster";
import { UpcomingList } from "@/components/dashboard/UpcomingList";
import { RecentList } from "@/components/dashboard/RecentList";
import { ScheduleModal } from "@/components/dashboard/ScheduleModal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Meeting } from "@/types";
import {
  Video,
  Calendar,
  Keyboard,
} from "lucide-react";
import { formatScheduleDisplay } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Protected route: Redirect unauthenticated users to /login
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login");
    }
  }, [isAuthLoading, user, router]);

  const fetchMeetings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setBackendError(null);
    try {
      const [upcoming, recent] = await Promise.all([
        api.getUpcomingMeetings(10),
        api.getRecentMeetings(10),
      ]);
      setUpcomingMeetings(upcoming);
      setRecentMeetings(recent);
    } catch (err: any) {
      setBackendError(
        "Unable to connect to conferencing service. Please check your connection."
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user, fetchMeetings]);

  if (isAuthLoading || (!user && !isAuthLoading)) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center space-y-3">
        <svg className="h-7 w-7 animate-spin text-[#0e72ed]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-text-muted">Loading dashboard...</span>
      </div>
    );
  }

  const nextMeeting = upcomingMeetings[0];

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7">
        {backendError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger flex items-center justify-between">
            <span>{backendError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMeetings}
              className="text-xs"
            >
              Retry Connection
            </Button>
          </div>
        )}

        {/* Primary Action Cluster */}
        <section aria-label="Meeting actions">
          <ActionCluster onScheduleClick={() => setIsScheduleOpen(true)} />
        </section>

        {/* Next Meeting Banner Strip (if upcoming exists) */}
        {nextMeeting && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0e72ed]/10 text-[#0e72ed] border border-[#0e72ed]/20">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-[10px] font-bold text-[#0e72ed] uppercase tracking-wider">
                  Up Next
                </div>
                <div className="text-sm font-bold text-text-primary truncate">
                  {nextMeeting.title}
                </div>
                <div className="text-xs text-text-secondary">
                  {formatScheduleDisplay(nextMeeting.scheduled_at)} • {nextMeeting.duration_minutes || 45} mins
                </div>
              </div>
            </div>
            <Link href={`/meeting/${nextMeeting.meeting_code}`}>
              <Button size="sm" className="gap-1.5 self-start sm:self-center shadow-xs">
                <Video className="h-4 w-4" />
                <span>Join Now</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Balanced 2-Column Responsive Dashboard Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* Main Column: Upcoming Meetings & Past Sessions (7 cols) */}
          <div className="lg:col-span-8 space-y-7">
            {/* Upcoming Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                    Upcoming Meetings
                  </h3>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                    {upcomingMeetings.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsScheduleOpen(true)}
                  className="text-xs text-[#0e72ed] hover:text-[#0b5cdb] h-7 px-2 font-semibold"
                >
                  + Schedule
                </Button>
              </div>
              <UpcomingList
                meetings={upcomingMeetings}
                isLoading={isLoading}
                onRefresh={fetchMeetings}
                onScheduleClick={() => setIsScheduleOpen(true)}
              />
            </section>

            {/* Recent Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                    Recent Meetings
                  </h3>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                    {recentMeetings.length}
                  </span>
                </div>
                <span className="text-xs text-text-muted">
                  History
                </span>
              </div>
              <RecentList
                meetings={recentMeetings}
                isLoading={isLoading}
              />
            </section>
          </div>

          {/* Right Column: Quick Shortcuts (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Quick Shortcuts Card */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5" />
                  <span>Quick Shortcuts</span>
                </span>
              </div>

              <div className="divide-y divide-border-subtle text-xs text-text-secondary">
                <div className="flex items-center justify-between py-2">
                  <span>Toggle Microphone</span>
                  <kbd className="rounded border border-border bg-surface-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-text-primary shadow-2xs">
                    Alt + A
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Toggle Camera</span>
                  <kbd className="rounded border border-border bg-surface-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-text-primary shadow-2xs">
                    Alt + V
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={fetchMeetings}
      />
    </div>
  );
}
