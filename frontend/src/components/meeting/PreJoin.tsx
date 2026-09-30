"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ShieldCheck,
  User,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Meeting } from "@/types";
import { formatMeetingCode } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(
    user?.display_name || (isHost ? (meeting.host_name || "Host") : "")
  );

  useEffect(() => {
    if (user?.display_name && !displayName) {
      setDisplayName(user.display_name);
    }
  }, [user, displayName]);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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
        if (!active) return;
        // Fallback: Attempt audio-only if camera is unavailable or denied
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!active) {
            audioStream.getTracks().forEach((t) => t.stop());
            return;
          }
          setMediaStream(audioStream);
          setVideoEnabled(false);
          setAudioEnabled(true);
        } catch {
          if (active) {
            console.warn("Media devices not accessible or permission denied:", err);
            setPermissionError("Camera and microphone access unavailable or denied by browser.");
            setVideoEnabled(false);
            setAudioEnabled(false);
          }
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(meeting.meeting_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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

  const initials = displayName.trim()
    ? displayName.trim().slice(0, 2).toUpperCase()
    : "ME";

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-[#272a34] bg-[#16181f] p-6 sm:p-8 text-white shadow-2xl space-y-6">
      {/* Meeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#272a34] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">{meeting.title}</h2>
            {isHost && (
              <span className="inline-flex items-center gap-1 rounded bg-[#fbc02d]/20 px-2 py-0.5 text-[11px] font-bold text-[#fbc02d] uppercase">
                <ShieldCheck className="h-3 w-3" /> Host
              </span>
            )}
          </div>
          <p className="text-xs text-[#9ba1b0]">
            Hosted by <strong className="text-white">{meeting.host_name || "Host"}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-[#2f3340] bg-[#1e212b] px-3 py-1.5 text-xs font-mono font-medium text-[#c5c9d6] hover:bg-[#282c3a] hover:text-white transition-colors cursor-pointer"
        >
          {copiedCode ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400 font-sans">Copied ID</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-[#9ba1b0]" />
              <span>ID: {formatMeetingCode(meeting.meeting_code)}</span>
            </>
          )}
        </button>
      </div>

      {/* Video Preview Box */}
      <div className="relative aspect-video w-full rounded-xl bg-[#0f1014] border border-[#272a34] overflow-hidden flex items-center justify-center shadow-inner">
        {videoEnabled && !permissionError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover -scale-x-100"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#242834] text-2xl font-bold text-white shadow-md border border-[#34394a]">
              {initials}
            </div>
            <span className="text-xs font-medium text-[#7d8496]">Camera is off</span>
          </div>
        )}

        {/* Floating Device Controls Overlay */}
        <div className="absolute bottom-4 flex items-center gap-3 bg-[#111318]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all cursor-pointer ${
              audioEnabled
                ? "bg-[#272b36] text-white hover:bg-[#343948]"
                : "bg-[#e53935] text-white hover:bg-[#d32f2f]"
            }`}
            title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all cursor-pointer ${
              videoEnabled
                ? "bg-[#272b36] text-white hover:bg-[#343948]"
                : "bg-[#e53935] text-white hover:bg-[#d32f2f]"
            }`}
            title={videoEnabled ? "Stop Camera" : "Start Camera"}
          >
            {videoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {permissionError && (
        <p className="text-center text-xs font-medium text-[#f87171]">{permissionError}</p>
      )}

      {/* Name and Join Action Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#9ba1b0]">
            Your Display Name
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full h-11 rounded-lg border border-[#34394a] bg-[#1e212b] px-3.5 py-2 text-sm text-white placeholder:text-[#6c7280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e72ed]"
              placeholder="e.g. Rohan Sharma"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoFocus
            />
            {user && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                Verified
              </span>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-bold shadow-md tracking-tight"
          disabled={!displayName.trim()}
        >
          Join Meeting
        </Button>

        <div className="text-center pt-1">
          <Link href="/" className="text-xs text-[#9ba1b0] hover:text-white transition-colors">
            Cancel and return to dashboard
          </Link>
        </div>
      </form>
    </div>
  );
};
