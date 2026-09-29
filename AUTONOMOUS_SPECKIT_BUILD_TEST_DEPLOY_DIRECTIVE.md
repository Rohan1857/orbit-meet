# Autonomous Spec Kit Build, Test, Deploy & Verification Directive
## Zoom-Style Video Conferencing Assignment

> **Purpose:** Give this file to the coding agent **after `/speckit-plan` has completed** for the current Zoom-clone feature.
>
> The agent must treat this document as an **execution directive**, not as advice or a planning document.
>
> **Primary behavior change:** Do **not** stop after any intermediate Spec Kit phase and do **not** send the user "next step" updates. Continue autonomously through tasks, analysis, implementation, convergence, testing, bug repair, deployment, and production verification. Only report back when the project satisfies the final completion gate, except for an unavoidable external blocker that requires user credentials, authorization, payment, or a manual third-party action.

---

# 0. Current Project State

The project is already beyond initial specification and planning.

Current known state:

```text
Branch: feature/001-zoom-clone
```

Existing artifacts include:

```text
constitution.md
spec.md
plan.md
research.md
data-model.md
contracts/rest-api.md
contracts/livekit-token.md
quickstart.md
```

The completed planning stage has already established, among other things:

- Next.js frontend
- Python FastAPI backend
- SQLite persistence
- SQLAlchemy data layer
- LiveKit SFU for realtime media
- persistent SQLite storage for production
- host-control authorization
- meeting and participant-session data models
- REST API contracts
- LiveKit token contract
- validation scenarios
- originality rules
- the project's anti-generic / anti-AI-looking frontend principles
- the project's constitution and design principles

**Do not regenerate or replace these artifacts casually.**

Before modifying their meaning, determine whether implementation evidence genuinely requires a spec/plan correction. If so, reconcile the artifact set deliberately and preserve the constitution.

---

# 1. Mission

Complete the entire assignment end-to-end.

The work is not complete when:

- scaffolding exists,
- routes exist,
- a dashboard renders,
- `/speckit-implement` finishes,
- tasks are checked off,
- unit tests pass,
- `/speckit-converge` reports Converged,
- the app runs locally,
- or deployment succeeds.

The work is complete only when **all final acceptance gates in this document pass**.

The required output is a functional, original, explainable, deployed Zoom-style conferencing application with:

- Next.js frontend
- FastAPI backend
- SQLite database
- real browser audio/video conferencing
- instant meeting creation
- meeting ID generation
- shareable invitation links
- join-by-ID and join-by-link
- participant display-name entry
- scheduled meetings
- upcoming meetings
- recent meetings
- meeting persistence
- seeded data
- responsive UI
- polished Zoom-inspired UX
- correct error/empty/loading states
- host controls required by the chosen implementation scope
- setup documentation
- public repository readiness
- deployed frontend
- deployed backend
- production media connectivity
- verified production behavior

---

# 2. Communication Policy

## 2.1 Default: no intermediate user updates

After receiving this directive, work continuously.

Do **not** stop to tell the user:

- "tasks generated"
- "backend complete"
- "frontend complete"
- "moving to testing"
- "converge passed"
- "deployment is next"
- "here is what I have done so far"
- or any equivalent progress update.

Do not ask the user to approve ordinary technical choices already resolved by the existing constitution, specification, plan, research, contracts, or this directive.

Use reasonable engineering judgment.

---

## 2.2 The only allowed interruption

Interrupt the user only when progress is blocked by something the agent cannot legally or technically perform without user action, for example:

- Vercel authentication requiring user login
- Railway authentication requiring user login
- LiveKit Cloud account creation or credentials
- GitHub authorization that cannot be completed with current credentials
- a billing confirmation
- an unavailable required secret
- a CAPTCHA
- an external account permission
- a third-party service outage that prevents completion

Before interrupting:

1. confirm the blocker is real;
2. try existing authenticated CLIs or environment credentials;
3. inspect `.env.example`, existing secrets configuration, and deployment config;
4. do everything else that can be completed without the missing action;
5. reduce the user request to the smallest possible action.

Example acceptable interruption:

```text
I have completed the application and local test suite. Production deployment is blocked only by missing LiveKit credentials. Please provide LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET or authenticate the LiveKit CLI/account. I will continue from deployment immediately after that.
```

Do not ask multiple speculative questions.

---

# 3. Spec Kit Operating Rule

