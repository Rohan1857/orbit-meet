export const ALLOWED_REACTIONS = ["👍", "👏", "❤️", "😂", "🎉"] as const;
export type AllowedReaction = typeof ALLOWED_REACTIONS[number];

export interface ChatMessagePayload {
  id: string;
  senderIdentity: string;
  senderName: string;
  text: string;
  timestamp: number;
  recipientIdentity?: string; // "everyone" or specific participant identity
  recipientName?: string;
  isDirect?: boolean;
}

export interface ReactionPayload {
  senderIdentity: string;
  senderName: string;
  emoji: AllowedReaction;
  timestamp: number;
}

export interface HandStatePayload {
  senderIdentity: string;
  isRaised: boolean;
}

export interface SystemMessagePayload {
  id: string;
  message: string;
  timestamp: number;
}

export interface PermissionsUpdatePayload {
  allow_participant_unmute?: boolean;
  allow_participant_screen_share?: boolean;
  is_locked?: boolean;
}

export type RealtimeEvent =
  | { type: "chat.message"; version: 1; payload: ChatMessagePayload }
  | { type: "reaction"; version: 1; payload: ReactionPayload }
  | { type: "hand.state"; version: 1; payload: HandStatePayload }
  | { type: "system"; version: 1; payload: SystemMessagePayload }
  | { type: "permissions.updated"; version: 1; payload: PermissionsUpdatePayload };

export function encodeRealtimeEvent(event: RealtimeEvent): Uint8Array {
  const json = JSON.stringify(event);
  return new TextEncoder().encode(json);
}

export function decodeRealtimeEvent(data: Uint8Array): RealtimeEvent | null {
  try {
    const text = new TextDecoder().decode(data);
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1) {
      return null;
    }

    if (parsed.type === "chat.message") {
      const p = parsed.payload;
      if (
        p &&
        typeof p.id === "string" &&
        typeof p.senderIdentity === "string" &&
        typeof p.senderName === "string" &&
        typeof p.text === "string" &&
        p.text.trim().length > 0 &&
        p.text.length <= 2000
      ) {
        return {
          type: "chat.message",
          version: 1,
          payload: {
            id: p.id,
            senderIdentity: p.senderIdentity,
            senderName: p.senderName.slice(0, 100),
            text: p.text.trim().slice(0, 2000),
            timestamp: typeof p.timestamp === "number" ? p.timestamp : Date.now(),
            recipientIdentity: typeof p.recipientIdentity === "string" ? p.recipientIdentity : "everyone",
            recipientName: typeof p.recipientName === "string" ? p.recipientName.slice(0, 100) : undefined,
            isDirect: Boolean(p.isDirect),
          },
        };
      }
    }

    if (parsed.type === "reaction") {
      const p = parsed.payload;
      if (
        p &&
        typeof p.senderIdentity === "string" &&
        ALLOWED_REACTIONS.includes(p.emoji)
      ) {
        return {
          type: "reaction",
          version: 1,
          payload: {
            senderIdentity: p.senderIdentity,
            senderName: typeof p.senderName === "string" ? p.senderName : "Participant",
            emoji: p.emoji,
            timestamp: typeof p.timestamp === "number" ? p.timestamp : Date.now(),
          },
        };
      }
    }

    if (parsed.type === "hand.state") {
      const p = parsed.payload;
      if (p && typeof p.senderIdentity === "string" && typeof p.isRaised === "boolean") {
        return {
          type: "hand.state",
          version: 1,
          payload: {
            senderIdentity: p.senderIdentity,
            isRaised: p.isRaised,
          },
        };
      }
    }

    if (parsed.type === "system") {
      const p = parsed.payload;
      if (p && typeof p.message === "string") {
        return {
          type: "system",
          version: 1,
          payload: {
            id: typeof p.id === "string" ? p.id : `sys_${Date.now()}`,
            message: p.message,
            timestamp: typeof p.timestamp === "number" ? p.timestamp : Date.now(),
          },
        };
      }
    }

    if (parsed.type === "permissions.updated") {
      const p = parsed.payload;
      if (p && typeof p === "object") {
        return {
          type: "permissions.updated",
          version: 1,
          payload: {
            allow_participant_unmute: typeof p.allow_participant_unmute === "boolean" ? p.allow_participant_unmute : undefined,
            allow_participant_screen_share: typeof p.allow_participant_screen_share === "boolean" ? p.allow_participant_screen_share : undefined,
            is_locked: typeof p.is_locked === "boolean" ? p.is_locked : undefined,
          },
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export const decodeRealtimeMessage = decodeRealtimeEvent;

export function encodeChatMessage(
  senderIdentity: string,
  senderName: string,
  text: string,
  recipientIdentity: string = "everyone",
  recipientName?: string
): Uint8Array {
  const isDirect = recipientIdentity !== "everyone" && !!recipientIdentity;
  return encodeRealtimeEvent({
    type: "chat.message",
    version: 1,
    payload: {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      senderIdentity,
      senderName,
      text,
      timestamp: Date.now(),
      recipientIdentity,
      recipientName,
      isDirect,
    },
  });
}

export function encodePermissionsUpdate(payload: PermissionsUpdatePayload): Uint8Array {
  return encodeRealtimeEvent({
    type: "permissions.updated",
    version: 1,
    payload,
  });
}

export function encodeReaction(senderIdentity: string, senderName: string, emoji: AllowedReaction): Uint8Array {
  return encodeRealtimeEvent({
    type: "reaction",
    version: 1,
    payload: {
      senderIdentity,
      senderName,
      emoji,
      timestamp: Date.now(),
    },
  });
}

export function encodeHandState(senderIdentity: string, isRaised: boolean): Uint8Array {
  return encodeRealtimeEvent({
    type: "hand.state",
    version: 1,
    payload: {
      senderIdentity,
      isRaised,
    },
  });
}

export function encodeSystemNotice(message: string): Uint8Array {
  return encodeRealtimeEvent({
    type: "system",
    version: 1,
    payload: {
      id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      message,
      timestamp: Date.now(),
    },
  });
}
