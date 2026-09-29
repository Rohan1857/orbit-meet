# Tasks: OrbitMeet Video Conferencing Platform

Feature: 001-zoom-clone
Target Branch: feature/001-zoom-clone

## Phase 1: Setup & Project Scaffolding
- [x] [TASK-001] [P] Create monorepo directory layout with `backend/` and `frontend/` roots and top-level `.gitignore`
- [x] [TASK-002] [P] Configure backend Python virtual environment, dependencies in `backend/requirements.txt`, and `.env.example`
- [x] [TASK-003] [P] Initialize frontend Next.js 15 project with TypeScript, Tailwind CSS, Lucide icons, and `.env.example`

## Phase 2: Database Layer & Domain Models
- [x] [TASK-004] Configure SQLite engine with WAL mode and foreign key enforcement in `backend/app/database.py`
- [x] [TASK-005] Define `Meeting` and `ParticipantSession` SQLAlchemy models in `backend/app/models/`
- [x] [TASK-006] Initialize Alembic and generate initial schema migration in `backend/alembic/`
- [x] [TASK-007] Implement deterministic seed script with realistic upcoming and recent meetings in `backend/app/seed.py`

## Phase 3: Backend REST Services & Meeting Lifecycle
- [x] [TASK-008] Implement Pydantic request/response validation schemas in `backend/app/schemas/`
- [x] [TASK-009] Implement `MeetingService` with 10-digit code generation, collision retry, and lifecycle logic in `backend/app/services/meeting_service.py`
- [x] [TASK-010] Create FastAPI router for meetings (`/api/meetings/instant`, `/api/meetings`, `/api/meetings/{code}`, `/api/meetings?filter=`) in `backend/app/routers/meetings.py`
- [x] [TASK-011] Add health check and application bootstrap with CORS in `backend/app/main.py`

## Phase 4: Realtime Media & LiveKit Integration
- [x] [TASK-012] Implement `LiveKitService` for participant and host token issuance with video grants in `backend/app/services/livekit_service.py`
- [x] [TASK-013] Add participant join and departure session tracking in `backend/app/routers/meetings.py`
- [x] [TASK-014] Implement server-side host moderation endpoints (mute, mute-all, remove, end) protected by `host_control_token` in `backend/app/routers/moderation.py`

## Phase 5: Frontend Design System & Layout Shell
- [x] [TASK-015] Define design tokens in `frontend/src/styles/tokens.css` (neutral light surfaces, dark meeting room, Zoom-blue accent, 6-12px radii)
- [x] [TASK-016] [P] Build reusable UI primitives: `Button`, `Input`, `Dialog`, `Avatar`, `Badge` in `frontend/src/components/ui/`
- [x] [TASK-017] [P] Implement centralized API client with typed methods in `frontend/src/lib/api.ts`
- [x] [TASK-018] Build top navigation bar with `OrbitMeet` branding, search/settings, and default user `Dhruv Singh` (`DS`) in `frontend/src/components/dashboard/Navbar.tsx`

## Phase 6: Dashboard & Meeting Management UI
- [x] [TASK-019] Build Dashboard Action Cluster (New Meeting, Join, Schedule, Share Screen) in `frontend/src/components/dashboard/ActionCluster.tsx`
- [x] [TASK-020] Build Upcoming Meetings list component with copy-invite and start/join actions in `frontend/src/components/dashboard/UpcomingList.tsx`
- [x] [TASK-021] Build Recent Meetings list component with meeting details in `frontend/src/components/dashboard/RecentList.tsx`
- [x] [TASK-022] Connect Dashboard page (`frontend/src/app/page.tsx`) to backend API with loading skeletons and empty states

## Phase 7: Meeting Scheduling & Join/Pre-Join UX
- [x] [TASK-023] Build Schedule Meeting form with inline validation and confirmation view in `frontend/src/app/schedule/page.tsx`
- [x] [TASK-024] Build Join Meeting page with code normalization and validation in `frontend/src/app/join/page.tsx`
- [x] [TASK-025] Implement Pre-Join preview component with camera/microphone device preview and toggles in `frontend/src/components/meeting/PreJoin.tsx`

## Phase 8: Realtime Meeting Room & Video Grid
- [x] [TASK-026] Build LiveKit meeting wrapper and room connection controller in `frontend/src/app/meeting/[meetingId]/page.tsx`
- [x] [TASK-027] Implement responsive participant video grid (1, 2, 3-4, 5+ layout) in `frontend/src/components/meeting/VideoGrid.tsx`
- [x] [TASK-028] Create Participant Tile with video track rendering, fallback avatar with initials, and mute indicators in `frontend/src/components/meeting/ParticipantTile.tsx`
- [x] [TASK-029] Build Meeting Toolbar (Mic, Video, Screen Share, Participants, Meeting Info, Leave/End) in `frontend/src/components/meeting/MeetingToolbar.tsx`

## Phase 9: Host Moderation & Participant Drawer
- [x] [TASK-030] Build Participant Panel / Drawer displaying attendee list, roles, and audio state in `frontend/src/components/meeting/ParticipantsPanel.tsx`
- [x] [TASK-031] Connect host moderation actions (Mute attendee, Mute-All, Kick attendee, End meeting) to backend APIs using `sessionStorage` token in `frontend/src/components/meeting/HostControls.tsx`
- [x] [TASK-032] Implement meeting leave dialog with host "End for all" vs "Leave" options and attendee redirect in `frontend/src/components/meeting/LeaveDialog.tsx`

## Phase 10: Verification, Automated Testing & Persistence Audit
- [x] [TASK-033] Write pytest automated tests covering health, instant meeting, scheduling, lookups, upcoming/recent queries, and host moderation in `backend/tests/`
- [x] [TASK-034] Execute backend test suite and verify SQLite persistence across service restart
- [x] [TASK-035] Run frontend TypeScript typecheck and production build (`npm run build`)
- [x] [TASK-036] Perform multi-browser media and layout smoke test (Scenarios A through G)

## Phase 11: Deployment & Documentation
- [x] [TASK-037] Create production Railway deployment configuration and persistent volume instructions in `backend/Dockerfile` and `railway.json`
- [x] [TASK-038] Create production Vercel configuration for Next.js in `frontend/`
- [x] [TASK-039] Generate complete project documentation: `README.md` and interview preparation guide `docs/interview-notes.md`
