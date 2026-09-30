export interface User {
  id: number;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  google_sub?: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleAuthPayload {
  credential: string;
}

export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  description?: string | null;
  host_name: string;
  meeting_type: "instant" | "scheduled";
  scheduled_at?: string | null;
  duration_minutes?: number | null;
  status: "scheduled" | "live" | "ended" | "cancelled";
  host_control_token?: string | null;
  owner_user_id?: number | null;
  invite_url?: string | null;
  is_locked?: boolean;
  allow_participant_unmute?: boolean;
  allow_participant_screen_share?: boolean;
  created_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  active_participants_count?: number;
}

export interface InstantMeetingPayload {
  host_name?: string;
  title?: string;
}

export interface ScheduledMeetingPayload {
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes?: number;
  host_name?: string;
}

export interface JoinMeetingPayload {
  display_name: string;
  role?: "host" | "participant";
}

export interface JoinMeetingResponse {
  meeting_code: string;
  title: string;
  participant_identity: string;
  display_name: string;
  role: string;
  token: string;
  livekit_url: string;
}

