# OrbitMeet: Technical Architecture Specification

## 1. System Topology

```
Browser Client
   |
   | (HTTPS / REST)
   +----------------------------------------------+
   |                                              |
   v                                              v
Next.js 15 Frontend                         FastAPI Backend
(Deployed on Vercel)                        (Deployed on Railway)
   |                                              |
   |                                              | (SQLAlchemy 2.0 / WAL)
   |                                              v
   |                                        SQLite Database
   |                                   (/data/zoom_clone.db Persistent Volume)
   |
   | (Direct WebRTC Media & Signaling via Token)
   v
LiveKit Cloud SFU
(STUN/TURN, Adaptive Bitrate, Track Fanout)
```

---

## 2. Separation of Responsibilities

### Next.js Frontend
- **Responsibilities**:
  - Application dashboard, navigation, and settings shell.
  - Client-side code normalization (strips spaces, handles invite links).
  - Pre-join local camera/mic preview and device enumeration.
  - Video grid with adaptive layouts (1, 2, 3-4, 5+).
  - WebRTC connection orchestration via `@livekit/components-react`.
  - Host authorization token handling in `sessionStorage`.

### FastAPI Backend
- **Responsibilities**:
  - Meeting lifecycle management (instant meeting launch, scheduled persistence, status transitions).
  - Cryptographically secure 10-digit meeting ID generation with collision retry.
  - Single system of record via SQLite with WAL mode.
  - Secure issuance of signed LiveKit `AccessToken` JWTs with video grants.
  - Host moderation enforcement (`x-host-token` header validation).
  - Participant join and departure session auditing.

### LiveKit Cloud SFU
- **Responsibilities**:
  - Selective forwarding unit (SFU) audio/video fanout.
  - Managed STUN/TURN traversal over restrictive NATs/firewalls.
  - Screen sharing media track distribution.
  - Realtime speaking indicators and participant presence.

---

## 3. Security Boundaries & Token Lifecycle

1. **Server-Side Credentials**:
   `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` reside exclusively in the FastAPI environment. They are never exported or leaked into client bundles.

2. **Participant Session Authentication**:
   When joining, the client sends a `POST /api/meetings/{code}/join`. FastAPI validates the meeting in SQLite, creates a session audit record, and signs a short-lived (6-hour TTL) JWT containing specific room permissions.

3. **Host Authorization**:
   Upon meeting creation, FastAPI generates a 32-character hexadecimal `host_control_token` returned once to the host client. The host browser caches this token in `sessionStorage`. Sensitive actions (`/end`, `/participants/{id}`, `/mute-all`) reject calls lacking a matching `x-host-token` header with `403 Forbidden`.
