# Zoom-Style Video Conferencing Platform
## End-to-End Agent Execution Blueprint

> **Purpose:** This document is an execution specification for an autonomous coding agent to design, build, test, document, publish, and deploy a complete Zoom-style video conferencing assignment using **Next.js + FastAPI + SQLite**, while keeping the work original, explainable, and visually polished.
>
> **Primary goal:** Deliver a public GitHub repository and a deployed application satisfying every required assignment feature, with a frontend that feels deliberately designed by a human rather than generated from a generic AI dashboard template.
>
> **Do not treat this as a brainstorming document. Treat it as a build contract.** The agent should work through the phases in order, maintain a running checklist, test each milestone before continuing, and not declare completion until the final acceptance checklist passes.

---

# 1. Assignment Target

Build a functional Zoom-inspired video conferencing web application with:

- Next.js frontend
- Python backend using FastAPI
- SQLite database designed specifically for the application
- Functional meeting creation
- Functional meeting joining
- Functional meeting scheduling
- Upcoming and recent meeting history
- Unique meeting IDs
- Shareable invite links
- Real browser video/audio conferencing
- Participant management
- Professional Zoom-like UI/UX
- Seeded sample data
- Responsive layout
- Public GitHub repository
- Public deployment
- Complete README

Authentication is **not required**. Assume one default signed-in user.

Bonus features should be implemented after all core requirements are stable:

- host mute-all
- remove participant
- responsive mobile meeting UI
- pre-join camera/microphone preview
- meeting copy-link UX
- meeting status transitions
- participant list
- screen sharing

---

# 2. Important Originality Rule

The agent must **not fork, copy, mechanically translate, or substantially reuse source code from an existing Zoom clone repository**.

Existing projects may be studied only for:

- interaction ideas
- information hierarchy
- expected meeting controls
- layout inspiration
- terminology
- broad architectural understanding

All implementation code, component structure, styles, backend routes, schema, and application logic must be authored specifically for this project.

Do not paste tutorial code and rename variables.

Do not reproduce another repository's:

- component tree
- file naming structure
- CSS classes
- exact copywriting
- demo content
- helper utilities
- icon arrangements
- database models
- README text

The final repository should have a coherent structure that is obviously tailored to the assignment.

---

# 3. Recommended Architecture

Use this architecture unless a technical blocker is discovered.

```text
Browser
  |
  | HTTPS
  v
Next.js Frontend on Vercel
  |
  | REST API
  v
FastAPI Backend on Railway
  |
  | SQLAlchemy
  v
SQLite database on Railway persistent volume

Meeting page
  |
  | short-lived participant token from FastAPI
  v
LiveKit Cloud
  |
  +--> WebRTC audio/video
  +--> participant presence
  +--> screen sharing
  +--> moderation APIs
```

## Why this architecture

### Next.js

Matches the required frontend technology and is straightforward to deploy to Vercel.

### FastAPI

Matches the assignment, keeps backend code compact and explainable, and works well for REST APIs and LiveKit token generation.

### SQLite

Matches the assignment exactly. It should remain the system of record for application-level meeting metadata.

### LiveKit

Do **not** build an SFU/media server from scratch for this assignment. Use LiveKit only as the realtime media transport layer.

Application business logic must still belong to the project's FastAPI backend and SQLite database.

LiveKit should handle:

- microphone publication
- camera publication
- remote participant media
- screen sharing
- participant presence
- room transport
- server-side participant moderation

FastAPI should handle:

- creating application meetings
- meeting ID generation
- meeting validation
- scheduled meeting persistence
- recent/upcoming meeting queries
- join events
- leave events
- meeting lifecycle
- LiveKit access-token issuance
- host authorization for moderation calls

### Deployment

Recommended:

- **Frontend:** Vercel
- **Backend + SQLite:** Railway
- **Realtime media:** LiveKit Cloud

SQLite must be stored on a **persistent volume**, not the default ephemeral filesystem.

Recommended Railway volume mount:

```text
/data
```

Recommended production SQLite URL:

```text
sqlite:////data/zoom_clone.db
```

For local development:

```text
sqlite:///./zoom_clone.db
```

---

# 4. Agent Skills / Capabilities Required

The coding agent should have or emulate the following skills.

## 4.1 Repository and shell skill

Capabilities:

- create directories/files
- run shell commands
- install dependencies
- inspect logs
- search codebase
- run formatters
- run tests
- manage `.env` files safely

The agent should use terminal commands rather than asking the user to manually edit routine files.

---

## 4.2 Git / GitHub skill

Capabilities:

- initialize git repository
- create `.gitignore`
- create logical commits
- inspect diff before committing
- create GitHub repository
- set remote
- push branches
- keep secrets out of commits
- make repository public only when ready

Preferred tools:

- `git`
- GitHub CLI (`gh`)

The agent should never commit:

- `.env`
- LiveKit secrets
- deployment tokens
- local SQLite DB unless intentionally seeding a harmless development DB

---

## 4.3 Product/UI design skill

The agent must be capable of:

- studying Zoom's current web UI
- extracting information hierarchy
- reproducing layout behavior without copying source code
- building responsive application surfaces
- refining typography and spacing
- designing realistic empty/loading/error states
- evaluating visual hierarchy in screenshots

If a browser automation or screenshot tool exists, use it repeatedly.

Do not design the UI only from JSX imagination.

The agent should inspect rendered pages at:

- 1440×900
- 1280×800
- 1024×768
- 768×1024
- 390×844

---

## 4.4 Next.js frontend skill

Required knowledge:

