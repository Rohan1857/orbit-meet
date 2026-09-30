# Implementation Plan: 004-meeting-experience

## Architecture & Technology Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, `@livekit/components-react`, `livekit-client`, Lucide icons.
- **Backend**: FastAPI, SQLAlchemy, SQLite, Pydantic, LiveKit Python SDK.
- **Realtime Transport**: LiveKit Data Channel (`localParticipant.publishData`) with reliable delivery mode.

## Proposed Changes

### Backend
1. **Schema & Model**:
   - Add `is_locked`, `allow_participant_unmute`, `allow_participant_screen_share` to `meetings` table.
   - Dynamic SQLite migration in `app/database.py` on startup to ensure backwards compatibility.
   - Update `app/schemas/meeting.py` to include new fields.
2. **Endpoints**:
   - `POST /api/meetings/{meeting_code}/lock` (Owner only)
   - `POST /api/meetings/{meeting_code}/unlock` (Owner only)
   - `PATCH /api/meetings/{meeting_code}/permissions` (Owner only)
   - `POST /api/meetings/{meeting_code}/join`: Return HTTP 423 if `meeting.is_locked`.

### Frontend
1. **Realtime Protocol**:
   - Create `frontend/src/lib/realtimeProtocol.ts` with types and serializer/deserializer for `chat.message`, `reaction`, `hand.state`.
2. **In-Meeting Chat**:
   - Create `frontend/src/components/meeting/ChatPanel.tsx`.
   - Track messages, unread count badge, auto-scroll, system notifications.
3. **Reactions & Raise Hand**:
   - Add Reactions picker to toolbar (👍 👏 ❤️ 😂 🎉).
   - Temporary floating emoji badge on `ParticipantTile.tsx`.
   - Raise Hand state tracking and visual indicator on tile and in Participants list.
4. **Enhanced Participants Panel**:
   - Upgrade `ParticipantsPanel.tsx` with hand raise status, host lower hand action, search bar.
5. **Host Tools**:
   - Add Host Tools popover/modal in toolbar with Lock/Unlock, Mute All, Permissions toggles.
6. **Device Selection**:
   - Dropdown on Mic and Camera in toolbar using `navigator.mediaDevices.enumerateDevices()`.
7. **Screen Share Layout**:
   - Prioritize presentation view when screen sharing is active in `VideoGrid.tsx`.
8. **More Menu, Fullscreen, Timer**:
   - More menu with Meeting Info, Keyboard Shortcuts (`Alt + A`, `Alt + V`, `Alt + H`), and Fullscreen toggle.
   - Client-side timer in meeting header.
