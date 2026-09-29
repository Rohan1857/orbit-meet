# Implementation Plan: OrbitMeet Video Conferencing Platform

## Technical Context
- **Target Platform**: Web (Desktop Chrome/Firefox/Safari/Edge, Tablet, Mobile responsive).
- **Frontend Architecture**:
  - Framework: Next.js 15+ (App Router), TypeScript, Tailwind CSS.
  - Icons: `lucide-react`.
  - Media SDK: `@livekit/components-react`, `livekit-client`.
  - Utilities: `date-fns` for datetime operations, `clsx` / `tailwind-merge` for class utility.
  - State Management: React state & Context where needed; LiveKit React hooks for media state. No heavyweight Redux/Zustand required (Ponytail principle).
- **Backend Architecture**:
  - Language & Runtime: Python 3.12+ (or 3.10+ compatible), FastAPI, Uvicorn.
  - ORM & Persistence: SQLAlchemy 2.0+ (declarative 2.0 style), Alembic migrations, SQLite with PRAGMA foreign_keys = ON and WAL mode.
  - Media Server SDK: `livekit-api` (Python server SDK).
  - Environment: `pydantic-settings`.
- **Infrastructure & Deployment**:
  - Frontend: Vercel.
  - Backend: Railway with `/data` persistent volume for SQLite.
  - Realtime SFU: LiveKit Cloud.

## Constitution Check
- [x] **Ponytail Minimalism**:
  - No unnecessary abstractions: Direct SQLAlchemy sessions, thin routers, single service layer.
  - Native platform first: HTML5 native date/time pickers or lightweight dropdowns, native WebRTC devices via LiveKit, standard flex/grid layouts.
  - Fewest files: Co-located modules without excessive micro-files.
- [x] **Anti-AI-Slop**:
  - Custom design tokens (`--app-bg`, `--surface`, `--border`, `--text-primary`, `--accent`).
  - Restrained 6px–12px border radii, no glowing purple gradients or marketing cards.
  - Restrained, human microcopy ("New meeting", "Join with ID", "Leave meeting").
  - Exclusively Lucide icons.
- [x] **Originality**:
  - Authored from scratch. Zero copied code or cloned boilerplate.
- [x] **System Security & Persistence**:
  - `LIVEKIT_API_SECRET` and `LIVEKIT_API_KEY` kept exclusively on FastAPI backend.
  - `host_control_token` used for authenticating host actions (mute, kick, end).
  - SQLite mounted to persistent volume in production; WAL mode enabled for write concurrency.

## Master Phase Breakdown (Mapped to Blueprint)

### Phase 0: Outline & Research
- Technology verification: Next.js 15 App router compatibility with LiveKit components, FastAPI SQLite WAL setup, LiveKit Python SDK token generation format.
- Output: `specs/001-zoom-clone/research.md`.

### Phase 1: Design & Contracts
- Data Model: `meetings` and `participant_sessions` tables with SQLite constraints.
- Interface Contracts: REST endpoints (`/api/meetings`, `/api/meetings/instant`, `/api/meetings/{code}/join`, `/api/health`), LiveKit token claims schema, host moderation API.
- Quickstart Validation Guide: End-to-end local reproduction and smoke testing scenarios.
- Output: `specs/001-zoom-clone/data-model.md`, `specs/001-zoom-clone/contracts/rest-api.md`, `specs/001-zoom-clone/contracts/livekit-token.md`, `specs/001-zoom-clone/quickstart.md`.

### Phase 2: Backend Core (Blueprint Phases B1–B6)
- Setup Python venv with Python 3.12/3.10, FastAPI, SQLAlchemy 2.x, Alembic, livekit-api.
- Configure SQLite database with foreign keys & WAL mode.
- Create SQLAlchemy models (`Meeting`, `ParticipantSession`) and Alembic migration.
- Implement `MeetingService`:
  - Instant meeting creation with random 10-digit code.
  - Scheduled meeting persistence and validation (future time, duration).
  - Meeting lookup, upcoming list (ascending scheduled time), recent list (descending end/start time).
- Implement `LiveKitService`:
  - Access token generation with video grants, participant identity, and room name.
  - Room moderation (participant removal, track mute).
- Implement Seed Script:
  - Deterministic realistic upcoming and recent meetings.
- Write pytest suite testing all meeting flows, validations, and security boundaries.

### Phase 3: Frontend Foundation & Design System (Blueprint Phases F1–F3)
- Initialize Next.js project with TypeScript, Tailwind CSS, Lucide icons.
- Establish CSS custom properties / design tokens for light dashboard and dark meeting room.
- Centralize API client (`src/lib/api.ts`) for all backend REST communications.
- Build UI primitives: Button, Input, Modal/Dialog, Avatar, Badge.

### Phase 4: Dashboard & Scheduling (Blueprint Phases F2, F4, Phase 3)
- Build Top Navigation with product branding (`OrbitMeet`), user avatar (`DS`), and settings.
- Action Cluster: New Meeting (subtle loading -> instant creation -> redirect), Join (route to `/join`), Schedule (modal/form).
- Today's strip & Next Meeting highlight.
- Connect Upcoming & Recent sections directly to FastAPI backend (no mock arrays).
- Schedule Meeting page/modal with inline validation, future date checks, and immediate dashboard refresh.

### Phase 5: Join & Pre-Join Room (Blueprint Phase 4, F5)
- Meeting code input normalization: strips spaces, handles pasted invite URLs.
- Dynamic meeting validation via backend API.
- Pre-join room with camera/mic browser device preview, toggle controls, and display name input.

### Phase 6: Live Meeting Room & Media Grid (Blueprint Phases 5–7, F6)
- Connect to LiveKit room using server-issued participant token.
- Responsive video grid adapting to participant count (1, 2, 3-4, 5+).
- Fallback avatar/initials tile when camera is disabled; mute status badge; host indicator.
- Meeting Toolbar: Mic, Camera, Screen Share, Participants toggle, Info/Invite modal, Leave/End.
- Participants Panel: attendee list, self indicator, host badge.
- Host Moderation: Mute participant, Mute All, Remove participant (backed by FastAPI calls).
- Leave/End Dialog: Participant leaves session; Host can "Leave" or "End for all".

### Phase 7: Responsive Hardening, Testing & Visual QA (Blueprint Phases 8–9)
- Viewport audits: 1440px desktop, 1024px tablet, 390px mobile (drawer participant list, compact toolbar, 1-2 col video).
- Automated test runs: `pytest` backend tests, `npm run build` and `npm run lint` frontend checks.
- Dual-browser session verification: video/audio exchange, camera toggle fallback, screen share, host moderation, meeting termination.
- Anti-AI-slop audit: ensure no generic gradients, consistent tokens, clean human microcopy.

### Phase 8: Deployment & Documentation (Blueprint Phases 10–11)
- Deploy FastAPI backend to Railway with `/data` persistent volume for SQLite.
- Deploy Next.js frontend to Vercel with `NEXT_PUBLIC_API_BASE_URL`.
- Verify production persistence (meeting survives backend redeploy).
- Write production README with architecture diagrams, schema details, setup instructions, and interview prep notes (`docs/interview-notes.md`).