- TypeScript
- React
- Next.js App Router
- client/server component boundaries
- dynamic routes
- data fetching
- forms
- optimistic UI where useful
- browser media permissions
- responsive layouts
- accessibility basics

---

## 4.5 FastAPI backend skill

Required knowledge:

- FastAPI routers
- Pydantic request/response schemas
- SQLAlchemy ORM
- dependency injection
- transaction boundaries
- HTTP error handling
- CORS
- environment configuration
- startup/bootstrap logic
- API documentation

---

## 4.6 Database design skill

Required knowledge:

- relational schema design
- foreign keys
- indexes
- uniqueness constraints
- timestamps
- one-to-many relationships
- lifecycle/status fields
- SQLite limitations
- migrations

Prefer SQLAlchemy + Alembic.

---

## 4.7 Realtime/WebRTC conferencing skill

Required knowledge:

- camera/microphone permissions
- media tracks
- room connection lifecycle
- participant identity
- token-based room access
- publish/subscribe concepts
- mute/unmute
- screen sharing
- remote participant handling
- disconnect behavior

Prefer LiveKit's React SDK rather than manually implementing raw WebRTC signaling.

---

## 4.8 Browser testing / Playwright skill

The agent should be able to:

- open the app
- navigate routes
- fill forms
- validate redirects
- test meeting creation
- test join validation
- test scheduling
- inspect console errors
- take screenshots
- test responsive layouts

Use Playwright if available.

For actual multi-user media validation, run two browser contexts or two browser windows with different participant names.

---

## 4.9 Deployment skill

Capabilities:

- Vercel CLI or dashboard integration
- Railway CLI / Railway agent tooling
- deployment logs
- environment variables
- domains
- persistent volumes
- CORS configuration
- production smoke tests

Railway currently documents agent-focused CLI/MCP/skills support; if the coding environment supports Railway's agent integration, install/use it rather than relying on manual dashboard steps.

---

## 4.10 QA / code-review skill

Before completion, the agent must inspect:

- dead code
- duplicated logic
- TypeScript errors
- Python lint errors
- broken imports
- unhandled API errors
- hidden secrets
- accessibility issues
- mobile overflow
- stale mock data
- placeholder text

---

# 5. Recommended Technology Choices

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
Lucide React icons
@livekit/components-react
livekit-client
React Hook Form (optional)
Zod (optional but recommended)
date-fns
```

Avoid introducing a huge UI component framework unless genuinely useful.

The interface should look custom-built, not like default shadcn/demo components assembled together.

Using a few headless primitives is acceptable, but styling should be custom.

## Backend

```text
Python 3.12+
FastAPI
Uvicorn
SQLAlchemy 2.x
Alembic
Pydantic / pydantic-settings
livekit-api/server SDK
```

Optional:

```text
pytest
httpx
ruff
```

## Database

```text
SQLite
```

Use foreign keys and indexes.

## Realtime media

```text
LiveKit Cloud
```

---

# 6. Repository Strategy

Use one public monorepo.

Recommended structure:

```text
zoom-meeting-platform/
├── README.md
├── .gitignore
├── .env.example
├── docs/
│   ├── architecture.md
│   ├── database-schema.md
│   └── screenshots/
│
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── join/
│       │   │   └── page.tsx
│       │   ├── schedule/
│       │   │   └── page.tsx
│       │   └── meeting/
│       │       └── [meetingId]/
│       │           └── page.tsx
│       ├── components/
│       │   ├── dashboard/
│       │   ├── meeting/
│       │   ├── forms/
│       │   └── ui/
│       ├── hooks/
│       ├── lib/
│       │   ├── api.ts
│       │   ├── meeting-links.ts
│       │   └── utils.ts
│       ├── types/
│       └── styles/
│
└── backend/
    ├── requirements.txt
    ├── alembic.ini
    ├── .env.example
    ├── app/
    │   ├── main.py
    │   ├── config.py
    │   ├── database.py
    │   ├── models/
    │   │   ├── meeting.py
    │   │   └── participant.py
    │   ├── schemas/
    │   │   ├── meeting.py
    │   │   └── participant.py
    │   ├── routers/
    │   │   ├── health.py
    │   │   ├── meetings.py
    │   │   └── livekit.py
    │   ├── services/
    │   │   ├── meeting_service.py
    │   │   └── livekit_service.py
    │   └── seed.py
    ├── migrations/
    └── tests/
```

The exact names can change, but maintain clear separation of concerns.

---

# 7. Database Design

The database design will be evaluated. Do not use one giant table.

## 7.1 `meetings`

Recommended fields:

```text
id                  INTEGER PRIMARY KEY
meeting_code        VARCHAR UNIQUE NOT NULL
title               VARCHAR NOT NULL
description         TEXT NULL
host_name           VARCHAR NOT NULL
meeting_type        VARCHAR NOT NULL
scheduled_at        DATETIME NULL
duration_minutes    INTEGER NULL
status              VARCHAR NOT NULL
invite_slug         VARCHAR UNIQUE NOT NULL
created_at          DATETIME NOT NULL
started_at          DATETIME NULL
ended_at            DATETIME NULL
```

Recommended `meeting_type` values:

```text
instant
scheduled
```

Recommended `status` values:

```text
scheduled
live
ended
cancelled
```

Do not make status arbitrary free text in application logic. Use an enum-like validation layer.

## 7.2 `participant_sessions`

```text
id                  INTEGER PRIMARY KEY
meeting_id          INTEGER NOT NULL FK -> meetings.id
participant_uid     VARCHAR NOT NULL
identity            VARCHAR NOT NULL
display_name        VARCHAR NOT NULL
role                VARCHAR NOT NULL
joined_at           DATETIME NOT NULL
left_at             DATETIME NULL
```

Recommended roles:

```text
host
participant
```

Useful index:

```text
(meeting_id, joined_at)
```

## 7.3 Optional `meeting_settings`

Only create this table if it makes the architecture cleaner.

Possible fields:

```text
meeting_id
mute_on_entry
allow_screen_share
waiting_room_enabled
```

Do not overengineer the schema.

---

# 8. Meeting ID Design

Do not expose sequential database IDs as the meeting ID.

Generate human-friendly meeting codes such as:

```text
823 194 6621
```

Store normalized digits:

```text
8231946621
```

Display formatted version:

```text
823 194 6621
```

Generation requirements:

1. generate cryptographically random digits
2. reject codes beginning with `0` if desired
3. check uniqueness in DB
4. retry on collision
5. place UNIQUE constraint in DB as final protection

Invite URL example:

```text
https://frontend-domain.vercel.app/join?meeting=8231946621
```

Do not put LiveKit room secrets in invite URLs.

---

# 9. API Contract

The frontend should not access SQLite or LiveKit secret keys directly.

Use a clean REST API.

## 9.1 Health

```http
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