Use the **full Spec Kit development discipline**, but continue automatically instead of treating each command as a reason to stop.

For this project state, the required sequence begins at tasks:

```text
/speckit-tasks
        ↓
/speckit-analyze
        ↓
/speckit-implement
        ↓
/speckit-converge
        ↓
if gaps appended:
    /speckit-implement
    /speckit-converge
    repeat until Converged
        ↓
Engineering Verification
        ↓
Bug Workflow for discovered defects
        ↓
Regression
        ↓
Deployment
        ↓
Production Smoke + Media Tests
        ↓
Final Acceptance Audit
```

If this integration exposes commands in dotted form, use the equivalent:

```text
/speckit.tasks
/speckit.analyze
/speckit.implement
/speckit.converge
```

Use the syntax supported by the current initialized integration.

---

# 4. Do Not Blindly Trust Artifacts

Spec Kit artifacts are contracts and guides, not proof that the software works.

The agent must verify that:

- the spec is implemented in actual code;
- the API matches the contracts;
- the database schema matches the intended model;
- frontend actions actually call the backend;
- persisted meetings survive page reloads and backend restarts;
- invitation links resolve correctly;
- LiveKit tokens are issued securely;
- host privileges are enforced server-side;
- real media is published and subscribed;
- upcoming/recent lists come from persisted application state;
- failures are handled intentionally;
- the deployed system behaves the same as local development.

A green checklist without runtime evidence is not completion.

---

# 5. Phase A — Generate Tasks

Run:

```text
/speckit-tasks
```

The generated task list must be implementation-oriented and dependency-ordered.

Inspect `tasks.md` after generation.

The task list should cover at minimum:

## Foundation

- monorepo/repository organization
- frontend scaffolding
- backend scaffolding
- environment configuration
- linting / formatting
- test configuration
- shared naming conventions
- CORS configuration
- production configuration strategy

## Database

- SQLAlchemy models
- SQLite initialization
- indexes
- uniqueness constraints
- migration/bootstrap strategy
- seed script/data
- participant session persistence
- meeting lifecycle fields
- timestamps and timezone handling

## Backend

- health endpoint
- instant meeting creation
- scheduled meeting creation
- meeting lookup
- join validation
- upcoming meetings
- recent meetings
- participant join/leave tracking
- LiveKit access-token generation
- host identity and grant handling
- mute-all / removal APIs if included by spec
- structured error responses
- configuration validation

## Frontend

- application shell
- Zoom-inspired navbar/header
- dashboard
- instant meeting action
- join flow
- schedule flow
- upcoming list
- recent list
- invitation copy/share interaction
- pre-join experience
- meeting room
- participant grid
- local media controls
- remote media
- participant panel
- host controls
- meeting end flow
- loading states
- empty states
- API errors
- invalid meeting state
- responsive states

## Realtime

- LiveKit room naming
- server-side token issuance
- host token
- participant token
- camera
- microphone
- screen sharing if in scope
- leave/disconnect behavior
- participant presence
- host moderation

## Quality

- backend tests
- frontend tests
- end-to-end tests
- visual checks
- accessibility basics
- build verification
- README
- deployment config
- production smoke tests

If key areas are absent, improve the task breakdown before implementation.

Do not report task generation to the user.

---

# 6. Phase B — Cross-Artifact Analysis

Run:

```text
/speckit-analyze
```

Resolve meaningful inconsistencies among:

```text
constitution.md
spec.md
plan.md
research.md
data-model.md
contracts/*
quickstart.md
tasks.md
```

The analysis must particularly check:

- all assignment requirements are represented;
- all must-have features have tasks;
- all contract endpoints have implementation tasks;
- all model fields required by the UI/API are represented;
- frontend actions map to backend behavior;
- host moderation has an authorization model;
- LiveKit secret handling is server-side only;
- SQLite persistence is compatible with deployment;
- deployment requirements are represented;
- testing is represented as real work, not one generic "test app" item;
- originality and anti-template UI constraints are preserved.

### Stop condition for analysis

Proceed only after there are no unresolved **critical** or **high-severity** specification/task inconsistencies.

Resolve ordinary ambiguity yourself using:

1. constitution,
2. spec,
3. plan,
4. research,
5. contracts,
6. assignment intent,
7. simplest maintainable implementation.

Do not ask the user about minor implementation choices.

---

# 7. Phase C — Implementation

Run:

```text
/speckit-implement
```

For a large implementation, staged runs are allowed to protect context quality, but the agent itself must continue through every stage.

