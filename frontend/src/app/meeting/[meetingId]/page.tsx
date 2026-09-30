"use client";

import React, { useEffect, useState, useRef, useCallback, use } from "react";
import Link from "next/link";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useRoomContext,
  useLocalParticipant,
  useTracks,
} from "@livekit/components-react";
import { RoomEvent, RemoteParticipant, DataPacket_Kind, Track } from "livekit-client";
import { AlertCircle, ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Meeting } from "@/types";
import { PreJoin } from "@/components/meeting/PreJoin";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { MeetingToolbar } from "@/components/meeting/MeetingToolbar";
import { ParticipantsPanel } from "@/components/meeting/ParticipantsPanel";
import { ChatPanel, ChatItem } from "@/components/meeting/ChatPanel";
import { LeaveDialog } from "@/components/meeting/LeaveDialog";
import { Button } from "@/components/ui/Button";
import { formatMeetingCode } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  decodeRealtimeMessage,
  encodeChatMessage,
  encodeReaction,
  encodeHandState,
  encodeSystemNotice,
  AllowedReaction,
} from "@/lib/realtimeProtocol";

interface PageProps {
  params: Promise<{ meetingId: string }>;
}

// Inner meeting room component having access to LiveKit hooks
interface RoomContentProps {
  meeting: Meeting;
  isHost: boolean;
  hostToken: string | null;
  participantIdentity: string;
  onLeaveClick: () => void;
  onMeetingUpdated: (updated: Partial<Meeting>) => void;
}

