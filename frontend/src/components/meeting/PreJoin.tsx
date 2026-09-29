"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Meeting } from "@/types";
import { formatMeetingCode } from "@/lib/utils";

interface PreJoinProps {
  meeting: Meeting;
  isHost: boolean;
  onJoin: (options: {
    displayName: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => void;
}

export const PreJoin: React.FC<PreJoinProps> = ({ meeting, isHost, onJoin }) => {
  const [displayName, setDisplayName] = useState(
    isHost ? (meeting.host_name || "Rohan") : ""
  );
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize camera preview
  useEffect(() => {
    let active = true;

    async function setupPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        if (active) {
          console.warn("Media devices not accessible or permission denied:", err);
          setPermissionError("Camera/Microphone access not available or denied.");
          setVideoEnabled(false);
          setAudioEnabled(false);
        }
      }
    }

    setupPreview();

    return () => {
      active = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Update track enabled state
  useEffect(() => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));
    }
  }, [videoEnabled, mediaStream]);

  useEffect(() => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((t) => (t.enabled = audioEnabled));
    }
  }, [audioEnabled, mediaStream]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    // Release preview stream before handing over to LiveKit client
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }

    onJoin({
      displayName: displayName.trim(),
      audioEnabled,
      videoEnabled,
    });
  };

  return (
    <div className="w-full max-w-2xl rounded-xl border border-[#2a2d36] bg-[#1a1b20] p-6 sm:p-8 text-white shadow-2xl space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{meeting.title}</h2>
        <div className="flex items-center justify-center gap-2 text-xs text-[#9ba1b0]">
          <span>Meeting ID: {formatMeetingCode(meeting.meeting_code)}</span>
          {isHost && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#fbc02d]">
                <ShieldCheck className="h-3.5 w-3.5" /> Host
              </span>
            </>
          )}
        </div>
      </div>

      {/* Video Preview Box */}
      <div className="relative aspect-video w-full rounded-lg bg-[#111215] border border-[#262930] overflow-hidden flex items-center justify-center shadow-inner">
        {videoEnabled && !permissionError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover -scale-x-100"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 text-[#6c7280]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#262932] text-xl font-bold text-white">
              {displayName ? displayName.slice(0, 2).toUpperCase() : <User className="h-8 w-8 text-[#9ba1b0]" />}
            </div>
            <span className="text-xs">Camera is off</span>
          </div>
        )}

        {/* Floating Device Controls */}
        <div className="absolute bottom-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              audioEnabled ? "bg-[#2b2e38] text-white hover:bg-[#383c49]" : "bg-[#e02828] text-white"
            }`}
            title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              videoEnabled ? "bg-[#2b2e38] text-white hover:bg-[#383c49]" : "bg-[#e02828] text-white"
            }`}
            title={videoEnabled ? "Stop Camera" : "Start Camera"}
          >
            {videoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {permissionError && (
        <p className="text-center text-xs text-[#f87171]">{permissionError}</p>
      )}

      {/* Name and Join action */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#9ba1b0] mb-1.5">
            Your Display Name
          </label>
          <input
            type="text"
            className="w-full h-10 rounded-md border border-[#3a3f4d] bg-[#252830] px-3 py-2 text-sm text-white placeholder:text-[#6c7280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e72ed]"
            placeholder="e.g. Rohan, Alice, Ayan..."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold"
          disabled={!displayName.trim()}
        >
          Join Meeting
        </Button>
      </form>
    </div>
  );
};
