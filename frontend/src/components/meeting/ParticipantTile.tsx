"use client";

import React from "react";
import { Mic, MicOff, ShieldCheck, Hand } from "lucide-react";
import { VideoTrack, useIsSpeaking } from "@livekit/components-react";
import { Participant, TrackPublication, Track } from "livekit-client";
import { cn } from "@/lib/utils";

interface ParticipantTileProps {
  participant: Participant;
  isLocal?: boolean;
  videoTrackPublication?: TrackPublication;
  activeReaction?: string | null;
  isHandRaised?: boolean;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
  isLocal = false,
  videoTrackPublication,
  activeReaction,
  isHandRaised = false,
}) => {
  const isSpeaking = useIsSpeaking(participant);

  // Check if camera is on and unmuted
  const isCameraEnabled =
    videoTrackPublication?.track &&
    !videoTrackPublication.isMuted &&
    videoTrackPublication.isEnabled;

  // Check if audio is muted
  const isAudioMuted = !participant.isMicrophoneEnabled;

  const displayName = participant.name || participant.identity || "Participant";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() || "U";

  const isHost = participant.identity.startsWith("host_");

  return (
    <div
      className={cn(
        "relative aspect-video w-full rounded-lg bg-[#191b20] border border-[#2b2f3a] overflow-hidden flex items-center justify-center select-none shadow-md",
        isSpeaking && "ring-2 ring-[#0e72ed] ring-offset-2 ring-offset-[#111215]"
      )}
    >
      {/* Video Stream or Avatar Fallback */}
      {isCameraEnabled && videoTrackPublication?.track ? (
        <VideoTrack
          trackRef={{
            participant,
            publication: videoTrackPublication,
            source: Track.Source.Camera,
          }}
          className={cn(
            "h-full w-full object-cover",
            isLocal && "-scale-x-100" // mirror local camera
          )}
        />
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#0e72ed] text-white text-xl sm:text-2xl font-bold shadow-md">
            {initials}
          </div>
          <span className="text-xs text-[#8f96a3] font-medium hidden sm:inline-block">
            {displayName}
          </span>
        </div>
      )}

      {/* Hand Raised Indicator */}
      {isHandRaised && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-md bg-[#eab308] text-[#0f172a] px-2 py-0.5 text-xs font-semibold shadow-md animate-in fade-in zoom-in-75 duration-150">
          <Hand className="h-3.5 w-3.5 fill-current" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Floating Reaction Overlay */}
      {activeReaction && (
        <div className="absolute top-2 right-2 z-10 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-xs border border-white/20 p-2 text-2xl shadow-xl animate-in zoom-in-50 fade-in duration-200">
          <span role="img" aria-label="reaction">{activeReaction}</span>
        </div>
      )}

      {/* Bottom Information Badge Overlay */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 backdrop-blur-xs px-2.5 py-1 text-xs text-white">
        {/* Audio Mute Status */}
        {isAudioMuted ? (
          <MicOff className="h-3.5 w-3.5 text-[#f87171]" />
        ) : (
          <Mic className={cn("h-3.5 w-3.5", isSpeaking ? "text-[#4ade80]" : "text-[#e2e8f0]")} />
        )}

        <span className="font-medium max-w-[120px] truncate">
          {displayName}
          {isLocal && " (You)"}
        </span>

        {isHost && (
          <span className="flex items-center gap-0.5 rounded-xs bg-[#fbc02d]/20 text-[#fbc02d] px-1 py-0.2 text-[10px] font-semibold uppercase">
            <ShieldCheck className="h-2.5 w-2.5" /> Host
          </span>
        )}
      </div>
    </div>
  );
};
