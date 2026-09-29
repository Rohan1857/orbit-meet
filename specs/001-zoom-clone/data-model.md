# Data Model Specification: OrbitMeet

## Relational Schema (SQLite)

```sql
-- Core meetings table
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

-- Participant sessions table
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

-- Indexes for fast lookups & sorting
CREATE INDEX idx_meetings_code ON meetings(meeting_code);
CREATE INDEX idx_meetings_upcoming ON meetings(status, scheduled_at);
CREATE INDEX idx_meetings_recent ON meetings(status, started_at, ended_at);
CREATE INDEX idx_participant_sessions_meeting ON participant_sessions(meeting_id, joined_at);
```

---

## Entity Descriptions

### 1. `Meeting`
- `meeting_code`: Clean 10-digit number (e.g. `8231946621`). Uniquely indexed.
- `meeting_type`:
  - `instant`: Launched on-demand from dashboard "New Meeting".
  - `scheduled`: Created with future date/time from "Schedule" flow.
- `status`:
  - `scheduled`: Future meeting awaiting start.
  - `live`: Active session with participants or host in room.
  - `ended`: Concluded meeting.
  - `cancelled`: Scheduled meeting marked cancelled.
- `host_control_token`: 32-byte hex string generated at creation time. Passed to the host client to authorize moderation endpoints.
- `scheduled_at`: UTC timestamp for scheduled events.
- `duration_minutes`: Estimated meeting length (15 to 480 mins).

### 2. `ParticipantSession`
- `meeting_id`: Foreign key to `meetings.id`.
- `identity`: Unique LiveKit participant identity string (e.g. `host_dhruv_8f3a` or `part_rohan_9c2b`).
- `display_name`: Human-readable name entered in pre-join or default user profile.
- `role`: `host` or `participant`.
- `joined_at` & `left_at`: Track attendee presence and duration for session auditing.

---

## State Transition Rules

### Instant Meeting
```
[User clicks "New Meeting"]
         |
         v
  status: "live"
  started_at: CURRENT_TIMESTAMP
         |
         v (Host clicks "End for All" or leaves empty room)
  status: "ended"
  ended_at: CURRENT_TIMESTAMP
```

### Scheduled Meeting
```
[User submits "Schedule Meeting" form]
         |
         v
  status: "scheduled"
  scheduled_at: future timestamp
         |
         v (Host clicks "Start")
  status: "live"
  started_at: CURRENT_TIMESTAMP
         |
         v (Host clicks "End for All")
  status: "ended"
  ended_at: CURRENT_TIMESTAMP
```

---

## Query Logic for Dashboard

### Upcoming Meetings
```sql
SELECT * FROM meetings 
WHERE status = 'scheduled' 
  AND scheduled_at >= datetime('now', '-15 minutes')
ORDER BY scheduled_at ASC 
LIMIT 10;
```

### Recent Meetings
```sql
SELECT * FROM meetings 
WHERE status = 'ended' 
   OR (status = 'live' AND started_at <= datetime('now', '-2 hours'))
ORDER BY COALESCE(ended_at, started_at, created_at) DESC 
LIMIT 10;
```
