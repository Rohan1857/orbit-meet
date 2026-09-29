# Orbit Meet — Video Conferencing Platform

Orbit Meet is an original, production-ready video conferencing application built with **Next.js 15 (App Router), FastAPI, SQLite (WAL mode on persistent storage), and LiveKit Cloud WebRTC SFU**, upgraded with full **Email + Password & Google Sign-In authentication**.

Designed to provide a responsive conferencing experience with clear visual hierarchy, server-authoritative meeting state, user-scoped dashboards, and real multi-participant WebRTC audio/video transport.

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
1. **Frontend (Next.js 15 App Router)**: UI components, auth context & route guards, pre-join camera/mic preview, device enumeration, video grid layout, client-side code normalization, and WebRTC orchestration via `@livekit/components-react`.
2. **Backend (FastAPI)**: Single system of record, user registration & login (bcrypt), Google ID token verification, 10-digit meeting ID generation, LiveKit JWT token signing with scoped video grants, meeting ownership enforcement, host moderation verification, and attendee audit logging.
3. **Storage (SQLite in WAL mode)**: Persistent volume storage (`/data/zoom_clone.db`) ensuring zero data loss across container redeployments.
4. **Media SFU (LiveKit Cloud)**: WebRTC media fanout, adaptive simulcast, and STUN/TURN NAT traversal.

---

## Key Features

### Authentication & Access Control
- **Email + Password**: Secure registration and login hashed with `bcrypt` (12 rounds).
- **Google Sign-In**: One-tap sign-in via Google Identity Services (GIS) with server-side signature and audience verification.
- **Cross-Domain Session Management**: Signed JWT `Bearer` token architecture enabling reliable authenticated requests across Vercel frontend and Railway backend domains without third-party cookie blocking.
- **Meeting Ownership**: Meetings are linked to the creator (`owner_user_id`), automatically granting the owner host moderation rights and sanitizing host control tokens from non-owners.
- **Scoped Dashboard**: Authenticated users see their upcoming and recent sessions, with instant meeting creation and scheduling.
- **Unauthenticated Guest Join (P0 Invariant)**: Anyone with an invite link or 10-digit code can enter a display name and join a meeting without an account or redirect to login.

### Conferencing & Realtime Media
- **Instant Meeting**: One-click meeting launch generating a random 10-digit meeting ID (`XXX XXX XXXX`) and shareable link.
- **Meeting Scheduling**: Future date/time selection, duration options, description, and automatic dashboard sync.
- **Persistent Storage**: All users, meetings, schedules, and attendee audit sessions stored in SQLite with Write-Ahead Logging (WAL).
- **Pre-Join Experience**: Local camera/microphone preview before entering the room, device toggle controls, and customizable display name.
- **Realtime Audio & Video**: Multi-user media fanout powered by LiveKit Cloud SFU with active speaker detection, initials avatar fallback, and dynamic tile layout.
- **Screen Sharing**: One-click display media streaming.
- **Host Moderation**: Server-authoritative host verification enabling host-only Mute-All, Kick Participant, and End Meeting for All.
- **Participant Safety & Security**: Non-host attendees and cross-user moderation requests are strictly rejected with `403 Forbidden` on all administrative endpoints.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15.5 (App Router), TypeScript, Tailwind CSS, Lucide React, `@livekit/components-react`, `livekit-client` |
| **Backend** | Python 3.12+, FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, `livekit-api`, `bcrypt`, `pyjwt`, `google-auth`, `pydantic-settings` |
| **Database** | SQLite with WAL mode (`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`) |
| **Media Transport** | LiveKit Cloud WebRTC SFU |
| **Testing** | pytest, httpx, Playwright (dual-browser automation with fake media streams) |

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    google_sub VARCHAR(64) UNIQUE,
    avatar_url VARCHAR(512),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Meetings table
