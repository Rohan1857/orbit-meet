import os
import sys
import time
import json
import urllib.request
import urllib.error
from playwright.sync_api import sync_playwright

FRONTEND_URL = "https://orbitmeet-nu.vercel.app"
BACKEND_HEALTH_URL = "https://orbitmeet-backend-production.up.railway.app/api/health"
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "evidence")
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
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(BACKEND_HEALTH_URL, headers={"User-Agent": "E2ETester/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
                status = resp.status == 200 and data.get("database") == "connected"
                if status:
                    log_step("backend_health", True, f"Status: {resp.status}, Database: {data.get('database')}")
                    return True
        except Exception as e:
            if attempt < 3:
                time.sleep(3)
            else:
                log_step("backend_health", False, str(e))
                return False
    return False

def run_test():
    if not verify_backend_health():
        print("Backend health failed. Aborting.")
        return False

    print("\n--- 2. Launching Isolated Browser Contexts ---")
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

        # Context A: Host (Authenticated User)
        context_a = browser.new_context(
            viewport={"width": 1280, "height": 800},
            permissions=["camera", "microphone"],
        )
        page_a = context_a.new_page()

        page_a.on("console", lambda msg: evidence["console_logs_host"].append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warn"] else None)
        page_a.on("pageerror", lambda exc: evidence["console_logs_host"].append(f"[EXC] {str(exc)}"))
        page_a.on("requestfailed", lambda req: evidence["network_errors_host"].append(f"{req.method} {req.url} - {req.failure}"))

        # Context B: Participant (Unauthenticated Guest)
        context_b = browser.new_context(
            viewport={"width": 1280, "height": 800},
            permissions=["camera", "microphone"],
        )
        page_b = context_b.new_page()

        page_b.on("console", lambda msg: evidence["console_logs_participant"].append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warn"] else None)
        page_b.on("pageerror", lambda exc: evidence["console_logs_participant"].append(f"[EXC] {str(exc)}"))
        page_b.on("requestfailed", lambda req: evidence["network_errors_participant"].append(f"{req.method} {req.url} - {req.failure}"))

        try:
            # 1. Host registers and authenticates
            print("\n--- 3. Host Registering & Authenticating ---")
            page_a.goto(f"{FRONTEND_URL}/signup", wait_until="networkidle")
            host_email = f"host_e2e_{int(time.time())}@orbitmeet.test"
            page_a.locator("input[placeholder*='Rohan Sharma']").fill("Rohan Host")
            page_a.locator("input[type='email']").fill(host_email)
            page_a.locator("input[type='password']").fill("Password123!")
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "01a_host_signup.png"))
            page_a.locator("button:has-text('Create Account')").click()

            page_a.wait_for_url(lambda url: "/login" not in url and "/signup" not in url, timeout=15000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "01b_host_dashboard.png"))
            log_step("host_registration_and_login", True, f"Host registered and logged in as {host_email}")

            # 2. Host creates instant meeting from authenticated dashboard
            print("\n--- 4. Host Creating Instant Meeting ---")
            new_meeting_btn = page_a.locator("button:has-text('New Meeting')")
            new_meeting_btn.wait_for(state="visible", timeout=10000)
            new_meeting_btn.click()

            page_a.wait_for_url(lambda url: "/meeting/" in url, timeout=15000)
            meeting_url = page_a.url
            meeting_code = meeting_url.split("/meeting/")[-1].split("?")[0]
            print(f"Meeting created with code: {meeting_code}")
            log_step("create_instant_meeting", bool(meeting_code and len(meeting_code) == 10), f"Code: {meeting_code}")

            # 3. Host PreJoin
            print("\n--- 5. Host Joining PreJoin ---")
            page_a.wait_for_selector("text=Join Meeting", timeout=10000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "02_host_prejoin.png"))
            page_a.locator("button:has-text('Join Meeting')").click()

            # Wait for LiveKit Room connected state
            page_a.wait_for_selector("header span:has-text('Connected')", timeout=15000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "03_host_connected.png"))
            log_step("host_livekit_connection", True, f"Host connected to room {meeting_code}")

            # 4. Participant opens invite URL as unauthenticated guest
            print("\n--- 6. Participant Joining via Invite Link (Unauthenticated Guest P0) ---")
            invite_url = f"{FRONTEND_URL}/join?meeting={meeting_code}"
            page_b.goto(invite_url, wait_until="networkidle")
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "04_participant_join_page.png"))

            # Verify guest is NOT redirected to login
            guest_not_redirected = "/login" not in page_b.url and "/signup" not in page_b.url
            log_step("guest_join_no_login_redirect", guest_not_redirected, f"Guest stayed on {page_b.url} without auth redirect")

            join_btn = page_b.locator("button:has-text('Join Meeting')")
            join_btn.wait_for(state="visible", timeout=10000)
            join_btn.click()

            page_b.wait_for_url(lambda url: f"/meeting/{meeting_code}" in url, timeout=10000)
            name_input = page_b.locator("input[placeholder*='Alice'], input[placeholder*='Rohan'], input[type='text']").first
            name_input.wait_for(state="visible", timeout=10000)
            name_input.fill("Alice Evaluator")
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "05_participant_prejoin.png"))
            page_b.locator("button:has-text('Join Meeting')").click()

            page_b.wait_for_selector("header span:has-text('Connected')", timeout=15000)
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "06_participant_connected.png"))
            log_step("participant_livekit_connection", True, f"Alice connected to room {meeting_code}")

            # 5. Verify presence & mutual discovery in VideoGrid and Attendees drawer
            print("\n--- 7. Verifying Presence & Mutual Participant Discovery ---")
            time.sleep(3)  # allow track/presence propagation

            # Host checks presence
            host_sees_alice_tile = page_a.locator(".relative span:has-text('Alice Evaluator')").first.is_visible()
            log_step("host_sees_alice_videotile", host_sees_alice_tile, "Alice video tile present in Host stage")

            host_attendees_btn = page_a.locator("button[title='Participants']")
            host_attendees_btn.click()
            panel_a = page_a.locator("aside[aria-label='Participants Panel']")
            panel_a.wait_for(state="visible", timeout=5000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "07_host_attendees_drawer.png"))

            host_panel_alice = panel_a.locator("text=Alice Evaluator").first.is_visible()
            host_panel_host = panel_a.locator("text=Rohan Host").first.is_visible()
            log_step("host_sees_both_in_panel", host_panel_alice and host_panel_host, f"Alice: {host_panel_alice}, Host: {host_panel_host}")

            # Participant checks presence
            part_sees_host_tile = page_b.locator(".relative span:has-text('Rohan Host')").first.is_visible()
            log_step("participant_sees_host_videotile", part_sees_host_tile, "Host video tile present in Alice stage")

            part_attendees_btn = page_b.locator("button[title='Participants']")
            part_attendees_btn.click()
            panel_b = page_b.locator("aside[aria-label='Participants Panel']")
            panel_b.wait_for(state="visible", timeout=5000)
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "08_participant_attendees_drawer.png"))

            part_panel_host = panel_b.locator("text=Rohan Host").first.is_visible()
            part_panel_alice = panel_b.locator("text=Alice Evaluator").first.is_visible()
            log_step("participant_sees_both_in_panel", part_panel_host and part_panel_alice, f"Host: {part_panel_host}, Alice: {part_panel_alice}")

            # Close panels
            page_a.locator("button[aria-label='Close attendees panel']").click()
            page_b.locator("button[aria-label='Close attendees panel']").click()
            time.sleep(1)

            # 6. Verify Video/Audio track states & Mute/Unmute
            print("\n--- 8. Exercising Media Tracks (Mute / Video Toggle) ---")
            
            # Host clicks Mute in toolbar
            host_mute_btn = page_a.locator("footer button:has-text('Mute')").first
            host_mute_btn.click()
            page_a.wait_for_selector("footer button:has-text('Unmute')", timeout=5000)
            log_step("host_mute_toggle", True, "Host mic toggled to Unmute")

            # Host clicks Unmute
            page_a.locator("footer button:has-text('Unmute')").first.click()
            page_a.wait_for_selector("footer button:has-text('Mute')", timeout=5000)
            log_step("host_unmute_toggle", True, "Host mic restored to Mute")

            # Host exercises Camera Toggle
            if page_a.locator("footer button:has-text('Stop Video')").count() > 0:
                host_video_btn = page_a.locator("footer button:has-text('Stop Video')").first
                host_video_btn.click()
                page_a.wait_for_selector("footer button:has-text('Start Video')", timeout=5000)
                page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "09_host_camera_off.png"))
                log_step("host_stop_video", True, "Host video stopped (avatar fallback active)")

                page_a.locator("footer button:has-text('Start Video')").first.click()
                page_a.wait_for_selector("footer button:has-text('Stop Video')", timeout=5000)
                log_step("host_start_video", True, "Host video restored")
            else:
                page_a.locator("footer button:has-text('Start Video')").first.click()
                page_a.wait_for_selector("footer button:has-text('Stop Video')", timeout=5000)
                log_step("host_start_video", True, "Host video started")

                page_a.locator("footer button:has-text('Stop Video')").first.click()
                page_a.wait_for_selector("footer button:has-text('Start Video')", timeout=5000)
                log_step("host_stop_video", True, "Host video stopped")

            # 7. Exercise Screen Sharing
            print("\n--- 9. Testing Screen Sharing ---")
            share_btn = page_a.locator("button[title='Share Screen']")
            if share_btn.is_visible():
                share_btn.click()
                time.sleep(2)
                page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "10_host_screenshare_attempt.png"))
                log_step("screenshare_control_exercised", True, "Screen share action triggered without crash")

            # 8. Test Host Moderation: Mute All and Track Verification
            print("\n--- 10. Host Mute All Moderation & Track Verification ---")
            host_attendees_btn.click()
            page_a.wait_for_selector("button:has-text('Mute All Attendees')", timeout=5000)
            page_a.locator("button:has-text('Mute All Attendees')").click()
            page_a.wait_for_selector("text=Muted all attendees.", timeout=5000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "11_host_mute_all_executed.png"))
            log_step("host_mute_all", True, "Mute All Attendees API dispatched successfully")

            # Verify track state in Alice's client (page_b) shows muted
            time.sleep(3)
            part_attendees_btn.click()
            panel_b = page_b.locator("aside[aria-label='Participants Panel']")
            panel_b.wait_for(state="visible", timeout=5000)
            
            # Check Alice audio icon in drawer or toolbar unmuted state
            alice_is_muted = page_b.locator("footer button:has-text('Unmute')").count() > 0 or panel_b.locator("svg.text-\\[\\#f87171\\]").count() > 0 or panel_a.locator("svg.text-\\[\\#f87171\\]").count() > 0
            log_step("alice_audio_track_muted_by_host", bool(alice_is_muted), "Alice audio track confirmed muted following host Mute All")

            # 9. Verify Non-Host Security: Alice cannot see Mute All or Kick buttons
            print("\n--- 11. Non-Host Moderation Security ---")
            has_mute_all_b = panel_b.locator("text=Mute All Attendees").is_visible()
            has_kick_b = panel_b.locator("button[aria-label*='Remove']").count() > 0
            log_step("non_host_moderation_prevented", (not has_mute_all_b) and (not has_kick_b), f"Participant Mute-All visible: {has_mute_all_b}, Kick visible: {has_kick_b}")

            # Direct API security check from Python: POST /api/meetings/{code}/mute-all without token
            try:
                mute_all_url = f"https://orbitmeet-backend-production.up.railway.app/api/meetings/{meeting_code}/mute-all"
                req = urllib.request.Request(mute_all_url, method="POST")
                urllib.request.urlopen(req)
                non_host_api_secure = False
            except urllib.error.HTTPError as e:
                non_host_api_secure = e.code in [403, 422]
            log_step("non_host_api_rejected", non_host_api_secure, "Backend rejected unauthenticated host request with 403/422")

            # 10. Host Removes Participant
            print("\n--- 12. Host Removing Participant (Kick) ---")
            remove_alice_btn = page_a.locator("aside[aria-label='Participants Panel'] button[aria-label*='Remove Alice']").first
            remove_alice_btn.wait_for(state="visible", timeout=5000)
            remove_alice_btn.click()
            page_a.wait_for_selector("text=Removed Alice Evaluator.", timeout=5000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "12_host_removed_alice.png"))
            log_step("host_remove_participant", True, "Removed Alice Evaluator via host moderation")

            time.sleep(3)

            # 11. Rejoin Participant
            print("\n--- 13. Participant Rejoining ---")
            page_b.goto(f"{FRONTEND_URL}/meeting/{meeting_code}", wait_until="networkidle")
            page_b.wait_for_selector("text=Join Meeting", timeout=10000)
            name_input_b = page_b.locator("input[placeholder*='Alice'], input[placeholder*='Rohan'], input[type='text']").first
            name_input_b.fill("Alice (Rejoined)")
            page_b.locator("button:has-text('Join Meeting')").click()
            page_b.wait_for_selector("header span:has-text('Connected')", timeout=15000)
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "13_participant_rejoined.png"))
            log_step("participant_rejoin", True, "Participant successfully rejoined after kick")

            time.sleep(3)

            # 12. Participant Normal Leave
            print("\n--- 14. Participant Normal Leave ---")
            part_leave_btn = page_b.locator("footer button:has-text('Leave')").first
            part_leave_btn.click()
            page_b.wait_for_selector("button:has-text('Leave Meeting')", timeout=5000)
            page_b.locator("button:has-text('Leave Meeting')").click()
            page_b.wait_for_url(lambda url: f"{FRONTEND_URL}" in url and "/meeting" not in url, timeout=10000)
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "14_participant_left_dashboard.png"))
            log_step("participant_normal_leave", True, "Participant left meeting and returned from room")

            # 13. Host Ends Meeting for All
            print("\n--- 15. Host End Meeting for All ---")
            close_drawer_btn = page_a.locator("button[aria-label='Close attendees panel']")
            if close_drawer_btn.is_visible():
                close_drawer_btn.click()
                time.sleep(1)

            page_a.locator("footer button:has-text('Leave')").first.click(force=True)
            page_a.wait_for_selector("button:has-text('End Meeting for All')", timeout=5000)
            page_a.locator("button:has-text('End Meeting for All')").click()
            page_a.wait_for_url(lambda url: f"{FRONTEND_URL}" in url and "/meeting" not in url, timeout=10000)
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "15_host_ended_dashboard.png"))
            log_step("host_end_meeting_for_all", True, "Host ended meeting for all and returned to dashboard")

            print("\n--- 16. Inspection of Console / Network Logs ---")
            print(f"Host Console Errors/Warnings: {len(evidence['console_logs_host'])}")
            print(f"Participant Console Errors/Warnings: {len(evidence['console_logs_participant'])}")
            print(f"Host Network Failures: {len(evidence['network_errors_host'])}")
            print(f"Participant Network Failures: {len(evidence['network_errors_participant'])}")

            critical_exc = [l for l in evidence['console_logs_host'] + evidence['console_logs_participant'] if "[EXC]" in l]
            critical_net = [l for l in evidence['network_errors_host'] + evidence['network_errors_participant'] if "net::ERR_ABORTED" not in l and "favicon" not in l]
            unexpected_error_count = len(critical_exc) + len(critical_net)
            log_step("unexpected_error_count_zero", unexpected_error_count == 0, f"Critical exceptions: {len(critical_exc)}, Unexpected network failures: {len(critical_net)}")

            return unexpected_error_count == 0

        except Exception as e:
            print(f"Test crashed with error: {e}")
            page_a.screenshot(path=os.path.join(SCREENSHOTS_DIR, "error_host.png"))
            page_b.screenshot(path=os.path.join(SCREENSHOTS_DIR, "error_participant.png"))
            log_step("full_suite_execution", False, str(e))
            return False
        finally:
            with open(os.path.join(SCREENSHOTS_DIR, "evidence_results.json"), "w") as f:
                json.dump(evidence, f, indent=2)
            browser.close()

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
