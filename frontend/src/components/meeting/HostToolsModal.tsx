"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, Unlock, VolumeX, PhoneOff, Monitor, Mic } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Meeting } from "@/types";

interface HostToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  hostToken: string | null;
  onMeetingUpdated: (updated: Partial<Meeting>) => void;
  onEndMeetingForAll: () => void;
}

export const HostToolsModal: React.FC<HostToolsModalProps> = ({
  isOpen,
  onClose,
  meeting,
  hostToken,
  onMeetingUpdated,
  onEndMeetingForAll,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleToggleLock = async () => {
    if (!hostToken) return;
    setLoadingAction("lock");
    try {
      if (meeting.is_locked) {
        await api.unlockMeeting(meeting.meeting_code, hostToken);
        onMeetingUpdated({ is_locked: false });
        showStatus("Meeting unlocked. Guests can now join.");
      } else {
        await api.lockMeeting(meeting.meeting_code, hostToken);
        onMeetingUpdated({ is_locked: true });
        showStatus("Meeting locked. New guests cannot join.");
      }
    } catch {
      showStatus("Failed to update lock status.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMuteAll = async () => {
    if (!hostToken) return;
    setLoadingAction("muteAll");
    try {
      await api.muteAll(meeting.meeting_code, hostToken);
      showStatus("Muted all attendees.");
    } catch {
      showStatus("Failed to mute all attendees.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleUnmutePerm = async () => {
    if (!hostToken) return;
    setLoadingAction("permUnmute");
    const nextVal = !meeting.allow_participant_unmute;
    try {
      await api.updateMeetingPermissions(
        meeting.meeting_code,
        { allow_participant_unmute: nextVal },
        hostToken
      );
      onMeetingUpdated({ allow_participant_unmute: nextVal });
      showStatus(nextVal ? "Attendees can unmute themselves." : "Attendees cannot unmute themselves.");
    } catch {
      showStatus("Failed to update unmute permission.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleScreenSharePerm = async () => {
    if (!hostToken) return;
    setLoadingAction("permScreen");
    const nextVal = !meeting.allow_participant_screen_share;
    try {
      await api.updateMeetingPermissions(
        meeting.meeting_code,
        { allow_participant_screen_share: nextVal },
        hostToken
      );
      onMeetingUpdated({ allow_participant_screen_share: nextVal });
      showStatus(nextVal ? "Attendees can share their screen." : "Attendees cannot share screen.");
    } catch {
      showStatus("Failed to update screen share permission.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Host Moderation & Security"
      description="Manage room access, security controls, and participant permissions."
    >
      <div className="space-y-4 text-xs">
        {statusMsg && (
          <div className="p-2.5 rounded-md bg-[#0e72ed]/10 border border-[#0e72ed]/30 text-[#60a5fa] font-medium">
            {statusMsg}
          </div>
        )}

        {/* Security & Access */}
        <div className="space-y-2 rounded-lg border border-border-subtle bg-surface-muted p-3">
          <span className="font-semibold text-text-primary uppercase tracking-wider text-[11px]">
            Room Security
          </span>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {meeting.is_locked ? (
                <Lock className="h-4 w-4 text-[#f87171]" />
              ) : (
                <Unlock className="h-4 w-4 text-[#4ade80]" />
              )}
              <div>
                <p className="font-medium text-text-primary">Lock Meeting</p>
                <p className="text-[#8f96a3]">
                  {meeting.is_locked
                    ? "Locked: No new participants can join."
                    : "Unlocked: Anyone with the link or code can join."}
                </p>
              </div>
            </div>
            <Button
              variant={meeting.is_locked ? "outline" : "meeting"}
              size="sm"
              onClick={handleToggleLock}
              disabled={loadingAction === "lock"}
              className="text-xs shrink-0"
            >
              {meeting.is_locked ? "Unlock" : "Lock"}
            </Button>
          </div>
        </div>

        {/* Participant Permissions */}
        <div className="space-y-3 rounded-lg border border-border-subtle bg-surface-muted p-3">
          <span className="font-semibold text-text-primary uppercase tracking-wider text-[11px]">
            Attendee Permissions
          </span>

          {/* Unmute Permission */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-text-muted" />
              <div>
                <p className="font-medium text-text-primary">Allow Attendees to Unmute</p>
                <p className="text-[#8f96a3]">
                  {meeting.allow_participant_unmute !== false
                    ? "Participants can unmute their microphones."
                    : "Participants cannot unmute themselves."}
                </p>
              </div>
            </div>
            <Button
              variant={meeting.allow_participant_unmute !== false ? "outline" : "meeting"}
              size="sm"
              onClick={handleToggleUnmutePerm}
              disabled={loadingAction === "permUnmute"}
              className="text-xs shrink-0"
            >
              {meeting.allow_participant_unmute !== false ? "Disallow" : "Allow"}
            </Button>
          </div>

          {/* Screen Share Permission */}
          <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-text-muted" />
              <div>
                <p className="font-medium text-text-primary">Allow Screen Sharing</p>
                <p className="text-[#8f96a3]">
                  {meeting.allow_participant_screen_share !== false
                    ? "Participants can share their screen."
                    : "Only the host can share their screen."}
                </p>
              </div>
            </div>
            <Button
              variant={meeting.allow_participant_screen_share !== false ? "outline" : "meeting"}
              size="sm"
              onClick={handleToggleScreenSharePerm}
              disabled={loadingAction === "permScreen"}
              className="text-xs shrink-0"
            >
              {meeting.allow_participant_screen_share !== false ? "Disallow" : "Allow"}
            </Button>
          </div>
        </div>

        {/* Global Moderation Actions */}
        <div className="space-y-2 rounded-lg border border-border-subtle bg-surface-muted p-3">
          <span className="font-semibold text-text-primary uppercase tracking-wider text-[11px]">
            Quick Moderation
          </span>
          <div className="pt-1 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMuteAll}
              disabled={loadingAction === "muteAll"}
              className="w-full gap-1.5 text-xs text-[#f87171] border-[#f87171]/30 hover:bg-[#f87171]/10"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>Mute All Attendees</span>
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-2 border-t border-border-subtle flex justify-end">
          <Button
            variant="danger"
            size="sm"
            onClick={onEndMeetingForAll}
            className="gap-1.5 text-xs"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span>End Meeting for All</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
