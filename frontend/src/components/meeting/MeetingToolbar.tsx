"use client";

import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Users,
  Info,
  PhoneOff,
  Copy,
  Check,
} from "lucide-react";
import { useLocalParticipant, useParticipants } from "@livekit/components-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Meeting } from "@/types";
import { formatMeetingCode } from "@/lib/utils";

interface MeetingToolbarProps {
  meeting: Meeting;
  isParticipantsOpen: boolean;
  onToggleParticipants: () => void;
  onLeaveClick: () => void;
}

export const MeetingToolbar: React.FC<MeetingToolbarProps> = ({
  meeting,
  isParticipantsOpen,
  onToggleParticipants,
  onLeaveClick,
}) => {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAudioEnabled = localParticipant.isMicrophoneEnabled;
  const isVideoEnabled = localParticipant.isCameraEnabled;
  const isScreenSharing = localParticipant.isScreenShareEnabled;

  const toggleAudio = async () => {
    await localParticipant.setMicrophoneEnabled(!isAudioEnabled);
  };

  const toggleVideo = async () => {
    await localParticipant.setCameraEnabled(!isVideoEnabled);
  };

  const toggleScreenShare = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
    }
  };

  const copyInviteLink = () => {
    const url =
      meeting.invite_url ||
      `${window.location.origin}/join?meeting=${meeting.meeting_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <footer className="h-18 w-full border-t border-[#262830] bg-[#16171b] px-4 sm:px-6 flex items-center justify-between select-none shrink-0 z-30">
        {/* Left: Meeting Info Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInfoOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-[#a0a6b5] hover:bg-[#252830] hover:text-white transition-colors"
            title="Meeting Information"
          >
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline-block font-medium">Meeting Info</span>
          </button>
        </div>

        {/* Center: Main Media & Utility Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Microphone Toggle */}
          <button
            onClick={toggleAudio}
            className={`flex flex-col items-center justify-center w-14 sm:w-16 h-12 rounded-md transition-colors ${
              isAudioEnabled
                ? "text-white hover:bg-[#252830]"
                : "text-[#f87171] hover:bg-[#252830]"
            }`}
          >
            {isAudioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5 text-[#f87171]" />
            )}
            <span className="text-[11px] mt-0.5 font-medium">
              {isAudioEnabled ? "Mute" : "Unmute"}
            </span>
          </button>

          {/* 2. Camera Toggle */}
          <button
            onClick={toggleVideo}
            className={`flex flex-col items-center justify-center w-14 sm:w-16 h-12 rounded-md transition-colors ${
              isVideoEnabled
                ? "text-white hover:bg-[#252830]"
                : "text-[#f87171] hover:bg-[#252830]"
            }`}
          >
            {isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5 text-[#f87171]" />
            )}
            <span className="text-[11px] mt-0.5 font-medium">
              {isVideoEnabled ? "Stop Video" : "Start Video"}
            </span>
          </button>

          {/* 3. Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center w-14 sm:w-16 h-12 rounded-md transition-colors ${
              isScreenSharing
                ? "text-[#4ade80] bg-[#252830]"
                : "text-[#a0a6b5] hover:bg-[#252830] hover:text-white"
            }`}
            title="Share Screen"
          >
            <ScreenShare className="h-5 w-5" />
            <span className="text-[11px] mt-0.5 font-medium hidden sm:inline-block">
              {isScreenSharing ? "Stop Share" : "Share"}
            </span>
          </button>

          {/* 4. Participants Panel Toggle */}
          <button
            type="button"
            onClick={onToggleParticipants}
            className={`flex flex-col items-center justify-center w-14 sm:w-16 h-12 rounded-md transition-colors relative cursor-pointer ${
              isParticipantsOpen
                ? "bg-[#252830] text-[#0e72ed]"
                : "text-[#a0a6b5] hover:bg-[#252830] hover:text-white"
            }`}
            title="Participants"
            aria-label="Participants"
            data-testid="participants-toggle"
          >
            <div className="relative">
              <Users className="h-5 w-5" />
              <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0e72ed] px-1 text-[9px] font-bold text-white">
                {participants.length}
              </span>
            </div>
            <span className="text-[11px] mt-0.5 font-medium hidden sm:inline-block">
              Participants
            </span>
          </button>
        </div>

        {/* Right: Leave Meeting Button */}
        <div className="flex items-center">
          <Button
            variant="danger"
            size="sm"
            onClick={onLeaveClick}
            className="gap-1.5 font-semibold text-xs px-3 sm:px-4"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span>Leave</span>
          </Button>
        </div>
      </footer>

      {/* Meeting Info Dialog */}
      <Modal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        title="Meeting Details"
        description="Share these details with teammates to let them join."
      >
        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border border-border-subtle bg-surface-muted p-4 text-xs text-text-secondary">
            <div>
              <span className="text-text-muted">Topic: </span>
              <span className="font-semibold text-text-primary">{meeting.title}</span>
            </div>
            <div>
              <span className="text-text-muted">Meeting ID: </span>
              <span className="font-mono font-medium text-text-primary">
                {formatMeetingCode(meeting.meeting_code)}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Host: </span>
              <span>{meeting.host_name}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button variant="outline" size="sm" onClick={copyInviteLink} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Copied Link</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-text-secondary" />
                  <span>Copy Invite Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
