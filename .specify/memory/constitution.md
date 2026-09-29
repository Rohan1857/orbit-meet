# Project Constitution: OrbitMeet (Zoom-Style Video Conferencing Platform)

## 1. Core Principles

### 1.1 Ponytail Architecture (Minimal Diff & YAGNI)
- **Ladder of Simplicity**: Before adding code or libraries, verify if stdlib or native platform primitives (e.g. native HTML `<input type="date">`, standard CSS grid) satisfy the need.
- **Zero Speculative Abstraction**: No generic repository patterns, single-use factory interfaces, or premature microservices. Thin routers, single service layer per domain, and explicit DB sessions.
- **Fewest Files**: Do not fracture single-purpose components across five files. Keep cohesive logic co-located.
- **Root-Cause Fixes**: Fix issues at the shared source, not via band-aids across call sites.

### 1.2 Anti-AI-Slop & Human-Authored UI
- **Zero Default AI Aesthetics**: Banned: purple-to-indigo gradient cards, glowing neon borders, glassmorphism overuse, floating background blobs, four identical rounded cards in a row.
- **Restrained Radii & Cohesive Tokens**: Border radii bounded between 6px and 12px. Explicit CSS variable tokens (`--app-bg`, `--surface`, `--border`, `--text-primary`, `--accent`) for all surfaces.
- **Authentic Copywriting**: No corporate pep talk ("Collaborate seamlessly", "Supercharge your meetings"). Functional, quiet, human microcopy ("New meeting", "Upcoming", "Schedule").
- **Single Icon Family**: Exclusively Lucide icons. No mixing icon sets or raw emojis as bullet points.

### 1.3 Strict Originality Mandate
- No copying, forking, or translating code from existing Zoom clone repositories.
- Custom component hierarchy, backend schemas, route structure, and application flow authored from scratch.

### 1.4 Architecture & System Boundaries
- **Frontend**: Next.js App Router, TypeScript, Tailwind CSS, `@livekit/components-react`, `livekit-client`.
- **Backend**: Python 3.12+, FastAPI, SQLAlchemy 2.x, Alembic, `livekit-api`.
- **Database**: SQLite with WAL mode enabled. Persisted at `/data/zoom_clone.db` in production (persistent volume) and `./zoom_clone.db` in development.
- **Media Transport**: LiveKit Cloud for WebRTC audio/video/screen-share. FastAPI issues short-lived participant tokens; LiveKit API secrets NEVER reach client.
- **Session & Identity**: No authentication required per assignment. Default user is "Rohan" (initials "RO"). Host authorization uses a cryptographically random `host_control_token` delivered on creation and stored in `sessionStorage`.

## 2. Hard Verification Gates
- No mock fixtures allowed in production paths.
- Instant, scheduled, join, and media workflows must execute with real SQLite records and LiveKit connection.
- SQLite database must survive backend restart/redeploy without losing scheduled meetings.
- All code must pass type-check, lint, and automated test gates before deployment.
