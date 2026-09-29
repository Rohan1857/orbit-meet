"use client";

import React, { useState } from "react";
import { Copy, Check, Video, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { Meeting } from "@/types";
import { formatMeetingCode, formatScheduleDisplay } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("45");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setDuration("45");
    setError(null);
    setCreatedMeeting(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
      onSuccess();
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdMeeting ? "Meeting Scheduled" : "Schedule a Meeting"}
      description={
        createdMeeting
          ? "Your meeting is registered and invite link is ready."
          : "Plan an upcoming session and generate a permanent invite code."
      }
    >
      {createdMeeting ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-border-subtle bg-surface-muted p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <CalendarCheck className="h-4 w-4 text-[#0e72ed]" />
              <span>{createdMeeting.title}</span>
            </div>
            <div className="text-xs text-text-secondary space-y-1">
              <div>
                <span className="text-text-muted">Time: </span>
                {formatScheduleDisplay(createdMeeting.scheduled_at)}
              </div>
              <div>
                <span className="text-text-muted">Duration: </span>
                {createdMeeting.duration_minutes || 45} minutes
              </div>
              <div>
                <span className="text-text-muted">Meeting ID: </span>
                <span className="font-mono font-medium text-text-primary">
                  {formatMeetingCode(createdMeeting.meeting_code)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="md"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-text-secondary" />
                  <span>Copy Invite Link</span>
                </>
              )}
            </Button>
            <Link href={`/meeting/${createdMeeting.meeting_code}`}>
              <Button size="md" className="gap-2 w-full sm:w-auto">
                <Video className="h-4 w-4" />
                <span>Start Now</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              {error}
            </div>
          )}

          <Input
            label="Topic / Title"
            placeholder="e.g. Design Architecture Review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none"
              placeholder="Brief agenda or discussion notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Date
              </label>
              <input
                type="date"
                className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Duration
            </label>
            <select
              className="w-full h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Schedule Meeting
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