Suggested internal sequence:

```text
1. Setup + foundations
2. Database + backend domain model
3. Core meeting REST API
4. Dashboard + meeting management UI
5. LiveKit token path + pre-join
6. Meeting room + media controls
7. Host controls
8. Responsive / states / UX polish
9. Tests
10. Documentation + deployment configuration
```

If sub-agents are available, delegate parallel `[P]` tasks where useful.

The primary agent remains responsible for:

- integration,
- consistency,
- regression testing,
- architecture coherence,
- and final verification.

---

# 8. Implementation Engineering Rules

## 8.1 No mocks in the final core path

Mocks are acceptable temporarily during development.

They must not remain as substitutes for required functionality.

Forbidden final-state examples:

```text
const mockMeetings = [...]
const mockParticipants = [...]
setTimeout(() => fakeCreateMeeting(), 500)
hard-coded upcoming meetings
fake participant tiles unrelated to LiveKit
fake host controls that only change local state
```

Dashboard and meeting data must originate from the real application API/database.

Participant media/presence must originate from LiveKit.

---

## 8.2 Backend owns business state

The backend/database must own:

- meeting identity
- meeting metadata
- schedule
- status
- host identity
- meeting validation
- participant session history
- recent/upcoming semantics
- token issuance
- moderation authorization

Do not store required persistent meeting state only in:

- localStorage
- sessionStorage
- React state
- Zustand persistence
- URL query parameters

Frontend local state may cache or stage data, but SQLite is the system of record.

---

## 8.3 Secret handling

Never expose these to the browser bundle:

```text
LIVEKIT_API_SECRET
LIVEKIT_API_KEY when server-confidential
Railway secrets
database secrets if any
private service credentials
```

LiveKit participant tokens must be generated by FastAPI.

Commit:

```text
.env.example
```

Do not commit:

```text
.env
.env.local
production secrets
database files containing private data
```

---

# 9. UI/UX Directive

The final UI must feel:

- deliberate,
- restrained,
- professional,
- productivity-focused,
- Zoom-inspired,
- original,
- and human-designed.

The visual target is **not** "cool AI SaaS dashboard."

Follow the existing constitution's **Ponytail minimalism**, **Anti-AI-Slop**, and originality constraints.

---

## 9.1 Avoid generic AI-generated design tropes

Do not use these as the dominant visual language:

- purple/blue mesh gradients
- huge marketing hero banners
- glassmorphism everywhere
- glowing borders
- giant floating orb decorations
- excessive rounded rectangles
- 20px+ radius on every surface
- everything inside cards
- fake analytics
- meaningless productivity statistics
- decorative charts not required by the assignment
- generic "Welcome back 👋"
- stock AI-generated illustrations
- giant empty whitespace caused by template layouts
- excessive shadows
- rainbow gradients
- generic shadcn dashboard composition copied without adaptation
- copied Yoom / JavaScript Mastery layout
- copied VideoSDK Zoom-clone layout
- copied Zoom markup/style implementation

---

## 9.2 Prefer

Use:

- neutral white/light-gray surfaces;
- restrained Zoom-like blue as an accent;
- purposeful hierarchy;
- compact action areas;
- realistic meeting metadata;
- subtle borders;
- moderate radii;
- deliberate whitespace;
- clean typography;
- clear hover/focus/disabled states;
- custom meeting action layout;
- custom empty-state wording;
- polished dialogs;
- meeting-specific icons;
- responsive layout designed rather than mechanically stacked.

---

## 9.3 Dashboard minimum visual quality

The dashboard must visibly contain:

- product identity/navigation
- profile/settings placeholders if required by spec
- clearly differentiated:
  - New Meeting
  - Join Meeting
  - Schedule Meeting
- upcoming meetings
- recent meetings

The primary meeting actions should be visually memorable without becoming decorative gimmicks.

A reviewer should understand the page hierarchy within seconds.

---

## 9.4 Meeting room quality

Meeting UI must include appropriate versions of:

- participant video area
- active/local participant
- participant name
- microphone state
- camera state
- meeting controls
- participant count/panel
- leave/end action
- host moderation controls when applicable
- copy meeting info
- clear connection/loading/error states

The control bar should feel like conferencing software, not a generic web form.

---

# 10. Convergence Loop

After implementation run:

```text
/speckit-converge
```

### If result is `Tasks appended`

Do not report this.

Immediately:

