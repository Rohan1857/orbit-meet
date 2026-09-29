# Orbit Meet — Video Conferencing Platform

Orbit Meet is an original, production-ready video conferencing application built with **Next.js 15 (App Router), FastAPI, SQLite (WAL mode on persistent storage), and LiveKit Cloud WebRTC SFU**.

Designed from the ground up to provide a responsive conferencing experience with clear visual hierarchy, server-authoritative meeting state, and real multi-participant WebRTC audio/video transport.

---

## Live Production URLs

- **Frontend (Vercel)**: [https://orbitmeet-nu.vercel.app](https://orbitmeet-nu.vercel.app)
- **Backend API (Railway)**: [https://orbitmeet-backend-production.up.railway.app](https://orbitmeet-backend-production.up.railway.app)
- **Backend Health Check**: [https://orbitmeet-backend-production.up.railway.app/api/health](https://orbitmeet-backend-production.up.railway.app/api/health)
- **Realtime Media SFU**: `wss://fh-e25mx63h.livekit.cloud`
- **GitHub Repository**: [https://github.com/Rohan1857/orbit-meet](https://github.com/Rohan1857/orbit-meet)

---

## Architecture Overview

```
Browser Client
   │
   │ (HTTPS / REST)
   ├───────────────────────────────────────────────┤
   │                                               │
   ▼                                               ▼
Next.js 15 Frontend                         FastAPI Backend
(Deployed on Vercel)                        (Deployed on Railway)
   │                                               │
   │                                               │ (SQLAlchemy 2.0 / WAL)
   │                                               ▼
   │                                         SQLite Database
   │                                    (/data/zoom_clone.db Persistent Volume)
   │
   │ (Direct WebRTC Media & Signaling via Signed JWT)
   ▼
LiveKit Cloud SFU
(STUN/TURN, Adaptive Bitrate, Track Fanout)
```

### Separation of Concerns
1. **Frontend (Next.js 15 App Router)**: UI components, pre-join camera/mic preview, device enumeration, video grid layout, client-side code normalization, and WebRTC orchestration via `@livekit/components-react`.
2. **Backend (FastAPI)**: Single system of record, 10-digit meeting ID generation, LiveKit JWT token signing with scoped video grants, host moderation verification (`x-host-token`), and attendee audit logging.
3. **Storage (SQLite in WAL mode)**: Persistent volume storage ensuring zero data loss across container redeployments.
4. **Media SFU (LiveKit Cloud)**: WebRTC media fanout, adaptive simulcast, and STUN/TURN NAT traversal.

---

## Key Features

### Core Conferencing
- **Instant Meeting**: One-click meeting launch generating a random 10-digit meeting ID (`XXX XXX XXXX`) and shareable link.
- **Meeting Scheduling**: Future date/time selection, duration options, description, and automatic dashboard sync.
- **Persistent Storage**: All meetings, schedules, and attendee audit sessions stored in SQLite with Write-Ahead Logging (WAL).
- **Upcoming & Recent History**: Filtered, deterministic dashboard views directly querying database records.
- **Pre-Join Experience**: Local camera/microphone preview before entering the room, device toggle controls, and customizable display name.
- **Realtime Audio & Video**: Multi-user media fanout powered by LiveKit Cloud SFU with active speaker detection, initials avatar fallback, and dynamic tile layout.
- **Screen Sharing**: One-click display media streaming.
- **Host Moderation**: Cryptographically secured `host_control_token` cached in `sessionStorage` enabling host-only Mute-All, Kick Participant, and End Meeting for All.
- **Participant Safety & Security**: Non-host attendees and forged tokens are strictly rejected with `403 Forbidden` on all administrative endpoints.
- **Seeded Sample Data**: Deterministic, realistic upcoming and recent meetings for immediate review.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15.5 (App Router), TypeScript, Tailwind CSS, Lucide React, `@livekit/components-react`, `livekit-client` |
| **Backend** | Python 3.12+, FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, `livekit-api`, `pydantic-settings` |
| **Database** | SQLite with WAL mode (`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`) |
| **Media Transport** | LiveKit Cloud WebRTC SFU |
| **Testing** | pytest, httpx, Playwright (dual-browser automation with fake media streams) |

---

## Database Schema

```sql
-- Meetings table
CREATE TABLE meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_code VARCHAR(10) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    host_name VARCHAR(100) NOT NULL DEFAULT 'Rohan',
    meeting_type VARCHAR(20) NOT NULL CHECK (meeting_type IN ('instant', 'scheduled')),
    scheduled_at DATETIME,
    duration_minutes INTEGER DEFAULT 45,
    status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    host_control_token VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    ended_at DATETIME
);

-- Participant Sessions table
CREATE TABLE participant_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    participant_uid VARCHAR(64) NOT NULL,
    identity VARCHAR(64) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('host', 'participant')),
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at DATETIME
);
```

---

## REST API Reference

All API routes are prefixed under `/api`.

| Method | Endpoint | Description | Auth / Headers | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/health` | Service health and database connection status | None | 200 |
| `POST` | `/api/meetings/instant` | Create and launch an instant meeting | None | 201 |
| `POST` | `/api/meetings` | Schedule a future meeting | None | 201, 422 |
| `GET` | `/api/meetings/{code}` | Retrieve meeting metadata by 10-digit code | None | 200, 404 |
| `GET` | `/api/meetings?status=upcoming` | List upcoming scheduled meetings | None | 200 |
| `GET` | `/api/meetings?status=recent` | List recent / completed meetings | None | 200 |
| `POST` | `/api/meetings/{code}/join` | Register attendee and issue signed LiveKit JWT | None | 200, 404, 400 |
| `POST` | `/api/meetings/{code}/end` | End meeting for all attendees | `x-host-token` | 200, 403, 404 |
| `DELETE` | `/api/meetings/{code}/participants/{id}` | Kick attendee from LiveKit room & database | `x-host-token` | 200, 403, 404 |
| `POST` | `/api/meetings/{code}/participants/{id}/mute` | Mute specific participant audio track | `x-host-token` | 200, 403, 404 |
| `POST` | `/api/meetings/{code}/mute-all` | Mute all non-host attendees | `x-host-token` | 200, 403, 404 |

### LiveKit Realtime Media Grants
When a participant or host joins, FastAPI issues a signed LiveKit `AccessToken` with:
- `room_join: true`
- `room: <10-digit meeting code>`
- `can_publish: true`
- `can_subscribe: true`
- `can_publish_data: true`
- `identity: host_<id>` or `part_<id>`
- `name: <display_name>`
- 6-hour expiration TTL

Server secrets (`LIVEKIT_API_SECRET`) remain strictly on the backend and are never sent to the browser.

---

## Local Development Setup

### Prerequisites
- Node.js 18+ (tested on v22+)
- Python 3.10+ or 3.12+
- LiveKit Cloud account (free tier available at [livekit.io](https://livekit.io))

### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed initial sample data
python -m app.seed

# Start backend server
uvicorn app.main:app --reload --port 8000
```
Backend runs at `http://localhost:8000`. Interactive OpenAPI documentation available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend runs at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)
```ini
DATABASE_URL=sqlite:///./zoom_clone.db
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
FRONTEND_ORIGIN=http://localhost:3000
ENVIRONMENT=development
DEFAULT_HOST_NAME=Rohan
```

### Frontend (`frontend/.env.local`)
```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

---

## Verification & Testing

### Backend Automated Test Suite
```bash
cd backend
pytest -v
```
Runs 12 test cases verifying:
- System health & DB connectivity
- Instant meeting creation & code generation
- Scheduling validation & past date rejection
- Meeting lookup and normalized code formatting
- Upcoming and recent query filters
- Join flow & LiveKit token issuance
- Host-token protected moderation endpoints
- Forged and invalid host token security rejection (403 Forbidden)

### Frontend Typecheck & Build
```bash
cd frontend
npm run typecheck
npm run build
```

### Production Dual-Browser Real-Media Verification
Orbit Meet includes an automated dual-browser test suite (`tests/e2e_production_livekit.py`) using Playwright with fake media flags (`--use-fake-ui-for-media-stream`, `--use-fake-device-for-media-stream`):
```bash
python tests/e2e_production_livekit.py
```
This exercises:
1. Host instant meeting creation on production.
2. Participant join via invite URL in an isolated browser context.
3. WebRTC room connection for both clients to LiveKit Cloud.
4. Mutual audio/video presence verification.
5. Microphone and camera track state toggling.
6. Host Mute-All and non-host security rejection.
7. Host removal of participant and clean rejoin.
8. Participant leave and host meeting end for all.
9. Persistent screenshot capture saved under `tests/evidence/`.

---

## Deployment Architecture

### Backend (Railway)
1. Deployed using `backend/Dockerfile` with `railway.json`.
2. Mounted persistent volume at `/data` with `DATABASE_URL=sqlite:////data/zoom_clone.db`.
3. Auto-runs Alembic migrations on container startup.
4. SQLite runs in WAL mode (`journal_mode=WAL`), allowing concurrent readers without database locking.

### Frontend (Vercel)
1. Deployed using Next.js framework preset with root directory set to `frontend`.
2. Environment variable: `NEXT_PUBLIC_API_BASE_URL=https://orbitmeet-backend-production.up.railway.app/api`.

---

## Assumptions & Security Model

- **Default User**: Per assignment specifications, user authentication is omitted. The application assumes a default host named "Rohan" (initials `RO`).
- **Security Model**: Host operations are authorized via a session-scoped `host_control_token` issued at meeting creation and verified server-side on every moderation call.
- **Credential Isolation**: LiveKit API credentials (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`) reside exclusively on the server and are never exposed to browser bundles.

---

## Known Limitations

- **Single-User Scope**: Without a multi-tenant user authentication layer (e.g. OAuth / OIDC), meeting ownership is session-bound.
- **Participant Leave Detection**: In the absence of server-side LiveKit Webhook receivers, participant departures are recorded when the user clicks "Leave" or is removed by the host. Abnormal browser crashes rely on LiveKit SFU's built-in participant timeout.
- **Database Scalability**: SQLite on persistent volume is optimal for single-node deployments; horizontal multi-node scaling would transition the backend to PostgreSQL or Amazon Aurora.
