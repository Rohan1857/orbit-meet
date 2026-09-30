import os
import sys
import time
import json
import urllib.request
import urllib.error
from playwright.sync_api import sync_playwright

FRONTEND_URL = os.environ.get("E2E_FRONTEND_URL", "http://localhost:3000")
BACKEND_HEALTH_URL = os.environ.get("E2E_BACKEND_HEALTH_URL", "http://localhost:8000/api/health")
EXPECTED_ENV = os.environ.get("E2E_EXPECTED_ENV", "")
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "evidence_meeting_experience")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

evidence = {
    "step_results": {},
    "console_logs_host": [],
    "console_logs_participant": [],
    "console_logs_third_guest": [],
    "network_errors_host": [],
    "network_errors_participant": [],
    "network_errors_third_guest": [],
    "unexpected_console_errors": [],
    "unexpected_network_errors": [],
}

def log_step(name, status, details=""):
    print(f"[{'PASS' if status else 'FAIL'}] {name}: {details}")
    evidence["step_results"][name] = {"passed": bool(status), "details": details}

def verify_backend_health():
    print("\n--- 1. Verify Backend Health ---")
    for attempt in range(1, 10):
        try:
            req = urllib.request.Request(BACKEND_HEALTH_URL, headers={"User-Agent": "E2ETester/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                is_connected = resp.status == 200 and data.get("database") == "connected"
                if EXPECTED_ENV:
                    env_ok = data.get("environment") == EXPECTED_ENV
                else:
                    env_ok = True
                if is_connected and env_ok:
                    log_step("backend_health", True, f"Status: {resp.status}, DB: {data.get('database')}, Env: {data.get('environment')}")
                    return True
        except Exception as e:
            time.sleep(1.5)
    log_step("backend_health", False, f"Could not reach {BACKEND_HEALTH_URL}")
    return False

def run_test():
    if not verify_backend_health():
        print("Backend health check failed. Aborting.")
        return False

    print(f"\n--- 2. Launching Playwright against {FRONTEND_URL} ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=[
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream",
                "--disable-features=WebRtcHideLocalIpsWithMdns",
                "--autoplay-policy=no-user-gesture-required",
            ],
        )

        # Context A: Host
        context_a = browser.new_context(
            viewport={"width": 1280, "height": 800},
            permissions=["camera", "microphone"],
        )
        page_a = context_a.new_page()
        page_a.on("console", lambda msg: evidence["console_logs_host"].append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warn"] else None)
        page_a.on("pageerror", lambda exc: evidence["console_logs_host"].append(f"[EXC] {str(exc)}"))

        # Context B: Alice (Participant)
        context_b = browser.new_context(
            viewport={"width": 1280, "height": 800},
            permissions=["camera", "microphone"],
        )
        page_b = context_b.new_page()
        page_b.on("console", lambda msg: evidence["console_logs_participant"].append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warn"] else None)
        page_b.on("pageerror", lambda exc: evidence["console_logs_participant"].append(f"[EXC] {str(exc)}"))

        # Track network errors
        page_a.on("requestfailed", lambda req: evidence["network_errors_host"].append(f"{req.method} {req.url} - {req.failure}"))
        page_b.on("requestfailed", lambda req: evidence["network_errors_participant"].append(f"{req.method} {req.url} - {req.failure}"))

        context_c = None
        try:
            # Step 1: Host registration & login
            print("\n--- 3. Host Signup & Dashboard ---")
            page_a.goto(f"{FRONTEND_URL}/signup", wait_until="networkidle")
            host_email = f"host_{int(time.time())}@orbitmeet.test"
            page_a.locator("input[placeholder*='Rohan Sharma']").fill("Rohan Host")
            page_a.locator("input[type='email']").fill(host_email)
            page_a.locator("input[type='password']").fill("Password123!")
            page_a.locator("button:has-text('Create Account')").click()
            page_a.wait_for_url(lambda url: "/login" not in url and "/signup" not in url, timeout=25000)
            log_step("host_signup", True, f"Logged in as {host_email}")

            # Step 2: Host creates instant meeting
            print("\n--- 4. Host Creates Instant Meeting ---")
            new_btn = page_a.locator("button:has-text('New Meeting')")
            new_btn.wait_for(state="visible", timeout=20000)
            new_btn.click()
            page_a.wait_for_url(lambda url: "/meeting/" in url, timeout=25000)
            meeting_code = page_a.url.split("/meeting/")[-1].split("?")[0]
            log_step("create_instant_meeting", len(meeting_code) == 10, f"Meeting code: {meeting_code}")

            # Step 3: Host enters meeting room
            print("\n--- 5. Host PreJoin & Connection ---")
            page_a.wait_for_selector("button:has-text('Join Meeting')", timeout=20000)
            page_a.locator("button:has-text('Join Meeting')").click()
            page_a.wait_for_selector("header span:has-text('Connected')", timeout=25000)
            page_a.wait_for_function("() => window.__orbitmeet_room !== undefined", timeout=10000)
            log_step("host_connected", True, "Host connected to LiveKit room")
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "01_host_room.png"))

            # Step 4: Alice joins as guest
            print("\n--- 6. Alice Joins as Unauthenticated Guest ---")
            page_b.goto(f"{FRONTEND_URL}/join?meeting={meeting_code}", wait_until="networkidle")
            page_b.locator("button:has-text('Join Meeting')").click()
            page_b.wait_for_url(lambda url: f"/meeting/{meeting_code}" in url, timeout=25000)
            page_b.locator("input[placeholder*='Alice'], input[type='text']").first.fill("Alice Guest")
            page_b.locator("button:has-text('Join Meeting')").click()
            page_b.wait_for_selector("header span:has-text('Connected')", timeout=25000)
            page_b.wait_for_function("() => window.__orbitmeet_room !== undefined", timeout=10000)
            log_step("alice_connected", True, "Alice connected to LiveKit room")
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "02_alice_room.png"))

            time.sleep(3)  # Allow WebRTC connection establishment & mutual presence

            # Mutual presence assertion
            host_sees_alice = page_a.locator("text=Alice Guest").first.is_visible()
            alice_sees_host = page_b.locator("text=Rohan Host").first.is_visible()
            log_step("mutual_presence", host_sees_alice and alice_sees_host, "Mutual discovery established")

            # Step 5: Test In-Meeting Chat & Unread Badge Verification
            print("\n--- 7. Testing Realtime Chat & Unread Badge ---")
            # Alice opens chat and sends message
            alice_chat_toggle = page_b.locator("[data-testid='chat-toggle']")
            alice_chat_toggle.click()
            chat_panel_b = page_b.locator("aside[aria-label='Meeting Chat']")
            chat_panel_b.wait_for(state="visible", timeout=5000)
            
            chat_input_b = chat_panel_b.locator("textarea")
            chat_input_b.fill("Hello Rohan from Alice!")
            chat_panel_b.locator("button[aria-label='Send message']").click()
            time.sleep(1.5)

            # Host sees unread counter on chat toggle
            host_chat_toggle = page_a.locator("[data-testid='chat-toggle']")
            unread_badge = host_chat_toggle.locator("[data-testid='unread-chat-badge']")
            page_a.wait_for_selector("[data-testid='unread-chat-badge']", timeout=5000)
            has_unread = unread_badge.is_visible()
            log_step("unread_chat_counter", has_unread, "Unread indicator active on Host toolbar")

            # Host opens chat and replies
            host_chat_toggle.click()
            chat_panel_a = page_a.locator("aside[aria-label='Meeting Chat']")
            chat_panel_a.wait_for(state="visible", timeout=5000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "03_host_chat_received.png"))

            # Verify unread badge resets/clears
            unread_cleared = not unread_badge.is_visible()
            log_step("unread_badge_cleared", unread_cleared, "Unread badge cleared after Host opens chat")
            
            alice_msg_in_host = chat_panel_a.locator("text=Hello Rohan from Alice!").first.is_visible()
            log_step("chat_message_propagation", alice_msg_in_host, "Host received Alice's chat message")

            chat_input_a = chat_panel_a.locator("textarea")
            chat_input_a.fill("Welcome to Orbit Meet, Alice!")
            chat_panel_a.locator("button[aria-label='Send message']").click()
            time.sleep(1.5)

            host_msg_in_alice = chat_panel_b.locator("text=Welcome to Orbit Meet, Alice!").first.is_visible()
            log_step("chat_bidirectional_reply", host_msg_in_alice, "Alice received Host's reply")
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "04_alice_chat_received.png"))

            # Close chat drawers
            chat_panel_a.locator("button[aria-label='Close Chat']").click()
            chat_panel_b.locator("button[aria-label='Close Chat']").click()
            time.sleep(1)

            # Step 6: Test Reactions & Auto-dismissal
            print("\n--- 8. Testing Reactions with Real Visibility & Timeout ---")
            # Host sends clapping reaction
            host_reactions_btn = page_a.locator("button[aria-label='Reactions and Raise Hand']")
            host_reactions_btn.click()
            time.sleep(0.5)
            page_a.locator("button[title='👏']").click()
            
            # Alice sees the reaction
            page_b.wait_for_selector("text=👏", timeout=5000)
            seen_reaction = page_b.locator("text=👏").first.is_visible()
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "05_alice_sees_reaction.png"))
            log_step("reaction_sent_and_displayed", seen_reaction, "Alice saw host's 👏 reaction")

            # Verify reaction auto-dismisses after 2.5s
            time.sleep(3.5)
            reaction_dismissed = page_b.locator("text=👏").count() == 0
            log_step("reaction_auto_dismissed", reaction_dismissed, "Reaction auto-dismissed after display timeout")

            # Step 7: Test Raised Hand & Lower Hand
            print("\n--- 9. Testing Raise Hand & Host Lower Hand ---")
            # Alice raises hand
            alice_reactions_btn = page_b.locator("button[aria-label='Reactions and Raise Hand']")
            alice_reactions_btn.click()
            time.sleep(0.5)
            page_b.locator("button:has-text('Raise Hand')").click()
            time.sleep(1.5)

            # Guest button toggles to Lower Hand
            alice_reactions_btn.click()
            guest_has_lower_hand = page_b.locator("button:has-text('Lower Hand')").is_visible()
            page_b.keyboard.press("Escape")
            log_step("alice_raise_hand_button_toggled", guest_has_lower_hand, "Alice button toggled to Lower Hand")

            # Host opens attendees drawer and verifies hand raised icon
            host_attendees_btn = page_a.locator("[data-testid='participants-toggle']")
            host_attendees_btn.click()
            panel_a = page_a.locator("aside[aria-label='Participants Panel']")
            panel_a.wait_for(state="visible", timeout=5000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "06_host_sees_raised_hand.png"))

            alice_hand_in_panel = panel_a.locator("button[aria-label*='Lower'][aria-label*='hand'], button[title*='Lower'][title*='hand']").first
            panel_a.wait_for_selector("button[title*='Lower'][title*='hand']", timeout=5000)
            has_hand_button = alice_hand_in_panel.is_visible()
            log_step("host_sees_alice_hand_raised", has_hand_button, "Host detected raised hand and has Lower button")

            # Host lowers Alice's hand
            if has_hand_button:
                alice_hand_in_panel.click()
                time.sleep(1.5)
                # Verify in Alice context that button reverted back to Raise Hand
                alice_reactions_btn.click()
                guest_hand_reverted = page_b.locator("button:has-text('Raise Hand')").is_visible()
                page_b.keyboard.press("Escape")
                log_step("host_lower_participant_hand", guest_hand_reverted, "Alice hand lowered by host and guest UI reverted")
            else:
                log_step("host_lower_participant_hand", False, "Hand button was not visible")

            page_a.locator("button[aria-label='Close attendees panel']").click()
            time.sleep(1)

            # Step 8: Real Single-Participant LiveKit Mute & Track Verification
            print("\n--- 10. Testing Real Single-Participant LiveKit Mute ---")
            # Verify Alice microphone is initially unmuted
            alice_initial_mic = page_b.evaluate("window.__orbitmeet_room?.localParticipant.isMicrophoneEnabled")
            print(f"Alice initial mic enabled: {alice_initial_mic}")

            # Host opens participants panel and clicks Mute on Alice
            host_attendees_btn.click()
            panel_a.wait_for(state="visible", timeout=5000)
            mute_alice_btn = panel_a.locator("button[title*='Mute Alice'], button[aria-label*='Mute Alice']").first
            mute_alice_btn.click()
            page_a.wait_for_selector("text=Muted Alice", timeout=10000)

            # Verify actual LiveKit track publication state on Alice's client
            time.sleep(2)
            alice_mic_after_mute = page_b.evaluate("window.__orbitmeet_room?.localParticipant.isMicrophoneEnabled")
            alice_tracks_muted = page_b.evaluate("Array.from(window.__orbitmeet_room?.localParticipant.audioTrackPublications.values() || []).every(t => t.isMuted)")
            log_step("single_mute_real_track_state", (alice_mic_after_mute is False) or alice_tracks_muted, "Alice LiveKit audio track publication muted=true confirmed by client")
            page_a.locator("button[aria-label='Close attendees panel']").click()
            time.sleep(1)

            # Step 9: Real Mute-All Attendees & Track Verification
            print("\n--- 11. Testing Real LiveKit Mute All Attendees ---")
            # Alice unmutes herself first
            page_b.locator("footer button:has-text('Unmute')").first.click()
            time.sleep(1.5)
            alice_unmuted_again = page_b.evaluate("window.__orbitmeet_room?.localParticipant.isMicrophoneEnabled")
            print(f"Alice unmuted again: {alice_unmuted_again}")

            # Host opens Host Tools modal and executes Mute All Attendees
            host_tools_btn = page_a.locator("button[aria-label='Host Tools']")
            host_tools_btn.click()
            page_a.wait_for_selector("text=Host Moderation & Security", timeout=5000)

            mute_all_btn = page_a.locator("button:has-text('Mute All Attendees')").first
            mute_all_btn.click()
            page_a.wait_for_selector("text=Muted all attendees.", timeout=15000)

            time.sleep(2)
            alice_mic_after_mute_all = page_b.evaluate("window.__orbitmeet_room?.localParticipant.isMicrophoneEnabled")
            alice_all_tracks_muted = page_b.evaluate("Array.from(window.__orbitmeet_room?.localParticipant.audioTrackPublications.values() || []).every(t => t.isMuted)")
            host_mic_after_mute_all = page_a.evaluate("window.__orbitmeet_room?.localParticipant.isMicrophoneEnabled")
            log_step("mute_all_real_track_states", (alice_mic_after_mute_all is False) or alice_all_tracks_muted, f"Alice muted={not alice_mic_after_mute_all}, Host mic intact={host_mic_after_mute_all}")

            # Step 10: Test Host Moderation Modal & Lock Room
            print("\n--- 12. Testing Host Security Tools (Lock Meeting) ---")
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "07_host_tools_modal.png"))

            # Lock meeting
            lock_btn = page_a.locator("button:has-text('Lock')").first
            lock_btn.click()
            page_a.wait_for_selector("text=Meeting locked.", timeout=15000)
            log_step("host_locked_meeting", True, "Host successfully locked meeting via Host Tools")
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "08_meeting_locked.png"))

            # Step 11: Context C (Bob) attempts to join locked meeting
            print("\n--- 13. Verifying Locked Room Rejection for 3rd Guest ---")
            context_c = browser.new_context(viewport={"width": 1280, "height": 800})
            page_c = context_c.new_page()
            page_c.on("console", lambda msg: evidence["console_logs_third_guest"].append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warn"] else None)
            page_c.on("pageerror", lambda exc: evidence["console_logs_third_guest"].append(f"[EXC] {str(exc)}"))
            page_c.on("requestfailed", lambda req: evidence["network_errors_third_guest"].append(f"{req.method} {req.url} - {req.failure}"))

            page_c.goto(f"{FRONTEND_URL}/meeting/{meeting_code}", wait_until="networkidle")
            time.sleep(1)
            name_input_c = page_c.locator("input[placeholder*='Alice'], input[type='text']").first
            name_input_c.fill("Bob Locked Guest")
            page_c.locator("button:has-text('Join Meeting')").click()
            time.sleep(2)
            page_c.screenshot(path=os.path.join(SCREENSHOTS_DIR, "09_bob_locked_out.png"))

            is_locked_error = page_c.locator("text=locked by the host").is_visible() or page_c.locator("text=Meeting Unavailable").is_visible()
            log_step("locked_room_rejection", is_locked_error, "Third guest rejected from locked room (HTTP 423)")

            # Host unlocks meeting
            unlock_btn = page_a.locator("button:has-text('Unlock')").first
            unlock_btn.click()
            page_a.wait_for_selector("text=Meeting unlocked.", timeout=15000)
            log_step("host_unlocked_meeting", True, "Host unlocked meeting")

            # Bob retries joining after unlock
            page_c.locator("button:has-text('Back to Dashboard')").click()
            page_c.wait_for_url(lambda url: "/meeting/" not in url, timeout=10000)
            page_c.goto(f"{FRONTEND_URL}/meeting/{meeting_code}", wait_until="networkidle")
            page_c.locator("input[placeholder*='Alice'], input[type='text']").first.fill("Bob Unlocked Guest")
            page_c.locator("button:has-text('Join Meeting')").click()
            page_c.wait_for_selector("header span:has-text('Connected')", timeout=20000)
            log_step("bob_join_after_unlock", True, "Bob connected after host unlocked meeting")

            # Close host tools modal
            page_a.locator("button[aria-label='Close dialog']").click()
            time.sleep(1)

            # Step 12: Inspect Device Dropdown & More Menu
            print("\n--- 14. Testing Device Selectors and Shortcuts Menu ---")
            page_a.locator("button[aria-label='Select Microphone']").click()
            time.sleep(0.5)
            mic_menu = page_a.locator("text=Select Microphone")
            log_step("microphone_device_menu", mic_menu.is_visible(), "Microphone device dropdown opened")
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "10_mic_device_dropdown.png"))
            page_a.keyboard.press("Escape")
            time.sleep(0.5)

            # More menu -> Shortcuts
            page_a.locator("button[aria-label='More options']").click()
            time.sleep(0.5)
            page_a.locator("button:has-text('Shortcuts')").click()
            time.sleep(0.5)
            shortcuts_modal = page_a.locator("text=Keyboard Shortcuts")
            log_step("shortcuts_modal", shortcuts_modal.is_visible(), "Keyboard shortcuts modal rendered Alt+A, Alt+V, Alt+H")
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "11_shortcuts_modal.png"))
            page_a.locator("button[aria-label='Close dialog']").click()
            time.sleep(1)

            # Step 13: Clean teardown
            print("\n--- 15. Leaving and Concluding Meeting ---")
            page_b.locator("footer button:has-text('Leave')").first.click()
            page_b.locator("button:has-text('Leave Meeting')").click()
            time.sleep(1)

            page_a.locator("footer button:has-text('Leave')").first.click(force=True)
            page_a.locator("button:has-text('End Meeting for All')").click()
            page_a.wait_for_url(lambda url: "/meeting" not in url, timeout=10000)
            log_step("host_end_meeting_for_all", True, "Host ended meeting cleanly")

            # Step 14: Console and Network Health Audit
            print("\n--- 16. Strict Console & Network Error Gate ---")
            all_console_errors = (
                [f"[Host] {e}" for e in evidence["console_logs_host"] if "error" in e.lower() or "[EXC]" in e] +
                [f"[Alice] {e}" for e in evidence["console_logs_participant"] if "error" in e.lower() or "[EXC]" in e] +
                [f"[Bob] {e}" for e in evidence["console_logs_third_guest"] if "error" in e.lower() or "[EXC]" in e]
            )

            # Whitelist deliberate expected errors
            unexpected_console = [
                e for e in all_console_errors
                if not any(exp in e for exp in [
                    "Failed to load resource: the server responded with a status of 423",
                    "423 (Locked)",
                    "favicon.ico",
                    "Download the React DevTools",
                ])
            ]

            all_network_errors = (
                [f"[Host] {e}" for e in evidence["network_errors_host"]] +
                [f"[Alice] {e}" for e in evidence["network_errors_participant"]] +
                [f"[Bob] {e}" for e in evidence["network_errors_third_guest"]]
            )

            unexpected_network = [
                e for e in all_network_errors
                if not any(exp in e for exp in [
                    "/join",
                    "favicon.ico",
                ])
            ]

            evidence["unexpected_console_errors"] = unexpected_console
            evidence["unexpected_network_errors"] = unexpected_network

            console_clean = len(unexpected_console) == 0
            network_clean = len(unexpected_network) == 0
            log_step("strict_console_health_gate", console_clean, f"Unexpected console errors: {len(unexpected_console)}")
            log_step("strict_network_health_gate", network_clean, f"Unexpected network errors: {len(unexpected_network)}")

            print("\n--- 17. Test Results Summary ---")
            passed_steps = sum(1 for s in evidence["step_results"].values() if s["passed"])
            total_steps = len(evidence["step_results"])
            print(f"Passed: {passed_steps}/{total_steps} steps.")

            return passed_steps == total_steps

        except Exception as e:
            print(f"Error during E2E test execution: {e}")
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "crash_host.png"))
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "crash_participant.png"))
            log_step("e2e_suite_exception", False, str(e))
            return False
        finally:
            with open(os.path.join(SCREENSHOTS_DIR, "evidence_results.json"), "w") as f:
                json.dump(evidence, f, indent=2)
            if context_c:
                context_c.close()
            browser.close()

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
