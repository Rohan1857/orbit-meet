"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, Video, Calendar, Plus } from "lucide-react";
import { Meeting } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatMeetingCode, formatScheduleDisplay } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface UpcomingListProps {
  meetings: Meeting[];
  isLoading: boolean;
  onRefresh: () => void;
  onScheduleClick?: () => void;
}

export const UpcomingList: React.FC<UpcomingListProps> = ({
  meetings,
  isLoading,
  onScheduleClick,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (meeting: Meeting) => {
    const inviteUrl =
      meeting.invite_url || `${window.location.origin}/join?meeting=${meeting.meeting_code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(meeting.meeting_code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getCalendarBadge = (isoString?: string | null) => {
    if (!isoString) return { month: "MTG", day: "--" };
    try {
      const d = parseISO(isoString);
      return {
        month: format(d, "MMM").toUpperCase(),
        day: format(d, "d"),
      };
    } catch {
      return { month: "MTG", day: "--" };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-border bg-surface p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-border-subtle" />
              <div className="space-y-2">
                <div className="h-4 w-44 rounded bg-border-subtle" />
                <div className="h-3 w-28 rounded bg-border-subtle" />
              </div>
            </div>
            <div className="h-8 w-20 rounded bg-border-subtle" />
          </div>
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/50 p-5 text-center space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-text-muted border border-border-subtle">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-text-primary">No upcoming meetings</h4>
          <p className="mt-0.5 text-xs text-text-secondary max-w-xs mx-auto">
            Schedule a meeting or start one instantly.
          </p>
        </div>
        {onScheduleClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onScheduleClick}
            className="text-xs gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 text-[#0e72ed]" />
            <span>Schedule a meeting</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => {
        const cal = getCalendarBadge(meeting.scheduled_at);
        return (
          <div
            key={meeting.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-[#cbd5e1] hover:shadow-xs"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Date Box Indicator */}
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-muted shrink-0 text-center select-none shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e72ed] leading-none">
                  {cal.month}
                </span>
                <span className="text-base font-extrabold text-text-primary leading-tight mt-0.5">
                  {cal.day}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-text-primary truncate">
                    {meeting.title}
                  </h4>
                  <Badge variant="scheduled" className="shrink-0">
                    Upcoming
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">
                    {formatScheduleDisplay(meeting.scheduled_at)}
                  </span>
                  <span>•</span>
                  <span>{meeting.duration_minutes || 45} mins</span>
                  <span>•</span>
                  <span className="font-mono text-text-muted">
                    ID: {formatMeetingCode(meeting.meeting_code)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(meeting)}
                className="text-xs"
                title="Copy meeting invite link"
              >
                {copiedCode === meeting.meeting_code ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-text-secondary" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
              <Link href={`/meeting/${meeting.meeting_code}`}>
                <Button size="sm" className="gap-1.5 text-xs shadow-xs">
                  <Video className="h-3.5 w-3.5" />
                  <span>Start</span>
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};