---

## 9.2 Create instant meeting

```http
POST /api/meetings/instant
```

Request:

```json
{
  "host_name": "Rohan"
}
```

Response:

```json
{
  "meeting_id": 12,
  "meeting_code": "8231946621",
  "title": "Rohan's Meeting",
  "status": "live",
  "invite_url": "https://.../join?meeting=8231946621"
}
```

---

## 9.3 Schedule meeting

```http
POST /api/meetings
```

Request:

```json
{
  "title": "Project Discussion",
  "description": "Weekly project sync",
  "scheduled_at": "2026-10-02T16:00:00+05:30",
  "duration_minutes": 45,
  "host_name": "Rohan"
}
```

Validation:

- title required
- future scheduled time
- sensible duration (e.g. 15–480 minutes)

---

## 9.4 Validate meeting

```http
GET /api/meetings/{meeting_code}
```

Return 404 if meeting does not exist.

Return useful meeting metadata if valid.

---

## 9.5 Upcoming meetings

```http
GET /api/meetings?filter=upcoming
```

Sorted ascending by scheduled time.

---

## 9.6 Recent meetings

```http
GET /api/meetings?filter=recent
```

Sorted descending by start/end time.

Limit dashboard list to a reasonable count such as 5.

---

## 9.7 Join meeting

```http
POST /api/meetings/{meeting_code}/join
```

Request:

```json
{
  "display_name": "Ayan",
  "role": "participant"
}
```

Response should include:

```json
{
  "participant_identity": "...",
  "participant_token": "...",
  "livekit_url": "wss://...",
  "meeting": {
    "meeting_code": "8231946621",
    "title": "Project Discussion"
  }
}
```

The LiveKit API secret must never reach the browser.

---

## 9.8 Leave meeting

```http
POST /api/meetings/{meeting_code}/leave
```

Record `left_at` for the participant session.

---

## 9.9 End meeting

```http
POST /api/meetings/{meeting_code}/end
```

Host-only operation.

Update DB status to `ended`.

Optionally close LiveKit room.

---

## 9.10 Host remove participant

```http
DELETE /api/meetings/{meeting_code}/participants/{identity}
```

FastAPI should call LiveKit's server-side participant removal API.

---

## 9.11 Host mute participant

```http
POST /api/meetings/{meeting_code}/participants/{identity}/mute
```

For mute-all, either iterate through current non-host participants server-side or provide a dedicated endpoint.

Note: remote unmute should not be assumed. A host can force mute, but participants generally unmute themselves.

---

# 10. Backend Implementation Order

The agent must build backend functionality before making the frontend depend on fake data.

## Phase B1 — Bootstrap

1. create virtual environment
2. install FastAPI dependencies
3. configure settings class
4. configure SQLAlchemy engine/session
5. enable SQLite foreign keys
6. add CORS
7. add health endpoint
8. run locally
9. verify `/docs`

### Acceptance

```text
GET /api/health -> 200
```

---

## Phase B2 — Models and migrations

Create:

- Meeting model
- ParticipantSession model
- relationships
- indexes
- unique constraints
- Alembic migration

Run migration on empty database.

Inspect resulting tables.

### Acceptance

- DB initializes without runtime table creation hacks
- schema is represented in migrations
- duplicate meeting_code is rejected

---

## Phase B3 — Meeting service

Implement functions such as:

```text
create_instant_meeting()
create_scheduled_meeting()
get_meeting_by_code()
list_upcoming_meetings()
list_recent_meetings()
mark_meeting_started()
mark_meeting_ended()
```

Business logic belongs in the service layer, not inside route functions.

---

## Phase B4 — LiveKit service

Implement:

```text
generate_participant_token()
remove_participant()
mute_participant_track()
end_livekit_room()
```

Use server-side environment variables:

