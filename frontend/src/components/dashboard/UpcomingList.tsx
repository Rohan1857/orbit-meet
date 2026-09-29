"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, Video, Clock } from "lucide-react";
import { Meeting } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatMeetingCode, formatScheduleDisplay } from "@/lib/utils";

interface UpcomingListProps {
  meetings: Meeting[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const UpcomingList: React.FC<UpcomingListProps> = ({ meetings, isLoading }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (meeting: Meeting) => {
    const inviteUrl =
      meeting.invite_url || `${window.location.origin}/join?meeting=${meeting.meeting_code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(meeting.meeting_code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-border bg-surface p-4 flex items-center justify-between"
          >
            <div className="space-y-2">
              <div className="h-4 w-48 rounded bg-border-subtle" />
              <div className="h-3 w-32 rounded bg-border-subtle" />
            </div>
            <div className="h-8 w-20 rounded bg-border-subtle" />
          </div>
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center">
        <Clock className="mx-auto h-8 w-8 text-text-muted mb-2 stroke-[1.5]" />
        <h4 className="text-sm font-semibold text-text-primary">No upcoming meetings</h4>
        <p className="mt-1 text-xs text-text-secondary max-w-sm mx-auto">
          Meetings you schedule will appear here with one-click launch and shareable invite links.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <div
          key={meeting.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 transition-all hover:border-border-subtle hover:shadow-sm"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-text-primary">{meeting.title}</h4>
              <Badge variant="scheduled">Scheduled</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
              <span>{formatScheduleDisplay(meeting.scheduled_at)}</span>
              <span>•</span>
              <span>{meeting.duration_minutes || 45} mins</span>
              <span>•</span>
              <span className="font-mono text-text-muted">
                ID: {formatMeetingCode(meeting.meeting_code)}
              </span>
            </div>
            {meeting.description && (
              <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                {meeting.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(meeting)}
              className="text-xs"
              title="Copy meeting invite URL"
            >
              {copiedCode === meeting.meeting_code ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-text-secondary" />
                  <span>Copy Invite</span>
                </>
              )}
            </Button>
            <Link href={`/meeting/${meeting.meeting_code}`}>
              <Button size="sm" className="gap-1.5 text-xs">
                <Video className="h-3.5 w-3.5" />
                <span>Start</span>
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};