const ActiveMeetingRoomContent: React.FC<RoomContentProps> = ({
  meeting,
  isHost,
  hostToken,
  participantIdentity,
  onLeaveClick,
  onMeetingUpdated,
}) => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__orbitmeet_room = room;
    }
    return () => {
      if (typeof window !== "undefined" && (window as any).__orbitmeet_room === room) {
        delete (window as any).__orbitmeet_room;
      }
    };
  }, [room]);

  // Panels mutual exclusivity
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Chat state
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Reactions & Hand raise
  const [activeReactions, setActiveReactions] = useState<Record<string, string>>({});
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({});
  const reactionTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Elapsed Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Find active screen sharer
  const screenShareTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const activeScreenSharerId = screenShareTracks[0]?.participant?.identity || null;

  // Realtime Data Channel Listener
  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant?: RemoteParticipant) => {
      const msg = decodeRealtimeMessage(payload);
      if (!msg) return;

      const senderId = participant?.identity || "unknown";

      switch (msg.type) {
        case "chat.message": {
          const newItem: ChatItem = {
            type: "message",
            data: msg.payload,
          };
          setChatItems((prev) => [...prev, newItem]);
          if (!isChatOpen) {
            setUnreadChatCount((prev) => prev + 1);
          }
          break;
        }

        case "reaction": {
          const emoji = msg.payload.emoji;
          const targetSender = msg.payload.senderIdentity || senderId;
          setActiveReactions((prev) => ({ ...prev, [targetSender]: emoji }));
          if (reactionTimeouts.current[targetSender]) {
            clearTimeout(reactionTimeouts.current[targetSender]);
          }
          reactionTimeouts.current[targetSender] = setTimeout(() => {
            setActiveReactions((prev) => {
              const updated = { ...prev };
              delete updated[targetSender];
              return updated;
            });
          }, 3500);
          break;
        }

        case "hand.state": {
          const targetId = msg.payload.senderIdentity || senderId;
          setRaisedHands((prev) => ({
            ...prev,
            [targetId]: !!msg.payload.isRaised,
          }));
          break;
        }

        case "system": {
          const sysItem: ChatItem = {
            type: "system",
            data: msg.payload,
          };
          setChatItems((prev) => [...prev, sysItem]);
          break;
        }
      }
    },
    [isChatOpen]
  );

  useEffect(() => {
    if (!room) return;
    room.on(RoomEvent.DataReceived, handleDataReceived);

    const onParticipantConnected = (participant: RemoteParticipant) => {
      const notice: ChatItem = {
        type: "system",
        data: {
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          message: `${participant.name || participant.identity} joined the room.`,
          timestamp: Date.now(),
        },
      };
      setChatItems((prev) => [...prev, notice]);
    };

    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      const notice: ChatItem = {
        type: "system",
        data: {
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          message: `${participant.name || participant.identity} left the room.`,
          timestamp: Date.now(),
        },
      };
      setChatItems((prev) => [...prev, notice]);
      setRaisedHands((prev) => {
        const copy = { ...prev };
        delete copy[participant.identity];
        return copy;
      });
    };

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    };
  }, [room, handleDataReceived]);

  // Actions
  const handleSendMessage = async (text: string) => {
    if (!localParticipant) return;
    const myId = localParticipant.identity;
    const myName = localParticipant.name || "Me";
    const data = encodeChatMessage(myId, myName, text);
    try {
      await localParticipant.publishData(data as any, { reliable: true });
      const localItem: ChatItem = {
        type: "message",
        data: {
          id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          senderIdentity: myId,
          senderName: myName,
          text,
          timestamp: Date.now(),
        },
      };
      setChatItems((prev) => [...prev, localItem]);
    } catch (err) {
      console.error("Failed to send chat message:", err);
    }
  };

  const handleSendReaction = async (emoji: string) => {
    if (!localParticipant) return;
    const myId = localParticipant.identity;
    const data = encodeReaction(myId, localParticipant.name || "Me", emoji as AllowedReaction);
    try {
      await localParticipant.publishData(data as any, { reliable: false });
      setActiveReactions((prev) => ({ ...prev, [myId]: emoji }));
      if (reactionTimeouts.current[myId]) {
        clearTimeout(reactionTimeouts.current[myId]);
      }
      reactionTimeouts.current[myId] = setTimeout(() => {
        setActiveReactions((prev) => {
          const updated = { ...prev };
          delete updated[myId];
          return updated;
        });
      }, 3500);
    } catch (err) {
      console.warn("Failed to publish reaction:", err);
    }
  };

  const handleToggleHand = async () => {
    if (!localParticipant) return;
    const myId = localParticipant.identity;
    const nextState = !raisedHands[myId];
    const data = encodeHandState(myId, nextState);
    try {
      await localParticipant.publishData(data as any, { reliable: true });
      setRaisedHands((prev) => ({ ...prev, [myId]: nextState }));
    } catch (err) {
      console.warn("Failed to update hand state:", err);
    }
  };

  const handleHostLowerHand = async (targetIdentity: string) => {
    if (!isHost || !localParticipant) return;
    const data = encodeHandState(targetIdentity, false);
    try {
      await localParticipant.publishData(data as any, { reliable: true });
      setRaisedHands((prev) => ({ ...prev, [targetIdentity]: false }));
    } catch (err) {
      console.warn("Failed to lower participant hand:", err);
    }
  };

  const handleToggleParticipants = () => {
    if (!isParticipantsOpen) {
      setIsChatOpen(false);
      setIsParticipantsOpen(true);
    } else {
      setIsParticipantsOpen(false);
    }
  };

  const handleToggleChat = () => {
    if (!isChatOpen) {
      setIsParticipantsOpen(false);
      setIsChatOpen(true);
      setUnreadChatCount(0);
    } else {
      setIsChatOpen(false);
    }
  };

  return (
    <>
      {/* Audio playback & Autoplay prompt */}
      <RoomAudioRenderer />
      <StartAudio
        label="Click to allow audio playback"
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-[#0e72ed] px-4 py-2 text-xs font-semibold text-white shadow-xl hover:bg-[#0b5cdb] transition-all cursor-pointer"
      />

      {/* Top Header */}
      <header className="h-12 w-full border-b border-[#262830] bg-[#16171b]/95 px-4 flex items-center justify-between text-xs select-none shrink-0 z-20">
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
          {meeting.is_locked && (
            <span className="flex items-center gap-1 rounded bg-[#ef4444]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#f87171]">
              Locked
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Meeting Elapsed Timer */}
          <div className="flex items-center gap-1.5 text-[#9ba1b0] bg-[#1e2026] px-2.5 py-1 rounded-md text-[11px] font-mono">
            <Clock className="h-3 w-3 text-[#64748b]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#4ade80] text-[11px] font-medium bg-[#1e2e24] px-2 py-0.5 rounded">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span>Connected</span>
          </div>
        </div>
      </header>

      {/* Main Stage Grid & Panels */}
      <div className="flex-1 relative overflow-hidden bg-[#111215]">
        <VideoGrid activeReactions={activeReactions} raisedHands={raisedHands} />

        <ParticipantsPanel
          meetingCode={meeting.meeting_code}
          isHost={isHost}
          hostToken={hostToken}
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          raisedHands={raisedHands}
          onLowerHand={handleHostLowerHand}
          activeScreenSharerId={activeScreenSharerId}
        />

        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          items={chatItems}
          currentIdentity={localParticipant?.identity || participantIdentity}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Meeting Bottom Toolbar */}
      <MeetingToolbar
        meeting={meeting}
        isHost={isHost}
        hostToken={hostToken}
        isParticipantsOpen={isParticipantsOpen}
        onToggleParticipants={handleToggleParticipants}
        isChatOpen={isChatOpen}
        onToggleChat={handleToggleChat}
        unreadChatCount={unreadChatCount}
        isHandRaised={!!(localParticipant && raisedHands[localParticipant.identity])}
        onToggleHand={handleToggleHand}
        onSendReaction={handleSendReaction}
        onLeaveClick={onLeaveClick}
        onEndMeetingForAll={onLeaveClick}
        onMeetingUpdated={onMeetingUpdated}
      />
    </>
  );
};

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
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  // Fetch meeting on mount
  useEffect(() => {
    let mounted = true;

    async function loadMeeting() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await api.getMeeting(rawMeetingCode);
        if (!mounted) return;
        setMeeting(data);

        if (data.host_control_token) {
          setIsHost(true);
          setHostToken(data.host_control_token);
          sessionStorage.setItem(`host_token_${data.meeting_code}`, data.host_control_token);
        } else {
          const savedToken = sessionStorage.getItem(`host_token_${data.meeting_code}`);
          if (savedToken) {
            setIsHost(true);
            setHostToken(savedToken);
          } else if (user && data.owner_user_id === user.id) {
            setIsHost(true);
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

  const handleMeetingUpdated = (updated: Partial<Meeting>) => {
    setMeeting((prev) => (prev ? { ...prev, ...updated } : null));
  };

  // Loading state
  if (isLoading && !isPreJoinDone) {
    return (
      <div className="min-h-screen bg-[#111215] flex flex-col items-center justify-center text-white space-y-3">
        <svg className="h-8 w-8 animate-spin text-[#0e72ed]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium text-[#9ba1b0]">Connecting to OrbitMeet...</span>
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
          <ActiveMeetingRoomContent
            meeting={meeting}
            isHost={isHost}
            hostToken={hostToken}
            participantIdentity={participantIdentity}
            onLeaveClick={() => setIsLeaveDialogOpen(true)}
            onMeetingUpdated={handleMeetingUpdated}
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
