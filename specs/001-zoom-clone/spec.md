# Feature Specification: 001-zoom-clone

## 1. Overview & Objective
Build an original, production-ready Zoom-style video conferencing application ("OrbitMeet") using **Next.js (App Router) + FastAPI + SQLite + LiveKit Cloud**.
The system satisfies all core assignment requirements with human-authored UI, solid relational persistence, real-time media communication, and host controls, strictly adhering to Ponytail (minimalism/YAGNI) and Anti-AI-Slop standards.

## 2. Personas & Assumptions
- **Assumed User**: Single default signed-in user ("Dhruv Singh", initials `DS`). No login/registration flow required.
- **Participant**: Any remote attendee joining via meeting code or invite link, entering their display name in pre-join preview.
- **Host**: The user who initiates or schedules the meeting, granted administrative controls (mute all, remove attendee, end meeting) via a secure `host_control_token` held in client session storage.

## 3. Functional Requirements

### 3.1 Dashboard & Navigation
- Top navigation with product logo (`OrbitMeet`), settings/help icons, and default user avatar (`DS`).
- Primary action cluster:
  - **New Meeting**: Instantly creates a live meeting in SQLite, obtains a meeting code, and transitions to `/meeting/{code}`.
  - **Join**: Navigates to `/join` with meeting code/link input.
  - **Schedule**: Navigates to `/schedule` modal or page.
  - **Share Screen**: Direct action button to join with screen-share intent.
- Meeting sections:
  - **Upcoming Meetings**: Chronological list of future scheduled meetings queried from SQLite with copy-invite and start/join buttons.
  - **Recent Meetings**: Reverse-chronological list of completed/past meetings with meeting details and quick re-start/copy options.

### 3.2 Meeting Identification & Links
- Human-friendly 10-digit meeting codes (formatted as `XXX XXX XXXX`, stored as unspaced digits `XXXXXXXXXX`).
- Cryptographically random generation with database uniqueness enforcement and collision retry.
- Canonical invite links: `https://<domain>/join?meeting=<code-digits>`.

### 3.3 Join & Pre-Join Experience
- Accepts raw digits (`8231946621`), spaced format (`823 194 6621`), or full invite URL.
- Live backend validation checking SQLite meeting existence and status.
- Pre-join room showing:
  - Meeting title & host name.
  - Editable display name input.
  - Real browser camera and microphone preview.
  - Initial mute and video toggles before entry.
- Join request records participant session in SQLite and receives short-lived LiveKit participant token.

### 3.4 Realtime Meeting Room
- Dark, focused conferencing interface with responsive grid:
  - 1 participant: Centered large tile.
  - 2 participants: 2-column split.
  - 3–4 participants: 2x2 grid.
  - 5+ participants: Adaptive paging/grid.
- Video tile fallback to participant initials/avatar when camera is muted.
- Bottom toolbar:
  - Audio toggle (Mute / Unmute).
  - Video toggle (Start Video / Stop Video).
  - Screen sharing (Publish display media track).
  - Participants list toggle with live attendee count.
  - Meeting info & copy invite link.
  - Leave meeting (Host gets "End for All" or "Leave"; attendees get "Leave").

### 3.5 Host Moderation
- Host mute participant / host mute-all.
- Host kick/remove participant (calls LiveKit server SDK via FastAPI).
- Secure host authorization using `host_control_token`.

### 3.6 Scheduling Flow
- Form fields: Title (required), Description, Date (future), Start Time, Duration (15–480 minutes).
- Validation: Inline error states, future timestamp enforcement.
- Creation feedback with copy invitation and immediate dashboard update.

## 4. Non-Functional & Quality Requirements
- **Originality**: Zero verbatim code or component structure from existing Zoom clone repositories.
- **Visuals**: Zoom-inspired light dashboard + dark conferencing room; no generic neon gradients or glassmorphism.
- **Persistence**: SQLite with WAL mode, foreign keys, and indexes. Survives container restarts on persistent `/data` volume.
- **Responsiveness**: Fluid layout across 1440px desktop, 1024px tablet, and 390px mobile viewports without horizontal scroll.
- **Performance**: Instant initial dashboard load (<1.5s), LiveKit room connection <2s.
