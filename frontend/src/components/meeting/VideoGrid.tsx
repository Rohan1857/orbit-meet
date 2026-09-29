"use client";

import React from "react";
import {
  useTracks,
  useParticipants,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { ParticipantTile } from "@/components/meeting/ParticipantTile";
import { cn } from "@/lib/utils";

export const VideoGrid: React.FC = () => {
  const participants = useParticipants();

  // Get all camera tracks
  const cameraTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });

  // Get screen share tracks if any
  const screenShareTracks = useTracks([Track.Source.ScreenShare], {
    onlySubscribed: true,
  });

  const activeScreenShare = screenShareTracks[0];

  // Screen Share Layout
  if (activeScreenShare && activeScreenShare.publication?.track) {
    return (
      <div className="flex h-full w-full flex-col lg:flex-row gap-3 p-3 overflow-hidden">
        {/* Main Stage Screen Share */}
        <div className="flex-1 relative rounded-lg bg-[#0e0f12] border border-[#2b2f3a] overflow-hidden flex items-center justify-center shadow-lg">
          <VideoTrack
            trackRef={activeScreenShare}
            className="h-full w-full object-contain"
          />
          <div className="absolute top-3 left-3 rounded-md bg-black/70 backdrop-blur-xs px-3 py-1 text-xs text-white">
            {activeScreenShare.participant.name || "Someone"}'s Screen
          </div>
        </div>

        {/* Side/Bottom Strip of Participants */}
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-64 max-h-48 lg:max-h-full shrink-0">
          {participants.map((p) => {
            const camTrack = cameraTracks.find(
              (t) => t.participant.identity === p.identity
            );
            return (
              <div key={p.identity} className="w-48 lg:w-full shrink-0">
                <ParticipantTile
                  participant={p}
                  isLocal={p.isLocal}
                  videoTrackPublication={camTrack?.publication}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Adaptive Grid Configuration based on participant count
  const count = participants.length;
  let gridCols = "grid-cols-1 max-w-3xl";

  if (count === 2) {
    gridCols = "grid-cols-1 sm:grid-cols-2 max-w-5xl";
  } else if (count >= 3 && count <= 4) {
    gridCols = "grid-cols-1 sm:grid-cols-2 max-w-5xl";
  } else if (count >= 5 && count <= 6) {
    gridCols = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-6xl";
  } else if (count > 6) {
    gridCols = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl";
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className={cn("grid w-full gap-3 sm:gap-4 items-center justify-center", gridCols)}>
        {participants.map((participant) => {
          const camTrack = cameraTracks.find(
            (t) => t.participant.identity === participant.identity
          );
          return (
            <ParticipantTile
              key={participant.identity}
              participant={participant}
              isLocal={participant.isLocal}
              videoTrackPublication={camTrack?.publication}
            />
          );
        })}
      </div>
    </div>
  );
};