```text
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

Never prefix secrets with `NEXT_PUBLIC_`.

---

## Phase B5 — Seed script

Create deterministic sample data:

- 2 upcoming meetings
- 2 recently ended meetings

Seed should be idempotent or clearly safe to run once.

Example topics should sound realistic, not generic AI placeholders:

```text
Design Review — Mobile Meeting Controls
Placement Team Weekly Sync
Audio Pipeline Debug Session
Research Check-in
```

---

## Phase B6 — Backend tests

Minimum tests:

- create instant meeting
- unique meeting code
- schedule meeting
- reject past date
- get existing meeting
- 404 invalid meeting
- upcoming ordering
- recent ordering
- join creates participant session
- invalid meeting cannot issue token

Mock LiveKit where appropriate.

---

# 11. Frontend Design Direction

The application should immediately feel like a conferencing product, not a generic admin dashboard.

The visual language should be:

- calm
- dense but readable
- professional
- neutral
- task-oriented
- desktop-first but responsive

## Primary inspiration

Zoom's current web experience:

- white/light neutral application surfaces
- recognizable blue accent
- strong separation between navigation and content
- compact utility controls
- meeting-focused hierarchy
- dark conferencing room

## Do NOT produce a stereotypical AI-generated dashboard

Avoid:

- giant gradient hero cards
- purple-blue glowing backgrounds
- glassmorphism everywhere
- four identical rounded cards in a row for every section
- unnecessary marketing copy
- huge 28–40px dashboard headings
- excessive 20–24px corner radii
- floating decorative blobs
- fake charts
- random statistics
- excessive emojis
- generic copy like "Collaborate smarter. Connect better."
- every button having an icon plus gradient
- massive whitespace designed like a landing page rather than an application

This is an application dashboard, **not a SaaS landing page**.

---

# 12. Human-Designed UI Rules

These rules are mandatory.

## 12.1 Use restrained radii

Prefer:

```text
6px
8px
10px
12px
```

Avoid making every element `rounded-2xl` or `rounded-3xl`.

---

## 12.2 Use meaningful spacing variation

Do not apply the same padding everywhere.

Examples:

```text
navbar horizontal padding: 24–32px
main content width: 1100–1240px
small control padding: 8px 12px
meeting cards: 16–20px
section separation: 28–36px
```

---

## 12.3 Typography

Use one professional sans-serif family.

Good choices:

- Inter
- Geist
- system UI

Suggested hierarchy:

```text
page title: 24–28px / semibold
section title: 17–20px / semibold
body: 14–15px
metadata: 12–13px
control labels: 13–14px / medium
```

Avoid huge marketing typography.

---

## 12.4 Color strategy

Use Zoom-like blue as an interaction accent, but create original CSS tokens.

Example design tokens:

```text
--app-bg
--surface
--surface-muted
--border
--text-primary
--text-secondary
--accent
--accent-hover
--danger
--meeting-bg
--meeting-toolbar
```

Do not hardcode slightly different hex colors throughout the project.

---

## 12.5 Icons

Use a single icon library such as Lucide.

Do not mix:

- Font Awesome
- Heroicons
- Lucide
- emoji icons

in the same UI.

---

## 12.6 Microcopy

Use realistic microcopy.

Instead of:

```text
Welcome back! Ready to connect?
```

Prefer:

```text
Home
Tuesday, September 29
```

Instead of:

```text
Start an amazing meeting experience
```

Prefer:

```text
New meeting
Start an instant meeting
```

Functional UI copy makes the project feel authored rather than generated.

---

# 13. Dashboard Specification

The home/dashboard should satisfy the assignment at first glance.

## 13.1 Top navigation

Left:

- original project logo mark
- product name such as `MeetSpace`, `Orbit Meet`, `FrameMeet`, etc.

Do not call the application "Zoom".

Right:

- search icon placeholder if desired
- settings icon
- help icon optional
- default-user avatar
- compact user dropdown placeholder

Use a convincing fictional profile:

```text
Rohan
RO
```

Do not implement authentication unless time permits.

---

## 13.2 Main action cluster

Prominent actions:

### New Meeting

Visual priority: highest.

On click:

1. disable button
2. show subtle loading state
3. POST instant meeting endpoint
4. receive meeting code
5. route to `/meeting/{code}`

### Join

Navigate to join UI.

### Schedule

Navigate to scheduling UI/modal.

Optional fourth action:

### Share Screen

Only add if it performs a meaningful action. Do not add fake controls.

---

## 13.3 Today's meeting area

A compact visual panel can show current date/time and next meeting.

Do not create an oversized decorative hero.

---

## 13.4 Upcoming meetings section

Each meeting item should show:

- time
- title
- date if not today
- duration
- meeting ID
- copy invite button
- Start/Join button
- overflow menu placeholder if meaningful

If empty:

```text
No upcoming meetings
Meetings you schedule will appear here.
```

---

## 13.5 Recent meetings section

Show:

- title
- date/time
- duration/status
- meeting ID
- start again or copy info action if useful

Do not fake recent meetings in frontend source. Fetch seeded DB data.

---

# 14. Join Meeting UX

The join flow should have two stages.

## Stage 1 — Resolve meeting

Input accepts:

```text
823 194 6621
8231946621
https://domain/join?meeting=8231946621
```

Normalize all of them to the canonical meeting code.

Call backend validation.

Error states:

```text
We couldn't find that meeting.
Check the meeting ID and try again.
```

Do not use browser `alert()`.

## Stage 2 — Pre-join

Show:

- meeting title
- display-name field
- camera preview
- microphone toggle
- camera toggle
- Join button

A user should know whether they are joining muted or with camera disabled.

When Join is clicked:

1. POST join endpoint
2. receive participant token + server URL
3. connect to LiveKit
4. create participant DB session
5. transition into meeting room

---

# 15. Schedule Meeting UX

Fields:

```text
Topic / title *
Description
Date *
Start time *
Duration *
```

Optional meeting settings:

```text
Mute participants on entry
Allow participants to share screen
```

Validation should be inline.

After creation show a success state with:

```text
Meeting scheduled
Meeting ID
Date and time
Copy invitation
Start meeting
Done
```

The newly scheduled meeting must appear on the dashboard without manually editing mock data.

---

# 16. Meeting Room Design

This is the most important visual screen.

Use a dark, neutral meeting surface.

Recommended structure:

```text
+------------------------------------------------------------+
| Top meeting info / security                         View   |
|                                                            |
|                                                            |
|             responsive participant video grid              |
|                                                            |
|                                                            |
|                                                            |
|------------------------------------------------------------|
| Mic  Video   Participants  Chat   Share   More      Leave  |
+------------------------------------------------------------+
```

Do not imitate every pixel of Zoom blindly. Match the interaction grammar while authoring your own components/styles.

---

# 17. Participant Grid Logic

The meeting grid should change based on participant count.

Suggested behavior:

```text
1 participant  -> centered large tile
2 participants -> 2 columns
3–4            -> 2 × 2
5–6            -> 3 × 2
7–9            -> 3 × 3
```

On mobile:

- reduce columns
- keep local tile visible
- toolbar remains reachable
- participant panel becomes drawer/sheet

Every tile should support:

- video track
- fallback avatar/initials when camera off
- participant name
- muted indicator
- host badge where applicable

Do not show fake video thumbnails.

---

# 18. Meeting Toolbar

Required controls:

## Microphone

States:

```text
Unmute
Mute
```

Icon and label should change.

## Camera

States:

```text
Start Video
Stop Video
```

## Participants

Opens participant panel.

Show count:

```text
Participants (4)
```

## Screen Share

Use LiveKit screen-share publishing.

## More

Can contain:

- copy invite link
- meeting info

Do not put unimplemented decorative actions in menus.

## Leave

Danger styling.

Host options:

```text
Leave meeting
End meeting for everyone
```

Participant option:

```text
Leave meeting
```

---

# 19. Participants Panel

Panel contents:

```text
Participants (N)
Search optional

