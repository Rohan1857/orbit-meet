# REST API Interface Contract: OrbitMeet

Base URL: `http://localhost:8000/api` (dev) / `https://<backend-domain>/api` (prod)

---

## 1. System Health

### `GET /health`
- **Description**: Verifies service liveness and database connectivity.
- **Request**: No body.
- **Response 200**:
```json
{
  "status": "ok",
  "database": "connected",
  "environment": "development",
  "time": "2026-09-29T23:25:00Z"
}
```

---

## 2. Meeting Lifecycle

### `POST /meetings/instant`
- **Description**: Creates a new instant live meeting.
- **Request Body**:
```json
{
  "host_name": "Rohan",
  "title": "Rohan's Meeting"
}
```
- **Response 201**:
```json
{
  "meeting_id": 1,
  "meeting_code": "8231946621",
  "title": "Rohan's Meeting",
  "status": "live",
  "meeting_type": "instant",
  "host_name": "Rohan",
  "host_control_token": "a4f89b12c7e0481283e7481f9b31d041",
  "invite_url": "http://localhost:3000/join?meeting=8231946621",
  "created_at": "2026-09-29T23:25:00Z"
}
```

---

### `POST /meetings`
- **Description**: Schedules a meeting for future date/time.
- **Request Body**:
```json
{
  "title": "Quarterly Planning Sync",
  "description": "Roadmap and milestones review",
  "scheduled_at": "2026-10-02T15:00:00Z",
  "duration_minutes": 45,
  "host_name": "Rohan"
}
```
- **Validation**:
  - `title`: String, min 3 chars, max 255.
  - `scheduled_at`: ISO 8601 string, must be in the future.
  - `duration_minutes`: Integer, 15 <= value <= 480.
- **Response 201**:
```json
{
  "meeting_id": 2,
  "meeting_code": "4918203719",
  "title": "Quarterly Planning Sync",
  "description": "Roadmap and milestones review",
  "status": "scheduled",
  "meeting_type": "scheduled",
  "scheduled_at": "2026-10-02T15:00:00Z",
  "duration_minutes": 45,
  "host_name": "Rohan",
  "host_control_token": "c71e9a3b821045f0918ef014a51e6042",
  "invite_url": "http://localhost:3000/join?meeting=4918203719",
  "created_at": "2026-09-29T23:25:00Z"
}
```

---

### `GET /meetings/{meeting_code}`
- **Description**: Validates meeting existence and returns metadata.
- **Path Parameter**: `meeting_code` (10 digits).
- **Response 200**:
```json
{
  "meeting_code": "8231946621",
  "title": "Rohan's Meeting",
  "description": null,
  "host_name": "Rohan",
  "status": "live",
  "meeting_type": "instant",
  "scheduled_at": null,
  "duration_minutes": 45,
  "created_at": "2026-09-29T23:25:00Z"
}
```
- **Response 404**:
```json
{
  "detail": "Meeting not found"
}
```

---

### `GET /meetings?filter={upcoming|recent}`
- **Description**: Queries meetings by filter for dashboard panels.
- **Query Parameter**:
  - `filter`: `upcoming` (sorted ascending by `scheduled_at`), `recent` (sorted descending by `ended_at`/`started_at`).
  - `limit`: Integer, default 10, max 50.
- **Response 200**: Array of meeting summary objects.

---

## 3. Join & Room Media Token

### `POST /meetings/{meeting_code}/join`
- **Description**: Registers participant session in SQLite and issues a signed LiveKit JWT.
- **Headers**:
  - `X-Host-Token`: (Optional) Host control secret if joining as host.
- **Request Body**:
```json
{
  "display_name": "Ayan",
  "role": "participant"
}
```
- **Response 200**:
```json
{
  "meeting_code": "8231946621",
  "title": "Rohan's Meeting",
  "participant_identity": "part_ayan_83ab1",
  "display_name": "Ayan",
  "role": "participant",
  "token": "eyJhbGciOi...",
  "livekit_url": "wss://orbitmeet.livekit.cloud"
}
```

---

### `POST /meetings/{meeting_code}/leave`
- **Description**: Records participant departure in SQLite session history.
- **Request Body**:
```json
{
  "participant_identity": "part_ayan_83ab1"
}
```
- **Response 200**:
```json
{
  "status": "recorded"
}
```

---

## 4. Host Moderation Endpoints

All endpoints in this group require the `X-Host-Token` header matching `meetings.host_control_token`. Returns `403 Forbidden` if missing or invalid.

### `POST /meetings/{meeting_code}/end`
- **Description**: Concludes meeting, marks status `ended` in SQLite, closes LiveKit room.
- **Response 200**:
```json
{
  "status": "ended",
  "meeting_code": "8231946621"
}
```

### `DELETE /meetings/{meeting_code}/participants/{identity}`
- **Description**: Kicks a participant from the LiveKit room and records departure.
- **Response 200**:
```json
{
  "status": "removed",
  "identity": "part_ayan_83ab1"
}
```

### `POST /meetings/{meeting_code}/participants/{identity}/mute`
- **Description**: Server-side mutes an individual participant's audio track via LiveKit.
- **Response 200**:
```json
{
  "status": "muted",
  "identity": "part_ayan_83ab1"
}
```

### `POST /meetings/{meeting_code}/mute-all`
- **Description**: Mutes audio for all non-host attendees in the active room.
- **Response 200**:
```json
{
  "status": "muted_all",
  "muted_count": 3
}
```