```text
/speckit-implement
/speckit-converge
```

Repeat until:

```text
Converged
```

### Important

`Converged` is a **spec completeness gate**, not the final project completion gate.

After Converged, continue directly into runtime verification.

---

# 11. Phase D — Static Engineering Verification

Before browser testing, run the applicable static checks.

Examples:

## Frontend

```bash
npm run lint
npm run typecheck
npm run build
```

If scripts differ, use the equivalent project commands.

Required outcomes:

- zero TypeScript errors;
- no build failure;
- no unresolved imports;
- no hydration-breaking errors;
- no serious lint violations;
- no secrets embedded in generated frontend artifacts.

## Backend

Use the project's configured equivalents, for example:

```bash
ruff check .
pytest
```

or:

```bash
python -m pytest
```

Also verify:

- application imports cleanly;
- database initializes cleanly;
- seeded data is idempotent;
- API schema/OpenAPI generation succeeds;
- environment validation gives actionable errors.

Fix all relevant failures before continuing.

---

# 12. Phase E — Backend Automated Test Matrix

Backend automated tests must verify at minimum:

## Health

```text
GET /health
→ 200
```

## Instant meeting

```text
POST instant meeting
→ creates unique meeting
→ persisted in SQLite
→ returns meeting ID
→ returns usable invite information
```

## Scheduling

```text
POST scheduled meeting
→ title saved
→ description saved
→ scheduled datetime saved correctly
→ duration saved
→ meeting code unique
→ invite link information returned
```

## Meeting lookup

```text
existing ID → success
nonexistent ID → correct 404/domain error
invalid ID format → validation error
```

## Upcoming meetings

Verify:

- future scheduled meetings appear;
- ended/past meetings do not incorrectly appear;
- ordering is sensible and deterministic.

## Recent meetings

Verify:

- completed/recent meetings appear;
- future scheduled meetings do not incorrectly appear;
- ordering is correct.

## Participant session

Verify:

- join session recorded;
- leave/end timestamps can be recorded;
- meeting relationship is valid.

## Host authorization

Verify that a normal participant cannot execute host-only operations by simply changing frontend state or request payload.

## Token behavior

Verify:

- token endpoint rejects nonexistent meeting;
- correct room name is encoded/used;
- identity is unique enough for concurrent users;
- host grants differ from participant grants when required.

---

# 13. Phase F — Frontend Automated Tests

Use the project's selected test stack.

Test behavior, not implementation details.

At minimum verify:

## Dashboard

- page renders;
- three primary meeting actions exist;
- upcoming meetings render from API response;
- recent meetings render from API response;
- empty states work.

## Instant meeting

- clicking New Meeting calls backend;
- successful response navigates to correct meeting/prejoin route;
- backend error is displayed intentionally.

## Join

- meeting ID accepted;
- full invitation URL accepted if specified by contract;
- display name required;
- nonexistent meeting handled;
- valid meeting navigates correctly.

## Schedule

- title
- description
- date/time
- duration
- validation
- successful persistence
- newly scheduled meeting appears in Upcoming

## Meeting UI

Where practical in component tests verify:

- media controls render;
- state changes are represented;
- participant list renders;
- leave/end interactions trigger expected behavior.

---

# 14. Phase G — End-to-End Browser Verification

Use Playwright or the project's browser automation tool.

Do not rely only on unit tests.

Create deterministic test data or reset state where appropriate.

---

## Scenario A — Dashboard

1. open application;
2. verify application shell;
3. verify New Meeting;
4. verify Join Meeting;
5. verify Schedule Meeting;
6. verify seeded Upcoming section;
7. verify Recent section;
8. refresh;
9. verify persisted data remains correct.

---

## Scenario B — Schedule meeting

1. click Schedule;
2. enter realistic title;
3. enter description;
4. select future date/time;
5. choose duration;
6. submit;
7. verify success;
8. verify meeting appears in Upcoming;
9. copy invite link;
10. refresh;
11. verify meeting still exists.

---

## Scenario C — Invalid join

1. open Join;
2. provide display name;
3. enter nonexistent meeting code;
4. submit;
5. verify user remains in safe UI state;
6. verify clear message;
7. verify no broken meeting room opens.

---

## Scenario D — Valid join

1. create/schedule meeting;
2. join by meeting ID;
3. verify pre-join screen;
4. verify display name;
5. enter meeting;
6. verify room shell loads;
7. verify participant is visible in participant list/presence state.