Rohan (Host)
Ayan
Aditya
```

For host, participant row menu may include:

```text
Mute
Remove
```

For self:

```text
Me
```

Host moderation actions must call FastAPI, not fake local state updates.

---

# 20. Meeting Information / Invite UX

Provide a compact dialog/panel containing:

```text
Meeting title
Meeting ID
Invite link
Copy invitation
```

Copy action should provide immediate feedback:

```text
Copied
```

Avoid toast spam.

---

# 21. Responsive Requirements

## Desktop

Target 1280–1440px as primary evaluation size.

## Tablet

Ensure:

- dashboard sections do not overflow
- schedule form remains readable
- meeting grid adapts

## Mobile

Dashboard:

- navbar simplified
- action buttons become 2×2 or stacked
- meeting rows become cards

Meeting page:

- toolbar horizontally compact
- hide text labels selectively
- participant drawer
- 1–2 column video grid

No horizontal page scroll.

---

# 22. Loading, Error, and Empty States

The app should never appear broken during API calls.

Implement:

- skeleton/loading state for dashboard data
- disabled action button during meeting creation
- schedule submission state
- join validation state
- backend-unavailable error
- invalid meeting error
- media permission denied state
- no-camera state
- no upcoming meetings state
- no recent meetings state

Avoid raw exception messages in the UI.

---

# 23. Frontend Implementation Order

## Phase F1 — Design system

Create:

- global colors
- typography
- buttons
- inputs
- dialog/sheet primitive
- avatar
- tooltip where necessary

Render a small internal test page if useful, then remove it before submission.

---

## Phase F2 — Dashboard static structure

Build the dashboard using temporary typed fixtures only to establish layout.

As soon as layout works, replace fixtures with API responses.

Do not leave fixtures in the final production path.

---

## Phase F3 — API client

Centralize backend calls.

Example:

```text
api.createInstantMeeting()
api.scheduleMeeting()
api.getMeeting()
api.getUpcomingMeetings()
api.getRecentMeetings()
api.joinMeeting()
api.endMeeting()
```

Do not scatter raw `fetch()` calls throughout UI components.

---

## Phase F4 — Dashboard integration

Replace all fixtures with backend data.

Verify:

```text
schedule -> DB -> dashboard
instant meeting -> DB -> recent/live state
```

---

## Phase F5 — Join and prejoin

Implement meeting-code normalization, validation and media preview.

---

## Phase F6 — Live meeting room

Integrate LiveKit only after normal application flows work.

Build the meeting room progressively:

1. connect
2. local audio
3. local video
4. remote participants
5. grid
6. toolbar
7. screen share
8. participant panel
9. host moderation
10. end/leave behavior

Test each step with two browser sessions.

---

# 24. Meeting Lifecycle Rules

Define behavior clearly.

## Instant meeting

```text
create -> status live -> host joins -> ended
```

## Scheduled meeting

```text
create -> scheduled
host starts -> live
host ends -> ended
```

Do not mark a scheduled meeting as live merely because its start time passed.

Upcoming query should generally return scheduled future/non-ended meetings.

Recent query should include ended meetings and optionally past scheduled meetings depending on chosen behavior.

Document assumptions in README.

---

# 25. Security Rules

Even for an assignment, implement sensible boundaries.

## Secrets

Only backend:

```text
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

Frontend can receive:

```text
NEXT_PUBLIC_API_BASE_URL
```

Participant tokens should be short-lived.

## CORS

Development:

```text
http://localhost:3000
```

Production:

```text
https://your-vercel-domain.vercel.app
```

Do not ship wildcard CORS if it is unnecessary.

## Meeting validation

Never issue a LiveKit token for a meeting that does not exist in SQLite.

## Host controls

Do not authorize host operations simply because the frontend sends:

