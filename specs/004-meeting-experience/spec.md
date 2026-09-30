# Feature Specification: 004-meeting-experience

## Overview
Transform the in-meeting conferencing room into a comprehensive, professional Zoom-grade conferencing interface.

## User Scenarios & Key Workflows
1. **In-Meeting Chat**: Participants exchange realtime text messages scoped to the active meeting. Chat panel shows sender, message, and timestamp. Unread count increments when closed and resets when opened. System events (join, leave, lock) render distinctly.
2. **Reactions**: Participants send floating emoji reactions (👍, 👏, ❤️, 😂, 🎉) that display over the participant's video tile and fade after 3 seconds.
3. **Raise Hand**: Participants toggle Raise/Lower Hand. Hand indicator surfaces in the video tile and participants list. Host can lower hand for any participant.
4. **Enhanced Participants Panel**: Lists all participants with host badge, mic/cam states, raised hand indicator, screen share indicator. Host sees moderation actions (Mute, Lower Hand, Remove).
5. **Meeting Info & Copy Invite**: Clean popover showing Meeting Title, 10-digit ID, Host Name, and formatted invite copy button.
6. **Host Tools**: Centralized host controls (Mute All, Lock/Unlock Meeting, Participant Permissions, End Meeting for All).
7. **Meeting Lock**: Host locks the meeting. Persisted in SQLite. Subsequent guest join requests receive a friendly "Meeting is locked by host" message. Unlock restores joining.
8. **Device Selection**: Dropdown attached to Mic and Camera controls allowing hardware input selection via Web MediaDevices API.
9. **Screen Share Layout**: When a participant shares screen, the presentation expands to fill the stage, reducing participant tiles to a compact strip.
10. **More Menu & Fullscreen**: Secondary controls menu containing Meeting Info, Keyboard Shortcuts, and Fullscreen toggle.
11. **Connection Status & Meeting Timer**: Unobtrusive connection indicator (Connected, Reconnecting) and client-derived elapsed meeting timer.

## Functional Requirements
- **FR-1**: LiveKit data channel protocol for realtime chat messages (`chat.message`), reactions (`reaction`), and hand raises (`hand.state`).
- **FR-2**: Chat composer with length limit, empty message rejection, Enter to send, Shift+Enter for newline.
- **FR-3**: Reaction whitelist strictly enforced: `['👍', '👏', '❤️', '😂', '🎉']`.
- **FR-4**: Backend API endpoints: `POST /api/meetings/{code}/lock`, `POST /api/meetings/{code}/unlock`, `PATCH /api/meetings/{code}/permissions`.
- **FR-5**: SQLite schema migration adding `is_locked`, `allow_participant_unmute`, `allow_participant_screen_share` to `meetings` table.
- **FR-6**: Public join endpoint (`GET /api/meetings/{code}` & `POST /api/meetings/{code}/join`) rejects join if `meeting.is_locked == True` with HTTP 423 / domain error.
- **FR-7**: Responsive sidebar system switching between Participants and Chat drawers (single active panel rule).
- **FR-8**: Mobile toolbar prioritizing high-frequency actions (Mic, Camera, Share, Participants, More, Leave).

## Success Criteria
- 100% of chat messages deliver between host and guest in under 300ms.
- Remote reactions appear on video tile within 200ms.
- Locked meetings block new entries while retaining active participants.
- Zero console exceptions and zero unexpected network errors.
- Visual QA passes across Desktop (1440×900), Tablet (1024×768), and Mobile (390×844).
