# LiveKit Token & Media Contract: OrbitMeet

## 1. Token Authority & Generation Architecture

All LiveKit tokens are generated exclusively on the FastAPI backend using `livekit.api.AccessToken`.
Neither `LIVEKIT_API_KEY` nor `LIVEKIT_API_SECRET` is ever transmitted to or stored on the client.

```
Client (Pre-Join) 
   |
   | POST /api/meetings/{code}/join (name, role, optional host token)
   v
FastAPI Backend
   |-- 1. Validates meeting in SQLite
   |-- 2. Verifies host role against host_control_token (if claiming host)
   |-- 3. Inserts participant_sessions record
   |-- 4. Signs AccessToken using LIVEKIT_API_KEY & LIVEKIT_API_SECRET
   v
Client receives { token, livekit_url, participant_identity }
   |
   | Connects via wss://
   v
LiveKit Cloud SFU
```

---

## 2. Participant Identity Schema

To avoid collisions and enable predictable roles, participant identities follow this pattern:

- **Host**: `host_{normalized_name}_{random_hex_4}`
  - Example: `host_dhruv_a8f1`
- **Participant**: `user_{normalized_name}_{random_hex_4}`
  - Example: `user_ayan_9b2e`

---

## 3. Video Grant Configuration

### Regular Participant Grant
```python
grant = VideoGrants(
    room_join=True,
    room=meeting_code,
    can_publish=True,
    can_subscribe=True,
    can_publish_data=True,
    room_admin=False,
    room_record=False
)
```

### Host Grant
```python
grant = VideoGrants(
    room_join=True,
    room=meeting_code,
    can_publish=True,
    can_subscribe=True,
    can_publish_data=True,
    room_admin=True,
    room_record=False
)
```

- **TTL**: 6 hours (`ttl=timedelta(hours=6)`). Tokens are short-lived session authenticators.

---

## 4. Track Publishing Rules

- **Microphone**: Published as `Track.Source.Microphone` with audio constraints (echo cancellation, noise suppression).
- **Camera**: Published as `Track.Source.Camera` with 720p 30fps default capability.
- **Screen Share**: Published as `Track.Source.ScreenShare` with audio track if available.
- **Fallback**: When camera track is unmuted or unpublished, frontend components render fallback avatar tile with initials.