---

## Scenario E — Invite link

1. create meeting;
2. copy generated invitation;
3. open link in a fresh browser context;
4. enter second display name;
5. join;
6. verify both participants resolve to the same application meeting/LiveKit room.

---

# 15. Phase H — Real Media Verification

This is mandatory.

A conferencing assignment is not verified merely because the UI loads.

Use two isolated browser contexts where browser/tool capabilities allow.

Recommended:

```text
Context A: Host
Context B: Participant
```

Verify:

1. both can join same room;
2. each appears as a participant;
3. camera publication works where test environment permits;
4. microphone publication works where test environment permits;
5. local mute changes state correctly;
6. local camera toggle changes state correctly;
7. leave removes/disconnects participant correctly;
8. reconnect/refresh does not corrupt application state.

If browser automation cannot provide physical camera/mic, use a supported fake media stream / browser test media configuration and document that fact in test evidence.

Do not claim camera/microphone verification if no media track was actually exercised.

---

# 16. Host Control Verification

If host controls are implemented, test them with two participants.

At minimum:

## Mute all

Verify:

- participant cannot invoke host-only endpoint;
- host can invoke endpoint;
- target participant state changes as intended by LiveKit/platform semantics;
- UI reflects the result.

## Remove participant

Verify:

- host can remove participant;
- removed participant disconnects;
- participant list updates;
- participant session/application state is reconciled as designed;
- participant cannot remove host by forging ordinary frontend state.

---

# 17. Phase I — Responsive Visual QA

Capture and inspect screenshots at minimum at:

```text
1440 × 900
1024 × 768
390 × 844
```

Check:

- no clipping;
- no overlapping controls;
- no unreadable labels;
- no giant accidental whitespace;
- dialogs fit viewport;
- meeting controls remain usable;
- dashboard actions remain understandable;
- mobile layout looks intentionally designed;
- text hierarchy is consistent;
- spacing is coherent;
- action buttons do not wrap awkwardly;
- no generic unfinished placeholder content remains.

---

# 18. Anti-AI Visual Review

Before deployment, explicitly inspect the screenshots and ask:

```text
Does this look like a generic AI-generated dashboard?
```

Look for:

- repetitive card layouts;
- excessive pills;
- default template spacing;
- random gradients;
- fake metrics;
- unnecessary decorative text;
- inconsistent icons;
- generic copy;
- giant headings;
- monotonous component repetition;
- obviously unedited component-library defaults.

If yes, revise the design before continuing.

Also ask:

```text
Does this look copied from a popular Zoom-clone tutorial?
```

If yes, alter:

- composition;
- component structure;
- copy;
- spacing;
- icon placement;
- meeting cards;
- action layout;
- empty states;
- pre-join composition.

Maintain recognizable Zoom-style interaction semantics without reproducing another repository.

---

# 19. Bug Workflow

Install/ensure the Spec Kit bug extension if required:

```bash
specify extension add bug
```

Whenever runtime testing discovers a genuine defect, use the bug discipline instead of random patching.

For each meaningful bug:

```text
/speckit-bug-assess "<precise symptom and reproduction>" slug=<short-slug>
/speckit-bug-fix slug=<short-slug>
/speckit-bug-test slug=<short-slug>
```

Equivalent dotted syntax may be used depending on integration:

```text
/speckit.bug.assess
/speckit.bug.fix
/speckit.bug.test
```

A bug is not closed until the bug test verdict is:

```text
verified
```

If verdict is:

```text
partial
```

obtain the missing verification evidence and retest.

If verdict is:

```text
failed
```

reassess/fix based on the new evidence and retest.

After bug repair, rerun affected regression suites.

---

# 20. Regression Gate

After all discovered bugs are resolved:

Run again:

```text
frontend lint
frontend type check
frontend tests
frontend production build

backend lint
backend tests

end-to-end core scenarios
```

Then rerun:

```text
/speckit-converge
```

if implementation changes could have introduced new spec gaps.

Do not deploy a knowingly failing branch.

---

# 21. Data Persistence Verification

SQLite is an explicit assignment requirement.

Verify persistence rather than merely inspecting code.

Local persistence test:

1. create scheduled meeting;
2. confirm it exists through API;
3. stop backend;
4. restart backend;
5. query meeting;
6. confirm it remains;
7. confirm Upcoming view still contains it.

Production persistence test must also be performed after deployment if the platform permits restart/redeploy verification.

