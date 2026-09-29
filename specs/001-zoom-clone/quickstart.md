# Quickstart & Verification Guide: OrbitMeet

This guide outlines prerequisites, local environment setup, and runnable end-to-end validation scenarios for the OrbitMeet video conferencing application.

---

## 1. Prerequisites

- **Node.js**: v18+ (tested on v22.22+)
- **Python**: 3.10+ or 3.12+ (tested with `py -3.12`)
- **LiveKit Cloud Credentials**: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- **Git** & **PowerShell** / Bash

---

## 2. Setup Commands

### Backend Setup
```powershell
cd D:\zoom-clone\backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```powershell
cd D:\zoom-clone\frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:3000` and communicate with FastAPI at `http://localhost:8000`.

---

## 3. End-to-End Validation Scenarios

### Scenario A: Instant Meeting Launch (Host)
1. Navigate to `http://localhost:3000`.
2. Observe dashboard shell with "Dhruv Singh" default profile and seeded upcoming/recent meetings.
3. Click **New Meeting**.
4. **Expected Outcome**:
   - Button shows subtle loading state.
   - FastAPI creates record in `meetings` table with `status="live"` and random 10-digit code.
   - Browser navigates to `/meeting/<meeting_code>`.
   - Host connects to LiveKit room; camera and microphone preview initialize.

### Scenario B: Schedule a Future Meeting
1. From dashboard, click **Schedule**.
2. Enter:
   - Topic: "Design Systems & Architecture Sync"
   - Date: Tomorrow's date
   - Time: 15:00
   - Duration: 45 minutes
3. Click **Schedule Meeting**.
4. **Expected Outcome**:
   - Success state displays generated 10-digit meeting ID and shareable invite URL.
   - Return to dashboard; "Design Systems & Architecture Sync" appears under **Upcoming Meetings**.
   - Refresh browser (`F5`); meeting persists from SQLite.

### Scenario C: Meeting Code Validation & Join Flow
1. Navigate to `http://localhost:3000/join`.
2. Input invalid meeting code `000 000 0000` -> Expected: Inline error "We couldn't find that meeting. Check meeting ID."
3. Input valid meeting code (e.g. from Scenario B) -> Expected: Resolves meeting title and transitions to pre-join stage.
4. Set display name "Ayan", toggle camera on/off, click **Join Meeting**.
5. **Expected Outcome**: Participant registers in `participant_sessions` table and connects to active meeting room.

### Scenario D: Multi-User WebRTC Communication
1. In Browser 1 (Host), launch an instant meeting.
2. Copy invite link via meeting toolbar or dashboard.
3. Open an Incognito window or second browser context (Browser 2) and paste invite link.
4. Join as "Rohan".
5. **Expected Outcome**:
   - Both browsers show 2-column video grid.
   - Audio and video stream between both browsers over LiveKit SFU.
   - Participant panel lists "Dhruv Singh (Host)" and "Rohan".

### Scenario E: Camera Fallback & Mute Status
1. In Browser 2, click **Stop Video**.
2. **Expected Outcome**:
   - Browser 1 immediately replaces Browser 2's video track with an initials tile ("R").
   - Browser 2 clicks **Mute**; microphone icon reflects muted state in Browser 1's tile badge.

### Scenario F: Host Moderation (Mute / Kick)
1. In Browser 1 (Host), open the **Participants** drawer.
2. Click **Mute** next to "Rohan" -> Browser 2 microphone is muted via server-side LiveKit action.
3. Click **Remove** next to "Rohan" -> Browser 2 is disconnected with notice "You were removed from the meeting".

### Scenario G: Meeting Termination & Persistence Audit
1. In Browser 1, click **Leave** -> select **End meeting for all**.
2. **Expected Outcome**:
   - SQLite updates meeting record status to `ended` with `ended_at` timestamp.
   - Dashboard **Recent Meetings** list now includes this meeting.
   - Restarting backend server (`Ctrl+C` then re-run `uvicorn`) preserves all created and ended meetings.
