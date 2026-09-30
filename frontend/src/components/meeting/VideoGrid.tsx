"use client";

import React, { useState } from "react";
import {
  useTracks,
  useParticipants,
  useLocalParticipant,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { ParticipantTile } from "@/components/meeting/ParticipantTile";
import { cn } from "@/lib/utils";
import { ScreenShare, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VideoGridProps {
  activeReactions?: Record<string, string>;
  raisedHands?: Record<string, boolean>;
}

const PAGE_SIZE = 6;

export const VideoGrid: React.FC<VideoGridProps> = ({
  activeReactions = {},
  raisedHands = {},
}) => {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Get all camera tracks
  const cameraTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });

  // Get screen share tracks
  const screenShareTracks = useTracks([Track.Source.ScreenShare], {
    onlySubscribed: false,
  });

  const activeScreenShare = screenShareTracks[0];
  const isLocalSharing = localParticipant?.isScreenShareEnabled;

  const handleTogglePin = (id: string) => {
    setPinnedId((prev) => (prev === id ? null : id));
  };

  // 1. Screen Share Presentation Mode
  if (activeScreenShare && activeScreenShare.publication?.track) {
    const sharerName =
      activeScreenShare.participant.isLocal
        ? "You"
        : activeScreenShare.participant.name || activeScreenShare.participant.identity || "Presenter";

    return (
      <div className="flex h-full w-full flex-col lg:flex-row gap-3 p-3 overflow-hidden relative">
        {/* Main Stage Presentation */}
        <div className="flex-1 relative rounded-lg bg-[#0e0f12] border border-[#2b2f3a] overflow-hidden flex items-center justify-center shadow-lg">
          <VideoTrack
            trackRef={activeScreenShare}
            className="h-full w-full object-contain"
          />

          {/* Presenter Name Badge */}
          <div className="absolute top-3 left-3 rounded-md bg-black/70 backdrop-blur-xs px-3 py-1.5 text-xs text-white flex items-center gap-2 border border-white/10 shadow-md">
            <ScreenShare className="h-3.5 w-3.5 text-[#38bdf8]" />
            <span className="font-medium">{sharerName} are presenting</span>
          </div>

          {/* Local Presenter Stop Share Banner */}
          {isLocalSharing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-full bg-[#1e293b]/90 backdrop-blur-md px-4 py-2 text-xs text-white border border-[#38bdf8]/40 shadow-2xl">
              <span className="text-[#38bdf8] font-medium">You are sharing your screen</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => localParticipant?.setScreenShareEnabled(false)}
                className="h-7 px-3 text-xs gap-1 rounded-full font-medium"
              >
                <X className="h-3.5 w-3.5" />
                <span>Stop Share</span>
              </Button>
            </div>
          )}
        </div>

        {/* Participant Strip */}
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
                  activeReaction={activeReactions[p.identity]}
                  isHandRaised={!!raisedHands[p.identity]}
                  isPinned={pinnedId === p.identity}
                  onTogglePin={handleTogglePin}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Pinned Participant Spotlight Mode
  const pinnedParticipant = pinnedId
    ? participants.find((p) => p.identity === pinnedId)
    : null;

  if (pinnedParticipant) {
    const pinnedTrack = cameraTracks.find(
      (t) => t.participant.identity === pinnedParticipant.identity
    );
    const otherParticipants = participants.filter(
      (p) => p.identity !== pinnedParticipant.identity
    );

    return (
      <div className="flex h-full w-full flex-col lg:flex-row gap-3 p-3 overflow-hidden relative">
        {/* Spotlight Main Stage */}
        <div className="flex-1 relative rounded-lg bg-[#0e0f12] border border-[#2b2f3a] overflow-hidden flex items-center justify-center shadow-lg">
          <ParticipantTile
            participant={pinnedParticipant}
            isLocal={pinnedParticipant.isLocal}
            videoTrackPublication={pinnedTrack?.publication}
            activeReaction={activeReactions[pinnedParticipant.identity]}
            isHandRaised={!!raisedHands[pinnedParticipant.identity]}
            isPinned={true}
            onTogglePin={handleTogglePin}
          />
        </div>

        {/* Other participants thumbnail strip */}
        {otherParticipants.length > 0 && (
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-64 max-h-48 lg:max-h-full shrink-0">
            {otherParticipants.map((p) => {
              const camTrack = cameraTracks.find(
                (t) => t.participant.identity === p.identity
              );
              return (
                <div key={p.identity} className="w-48 lg:w-full shrink-0">
                  <ParticipantTile
                    participant={p}
                    isLocal={p.isLocal}
                    videoTrackPublication={camTrack?.publication}
                    activeReaction={activeReactions[p.identity]}
                    isHandRaised={!!raisedHands[p.identity]}
                    isPinned={false}
                    onTogglePin={handleTogglePin}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 3. Paginated Adaptive Grid Mode
  const totalPages = Math.max(1, Math.ceil(participants.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const currentParticipants = participants.slice(startIndex, startIndex + PAGE_SIZE);

  const count = currentParticipants.length;
  let gridCols = "grid-cols-1 max-w-3xl";
  if (count === 2) {
    gridCols = "grid-cols-1 sm:grid-cols-2 max-w-5xl";
  } else if (count >= 3 && count <= 4) {
    gridCols = "grid-cols-1 sm:grid-cols-2 max-w-5xl";
  } else if (count >= 5 && count <= 6) {
    gridCols = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-6xl";
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="flex-1 w-full flex items-center justify-center overflow-y-auto">
        <div className={cn("grid w-full gap-3 sm:gap-4 items-center justify-center", gridCols)}>
          {currentParticipants.map((participant) => {
            const camTrack = cameraTracks.find(
              (t) => t.participant.identity === participant.identity
            );
            return (
              <ParticipantTile
                key={participant.identity}
                participant={participant}
                isLocal={participant.isLocal}
                videoTrackPublication={camTrack?.publication}
                activeReaction={activeReactions[participant.identity]}
                isHandRaised={!!raisedHands[participant.identity]}
                isPinned={false}
                onTogglePin={handleTogglePin}
              />
            );
          })}
        </div>
      </div>

      {/* Pagination Controls Bar when > PAGE_SIZE */}
      {totalPages > 1 && (
        <div className="mt-2 shrink-0 z-20 flex items-center gap-3 rounded-full bg-[#1e2026]/90 backdrop-blur-md px-3.5 py-1.5 border border-[#34394a] shadow-xl text-xs text-white">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={activePage === 1}
            className="p-1 rounded-full hover:bg-[#2c303a] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-medium text-[#cbd5e1] text-[11px] select-none">
            Page {activePage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={activePage === totalPages}
            className="p-1 rounded-full hover:bg-[#2c303a] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