At minimum, verify database path points to persistent storage in production.

---

# 22. Seed Data

Seed data must:

- be realistic;
- not contain nonsense filler;
- demonstrate Upcoming and Recent states;
- be idempotent or safely initialized;
- not duplicate endlessly on restart;
- not interfere with normal user-created meetings.

Example realistic topics:

```text
Product Design Review
Weekly Engineering Sync
Candidate Interview
Research Discussion
Project Handoff
```

Avoid generic demo labels such as:

```text
Test Meeting 1
Meeting ABC
Lorem Ipsum Meeting
```

---

# 23. README Gate

Before deployment completion, README must include:

- project description
- screenshots if useful
- major features
- technology stack
- architecture explanation
- database design summary
- realtime media explanation
- local setup
- frontend commands
- backend commands
- environment variables
- SQLite behavior
- seed instructions
- test instructions
- deployment architecture
- assumptions
- limitations
- originality statement
- deployed frontend URL
- backend URL if appropriate

README must be written specifically for this project.

Do not copy another Zoom clone README.

---

# 24. Git Quality Gate

Before final deployment/submission:

```bash
git status
git diff
git log --oneline
```

Verify:

- no secrets tracked;
- no `.env`;
- no private keys;
- no generated junk accidentally committed;
- no local SQLite database unless intentionally allowed;
- no debug screenshots unless desired;
- no dead experimental files;
- no commented-out obsolete implementation;
- commit history is understandable.

Use logical commits.

Examples:

```text
feat: scaffold meeting API and persistence
feat: implement scheduling and meeting lookup
feat: add LiveKit token issuance and prejoin flow
feat: build realtime meeting room controls
test: cover meeting lifecycle and join flows
fix: enforce host moderation permissions
docs: add setup and deployment guide
```

Do not fabricate authorship or rewrite commits merely to conceal external copying. All project code must remain original as required by the constitution.

---

# 25. Deployment Gate

Target deployment:

```text
Frontend: Vercel
Backend: Railway
Realtime: LiveKit Cloud
Database: SQLite on Railway persistent volume
```

Use the actual deployment configuration established in `plan.md` if it differs for a justified reason.

---

## 25.1 Backend

Deploy FastAPI.

Verify production environment includes correct values for items such as:

