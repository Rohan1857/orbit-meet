# Research & Architecture Decisions: OrbitMeet

## 1. Realtime Media Architecture

### Decision
Use **LiveKit Cloud** as the media transport layer with **FastAPI** as the control plane and token authority.

### Rationale
Building a custom SFU or WebRTC mesh from scratch is out of assignment scope and fails beyond 3 participants due to upload bandwidth multiplication. LiveKit provides managed STUN/TURN, SFU selective forwarding, simulcast, and track moderation. The application maintains all business logic (meeting creation, scheduling, participant tracking, host privileges, validation) in FastAPI and SQLite.

### Alternatives Considered
- **WebRTC Peer-to-Peer Mesh**: O(N²) upload bandwidth scaling; degrades significantly at 4+ participants.
- **Self-Hosted Mediasoup / Janus**: Excessive operational overhead for cloud deployment on Railway/Vercel.
- **Agora / Twilio Video**: Vendor lock-in with closed SDKs; Twilio Video is deprecated.

---

## 2. Persistence & SQLite Concurrency

### Decision
Use **SQLite** with **Write-Ahead Logging (WAL)** enabled (`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`), hosted on a persistent volume mounted at `/data` in Railway (`sqlite:////data/zoom_clone.db`).

### Rationale
The assignment explicitly specifies SQLite. In containerized environments like Railway, files written to default container root are ephemeral. Mounting a persistent disk volume to `/data` guarantees that scheduled meetings, past meetings, and participant sessions survive container redeploys and restarts. WAL mode allows concurrent readers while a write is occurring, preventing database locks during meeting lookups.

### Alternatives Considered
- **Default Container Storage**: Fails the persistence test on restart/redeploy.
- **PostgreSQL**: Violates assignment constraint requiring SQLite.

---

## 3. Host Authentication Without User Auth System

### Decision
Issue a cryptographically secure `host_control_token` (UUID4 / hex) upon meeting creation, returned only in the initial creation response and held in the host browser's `sessionStorage`. Host moderation endpoints require this token via header `X-Host-Token`.

### Rationale
The assignment specifies no authentication (single default user "Rohan"). However, leaving administrative actions (mute-all, kick participant, end meeting) open to any client sending `{"role": "host"}` creates an unexplainable security flaw. A session-scoped host token provides authorization without adding multi-user auth schemas or OAuth complexity (Ponytail / YAGNI).

### Alternatives Considered
- **Full OAuth / JWT User System**: Violates YAGNI; adds unnecessary complexity for single-user assignment scope.
- **Trusting Client Request Body**: Unacceptable security practice that would fail senior technical review.

---

## 4. Meeting Identification & Code Design

### Decision
Generate cryptographically random 10-digit meeting codes (e.g. `823 194 6621`). Stored normalized as 10 digits (`8231946621`) in SQLite with a `UNIQUE` constraint, and formatted as `XXX XXX XXXX` in presentation.

### Rationale
Standard conferencing platforms (Zoom, Google Meet) use memorable, human-friendly numeric or phonetic codes. 10 digits offer $10^{10}$ permutations, making collisions astronomically rare while remaining easy to speak or paste.

### Alternatives Considered
- **Auto-increment Database IDs**: Exposes business volume; predictable; insecure.
- **UUID4**: Too long and clumsy for human communication and URL sharing.

---

## 5. Frontend Media & Component Composition

### Decision
Use Next.js 15 App Router with `@livekit/components-react` headless hooks and context providers (`LiveKitRoom`, `useParticipants`, `useTracks`, `useLocalParticipant`), but **author 100% of the UI components, grid layouts, and toolbar styles from scratch** using Tailwind CSS and CSS custom properties.

### Rationale
Using pre-styled LiveKit UI components creates a cookie-cutter appearance that fails the originality requirement. Using headless hooks gives reliable WebRTC event subscription while allowing complete control over layout, typography, controls, and accessibility.

### Alternatives Considered
- **Raw `livekit-client` Event Listeners**: Hundreds of lines of state-syncing boilerplate.
- **Pre-styled `@livekit/components-styles`**: Generic appearance that does not match Zoom's layout grammar.

---

## 6. Design System & Anti-AI-Slop Framework

### Decision
Define a custom design token system in `src/styles/tokens.css` with clean neutral backgrounds, Zoom-inspired clear blue interaction accents, restrained 6px–12px radii, single-family typography (Inter / system), and Lucide-only icons.

### Rationale
Eliminates all AI template tells (purple gradients, glowing borders, floating blobs, cards-inside-cards, generic marketing phrases). Provides a credible, distraction-free application experience suitable for enterprise evaluation.
