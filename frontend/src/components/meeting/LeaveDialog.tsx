"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

interface LeaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  meetingCode: string;
  isHost: boolean;
  hostToken: string | null;
  participantIdentity?: string;
  onLeaveConfirmed: () => void;
}

export const LeaveDialog: React.FC<LeaveDialogProps> = ({
  isOpen,
  onClose,
  meetingCode,
  isHost,
  hostToken,
  participantIdentity,
  onLeaveConfirmed,
}) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleJustLeave = async () => {
    setIsProcessing(true);
    try {
      if (participantIdentity) {
        await api.leaveMeeting(meetingCode, participantIdentity);
      }
    } catch {
      // Ignore background leave errors
    } finally {
      onLeaveConfirmed();
      router.push("/");
    }
  };

  const handleEndForAll = async () => {
    if (!hostToken) return;
    setIsProcessing(true);
    try {
      await api.endMeeting(meetingCode, hostToken);
    } catch {
      // Ignore background end errors
    } finally {
      onLeaveConfirmed();
      router.push("/");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHost ? "Leave or End Meeting?" : "Leave Meeting"}
      description={
        isHost
          ? "As host, you can end this session for everyone or leave others to continue."
          : "Are you sure you want to disconnect from this conference?"
      }
    >
      <div className="space-y-4 pt-2">
        <div className="flex flex-col gap-2.5">
          {isHost && hostToken && (
            <Button
              variant="danger"
              size="md"
              onClick={handleEndForAll}
              isLoading={isProcessing}
              className="w-full font-semibold"
            >
              End Meeting for All
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={handleJustLeave}
            disabled={isProcessing}
            className="w-full"
          >
            Leave Meeting
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full mt-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
