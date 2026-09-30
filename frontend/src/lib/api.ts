import {
  Meeting,
  InstantMeetingPayload,
  ScheduledMeetingPayload,
  JoinMeetingPayload,
  JoinMeetingResponse,
  User,
  AuthResponse,
  RegisterPayload,
  LoginPayload,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api";

const TOKEN_STORAGE_KEY = "orbitmeet_token";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
      } catch {
        this.token = null;
      }
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      try {
        if (token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch {
        // localStorage not available
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      try {
        this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
      } catch {
        this.token = null;
      }
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    const currentToken = this.getToken();
    if (currentToken && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${currentToken}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMessage = `Request failed with status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorMessage = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Fallback to generic message
      }
      throw new Error(errorMessage);
    }

    return res.json() as Promise<T>;
  }

  // Auth endpoints
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async logout(): Promise<void> {
    try {
      await this.request<{ status: string }>("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.setToken(null);
    }
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health");
  }

  async createInstantMeeting(payload: InstantMeetingPayload = {}): Promise<Meeting> {
    return this.request<Meeting>("/meetings/instant", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createScheduledMeeting(payload: ScheduledMeetingPayload): Promise<Meeting> {
    return this.request<Meeting>("/meetings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getMeeting(code: string): Promise<Meeting> {
    return this.request<Meeting>(`/meetings/${encodeURIComponent(code)}`);
  }

  async getUpcomingMeetings(limit: number = 10): Promise<Meeting[]> {
    return this.request<Meeting[]>(`/meetings?filter=upcoming&limit=${limit}`);
  }

  async getRecentMeetings(limit: number = 10): Promise<Meeting[]> {
    return this.request<Meeting[]>(`/meetings?filter=recent&limit=${limit}`);
  }

  async joinMeeting(
    code: string,
    payload: JoinMeetingPayload,
    hostToken?: string | null
  ): Promise<JoinMeetingResponse> {
    const headers: Record<string, string> = {};
    if (hostToken) {
      headers["x-host-token"] = hostToken;
    }
    return this.request<JoinMeetingResponse>(`/meetings/${encodeURIComponent(code)}/join`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }

  async leaveMeeting(code: string, identity: string): Promise<void> {
    await this.request<{ status: string }>(`/meetings/${encodeURIComponent(code)}/leave`, {
      method: "POST",
      body: JSON.stringify({ participant_identity: identity }),
    });
  }

  async endMeeting(code: string, hostToken: string): Promise<void> {
    await this.request<{ status: string }>(`/meetings/${encodeURIComponent(code)}/end`, {
      method: "POST",
      headers: {
        "x-host-token": hostToken,
      },
    });
  }

  async removeParticipant(code: string, identity: string, hostToken: string): Promise<void> {
    await this.request<{ status: string }>(
      `/meetings/${encodeURIComponent(code)}/participants/${encodeURIComponent(identity)}`,
      {
        method: "DELETE",
        headers: {
          "x-host-token": hostToken,
        },
      }
    );
  }

  async muteParticipant(code: string, identity: string, hostToken: string): Promise<void> {
    await this.request<{ status: string }>(
      `/meetings/${encodeURIComponent(code)}/participants/${encodeURIComponent(identity)}/mute`,
      {
        method: "POST",
        headers: {
          "x-host-token": hostToken,
        },
      }
    );
  }

  async muteAll(code: string, hostToken: string): Promise<void> {
    await this.request<{ status: string }>(
      `/meetings/${encodeURIComponent(code)}/mute-all`,
      {
        method: "POST",
        headers: {
          "x-host-token": hostToken,
        },
      }
    );
  }

  async lockMeeting(code: string, hostToken?: string | null): Promise<{ is_locked: boolean }> {
    return this.request<{ is_locked: boolean }>(
      `/meetings/${encodeURIComponent(code)}/lock`,
      {
        method: "POST",
        headers: hostToken ? { "x-host-token": hostToken } : undefined,
      }
    );
  }

  async unlockMeeting(code: string, hostToken?: string | null): Promise<{ is_locked: boolean }> {
    return this.request<{ is_locked: boolean }>(
      `/meetings/${encodeURIComponent(code)}/unlock`,
      {
        method: "POST",
        headers: hostToken ? { "x-host-token": hostToken } : undefined,
      }
    );
  }

  async updateMeetingPermissions(
    code: string,
    permissions: { allow_participant_unmute?: boolean; allow_participant_screen_share?: boolean },
    hostToken?: string | null
  ): Promise<{ allow_participant_unmute: boolean; allow_participant_screen_share: boolean }> {
    return this.request<{ allow_participant_unmute: boolean; allow_participant_screen_share: boolean }>(
      `/meetings/${encodeURIComponent(code)}/permissions`,
      {
        method: "PATCH",
        headers: hostToken ? { "x-host-token": hostToken } : undefined,
        body: JSON.stringify(permissions),
      }
    );
  }
}

export const api = new ApiClient();