```text
DATABASE_URL
FRONTEND_URL
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

Ensure SQLite points to a persistent volume, e.g. the planned production path.

Verify:

```text
GET production-backend/health
```

returns success.

---

## 25.2 Frontend

Deploy Next.js.

Configure production backend URL.

Ensure:

- frontend does not reference localhost;
- browser requests use HTTPS;
- CORS allows deployed frontend;
- no secret is embedded in client environment variables;
- production build succeeds.

---

## 25.3 LiveKit

Verify deployed FastAPI can:

- create/sign valid access tokens;
- send clients to correct LiveKit server;
- use consistent room identity;
- enforce grants.

---

# 26. Production Smoke Tests

Local success is not sufficient.

Run core flows against deployed URLs.

Minimum production smoke suite:

```text
1. frontend loads
2. backend health succeeds
3. dashboard loads API data
4. instant meeting can be created
5. meeting persists
6. schedule meeting succeeds
7. upcoming list updates
8. invalid meeting join is rejected cleanly
9. valid meeting join reaches prejoin/room
10. invitation link opens same meeting
11. two browser contexts can join same LiveKit room
12. media/presence is exercised
13. leave/end flow works
14. recent meeting state appears as designed
15. refresh does not destroy persisted meeting metadata
```

Where host controls are part of the implementation:

```text
16. host moderation works in production
17. non-host moderation is rejected
```

---

# 27. Production Visual Test

Capture production screenshots at:

```text
1440 × 900
390 × 844
```

Check for deployment-only problems:

- missing fonts
- missing icons
- CSS mismatch
- hydration issues
- API error banners
- mixed-content warnings
- incorrect CORS behavior
- broken routing
- broken copy link
- unexpected mobile overflow

Fix before completion.

---

# 28. Browser Console / Network Gate

Inspect deployed application console/network during representative flows.

Do not finish with:

- recurring uncaught exceptions;
- failing API requests;
- 404 asset requests;
- CORS failures;
- React hydration failures;
- repeated reconnect loops;
- unauthorized requests caused by frontend bugs;
- leaked secrets;
- obvious failed source-map or chunk loading problems that affect functionality.

Non-impacting development warnings should still be understood.

---

# 29. Security / Robustness Sanity Check

This assignment does not need enterprise-grade security, but verify basic correctness:

- backend validates meeting identifiers;
- backend validates schedule payloads;
- SQLAlchemy parameterization is used;
- no raw concatenated SQL from user input;
- no LiveKit secret in browser;
- host actions are authorized server-side;
- display names are constrained to sensible size;
- API errors do not expose stack traces in production;
- CORS is not unnecessarily `*` with sensitive credentials;
- invite links do not embed service secrets;
- meeting creation does not depend on client-generated trusted host flags.

---

# 30. Assignment Traceability Audit

Before final success, create or inspect a requirement matrix internally.

Every assignment requirement must map to:

```text
Requirement
→ implementation file(s)
→ API/database support if needed
→ test evidence
→ production verification
```

Minimum traceability entries:

| Assignment requirement | Must have evidence |
|---|---|
| Landing dashboard | screenshot + E2E |
| New Meeting | API + DB + navigation test |
| Unique Meeting ID | backend test |
| Shareable invite | E2E fresh-context join |
| Join by ID | E2E |
| Join by invite link | E2E |
| Display name | validation + meeting presence |
| Validate meeting existence | API + UI test |
| Schedule title | DB/API/UI |
| Description | DB/API/UI |
| Date/time | DB/API/UI |
| Duration | DB/API/UI |
| Auto link | API/UI |
| Store in DB | restart/persistence evidence |
| Upcoming meetings | API/UI test |
| Recent meetings | API/UI test |
| Responsive | screenshots |
| Default logged-in user assumption | documented |
| Seed data | startup + UI |
| README | reviewed |
| Public deploy | production URL smoke test |

Do not mark a requirement complete merely because a file name suggests it exists.

---

# 31. Definition of Testing Complete

The phrase:

```text
TESTING COMPLETE
```

may only be used when all of the following are true:

### Spec discipline

- [ ] `/speckit-tasks` completed
- [ ] `/speckit-analyze` completed with critical issues resolved
- [ ] `/speckit-implement` completed all required tasks
- [ ] `/speckit-converge` reports **Converged**
- [ ] any later implementation changes were reconciled

### Backend

- [ ] backend lint/static checks pass
- [ ] backend automated tests pass
- [ ] SQLite persistence verified
- [ ] meeting IDs verified unique
- [ ] schedule/lookup/upcoming/recent flows verified
- [ ] token issuance tested
- [ ] host authorization tested if applicable

### Frontend

- [ ] frontend lint passes
- [ ] TypeScript passes
- [ ] frontend tests pass
- [ ] production build passes
- [ ] core dashboard/join/schedule flows pass

### E2E

- [ ] instant create passes
- [ ] schedule passes
- [ ] invalid join passes
- [ ] valid ID join passes
- [ ] invitation link join passes
- [ ] refresh persistence passes
- [ ] recent/upcoming semantics pass

### Media

- [ ] two participant contexts successfully join same room
- [ ] LiveKit participant presence verified
- [ ] audio/video track behavior exercised where environment permits
- [ ] mute/camera toggles exercised
- [ ] disconnect/leave behavior verified
- [ ] host controls exercised if included

### Visual

- [ ] 1440×900 reviewed
- [ ] 1024×768 reviewed
- [ ] 390×844 reviewed
- [ ] anti-AI-template visual review passed
- [ ] no obvious copied tutorial layout

### Deployment

- [ ] backend deployed
- [ ] persistent SQLite configured
- [ ] frontend deployed
- [ ] LiveKit production credentials configured
- [ ] production health succeeds
- [ ] production smoke suite passes
- [ ] production two-participant meeting verified
- [ ] production console/network checked

### Submission readiness

- [ ] README complete
- [ ] `.env.example` complete
- [ ] no secrets committed
- [ ] repository clean
- [ ] deployment URLs recorded
- [ ] assignment traceability audit complete

If any checkbox is false, testing is **not complete**.

---

# 32. Failure Handling

Do not hide test failures.

For any failure:

```text
Observe
→ reproduce
→ identify cause
→ use bug workflow for meaningful defects
→ fix
→ verify original reproduction
→ rerun affected tests
→ rerun regression
```

Never disable a valid test merely to get a green suite.

Never weaken acceptance criteria to match broken implementation.

Never replace real functionality with a mock to make tests pass.

---

# 33. Context Management

Long autonomous builds can exceed an agent's useful context.

Protect quality by:

- using the Spec Kit artifacts as durable state;
- marking tasks complete in `tasks.md`;
- writing test evidence where appropriate;
- making logical commits;
- keeping architecture decisions in documented artifacts;
- using scoped `/speckit-implement` runs when necessary;
- delegating parallel tasks when supported;
- resuming from task state rather than re-deriving project intent.

Do not restart the architecture from scratch because the session became long.

---

# 34. Source-of-Truth Priority

When instructions appear to conflict, use this priority:

```text
1. User's original assignment
2. Constitution
3. This autonomous completion directive
4. spec.md
5. plan.md
6. contracts
7. data-model.md
8. research.md
9. tasks.md
10. implementation convenience
```

However, if a lower-level artifact contains a newer deliberate clarification that is clearly compatible with the assignment and constitution, preserve it.

Never violate a constitutional MUST just because implementation would be easier.

---

# 35. Scope Control

Do not spend substantial time adding unrelated features.

Core assignment quality is more important than extras.

Priority order:

```text
P0 — assignment core functionality
P0 — real persistence
P0 — real conferencing
P0 — correct Zoom-like UX
P0 — tests
P0 — deployment