```json
{"role":"host"}
```

For this no-auth assignment, generate a random host-control secret at meeting creation and store a hash or otherwise maintain a server-verifiable host session token.

A simpler acceptable assignment implementation:

- backend creates `host_control_token`
- browser host receives it once
- store in `sessionStorage`
- host moderation endpoints require it
- never put it in invite URL

Explain the assumption in README.

---

# 26. Accessibility / UX Quality

Minimum requirements:

- buttons have accessible labels
- icon-only buttons have `aria-label`
- forms have labels
- visible focus states
- dialogs can be closed with keyboard
- sufficient contrast
- microphone/video state not communicated by color alone
- destructive actions require deliberate click

---

# 27. Testing Plan

Do not wait until the end to test.

## Backend automated tests

Use pytest.

Test at least:

```text
health
instant meeting
schedule meeting
validation
meeting lookup
upcoming
recent
join invalid meeting
join valid meeting
host-only endpoint protection
```

## Frontend quality gates

Run:

```bash
npm run lint
npm run build
```

No TypeScript build errors.

## Backend quality gates

Run:

```bash
pytest
ruff check .
```

If Ruff is used.

## Browser E2E smoke tests

Scenario A:

```text
Open dashboard
Click New Meeting
Meeting is created
URL contains meeting code
Meeting screen loads
```

Scenario B:

```text
Schedule meeting
Return to dashboard
Scheduled meeting appears under Upcoming
Refresh page
Meeting still exists
```

Scenario C:

```text
Join using invalid ID
Receive friendly error
```

Scenario D:

```text
Copy valid meeting invite URL
Open second browser context
Enter participant name
Join
Host sees participant
Participant sees host
```

Scenario E:

```text
Second participant disables camera
Host sees fallback avatar
```

Scenario F:

```text
Host mutes/removes participant
Realtime behavior matches UI
```

Scenario G:

```text
Host ends meeting
Meeting is marked ended in DB
Dashboard shows it under Recent
```

---

# 28. Visual QA Pass

The agent must perform a dedicated visual pass **after functionality is complete**.

For each primary page:

```text
Dashboard
Join
Prejoin
Schedule
Meeting room with 1 participant
Meeting room with 2 participants
Participants panel
```

Capture screenshots at desktop and mobile widths.

Ask the following for every screenshot:

1. Is hierarchy obvious in three seconds?
2. Does anything look like a generic AI-generated SaaS template?
3. Is spacing consistent but not mechanically identical?
4. Are controls too rounded?
5. Are icons from one family?
6. Is any text generic/filler?
7. Are any gradients/decorations unnecessary?
8. Does it resemble a serious conferencing product?
9. Is the Zoom inspiration obvious without using copied assets?
10. Is there any visible mock/fake content that should come from DB?

Fix issues before deployment.

---

# 29. Deliberate Uniqueness Checklist

The final frontend should contain several authored choices so it does not look like a tutorial clone.

Implement at least 6 of these:

- custom original product name and simple geometric logo
- distinctive action-button arrangement
- compact next-meeting strip
- custom meeting-card density and typography
- original empty-state illustration made with simple CSS/icon composition
- custom date/time presentation
- original meeting-info sheet layout
- participant tiles with subtle connection-state treatment
- custom mobile toolbar behavior
- own responsive breakpoints/layout decisions
- own profile menu
- own schedule confirmation screen

Do not introduce novelty that harms usability.

---

# 30. Git Workflow

Recommended commit progression:

```text
chore: initialize frontend and backend
feat: add database models and migrations
feat: implement meeting lifecycle API
feat: add seeded dashboard meeting data
feat: build dashboard shell
feat: integrate dashboard meeting APIs
feat: implement schedule meeting flow
feat: implement join and prejoin flow
feat: integrate LiveKit meeting room
feat: add participant controls and screen sharing
feat: add host moderation controls
fix: harden meeting lifecycle and error states
style: refine responsive Zoom-inspired UI
 test: add backend and e2e smoke coverage
 docs: add setup, architecture and deployment guide
chore: prepare production deployment
```

Commits do not need to match these exactly, but avoid one giant `final project` commit.

---

# 31. Deployment Plan

## 31.1 Create LiveKit Cloud project

Obtain:

```text
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

Store locally in backend `.env`.

Verify token generation locally before deployment.

---

## 31.2 Deploy FastAPI + SQLite to Railway

Recommended process:

1. connect Railway to GitHub repo or use Railway CLI
2. configure backend root directory
3. configure build/start command
4. create persistent volume
5. mount volume at `/data`
6. set production `DATABASE_URL`
7. add LiveKit secrets
8. deploy
9. generate public domain
10. run migration against mounted SQLite DB
11. run seed process carefully
12. test `/api/health`

Production env example:

```text
DATABASE_URL=sqlite:////data/zoom_clone.db
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
FRONTEND_ORIGIN=https://your-app.vercel.app
ENVIRONMENT=production
```

Recommended start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Exact import path depends on final backend layout.

### Important SQLite persistence check

After deploying:

1. create a scheduled meeting
2. note meeting ID
3. redeploy backend
4. load dashboard again
5. confirm meeting still exists

If it disappears, the SQLite file is not on the persistent volume.

Do not submit until this test passes.

---

## 31.3 Deploy frontend to Vercel

Connect same GitHub repository.

Set root directory:

```text
frontend
```

Set environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain
```

Deploy.

After frontend URL exists, update backend CORS origin if necessary and redeploy backend.

---

## 31.4 Production smoke test

Test from deployed URLs, not localhost.

Run:

