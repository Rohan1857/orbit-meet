"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from "@livekit/components-react";
import { AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Meeting } from "@/types";
import { PreJoin } from "@/components/meeting/PreJoin";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { MeetingToolbar } from "@/components/meeting/MeetingToolbar";
import { ParticipantsPanel } from "@/components/meeting/ParticipantsPanel";
import { LeaveDialog } from "@/components/meeting/LeaveDialog";
import { Button } from "@/components/ui/Button";
import { formatMeetingCode } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface PageProps {
  params: Promise<{ meetingId: string }>;
}

export default function MeetingRoomPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawMeetingCode = resolvedParams.meetingId;
  const { user } = useAuth();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-join & Connection state
  const [isPreJoinDone, setIsPreJoinDone] = useState(false);
  const [connectionToken, setConnectionToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [participantIdentity, setParticipantIdentity] = useState<string>("");
  const [initialAudio, setInitialAudio] = useState(true);
  const [initialVideo, setInitialVideo] = useState(true);

  // Host role
  const [isHost, setIsHost] = useState(false);
  const [hostToken, setHostToken] = useState<string | null>(null);

  // UI Panels
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  // 1. Fetch meeting on mount
  useEffect(() => {
    let mounted = true;

    async function loadMeeting() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await api.getMeeting(rawMeetingCode);
        if (!mounted) return;
        setMeeting(data);

        // Check if server returned host token (if owner) or if saved in sessionStorage
        if (data.host_control_token) {
          setIsHost(true);
          setHostToken(data.host_control_token);
          sessionStorage.setItem(`host_token_${data.meeting_code}`, data.host_control_token);
        } else {
          const savedToken = sessionStorage.getItem(`host_token_${data.meeting_code}`);
          if (savedToken) {
            setIsHost(true);
            setHostToken(savedToken);
          }
        }
      } catch (err: any) {
        if (!mounted) return;
        setErrorMessage(
          err?.message || "Unable to locate this meeting. Check the code and try again."
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadMeeting();

    return () => {
      mounted = false;
    };
  }, [rawMeetingCode, user]);

  // 2. Handle Pre-Join Complete -> obtain LiveKit Token
  const handleJoinFromPreJoin = async ({
    displayName,
    audioEnabled,
    videoEnabled,
  }: {
    displayName: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => {
    if (!meeting) return;

    setInitialAudio(audioEnabled);
    setInitialVideo(videoEnabled);
    setIsLoading(true);

    try {
      const joinRes = await api.joinMeeting(
        meeting.meeting_code,
        {
          display_name: displayName,
          role: isHost ? "host" : "participant",
        },
        hostToken
      );

      setConnectionToken(joinRes.token);
      setServerUrl(joinRes.livekit_url);
      setParticipantIdentity(joinRes.participant_identity);
      setIsPreJoinDone(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to establish meeting connection");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading && !isPreJoinDone) {
    return (
      <div className="min-h-screen bg-[#111215] flex flex-col items-center justify-center text-white space-y-3">
        <svg className="h-8 w-8 animate-spin text-[#0e72ed]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium text-[#9ba1b0]">
          Connecting to OrbitMeet...
        </span>
      </div>
    );
  }

  // Error / Invalid meeting
  if (errorMessage || !meeting) {
    return (
      <div className="min-h-screen bg-[#111215] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-[#262830] bg-[#1a1b20] p-6 text-center text-white space-y-4 shadow-xl">
          <AlertCircle className="mx-auto h-10 w-10 text-[#f87171]" />
          <div>
            <h2 className="text-lg font-bold">Meeting Unavailable</h2>
            <p className="mt-1 text-xs text-[#9ba1b0]">
              {errorMessage || "This meeting ID is invalid or has concluded."}
            </p>
          </div>
          <Link href="/">
            <Button variant="secondary" size="md" className="gap-2 w-full mt-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Pre-join Preview Stage
  if (!isPreJoinDone) {
    return (
      <div className="min-h-screen bg-[#111215] flex flex-col items-center justify-center p-4">
        <PreJoin
          meeting={meeting}
          isHost={isHost}
          onJoin={handleJoinFromPreJoin}
        />
      </div>
    );
  }

  // Active LiveKit Meeting Room
  return (
    <div className="h-screen w-screen bg-[#111215] flex flex-col overflow-hidden text-white">
      {connectionToken && serverUrl ? (
        <LiveKitRoom
          token={connectionToken}
          serverUrl={serverUrl}
          connect={true}
          audio={initialAudio}
          video={initialVideo}
          className="flex h-full w-full flex-col overflow-hidden relative"
        >
          {/* Audio output playback for all remote participants */}
          <RoomAudioRenderer />
          {/* Autoplay blocker prompt fallback */}
          <StartAudio
            label="Click to allow audio playback"
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-[#0e72ed] px-4 py-2 text-xs font-semibold text-white shadow-xl hover:bg-[#0b5cdb] transition-all cursor-pointer"
          />

          {/* Top Meeting Header Strip */}
          <header className="h-12 w-full border-b border-[#262830] bg-[#16171b]/90 px-4 flex items-center justify-between text-xs select-none shrink-0 z-20">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-white tracking-tight">
                {meeting.title}
              </span>
              <span className="text-[#6c7280] font-mono hidden sm:inline-block">
                ID: {formatMeetingCode(meeting.meeting_code)}
              </span>
              {isHost && (
                <span className="flex items-center gap-1 rounded bg-[#fbc02d]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#fbc02d] uppercase">
                  <ShieldCheck className="h-3 w-3" /> Host
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[#4ade80] text-[11px] font-medium bg-[#1e2e24] px-2 py-0.5 rounded">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                <span>Connected</span>
              </div>
            </div>
          </header>

          {/* Main Stage Video Grid Area */}
          <div className="flex-1 relative overflow-hidden bg-[#111215]">
            <VideoGrid />
            <ParticipantsPanel
              meetingCode={meeting.meeting_code}
              isHost={isHost}
              hostToken={hostToken}
              isOpen={isParticipantsOpen}
              onClose={() => setIsParticipantsOpen(false)}
            />
          </div>

          {/* Bottom Meeting Toolbar */}
          <MeetingToolbar
            meeting={meeting}
            isParticipantsOpen={isParticipantsOpen}
            onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
            onLeaveClick={() => setIsLeaveDialogOpen(true)}
          />

          {/* Leave & End Dialog */}
          <LeaveDialog
            isOpen={isLeaveDialogOpen}
            onClose={() => setIsLeaveDialogOpen(false)}
            meetingCode={meeting.meeting_code}
            isHost={isHost}
            hostToken={hostToken}
            participantIdentity={participantIdentity}
            onLeaveConfirmed={() => setIsPreJoinDone(false)}
          />
        </LiveKitRoom>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-xs text-[#9ba1b0]">Initializing media room...</span>
        </div>
      )}
    </div>
  );
}
