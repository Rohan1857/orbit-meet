# OrbitMeet: Technical Interview & Architecture Notes

These notes provide concise, senior-level explanations of design decisions and system mechanics for code review and technical evaluation.

---

### 1. Why FastAPI?
FastAPI provides high performance (built on Starlette and Pydantic v2), automatic OpenAPI documentation, clean dependency injection for database sessions, and native asynchronous support needed for LiveKit server API interactions.

### 2. Why LiveKit instead of raw WebRTC?
Raw WebRTC peer-to-peer (mesh) creates $O(N^2)$ media streams, which degrades network and CPU on client machines past 3 participants. LiveKit acts as a Selective Forwarding Unit (SFU): each participant uploads their stream once ($O(1)$ upstream), and the server forwards tracks to subscribers. It also handles global STUN/TURN relay for restrictive symmetric NATs and firewalls.

### 3. What happens when "New Meeting" is clicked?
1. Frontend disables button and displays subtle spinner.
2. Client sends `POST /api/meetings/instant`.
3. FastAPI generates a cryptographically unique 10-digit meeting code and a 32-char hex `host_control_token`.
4. Record inserted into SQLite `meetings` table with status `live`.
5. Frontend receives payload, stores `host_control_token` in `sessionStorage`, and routes to `/meeting/{code}`.

### 4. How is a meeting ID generated?
Meeting IDs are 10-digit numeric codes generated using Python's `secrets` module (e.g. `secrets.choice("123456789") + 9 digits`). The service performs an existence check against SQLite with up to 10 collision retries. A database `UNIQUE` constraint acts as the final consistency safeguard.

### 5. How does joining work end-to-end?
1. Client enters 10-digit code or clicks invite URL (`/join?meeting=8231946621`).
2. Code is normalized (spaces, dashes, and URLs stripped to raw 10 digits).
3. Backend validates meeting existence and checks that meeting is not `ended`.
4. Pre-join screen initializes browser camera/microphone preview via `navigator.mediaDevices.getUserMedia`.
5. User enters display name and clicks "Join Meeting".
6. Backend records entry in `participant_sessions` table, generates a signed LiveKit JWT with room video grants, and returns it to the client.
7. Client connects to LiveKit Cloud via WebSockets (`wss://...`).

### 6. Why are LiveKit API secrets backend-only?
`LIVEKIT_API_SECRET` has administrative privilege to sign tokens and manipulate any room on the account. Exposing this key to the browser bundle would allow any user to forge tokens, impersonate hosts, or access other rooms.

### 7. What does SQLite store vs LiveKit?
- **SQLite (System of Record)**: Meeting metadata, scheduled date/time, duration, creation timestamps, lifecycle status (`scheduled`, `live`, `ended`), host authorization secrets, and participant audit logs.
- **LiveKit (Ephemeral Media Layer)**: Realtime media tracks, audio/video stream packets, connection quality, active speaker status, and instantaneous room presence.

### 8. How are upcoming/recent queries calculated?
- **Upcoming**: Filtered by `status = 'scheduled'` and `scheduled_at >= now - 30 minutes`, sorted ascending (`scheduled_at ASC`).
- **Recent**: Filtered by `status IN ('ended', 'live')`, sorted descending by most recent activity timestamp (`COALESCE(ended_at, started_at, created_at) DESC`).

### 9. How are participant sessions modeled?
Each join creates a `participant_sessions` record linked to `meetings.id` via foreign key with `ON DELETE CASCADE`. Fields include `participant_uid`, `identity`, `display_name`, `role`, `joined_at`, and `left_at`.

### 10. How do mute/remove host controls work?
Moderation endpoints require the `x-host-token` header. FastAPI validates this against `meetings.host_control_token`. When verified, FastAPI calls LiveKit's server SDK to kick the participant identity or mute their track, then updates the departure timestamp in SQLite.

### 11. What happens when the host ends a meeting?
1. Host selects "End meeting for all".
2. FastAPI updates meeting status to `ended` and sets `ended_at = now`.
3. All open `participant_sessions` left_at timestamps are closed.
4. Meeting now appears under "Recent Meetings" on the dashboard.

### 12. Why is SQLite on a persistent volume?
Cloud platforms like Railway run containers on ephemeral filesystems; any restart or redeploy wipes files stored in root. Mounting a persistent disk volume to `/data` ensures that `zoom_clone.db` and its WAL logs persist indefinitely across restarts.

### 13. How would architecture change at production scale?
- Replace SQLite with PostgreSQL / Amazon Aurora.
- Deploy stateless FastAPI replicas behind an Application Load Balancer.
- Use Redis for distributed cache and session coordination.
- Use Webhook receivers from LiveKit Cloud to sync participant disconnect events automatically.

### 14. What would authentication add?
OAuth2 / OIDC (e.g. Google, GitHub, WorkOS) to bind meeting ownership to user IDs, enable personal meeting rooms, protect user profile settings, and prevent meeting link spoofing.

### 15. What tradeoffs were intentionally made for the assignment?
- No authentication required: Assumed single default host ("Dhruv Singh") per assignment specification.
- Session-scoped host tokens: Secured administrative endpoints without needing full multi-user RBAC.
- Managed LiveKit Cloud: Avoided self-hosting and maintaining complex SFU infrastructure.
