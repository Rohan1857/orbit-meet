"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Users,
  MessageSquare,
  Smile,
  Shield,
  MoreHorizontal,
  ChevronUp,
  PhoneOff,
  Info,
  Copy,
  Check,
  Hand,
  Maximize,
  Minimize,
  Keyboard,
  CheckCheck,
} from "lucide-react";
import { useLocalParticipant, useParticipants, useRoomContext } from "@livekit/components-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Meeting } from "@/types";
import { formatMeetingCode } from "@/lib/utils";
import { HostToolsModal } from "./HostToolsModal";

interface MeetingToolbarProps {
  meeting: Meeting;
  isHost: boolean;
  hostToken: string | null;
  isParticipantsOpen: boolean;
  onToggleParticipants: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  unreadChatCount: number;
  isHandRaised: boolean;
  onToggleHand: () => void;
  onSendReaction: (emoji: string) => void;
  onLeaveClick: () => void;
  onEndMeetingForAll: () => void;
  onMeetingUpdated: (updated: Partial<Meeting>) => void;
}

const REACTION_EMOJIS = ["👍", "👏", "❤️", "😂", "🎉"];

export const MeetingToolbar: React.FC<MeetingToolbarProps> = ({
  meeting,
  isHost,
  hostToken,
  isParticipantsOpen,
  onToggleParticipants,
  isChatOpen,
  onToggleChat,
  unreadChatCount,
  isHandRaised,
  onToggleHand,
  onSendReaction,
  onLeaveClick,
  onEndMeetingForAll,
  onMeetingUpdated,
}) => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  // Dialog and Popover States
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isHostToolsOpen, setIsHostToolsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<"audio" | "video" | "reactions" | "more" | null>(null);
  const [copied, setCopied] = useState(false);

  // Device lists
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const isAudioEnabled = localParticipant?.isMicrophoneEnabled ?? false;
  const isVideoEnabled = localParticipant?.isCameraEnabled ?? false;
  const isScreenSharing = localParticipant?.isScreenShareEnabled ?? false;

  // Enumerate devices on mount and when menu opened
  const loadDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
      if (room) {
        setSelectedAudioId(room.getActiveDevice("audioinput") || "");
        setSelectedVideoId(room.getActiveDevice("videoinput") || "");
      }
    } catch (err) {
      console.warn("Could not enumerate media devices:", err);
    }
  };

  useEffect(() => {
    loadDevices();
    const handleDeviceChange = () => {
      loadDevices();
    };
    navigator.mediaDevices?.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [room]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard Shortcuts: Alt+A (mic), Alt+V (video), Alt+H (raise hand)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.altKey && (e.key === "a" || e.key === "A" || e.code === "KeyA")) {
        e.preventDefault();
        toggleAudio();
      } else if (e.altKey && (e.key === "v" || e.key === "V" || e.code === "KeyV")) {
        e.preventDefault();
        toggleVideo();
      } else if (e.altKey && (e.key === "h" || e.key === "H" || e.code === "KeyH")) {
        e.preventDefault();
        onToggleHand();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAudioEnabled, isVideoEnabled, onToggleHand]);

  // Fullscreen tracking
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const toggleAudio = async () => {
    if (!localParticipant) return;
    // Check permission if participant is not host
    if (!isHost && !isAudioEnabled && meeting.allow_participant_unmute === false) {
      alert("The host has muted attendees and disabled unmuting.");
      return;
    }
    await localParticipant.setMicrophoneEnabled(!isAudioEnabled);
  };

  const toggleVideo = async () => {
    if (!localParticipant) return;
    await localParticipant.setCameraEnabled(!isVideoEnabled);
  };

  const toggleScreenShare = async () => {
    if (!localParticipant) return;
    if (!isHost && !isScreenSharing && meeting.allow_participant_screen_share === false) {
      alert("The host has disabled participant screen sharing.");
      return;
    }
    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
    }
  };

  const selectDevice = async (kind: "audioinput" | "videoinput", deviceId: string) => {
    if (!room) return;
    try {
      await room.switchActiveDevice(kind, deviceId);
      if (kind === "audioinput") setSelectedAudioId(deviceId);
      if (kind === "videoinput") setSelectedVideoId(deviceId);
    } catch (err) {
      console.error(`Failed to switch ${kind} to ${deviceId}:`, err);
    } finally {
      setActiveMenu(null);
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
      <footer
        ref={menuRef}
        className="relative h-18 w-full border-t border-[#262830] bg-[#16171b] px-3 sm:px-6 flex items-center justify-between select-none shrink-0 z-30"
      >
        {/* Left Section: Meeting Info Quick Access */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsInfoOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-[#a0a6b5] hover:bg-[#252830] hover:text-white transition-colors"
            title="Meeting Information"
            aria-label="Meeting Information"
          >
            <Info className="h-4 w-4" />
            <span className="hidden md:inline-block font-medium">Info</span>
          </button>
        </div>

        {/* Center: Controls Bar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* 1. Microphone Toggle + Device Selector */}
          <div className="relative flex items-center">
            <button
              onClick={toggleAudio}
              className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-l-md transition-colors ${
                isAudioEnabled
                  ? "text-white hover:bg-[#252830]"
                  : "text-[#f87171] hover:bg-[#252830]"
              }`}
              title={isAudioEnabled ? "Mute Microphone (Alt+A)" : "Unmute Microphone (Alt+A)"}
              aria-label={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isAudioEnabled ? (
                <Mic className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              ) : (
                <MicOff className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#f87171]" />
              )}
              <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">
                {isAudioEnabled ? "Mute" : "Unmute"}
              </span>
            </button>
            <button
              onClick={() => {
                loadDevices();
                setActiveMenu(activeMenu === "audio" ? null : "audio");
              }}
              className="flex items-center justify-center w-5 sm:w-6 h-12 rounded-r-md text-[#8f96a3] hover:text-white hover:bg-[#252830] transition-colors border-l border-[#262830]/60"
              title="Microphone settings"
              aria-label="Select Microphone"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>

            {/* Audio Device Dropdown */}
            {activeMenu === "audio" && (
              <div className="absolute bottom-16 left-0 w-64 rounded-lg border border-[#2b2f3a] bg-[#1a1b20] p-2 shadow-2xl z-50 text-xs text-white animate-in fade-in zoom-in-95 duration-100">
                <p className="px-2 py-1 text-[10px] font-semibold text-[#8f96a3] uppercase tracking-wider">
                  Select Microphone
                </p>
                <div className="mt-1 max-h-48 overflow-y-auto space-y-0.5">
                  {audioDevices.length === 0 ? (
                    <div className="px-2 py-1 text-[#8f96a3]">No microphones detected</div>
                  ) : (
                    audioDevices.map((device, idx) => (
                      <button
                        key={device.deviceId || idx}
                        onClick={() => selectDevice("audioinput", device.deviceId)}
                        className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between hover:bg-[#252830] transition-colors ${
                          selectedAudioId === device.deviceId ? "text-[#38bdf8] font-medium" : "text-[#cbd5e1]"
                        }`}
                      >
                        <span className="truncate pr-2">{device.label || `Microphone ${idx + 1}`}</span>
                        {selectedAudioId === device.deviceId && <CheckCheck className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Camera Toggle + Device Selector */}
          <div className="relative flex items-center">
            <button
              onClick={toggleVideo}
              className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-l-md transition-colors ${
                isVideoEnabled
                  ? "text-white hover:bg-[#252830]"
                  : "text-[#f87171] hover:bg-[#252830]"
              }`}
              title={isVideoEnabled ? "Stop Camera (Alt+V)" : "Start Camera (Alt+V)"}
              aria-label={isVideoEnabled ? "Stop Camera" : "Start Camera"}
            >
              {isVideoEnabled ? (
                <Video className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              ) : (
                <VideoOff className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#f87171]" />
              )}
              <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">
                {isVideoEnabled ? "Stop Video" : "Start Video"}
              </span>
            </button>
            <button
              onClick={() => {
                loadDevices();
                setActiveMenu(activeMenu === "video" ? null : "video");
              }}
              className="flex items-center justify-center w-5 sm:w-6 h-12 rounded-r-md text-[#8f96a3] hover:text-white hover:bg-[#252830] transition-colors border-l border-[#262830]/60"
              title="Camera settings"
              aria-label="Select Camera"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>

            {/* Video Device Dropdown */}
            {activeMenu === "video" && (
              <div className="absolute bottom-16 left-0 w-64 rounded-lg border border-[#2b2f3a] bg-[#1a1b20] p-2 shadow-2xl z-50 text-xs text-white animate-in fade-in zoom-in-95 duration-100">
                <p className="px-2 py-1 text-[10px] font-semibold text-[#8f96a3] uppercase tracking-wider">
                  Select Camera
                </p>
                <div className="mt-1 max-h-48 overflow-y-auto space-y-0.5">
                  {videoDevices.length === 0 ? (
                    <div className="px-2 py-1 text-[#8f96a3]">No cameras detected</div>
                  ) : (
                    videoDevices.map((device, idx) => (
                      <button
                        key={device.deviceId || idx}
                        onClick={() => selectDevice("videoinput", device.deviceId)}
                        className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between hover:bg-[#252830] transition-colors ${
                          selectedVideoId === device.deviceId ? "text-[#38bdf8] font-medium" : "text-[#cbd5e1]"
                        }`}
                      >
                        <span className="truncate pr-2">{device.label || `Camera ${idx + 1}`}</span>
                        {selectedVideoId === device.deviceId && <CheckCheck className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-md transition-colors ${
              isScreenSharing
                ? "text-[#4ade80] bg-[#252830]"
                : "text-[#a0a6b5] hover:bg-[#252830] hover:text-white"
            }`}
            title="Share Screen"
            aria-label="Share Screen"
          >
            <ScreenShare className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium hidden sm:inline-block">
              {isScreenSharing ? "Stop Share" : "Share"}
            </span>
          </button>

          {/* 4. Participants Toggle */}
          <button
            type="button"
            onClick={onToggleParticipants}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-md transition-colors relative cursor-pointer ${
              isParticipantsOpen
                ? "bg-[#252830] text-[#0e72ed]"
                : "text-[#a0a6b5] hover:bg-[#252830] hover:text-white"
            }`}
            title="Attendees"
            aria-label="Attendees"
            data-testid="participants-toggle"
          >
            <div className="relative">
              <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0e72ed] px-1 text-[9px] font-bold text-white">
                {participants.length}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium hidden sm:inline-block">
              Attendees
            </span>
          </button>

          {/* 5. Chat Toggle */}
          <button
            type="button"
            onClick={onToggleChat}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-md transition-colors relative cursor-pointer ${
              isChatOpen
                ? "bg-[#252830] text-[#0e72ed]"
                : "text-[#a0a6b5] hover:bg-[#252830] hover:text-white"
            }`}
            title="Meeting Chat"
            aria-label="Meeting Chat"
            data-testid="chat-toggle"
          >
            <div className="relative">
              <MessageSquare className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white animate-pulse">
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium hidden sm:inline-block">
              Chat
            </span>
          </button>

          {/* 6. Reactions & Raise Hand Button */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "reactions" ? null : "reactions")}
              className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-md transition-colors ${
                isHandRaised
                  ? "bg-[#eab308]/20 text-[#eab308]"
                  : "text-[#a0a6b5] hover:bg-[#252830] hover:text-white"
              }`}
              title="Reactions and Raise Hand (Alt+H)"
              aria-label="Reactions and Raise Hand"
            >
              {isHandRaised ? (
                <Hand className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-current" />
              ) : (
                <Smile className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              )}
              <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium hidden sm:inline-block">
                {isHandRaised ? "Raised" : "Reactions"}
              </span>
            </button>

            {/* Reactions Popover */}
            {activeMenu === "reactions" && (
              <div className="absolute bottom-16 -left-12 sm:left-1/2 sm:-translate-x-1/2 w-56 rounded-lg border border-[#2b2f3a] bg-[#1a1b20] p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <p className="text-[10px] font-semibold text-[#8f96a3] uppercase tracking-wider mb-2 px-1">
                  Reactions
                </p>
                <div className="flex items-center justify-between pb-2 border-b border-[#262830]">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onSendReaction(emoji);
                        setActiveMenu(null);
                      }}
                      className="p-1.5 rounded-md hover:bg-[#252830] text-xl transition-transform hover:scale-125"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onToggleHand();
                      setActiveMenu(null);
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isHandRaised
                        ? "bg-[#eab308]/20 text-[#eab308] hover:bg-[#eab308]/30"
                        : "bg-[#252830] text-white hover:bg-[#2e323c]"
                    }`}
                  >
                    <Hand className="h-4 w-4" />
                    <span>{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 7. Host Tools (Host Only) */}
          {isHost && (
            <button
              onClick={() => setIsHostToolsOpen(true)}
              className="flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-md text-[#fbc02d] hover:bg-[#252830] transition-colors"
              title="Host Moderation & Security"
              aria-label="Host Tools"
            >
              <Shield className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium hidden sm:inline-block">
                Host
              </span>
            </button>
          )}

          {/* 8. More Menu (•••) */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "more" ? null : "more")}
              className="flex flex-col items-center justify-center w-10 sm:w-12 h-12 rounded-md text-[#a0a6b5] hover:bg-[#252830] hover:text-white transition-colors"
              title="More options"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium hidden sm:inline-block">
                More
              </span>
            </button>

            {/* More Menu Dropdown */}
            {activeMenu === "more" && (
              <div className="absolute bottom-16 right-0 w-48 rounded-lg border border-[#2b2f3a] bg-[#1a1b20] p-1.5 shadow-2xl z-50 text-xs text-white animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setIsInfoOpen(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-md flex items-center gap-2 hover:bg-[#252830] transition-colors"
                >
                  <Info className="h-4 w-4 text-[#8f96a3]" />
                  <span>Meeting Info</span>
                </button>
                <button
                  onClick={() => {
                    setIsShortcutsOpen(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-md flex items-center gap-2 hover:bg-[#252830] transition-colors"
                >
                  <Keyboard className="h-4 w-4 text-[#8f96a3]" />
                  <span>Shortcuts</span>
                </button>
                <button
                  onClick={() => {
                    toggleFullscreen();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-md flex items-center gap-2 hover:bg-[#252830] transition-colors"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize className="h-4 w-4 text-[#8f96a3]" />
                      <span>Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <Maximize className="h-4 w-4 text-[#8f96a3]" />
                      <span>Fullscreen</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Leave / End Meeting */}
        <div className="flex items-center gap-2">
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

      {/* Meeting Info Modal */}
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
            {meeting.is_locked && (
              <div className="pt-1 text-[#f87171] font-semibold">
                🔒 This meeting is locked by the host.
              </div>
            )}
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

      {/* Keyboard Shortcuts Modal */}
      <Modal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        title="Keyboard Shortcuts"
        description="Quick controls available during the conference."
      >
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-md bg-surface-muted border border-border-subtle">
            <span className="text-text-secondary">Mute / Unmute Microphone</span>
            <kbd className="px-2 py-0.5 rounded bg-[#252830] text-white font-mono text-[11px] border border-[#3b4150]">
              Alt + A
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-md bg-surface-muted border border-border-subtle">
            <span className="text-text-secondary">Start / Stop Video</span>
            <kbd className="px-2 py-0.5 rounded bg-[#252830] text-white font-mono text-[11px] border border-[#3b4150]">
              Alt + V
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-md bg-surface-muted border border-border-subtle">
            <span className="text-text-secondary">Raise / Lower Hand</span>
            <kbd className="px-2 py-0.5 rounded bg-[#252830] text-white font-mono text-[11px] border border-[#3b4150]">
              Alt + H
            </kbd>
          </div>
        </div>
      </Modal>

      {/* Host Moderation Modal */}
      {isHost && (
        <HostToolsModal
          isOpen={isHostToolsOpen}
          onClose={() => setIsHostToolsOpen(false)}
          meeting={meeting}
          hostToken={hostToken}
          onMeetingUpdated={onMeetingUpdated}
          onEndMeetingForAll={onEndMeetingForAll}
        />
      )}
    </>
  );
};
