# Task List: 004-meeting-experience

- [ ] Task 1: Backend schema migration & lock/permissions endpoints
  - [ ] 1.1 Add `is_locked`, `allow_participant_unmute`, `allow_participant_screen_share` to `Meeting` model and schemas
  - [ ] 1.2 Add SQLite safe column migration on startup
  - [ ] 1.3 Add lock, unlock, and permissions endpoints in `backend/app/routers/meetings.py`
  - [ ] 1.4 Enforce lock check in `POST /api/meetings/{code}/join`
  - [ ] 1.5 Add backend tests for lock/unlock and permissions

- [ ] Task 2: Realtime LiveKit Data Protocol & Chat
  - [ ] 2.1 Implement `realtimeProtocol.ts` with message validation
  - [ ] 2.2 Implement `ChatPanel.tsx` with auto-scroll, unread badge, and system events
  - [ ] 2.3 Wire chat send/receive in `MeetingRoom`

- [ ] Task 3: Reactions, Raise Hand & Enhanced Participants
  - [ ] 3.1 Implement Reactions bar with whitelist and timed tile overlays
  - [ ] 3.2 Implement Raise Hand / Lower Hand state and Host Lower Hand action
  - [ ] 3.3 Upgrade `ParticipantsPanel.tsx` with raised hand badges, screen share tags, and host actions

- [ ] Task 4: Host Tools, Device Selection & Meeting Info
  - [ ] 4.1 Implement Host Tools menu (Lock/Unlock, Mute All, Permissions)
  - [ ] 4.2 Implement Device Selection dropdown for mic and camera in `MeetingToolbar.tsx`
  - [ ] 4.3 Implement Meeting Info modal and More menu (Keyboard Shortcuts, Fullscreen)
  - [ ] 4.4 Add meeting elapsed timer in meeting header

- [ ] Task 5: Screen Share Presentation Mode & Verification
  - [ ] 5.1 Implement presentation layout when screen sharing is active
  - [ ] 5.2 Run backend pytest suite
  - [ ] 5.3 Run frontend lint, typecheck, and build
  - [ ] 5.4 Run dual-client E2E tests covering chat, reactions, raise hand, and meeting lock