CREATE TABLE meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_code VARCHAR(10) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    host_name VARCHAR(100) NOT NULL DEFAULT 'Host',
    meeting_type VARCHAR(20) NOT NULL CHECK (meeting_type IN ('instant', 'scheduled')),
    scheduled_at DATETIME,
    duration_minutes INTEGER DEFAULT 45,
    status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    host_control_token VARCHAR(64) NOT NULL,
    owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
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
| `POST` | `/api/auth/register` | Register new user with email, password, and display name | None | 201, 400 |
| `POST` | `/api/auth/login` | Authenticate existing user with email and password | None | 200, 401 |
| `POST` | `/api/auth/google` | Authenticate or register user via Google GIS ID token | None | 200, 401, 409 |
| `GET` | `/api/auth/me` | Retrieve profile of authenticated user | `Bearer <token>` | 200, 401 |
| `POST` | `/api/auth/logout` | Invalidate current session client-side | None | 200 |
| `POST` | `/api/meetings/instant` | Create instant meeting (attaches authenticated owner if logged in) | Optional `Bearer` | 201 |
| `POST` | `/api/meetings` | Schedule a future meeting | Optional `Bearer` | 201, 422 |
| `GET` | `/api/meetings/{code}` | Retrieve meeting metadata (sanitizes host token for non-owners) | Optional `Bearer` | 200, 404 |
| `GET` | `/api/meetings?filter=upcoming` | List upcoming meetings (scoped to authenticated user) | Optional `Bearer` | 200 |
| `GET` | `/api/meetings?filter=recent` | List recent meetings (scoped to authenticated user) | Optional `Bearer` | 200 |
| `POST` | `/api/meetings/{code}/join` | Join meeting and issue signed LiveKit JWT (open to guests) | Optional `Bearer` | 200, 404, 400 |
| `POST` | `/api/meetings/{code}/end` | End meeting for all attendees (owner or host token required) | `Bearer` / `x-host-token` | 200, 403, 404 |
| `DELETE` | `/api/meetings/{code}/participants/{id}` | Kick attendee from LiveKit room & database | `Bearer` / `x-host-token` | 200, 403, 404 |
| `POST` | `/api/meetings/{code}/participants/{id}/mute` | Mute specific participant audio track | `Bearer` / `x-host-token` | 200, 403, 404 |
| `POST` | `/api/meetings/{code}/mute-all` | Mute all non-host attendees | `Bearer` / `x-host-token` | 200, 403, 404 |

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
JWT_SECRET=your-random-32-byte-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

### Frontend (`frontend/.env.local`)
```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

---

## Verification & Testing

### Backend Automated Test Suite
```bash
cd backend
pytest -v
```
Runs 31 automated tests verifying:
- System health & DB connectivity
- User registration (validations, password hashing, duplicates)
- User login (password verification, invalid credentials)
- Current user retrieval & logout
- Google Sign-In (new user, existing user, account collision handling, invalid tokens)
- Instant meeting creation & code generation
- Scheduling validation & past date rejection
- Meeting lookup and normalized code formatting
- Scoped upcoming and recent query filters
- Join flow & LiveKit token issuance (guests and owners)
- Meeting ownership assignment and scoped listing isolation
- Cross-user moderation security rejection (403 Forbidden)
- Unauthenticated guest access (P0 invariant)

### Frontend Typecheck & Build
```bash
cd frontend
npm run build
```

### Production Dual-Browser Real-Media Verification
Orbit Meet includes an automated dual-browser test suite (`tests/e2e_production_livekit.py`) using Playwright with fake media flags (`--use-fake-ui-for-media-stream`, `--use-fake-device-for-media-stream`):
```bash
python tests/e2e_production_livekit.py
```
This exercises:
1. Host registration and login on production.
2. Authenticated dashboard meeting creation.
3. Participant join via invite URL in an isolated incognito browser context without login.
4. WebRTC room connection for both clients to LiveKit Cloud.
5. Mutual audio/video presence verification.
6. Microphone and camera track state toggling.
7. Host Mute-All and non-host security rejection.
8. Host removal of participant and clean rejoin.
9. Participant leave and host meeting end for all.
10. Persistent screenshot capture saved under `tests/evidence/`.

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
