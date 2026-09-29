"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/dashboard/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { normalizeMeetingCode, formatMeetingCode } from "@/lib/utils";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMeeting = searchParams.get("meeting") || "";

  const [inputVal, setInputVal] = useState(initialMeeting);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialMeeting) {
      const clean = normalizeMeetingCode(initialMeeting);
      if (clean.length === 10) {
        setInputVal(formatMeetingCode(clean));
      }
    }
  }, [initialMeeting]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = normalizeMeetingCode(inputVal);
    if (!cleanCode || cleanCode.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit meeting ID or invitation link.");
      return;
    }

    setIsValidating(true);
    try {
      const meeting = await api.getMeeting(cleanCode);
      if (meeting.status === "ended") {
        setErrorMessage("This meeting has already ended.");
        setIsValidating(false);
        return;
      }
      // Navigate to pre-join / meeting room
      router.push(`/meeting/${cleanCode}`);
    } catch (err: any) {
      setErrorMessage("We couldn't find that meeting. Check the meeting ID and try again.");
      setIsValidating(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <h2 className="text-xl font-bold text-text-primary">Join a Meeting</h2>
        <p className="text-xs text-text-secondary">
          Enter the 10-digit meeting ID or paste the invite link to enter.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleJoin} className="space-y-4">
        <Input
          label="Meeting ID or Link"
          placeholder="823 194 6621"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          autoFocus
        />

        <Button
          type="submit"
          className="w-full gap-2"
          isLoading={isValidating}
          disabled={!inputVal.trim()}
        >
          <Video className="h-4 w-4" />
          <span>Join Meeting</span>
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-border-subtle">
        <p className="text-xs text-text-muted">
          Need to host instead?{" "}
          <Link href="/" className="text-[#0e72ed] hover:underline font-medium">
            Start an instant meeting
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
        <Suspense fallback={<div className="text-xs text-text-muted">Loading...</div>}>
          <JoinContent />
        </Suspense>
      </main>
    </div>
  );
}
