"use client";

import React, { useState } from "react";
import Link from "next/link";
import { History, Copy, Check, RotateCw } from "lucide-react";
import { Meeting } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatMeetingCode, formatScheduleDisplay } from "@/lib/utils";

interface RecentListProps {
  meetings: Meeting[];
  isLoading: boolean;
}

export const RecentList: React.FC<RecentListProps> = ({ meetings, isLoading }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
              <div className="h-10 w-10 rounded-lg bg-border-subtle" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-border-subtle" />
                <div className="h-3 w-28 rounded bg-border-subtle" />
              </div>
            </div>
            <div className="h-8 w-16 rounded bg-border-subtle" />
          </div>
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/50 p-8 text-center space-y-2">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-text-muted border border-border-subtle">
          <History className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold text-text-primary">No recent meetings</h4>
        <p className="mt-1 text-xs text-text-secondary max-w-xs mx-auto">
          Completed sessions and past conferences will be catalogued here for reference.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <div
          key={meeting.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-[#cbd5e1] hover:shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Archive History Icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-surface-muted shrink-0 text-text-secondary">
              <History className="h-5 w-5" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-text-primary truncate">
                  {meeting.title}
                </h4>
                <Badge variant={meeting.status === "live" ? "live" : "ended"} className="shrink-0">
                  {meeting.status === "live" ? "Live Now" : "Ended"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-secondary">
                <span>
                  {formatScheduleDisplay(meeting.ended_at || meeting.started_at || meeting.created_at)}
                </span>
                <span>•</span>
                <span className="font-mono text-text-muted">
                  ID: {formatMeetingCode(meeting.meeting_code)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(meeting.meeting_code)}
              className="text-xs"
              title="Copy meeting ID"
            >
              {copiedCode === meeting.meeting_code ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-text-secondary" />
                  <span>Copy ID</span>
                </>
              )}
            </Button>
            <Link href={`/meeting/${meeting.meeting_code}`}>
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs shadow-xs">
                <RotateCw className="h-3.5 w-3.5 text-text-secondary" />
                <span>Re-join</span>
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};