P1 — host moderation
P1 — responsive refinement
P1 — screen sharing
P1 — prejoin device controls

P2 — optional enhancements only if P0/P1 stable
```

Do not add:

- complex authentication unless explicitly needed;
- billing;
- teams/workspaces;
- calendars requiring OAuth;
- chat history systems unrelated to assignment;
- AI summaries;
- background transcription;
- unnecessary analytics dashboards.

---

# 36. Completion Message Policy

Do not send the user a success message before the final gate passes.

The final response should be concise but evidence-based.

Use this structure:

```text
✅ Build and testing complete.

Repository:
<URL>

Deployment:
<frontend URL>

Backend:
<backend URL>

Verification:
- Spec Kit: Converged
- Backend tests: <passed count/result>
- Frontend tests: <passed count/result>
- E2E: <result>
- Two-participant LiveKit test: <result>
- Responsive QA: 1440×900, 1024×768, 390×844 passed
- Production smoke test: passed
- SQLite persistence: verified

Notable implemented features:
<short list>

Known limitations:
<only genuine limitations; write "None affecting assignment requirements" if appropriate>
```

Do not claim a verification that was not actually executed.

---

# 37. Blocked Completion Message

If and only if an unavoidable external dependency prevents final completion, send:

```text
⚠️ External action required.

Completed:
<everything already completed>

Blocked:
<single precise blocker>

Please do:
<minimal user action>

After that, continue automatically with:
<exact remaining deployment/test stage>
```

Do not call the project complete while blocked.

---

# 38. Optional: Use Spec Kit Workflow Automation

Spec Kit supports resumable workflows. If workflow automation is available in the installed version, the agent may encode repetitive orchestration in a local workflow rather than manually issuing every phase.

Useful CLI concepts include:

```bash
specify workflow run <workflow>
specify workflow status
specify workflow resume <run-id>
```

However:

**Do not assume the stock Full SDD workflow alone satisfies this directive.**

The stock SDD workflow may stop after its built-in implementation steps and may include human review gates. This project additionally requires:

- analyze;
- repeated converge cycles;
- engineering tests;
- bug assessment/fix/test loops;
- deployment;
- production smoke testing;
- final completion gates.

If creating a local custom workflow, preserve these requirements.

Review any workflow containing shell steps before execution because shell steps run with the agent's local privileges.

---

# 39. Immediate Instruction From Current State

The current `/speckit-plan` stage is complete.

Therefore begin now with:

```text
/speckit-tasks
```

Then **continue autonomously through every phase in this file**.

Do not stop after generating tasks.

Do not stop after analysis.

Do not stop after implementation.

Do not stop after convergence.

Do not stop after local tests.

Do not stop after deployment.

Stop only when:

```text
FINAL ACCEPTANCE GATE = PASS
```

or when an irreducible external user action is required.

---

# 40. Final Principle

The objective is not to produce code that appears complete.

The objective is to produce a submission that can survive:

- evaluator interaction,
- browser refreshes,
- invalid input,
- a second participant,
- actual realtime media,
- database inspection,
- code review,
- responsive layouts,
- deployment,
- and questions about architectural decisions.

**Build it. Prove it. Deploy it. Re-test it. Only then report completion.**
