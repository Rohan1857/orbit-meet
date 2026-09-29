# OrbitMeet — Video Conferencing Platform

OrbitMeet is an original, production-ready Zoom-style video conferencing application built with **Next.js (App Router) + FastAPI + SQLite + LiveKit Cloud**.
Designed from the ground up to provide a human-authored, responsive conferencing experience adhering strictly to minimalism, clear visual hierarchy, and real WebRTC audio/video transport.

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
   | (Direct WebRTC Media & Signaling via Signed JWT)
   v
LiveKit Cloud SFU
(STUN/TURN, Adaptive Bitrate, Track Fanout)
```

---

## Key Features

### Core Conferencing
- **Instant Meeting**: One-click meeting launch generating a random 10-digit meeting ID (`XXX XXX XXXX`) and shareable link.
- **Meeting Scheduling**: Future date/time selection, duration options, description, and automatic dashboard sync.
- **Persistent Storage**: All meetings, schedules, and attendee audit sessions stored in SQLite with Write-Ahead Logging (WAL).
- **Upcoming & Recent History**: Filtered, deterministic dashboard views directly querying database records.
- **Pre-Join Experience**: Browser camera/microphone device preview, toggle controls, and customizable display name.
- **Realtime Audio & Video**: Multi-user media fanout powered by LiveKit Cloud SFU with active speaker detection and initials fallback avatar.
- **Screen Sharing**: One-click display media streaming.
- **Host Moderation**: Cryptographically secured `host_control_token` in `sessionStorage` enabling host-only Mute-All, Kick Participant, and End for All.
- **Seeded Sample Data**: Deterministic, realistic upcoming and recent meetings for immediate review.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React, `@livekit/components-react`, `livekit-client` |
| **Backend** | Python 3.12+, FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, `livekit-api`, `pydantic-settings` |
| **Database** | SQLite with WAL mode (`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`) |
| **Media Transport** | LiveKit Cloud WebRTC SFU |
| **Testing** | pytest, httpx, TypeScript `tsc --noEmit` |

---

## Database Schema

```sql
-- Meetings table
CREATE TABLE meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_code VARCHAR(10) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    host_name VARCHAR(100) NOT NULL DEFAULT 'Dhruv Singh',
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
Backend runs at `http://localhost:8000`. OpenAPI docs available at `http://localhost:8000/docs`.

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
Runs 11 test cases verifying:
- System health
- Instant meeting creation & uniqueness
- Scheduling validation & past date rejection
- Meeting lookup and normalized code formatting
- Upcoming and recent query filters
- Join flow & LiveKit token issuance
- Host-token protected moderation endpoints

### Frontend Typecheck & Build
```bash
cd frontend
npm run typecheck
npm run build
```

---

## Deployment Architecture

### Backend (Railway)
1. Deployed using `backend/Dockerfile` with `railway.json`.
2. Mounted persistent volume at `/data` with `DATABASE_URL=sqlite:////data/zoom_clone.db`.
3. Auto-runs Alembic migrations on startup.

### Frontend (Vercel)
1. Deployed using Next.js framework preset with root directory set to `frontend`.
2. Configured environment variable `NEXT_PUBLIC_API_BASE_URL=https://<railway-backend-domain>/api`.

---

## Assumptions & Originality Statement

- **Default User**: Per assignment specifications, user authentication is omitted. The application assumes a default logged-in host named "Dhruv Singh" (initials `DS`).
- **Security Model**: Host operations are authorized via a session-scoped `host_control_token` generated at meeting creation. LiveKit API keys never leave the server.
- **Originality**: All components, styling tokens, database models, and service logic were authored specifically for OrbitMeet from scratch. Zero copied code from existing tutorial repositories.
