"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Video,
  CalendarCheck,
  Clock,
  FileText,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/dashboard/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { Meeting } from "@/types";
import { formatMeetingCode, formatScheduleDisplay } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function SchedulePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("45");
  const [autoMute, setAutoMute] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login?redirect=/schedule");
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading || (!user && !isAuthLoading)) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center space-y-3">
        <svg className="h-7 w-7 animate-spin text-[#0e72ed]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-text-muted">Loading schedule...</span>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a meeting topic");
      return;
    }
    if (!date || !time) {
      setError("Please select both a date and start time");
      return;
    }

    try {
      const scheduledDateTime = new Date(`${date}T${time}:00`);
      if (isNaN(scheduledDateTime.getTime())) {
        setError("Invalid date or time selected");
        return;
      }
      if (scheduledDateTime.getTime() <= Date.now()) {
        setError("Scheduled date & time must be in the future");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const meeting = await api.createScheduledMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_at: scheduledDateTime.toISOString(),
        duration_minutes: parseInt(duration, 10),
        host_name: user?.display_name || "Host",
      });

      if (meeting.host_control_token) {
        sessionStorage.setItem(`host_token_${meeting.meeting_code}`, meeting.host_control_token);
      }

      setCreatedMeeting(meeting);
    } catch (err: any) {
      setError(err?.message || "Failed to schedule meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdMeeting) return;
    const url =
      createdMeeting.invite_url ||
      `${window.location.origin}/join?meeting=${createdMeeting.meeting_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-xl rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">
              Schedule a Meeting
            </h2>
            <p className="text-xs text-text-secondary">
              Plan an upcoming meeting and share the invite link.
            </p>
          </div>

          {createdMeeting ? (
            <div className="space-y-5 animate-in fade-in">
              <div className="rounded-xl border border-border-subtle bg-surface-muted p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <CalendarCheck className="h-5 w-5 text-[#0e72ed]" />
                  <span>{createdMeeting.title}</span>
                </div>
                <div className="text-xs text-text-secondary divide-y divide-border-subtle/60">
                  <div className="py-1.5 flex justify-between">
                    <span className="text-text-muted">Start Time:</span>
                    <span className="font-semibold text-text-primary">
                      {formatScheduleDisplay(createdMeeting.scheduled_at)}
                    </span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-text-muted">Duration:</span>
                    <span>{createdMeeting.duration_minutes || 45} minutes</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-text-muted">Room Code:</span>
                    <span className="font-mono font-semibold text-[#0e72ed]">
                      {formatMeetingCode(createdMeeting.meeting_code)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
                <Button variant="outline" size="md" onClick={handleCopy} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-text-secondary" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
                <Link href={`/meeting/${createdMeeting.meeting_code}`}>
                  <Button size="md" className="gap-2 w-full sm:w-auto font-semibold">
                    <Video className="h-4 w-4" />
                    <span>Start Meeting</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger">
                  {error}
                </div>
              )}

              {/* Group 1: Meeting Details */}
              <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-muted/40 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                  <FileText className="h-3.5 w-3.5 text-[#0e72ed]" />
                  <span>Meeting Details</span>
                </div>

                <Input
                  label="Topic / Title"
                  placeholder="e.g. Weekly Product Architecture Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Agenda Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e72ed] resize-none"
                    placeholder="Key talking points or agenda links..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Group 2: Date & Time */}
              <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-muted/40 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                  <Clock className="h-3.5 w-3.5 text-[#0e72ed]" />
                  <span>Date & Schedule</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e72ed]"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e72ed]"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Estimated Duration
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e72ed]"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    <option value="15">15 minutes (Quick Standup)</option>
                    <option value="30">30 minutes (Standard Sync)</option>
                    <option value="45">45 minutes (Default)</option>
                    <option value="60">1 hour (Comprehensive)</option>
                    <option value="90">1.5 hours (Workshop / Sprint)</option>
                  </select>
                </div>
              </div>

              {/* Group 3: Conferencing Options */}
              <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-muted/40 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                  <Sliders className="h-3.5 w-3.5 text-[#0e72ed]" />
                  <span>Conferencing Options</span>
                </div>

                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                  <span className="text-text-primary font-medium">Mute participants upon entry</span>
                  <input
                    type="checkbox"
                    checked={autoMute}
                    onChange={(e) => setAutoMute(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-[#0e72ed] focus:ring-[#0e72ed] cursor-pointer"
                  />
                </label>

                <div className="flex items-center gap-1 text-[11px] text-text-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                  <span>Host moderation controls will be enabled automatically for your account.</span>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="ghost" onClick={() => router.push("/")} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="text-xs font-semibold px-5">
                  Schedule Meeting
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