```text
Dashboard loads
Upcoming/recent API succeeds
Create instant meeting
Camera/mic permissions work over HTTPS
Create scheduled meeting
Refresh persistence
Join via copied invite in second browser/device
Remote video works
Screen share works
Host participant controls work
End meeting works
Recent list updates
Mobile responsive layout works
```

Inspect browser console and network tab.

There should be no repeating errors or failed API calls.

---

# 32. README Requirements

README is part of evaluation. Make it strong but concise.

Recommended structure:

```text
# Product Name

Short description

## Live Demo
Frontend URL
Backend API/docs URL (optional)

## Screenshots
Dashboard
Meeting room
Schedule flow

## Features

## Tech Stack

## Architecture
small diagram

## Database Schema
short table/diagram

## Local Setup
frontend
backend
LiveKit env
migrations
seed

## Environment Variables

## API Overview

## Assumptions

## Deployment

## Known Limitations
```

Explicitly state:

- default user is assumed logged in per assignment
- LiveKit is used only for realtime media transport
- app meeting metadata is stored in SQLite
- host control strategy
- any unsupported Zoom features

Do not claim production-scale architecture.

---

# 33. `.env.example`

## Backend

```text
DATABASE_URL=sqlite:///./zoom_clone.db
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
FRONTEND_ORIGIN=http://localhost:3000
ENVIRONMENT=development
```

## Frontend

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Never put real secrets in examples.

---

# 34. Code Quality Rules

The agent should follow these throughout.

## Frontend

- TypeScript strict where practical
- avoid `any`
- small reusable components
- business logic not buried in JSX
- no 500-line page component
- API calls centralized
- no unnecessary global state library
- derive meeting state from LiveKit where appropriate

## Backend

- routes thin
- service layer owns meeting logic
- DB session dependency centralized
- Pydantic schemas separate from ORM models
- HTTP exceptions consistent
- no giant `main.py`
- no raw SQL unless justified

## Both

- delete unused experiments
- delete dead components
- remove console debugging
- remove commented-out code blocks
- no TODOs for required features

---

# 35. Agent Operating Procedure

This section defines how the autonomous agent should behave.

## Before each phase

1. inspect current repository state
2. inspect relevant existing files
3. define a narrow completion target
4. implement
5. run tests/build
6. inspect output
7. fix errors
8. commit only stable state

## Do not

- create dozens of files before running anything
- assume packages APIs without checking installed versions
- leave core workflows backed by mock arrays
- defer all browser testing to the end
- rewrite working architecture without reason
- add unrelated bonus features before core features pass

## When a bug appears

Use this order:

```text
reproduce
inspect logs
identify failing boundary
write smallest fix
rerun relevant test
rerun smoke path
```

Do not blindly refactor unrelated code while debugging.

---

# 36. Phase-by-Phase Master Execution Plan

## Phase 0 — Research and design lock

Deliverables:

- design references/screenshots
- architecture decision
- DB schema
- API contract
- repository initialized

Exit criteria:

- no unresolved foundational architecture question

---

## Phase 1 — Backend foundation

Deliverables:

- FastAPI app
- database setup
- migrations
- health endpoint
- meeting models
- meeting CRUD/services
- seed data

Exit criteria:

- API can create and retrieve meetings with tests passing

---

## Phase 2 — Dashboard

Deliverables:

- navbar
- action controls
- upcoming section
- recent section
- API integration

Exit criteria:

- dashboard data comes from SQLite through FastAPI

---

## Phase 3 — Scheduling

Deliverables:

- schedule form
- validation
- API integration
- confirmation UI
- dashboard refresh

Exit criteria:

- scheduled item survives browser refresh and appears in Upcoming

---

## Phase 4 — Join/prejoin

Deliverables:

- meeting input normalization
- validation
- display name
- camera preview
- mic/camera prejoin state

Exit criteria:

- invalid and valid meeting paths behave correctly

---

## Phase 5 — Realtime meeting

Deliverables:

- LiveKit token endpoint
- room connection
- audio
- video
- remote participant rendering
- controls

Exit criteria:

- two browsers can communicate using video/audio

---

## Phase 6 — Meeting UX

Deliverables:

- adaptive grid
- participants panel
- invite info
- screen sharing
- leave/end dialog
- camera-off avatar
- mute indicators

Exit criteria:

- meeting feels like a real conferencing application

---

## Phase 7 — Host controls

Deliverables:

- host verification token
- mute participant
- mute-all
- remove participant

Exit criteria:

- actions affect the remote participant through LiveKit, not only frontend state

---

## Phase 8 — Responsive / polish

Deliverables:

- mobile dashboard
- mobile forms
- mobile meeting toolbar
- tablet grid
- polished loading/errors

Exit criteria:

- no horizontal overflow or unusable controls at required viewport sizes

---

## Phase 9 — Testing and cleanup

Deliverables:

- backend tests
- build/lint clean
- browser E2E passes
- visual screenshot review
- dead code removed

Exit criteria:

- all acceptance scenarios pass locally

---

## Phase 10 — Deployment

Deliverables:

- Railway backend
- Railway persistent volume
- Vercel frontend
- LiveKit production configuration
- CORS production config

Exit criteria:

- production two-browser meeting succeeds
- SQLite survives backend redeploy

---

## Phase 11 — Submission preparation

Deliverables:

- polished README
- screenshots
- architecture notes
- public repository
- deployment URL
- clean commit history

Exit criteria:

- evaluator can clone and run project from README alone

---

# 37. Evaluation Mapping

The agent should explicitly check the submission against the rubric.

## Functionality

Evidence:

