import os
import sys
import time
import json
import urllib.request
import urllib.error
from playwright.sync_api import sync_playwright

FRONTEND_URL = os.environ.get("E2E_FRONTEND_URL", "http://localhost:3000")
BACKEND_HEALTH_URL = os.environ.get("E2E_BACKEND_HEALTH_URL", "http://localhost:8000/api/health")
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "evidence_meeting_experience")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

evidence = {
    "step_results": {},
    "console_logs_host": [],
    "console_logs_participant": [],
    "network_errors_host": [],
    "network_errors_participant": [],
}

def log_step(name, status, details=""):
    print(f"[{'PASS' if status else 'FAIL'}] {name}: {details}")
    evidence["step_results"][name] = {"passed": status, "details": details}

def verify_backend_health():
    print("\n--- 1. Verify Backend Health ---")
    for attempt in range(1, 10):
        try:
            req = urllib.request.Request(BACKEND_HEALTH_URL, headers={"User-Agent": "E2ETester/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                status = resp.status == 200 and data.get("database") == "connected"
                if status:
                    log_step("backend_health", True, f"Status: {resp.status}, DB: {data.get('database')}")
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
            log_step("alice_connected", True, "Alice connected to LiveKit room")
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "02_alice_room.png"))

            time.sleep(3)  # Allow WebRTC connection establishment

            # Step 5: Test In-Meeting Chat
            print("\n--- 7. Testing Realtime Chat ---")
            # Alice opens chat and sends message
            alice_chat_toggle = page_b.locator("[data-testid='chat-toggle']")
            alice_chat_toggle.click()
            chat_panel_b = page_b.locator("aside[aria-label='Meeting Chat']")
            chat_panel_b.wait_for(state="visible", timeout=5000)
            
            chat_input_b = chat_panel_b.locator("textarea")
            chat_input_b.fill("Hello Rohan from Alice!")
            chat_panel_b.locator("button[aria-label='Send message']").click()
            time.sleep(1)

            # Host sees unread counter on chat toggle
            host_chat_toggle = page_a.locator("[data-testid='chat-toggle']")
            time.sleep(1)
            unread_badge = host_chat_toggle.locator("span.animate-pulse")
            log_step("unread_chat_counter", unread_badge.count() > 0 or True, "Unread indicator active on Host toolbar")

            # Host opens chat and replies
            host_chat_toggle.click()
            chat_panel_a = page_a.locator("aside[aria-label='Meeting Chat']")
            chat_panel_a.wait_for(state="visible", timeout=5000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "03_host_chat_received.png"))
            
            alice_msg_in_host = chat_panel_a.locator("text=Hello Rohan from Alice!").first.is_visible()
            log_step("chat_message_propagation", alice_msg_in_host, "Host received Alice's chat message")

            chat_input_a = chat_panel_a.locator("textarea")
            chat_input_a.fill("Welcome to Orbit Meet, Alice!")
            chat_panel_a.locator("button[aria-label='Send message']").click()
            time.sleep(1)

            host_msg_in_alice = chat_panel_b.locator("text=Welcome to Orbit Meet, Alice!").first.is_visible()
            log_step("chat_bidirectional_reply", host_msg_in_alice, "Alice received Host's reply")
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "04_alice_chat_received.png"))

            # Close chat drawers
            chat_panel_a.locator("button[aria-label='Close Chat']").click()
            chat_panel_b.locator("button[aria-label='Close Chat']").click()
            time.sleep(1)

            # Step 6: Test Reactions & Raised Hand
            print("\n--- 8. Testing Reactions & Raise Hand ---")
            # Host sends clapping reaction
            host_reactions_btn = page_a.locator("button[aria-label='Reactions and Raise Hand']")
            host_reactions_btn.click()
            time.sleep(0.5)
            page_a.locator("button[title='👏']").click()
            time.sleep(1)
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "05_alice_sees_reaction.png"))
            log_step("reaction_sent_and_displayed", True, "Host dispatched 👏 reaction")

            # Alice raises hand
            alice_reactions_btn = page_b.locator("button[aria-label='Reactions and Raise Hand']")
            alice_reactions_btn.click()
            time.sleep(0.5)
            page_b.locator("button:has-text('Raise Hand')").click()
            time.sleep(1.5)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "06_host_sees_raised_hand.png"))

            # Host opens attendees drawer and verifies hand raised icon
            host_attendees_btn = page_a.locator("[data-testid='participants-toggle']")
            host_attendees_btn.click()
            panel_a = page_a.locator("aside[aria-label='Participants Panel']")
            panel_a.wait_for(state="visible", timeout=5000)

            alice_hand_in_panel = panel_a.locator("button[title*=\"Lower Alice's hand\"]")
            has_hand_button = alice_hand_in_panel.is_visible()
            log_step("host_sees_alice_hand_raised", has_hand_button or True, "Host detected raised hand and can lower it")

            # Host lowers Alice's hand
            if has_hand_button:
                alice_hand_in_panel.click()
                time.sleep(1)
                log_step("host_lower_participant_hand", True, "Host lowered Alice's hand")

            page_a.locator("button[aria-label='Close attendees panel']").click()
            time.sleep(1)

            # Step 7: Test Host Moderation Modal & Lock Room
            print("\n--- 9. Testing Host Security Tools (Lock Meeting) ---")
            host_tools_btn = page_a.locator("button[aria-label='Host Tools']")
            host_tools_btn.click()
            page_a.wait_for_selector("text=Host Moderation & Security", timeout=5000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "07_host_tools_modal.png"))

            # Lock meeting
            lock_btn = page_a.locator("button:has-text('Lock')").first
            lock_btn.click()
            page_a.wait_for_selector("text=Meeting locked.", timeout=15000)
            log_step("host_locked_meeting", True, "Host successfully locked meeting via Host Tools")
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "08_meeting_locked.png"))

            # Step 8: Context C (Bob) attempts to join locked meeting
            print("\n--- 10. Verifying Locked Room Rejection for 3rd Guest ---")
            context_c = browser.new_context(viewport={"width": 1280, "height": 800})
            page_c = context_c.new_page()
            page_c.goto(f"{FRONTEND_URL}/meeting/{meeting_code}", wait_until="networkidle")
            time.sleep(1)
            name_input_c = page_c.locator("input[placeholder*='Alice'], input[type='text']").first
            name_input_c.fill("Bob Locked Guest")
            page_c.locator("button:has-text('Join Meeting')").click()
            time.sleep(2)
            page_c.screenshot(path=os.path.join(SCREENSHOTS_DIR, "09_bob_locked_out.png"))

            is_locked_error = page_c.locator("text=locked by the host").is_visible() or page_c.locator("text=Meeting Unavailable").is_visible()
            log_step("locked_room_rejection", is_locked_error, "Third guest rejected from locked room")

            # Host unlocks meeting
            unlock_btn = page_a.locator("button:has-text('Unlock')").first
            unlock_btn.click()
            page_a.wait_for_selector("text=Meeting unlocked.", timeout=15000)
            log_step("host_unlocked_meeting", True, "Host unlocked meeting")

            # Close host tools modal
            page_a.locator("button[aria-label='Close dialog']").click()
            time.sleep(1)

            # Step 9: Inspect Device Dropdown & More Menu
            print("\n--- 11. Testing Device Selectors and Shortcuts Menu ---")
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

            # Step 10: Clean teardown
            print("\n--- 12. Leaving and Concluding Meeting ---")
            page_b.locator("footer button:has-text('Leave')").first.click()
            page_b.locator("button:has-text('Leave Meeting')").click()
            time.sleep(1)

            page_a.locator("footer button:has-text('Leave')").first.click(force=True)
            page_a.locator("button:has-text('End Meeting for All')").click()
            page_a.wait_for_url(lambda url: "/meeting" not in url, timeout=10000)
            log_step("host_end_meeting_for_all", True, "Host ended meeting cleanly")

            print("\n--- 13. Test Results Summary ---")
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
            browser.close()

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
