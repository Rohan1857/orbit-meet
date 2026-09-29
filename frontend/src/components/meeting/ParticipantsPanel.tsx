"use client";

import React, { useState } from "react";
import { X, Mic, MicOff, Video, VideoOff, ShieldCheck, UserX, VolumeX } from "lucide-react";
import { useParticipants } from "@livekit/components-react";
import { Participant } from "livekit-client";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api";

interface ParticipantsPanelProps {
  meetingCode: string;
  isHost: boolean;
  hostToken: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  meetingCode,
  isHost,
  hostToken,
  isOpen,
  onClose,
}) => {
  const participants = useParticipants();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = participants.filter((p) => {
    const name = p.name || p.identity;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleMuteAll = async () => {
    if (!hostToken) return;
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"}/meetings/${meetingCode}/mute-all`,
        {
          method: "POST",
          headers: { "x-host-token": hostToken },
        }
      );
      setStatusMessage("Requested mute-all for attendees.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage("Failed to execute mute-all.");
    }
  };

  const handleRemove = async (participant: Participant) => {
    if (!hostToken || participant.isLocal) return;
    try {
      await api.removeParticipant(meetingCode, participant.identity, hostToken);
      setStatusMessage(`Removed ${participant.name || "participant"}.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage("Failed to remove participant.");
    }
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 w-80 sm:w-88 border-l border-[#262830] bg-[#1a1b20] text-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
      aria-label="Participants Panel"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#262830]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Attendees</h3>
          <span className="rounded-full bg-[#2a2d36] px-2 py-0.5 text-xs text-[#9ba1b0]">
            {participants.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-[#8f96a3] hover:text-white hover:bg-[#252830] transition-colors"
          aria-label="Close attendees panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {statusMessage && (
        <div className="bg-[#0e72ed]/10 border-b border-[#0e72ed]/30 px-4 py-2 text-xs text-[#60a5fa]">
          {statusMessage}
        </div>
      )}

      {/* Search Input */}
      <div className="p-3 border-b border-[#262830]">
        <input
          type="text"
          placeholder="Filter attendees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-8 rounded-md border border-[#2b2f3a] bg-[#121316] px-3 text-xs text-white placeholder:text-[#6c7280] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0e72ed]"
        />
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#262830]/50 p-2 space-y-1">
        {filtered.map((participant) => {
          const isParticipantHost = participant.identity.startsWith("host_");
          const name = participant.name || participant.identity;

          return (
            <div
              key={participant.identity}
              className="flex items-center justify-between p-2 rounded-md hover:bg-[#22242b] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={name} size="sm" className="h-7 w-7 text-xs shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium truncate">
                    {name}
                    {participant.isLocal && " (Me)"}
                  </span>
                  {isParticipantHost && (
                    <span className="flex items-center gap-1 text-[10px] text-[#fbc02d]">
                      <ShieldCheck className="h-3 w-3" /> Host
                    </span>
                  )}
                </div>
              </div>

              {/* Status and Host Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {participant.isMicrophoneEnabled ? (
                  <Mic className="h-4 w-4 text-[#4ade80]" />
                ) : (
                  <MicOff className="h-4 w-4 text-[#f87171]" />
                )}

                {participant.isCameraEnabled ? (
                  <Video className="h-4 w-4 text-[#94a3b8]" />
                ) : (
                  <VideoOff className="h-4 w-4 text-[#f87171]" />
                )}

                {/* Host Moderation Controls */}
                {isHost && !participant.isLocal && (
                  <button
                    onClick={() => handleRemove(participant)}
                    className="rounded-sm p-1 text-[#f87171] hover:bg-[#321e20] transition-colors ml-1"
                    title={`Remove ${name}`}
                    aria-label={`Remove ${name}`}
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Bottom Controls */}
      {isHost && (
        <div className="p-3 border-t border-[#262830] bg-[#16171b]">
          <Button
            variant="meeting"
            size="sm"
            onClick={handleMuteAll}
            className="w-full gap-2 text-xs"
          >
            <VolumeX className="h-3.5 w-3.5 text-[#f87171]" />
            <span>Mute All Attendees</span>
          </Button>
        </div>
      )}
    </aside>
  );
};