- instant meeting works
- join works
- schedule works
- meeting media works
- recent/upcoming lists work

## UI/UX

Evidence:

- Zoom-inspired dashboard
- Zoom-inspired meeting controls
- consistent design tokens
- responsive behavior
- polished states

## Database Design

Evidence:

- normalized meetings/participants schema
- constraints
- relationships
- migrations
- persistence

## Code Quality

Evidence:

- typed frontend
- service-layer backend
- tests
- predictable error handling

## Code Modularity

Evidence:

- routers/services/models/schemas separated
- reusable meeting UI components

## Code Understanding

Evidence:

- architecture documentation
- minimal unnecessary abstraction
- README explains important design decisions
- code avoids copied tutorial structure

---

# 38. Interview Preparation Notes the Agent Should Generate

At the end, generate `docs/interview-notes.md` explaining the finished project in simple language.

Cover:

1. Why FastAPI?
2. Why LiveKit instead of raw WebRTC?
3. What happens when New Meeting is clicked?
4. How is a meeting ID generated?
5. How does joining work end-to-end?
6. Why are LiveKit API secrets backend-only?
7. What does SQLite store vs LiveKit?
8. How are upcoming/recent queries calculated?
9. How are participant sessions modeled?
10. How do mute/remove host controls work?
11. What happens when host ends a meeting?
12. Why is SQLite on a persistent volume?
13. How would architecture change at production scale?
14. What would authentication add?
15. What tradeoffs were intentionally made for the assignment?

This file is for the developer's understanding, not marketing.

---

# 39. Production-Scale Discussion for Interview

Do not implement unnecessary scale, but be able to explain it.

If asked how this would scale beyond the assignment:

```text
SQLite -> PostgreSQL
single backend instance -> stateless FastAPI replicas
host control token -> real authenticated users + RBAC
simple REST updates -> WebSocket/event-driven application state where useful
basic logs -> centralized monitoring/observability
manual seed -> migrations + production data workflows
```

LiveKit already removes the need for the FastAPI server itself to relay media.

Do not claim SQLite is horizontally scalable.

---

# 40. Definition of Done

The project is **not complete** until every item below is true.

## Required features

- [ ] Zoom-inspired landing dashboard
- [ ] navbar/profile/settings placeholders
- [ ] New Meeting button
- [ ] Join Meeting button
- [ ] Schedule Meeting button
- [ ] Upcoming meetings section
- [ ] Recent meetings section
- [ ] instant meeting creates unique meeting ID
- [ ] instant meeting creates invite link
- [ ] instant meeting redirects to meeting room
- [ ] join by meeting ID
- [ ] join by invite link
- [ ] display name before joining
- [ ] invalid meeting rejected
- [ ] scheduled title
- [ ] scheduled description
- [ ] scheduled date/time
- [ ] scheduled duration
- [ ] scheduled meeting persisted to SQLite
- [ ] scheduled meeting appears in Upcoming
- [ ] sample DB data present
- [ ] README contains setup instructions
- [ ] README lists tech stack
- [ ] README documents assumptions

## Real conferencing

- [ ] camera works
- [ ] microphone works
- [ ] remote participant works
- [ ] mute/unmute works
- [ ] camera toggle works
- [ ] leave works

## Bonus

- [ ] responsive dashboard
- [ ] responsive meeting room
- [ ] participant list
- [ ] screen sharing
- [ ] host mute-all
- [ ] host remove participant
- [ ] prejoin preview

## Engineering

- [ ] no hard-coded meeting fixtures in production path
- [ ] no secrets committed
- [ ] migrations included
- [ ] tests pass
- [ ] frontend production build passes
- [ ] backend boots from clean clone
- [ ] SQLite survives deployed backend restart/redeploy
- [ ] public repository exists
- [ ] public frontend deployment works
- [ ] production backend works
- [ ] invite link works in a second browser/device

## Visual originality

- [ ] no generic gradient SaaS hero
- [ ] no copied tutorial branding
- [ ] no copied Zoom assets/source code
- [ ] custom product branding
- [ ] custom design tokens
- [ ] deliberate compact spacing
- [ ] realistic microcopy
- [ ] UI has been screenshot-reviewed on desktop/mobile

---

# 41. Final Agent Instruction

The agent should continue autonomously through implementation, testing, deployment, and documentation whenever credentials/tool access permit.

When an operation requires user-owned authentication—such as creating a GitHub repository, connecting Vercel, Railway, or LiveKit—the agent should:

1. perform everything possible up to the authentication boundary
2. request only the minimum authorization/action required
3. resume immediately after access is granted
4. avoid asking the user to perform routine technical steps that the agent can execute itself

Never claim deployment success without opening the deployed application and validating the major workflows.

Never claim a required feature is complete if it is mocked.

Never substitute hard-coded dashboard data for SQLite persistence.

Never expose LiveKit secrets in the frontend.

Never use an existing Zoom-clone repository as the submission base.

The final product should look like a **small, deliberately engineered conferencing application**, not a generated demo.

---

# 42. Useful Official References

Use current official documentation during implementation because SDK APIs can change.

- Next.js / Vercel: https://vercel.com/frameworks/nextjs
- FastAPI on Railway: https://docs.railway.com/guides/fastapi
- Railway volumes: https://docs.railway.com/volumes
- Railway agent support: https://docs.railway.com/agents
- LiveKit React components: https://docs.livekit.io/reference/components/react/
- LiveKit authentication/token generation: https://docs.livekit.io/frontends/build/authentication/custom/
- LiveKit participant management: https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants/

The agent should confirm current package APIs against official docs before implementing integration-specific code.

