"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video, AlertCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/dashboard/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { normalizeMeetingCode, formatMeetingCode } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const initialMeeting = searchParams.get("meeting") || "";

  const [inputVal, setInputVal] = useState(initialMeeting);
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.display_name && !displayName) {
      setDisplayName(user.display_name);
    }
  }, [user, displayName]);

  useEffect(() => {
    if (initialMeeting) {
      const clean = normalizeMeetingCode(initialMeeting);
      if (clean.length === 10) {
        setInputVal(formatMeetingCode(clean));
      }
    }
  }, [initialMeeting]);

  const cleanCode = normalizeMeetingCode(inputVal);
  const isCodeRecognized = cleanCode.length === 10;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!cleanCode || cleanCode.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit meeting ID or paste the complete invite link.");
      return;
    }

    setIsValidating(true);
    try {
      const meeting = await api.getMeeting(cleanCode);
      if (meeting.status === "ended") {
        setErrorMessage("This meeting has already concluded.");
        setIsValidating(false);
        return;
      }
      // Navigate to pre-join stage
      router.push(`/meeting/${cleanCode}`);
    } catch (err: any) {
      setErrorMessage("Could not locate conference. Verify the 10-digit meeting ID and try again.");
      setIsValidating(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-xs space-y-6">
      <div className="space-y-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Join a Meeting</h2>
        <p className="text-xs text-text-secondary">
          Enter a meeting code or invite link. Guests join freely without an account.
        </p>
      </div>

      {isCodeRecognized && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2 text-xs font-medium text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span>Meeting code recognized</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <Input
            label="Meeting ID or Link"
            placeholder="e.g. 843 429 4693"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            autoFocus
          />
        </div>

        <Button
          type="submit"
          className="w-full h-10 gap-2 font-semibold text-xs shadow-xs"
          isLoading={isValidating}
          disabled={!inputVal.trim()}
        >
          <Video className="h-4 w-4" />
          <span>Join Meeting</span>
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-border-subtle space-y-2">
        <p className="text-xs text-text-muted">
          Need to host your own conference?{" "}
          <Link href="/" className="text-[#0e72ed] hover:underline font-semibold">
            Start instant meeting
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<div className="text-xs text-text-muted">Loading meeting room...</div>}>
          <JoinContent />
        </Suspense>
      </main>
    </div>
  );
}
