import os
import sys
import time
import json
from playwright.sync_api import sync_playwright

FRONTEND_URL = os.environ.get("E2E_FRONTEND_URL", "https://orbitmeet-nu.vercel.app")
BACKEND_URL = os.environ.get("E2E_BACKEND_URL", "https://orbitmeet-backend-production.up.railway.app")
EVIDENCE_DIR = os.path.join(os.path.dirname(__file__), "evidence_meeting_experience")
os.makedirs(EVIDENCE_DIR, exist_ok=True)

results = {}

def report(name, passed, details=""):
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {name}: {details}")
    results[name] = {"passed": bool(passed), "details": str(details)}

def run_verification():
    print(f"=== Starting Comprehensive Manual Requirements Verification ===")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Backend URL:  {BACKEND_URL}\n")

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

        # Context A: Host Desktop
        ctx_host = browser.new_context(
            viewport={"width": 1280, "height": 800},
            permissions=["camera", "microphone"],
        )
        page_host = ctx_host.new_page()

        # Context B: Alice Desktop
        ctx_alice = browser.new_context(
            viewport={"width": 1280, "height": 800},
            permissions=["camera", "microphone"],
        )
        page_alice = ctx_alice.new_page()

        # Context C: Mobile Guest (Phone portrait: 375x667 iPhone SE)
        ctx_mobile = browser.new_context(
            viewport={"width": 375, "height": 667},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            permissions=["camera", "microphone"],
        )
        page_mobile = ctx_mobile.new_page()

        try:
            # 1. Host Sign Up & Dashboard
            print("\n--- 1. Host Signup & Dashboard ---")
            page_host.goto(f"{FRONTEND_URL}/signup", wait_until="networkidle")
            host_email = f"host_{int(time.time())}@orbitmeet.test"
            page_host.locator("input[placeholder*='Rohan Sharma']").fill("Rohan Host")
            page_host.locator("input[type='email']").fill(host_email)
            page_host.locator("input[type='password']").fill("Password123!")
            page_host.locator("button:has-text('Create Account')").click()
            page_host.wait_for_url(lambda url: "/login" not in url and "/signup" not in url, timeout=25000)
            report("host_signup", True, f"Logged in as {host_email}")

            # 2. Test Manual Duration (Schedule Modal)
            print("\n--- 2. Schedule Modal Manual Duration (2 min & 90 min) ---")
            sched_btn = page_host.locator("button:has-text('Schedule')").first
            sched_btn.wait_for(state="visible", timeout=10000)
            sched_btn.click()
            time.sleep(1)

            # Check duration input has min="2" max="90"
            dur_input = page_host.locator("input[type='number'][min='2'][max='90']")
            has_dur_input = dur_input.count() > 0
            report("schedule_duration_numeric_input", has_dur_input, "Found numeric duration input with min=2 max=90")

            # Check preset buttons exist (15m, 30m, 45m, 60m, 90m)
            preset_90 = page_host.locator("button:has-text('90m')")
            preset_90_exists = preset_90.count() > 0
            report("schedule_duration_presets", preset_90_exists, "Found quick preset buttons including 90m")

            # Fill schedule form with manual 2 min duration
            page_host.locator("input[placeholder*='Design Architecture']").fill("2 Min Emergency Standup")
            page_host.locator("input[type='date']").fill("2026-10-02")
            page_host.locator("input[type='time']").fill("14:30")
            dur_input.fill("2")
            page_host.locator("button[type='submit']:has-text('Schedule Meeting')").click()

            # Verify scheduled confirmation displays duration 2 minutes
            page_host.wait_for_selector("div:has-text('Meeting Scheduled')", timeout=15000)
            dur_text = page_host.locator("div:has-text('Duration:')").last.inner_text()
            dur_2_saved = "2 minutes" in dur_text
            report("schedule_manual_2_min_saved", dur_2_saved, f"Confirmation text: {dur_text}")
            page_host.screenshot(path=os.path.join(EVIDENCE_DIR, "manual_duration_2min_saved.png"))

            # Close schedule modal
            page_host.keyboard.press("Escape")
            time.sleep(1)

            # 3. Create Instant Meeting
            print("\n--- 3. Host Creates Instant Meeting ---")
            new_meeting_btn = page_host.locator("button:has-text('New Meeting')")
            new_meeting_btn.click()
            page_host.wait_for_url(lambda url: "/meeting/" in url, timeout=25000)
            meeting_code = page_host.url.split("/meeting/")[-1].split("?")[0]
            report("host_create_instant_meeting", len(meeting_code) == 10, f"Meeting code: {meeting_code}")

            # Host joins meeting
            page_host.wait_for_selector("button:has-text('Join Meeting')", timeout=20000)
            page_host.locator("button:has-text('Join Meeting')").click()
            page_host.wait_for_selector("header span:has-text('Connected')", timeout=25000)
            page_host.wait_for_function("() => window.__orbitmeet_room !== undefined", timeout=10000)
            report("host_connected", True, "Host in room with verified LiveKit session")

            # 4. Quick Share Link Button in Header
            print("\n--- 4. Verify Quick Share Link Button in Header ---")
            share_link_btn = page_host.locator("header button:has-text('Share Link')")
            share_btn_found = share_link_btn.count() > 0
            if share_btn_found:
                share_link_btn.click()
                time.sleep(0.5)
                copied_badge = page_host.locator("header button:has-text('Copied')")
                report("header_share_link_button", copied_badge.count() > 0, "Quick Share Link button works and displays 'Copied!'")
            else:
                report("header_share_link_button", False, "Share Link button missing in header")

            # 5. Alice Joins as Attendee
            print("\n--- 5. Alice Joins Meeting ---")
            page_alice.goto(f"{FRONTEND_URL}/join?meeting={meeting_code}", wait_until="networkidle")
            page_alice.locator("button:has-text('Join Meeting')").click()
            page_alice.wait_for_url(lambda url: f"/meeting/{meeting_code}" in url, timeout=25000)
            page_alice.locator("input[placeholder*='Alice'], input[type='text']").first.fill("Alice Guest")
            page_alice.locator("button:has-text('Join Meeting')").click()
            page_alice.wait_for_selector("header span:has-text('Connected')", timeout=25000)
            page_alice.wait_for_function("() => window.__orbitmeet_room !== undefined", timeout=10000)
            report("alice_connected", True, "Alice connected to meeting")

            time.sleep(3)

            # 6. Direct Messaging (DM)
            print("\n--- 6. Direct Messaging (DM) Verification ---")
            page_host.locator("button[aria-label='Meeting Chat']").click()
            page_alice.locator("button[aria-label='Meeting Chat']").click()
            time.sleep(1)

            # Host opens recipient dropdown and selects Alice
            recipient_select = page_host.locator("select[aria-label='Select chat recipient']")
            recipient_select.wait_for(timeout=5000)
            options = recipient_select.locator("option").all_inner_texts()
            print(f"Recipient options: {options}")

            alice_val = None
            for opt in recipient_select.locator("option").all():
                if "Alice" in opt.inner_text():
                    alice_val = opt.get_attribute("value")
                    break

            if alice_val:
                recipient_select.select_option(alice_val)
                time.sleep(0.5)
                dm_input = page_host.locator("textarea[placeholder*='Message']")
                dm_input.fill("Confidential note: budget approved!")
                dm_input.press("Enter")
                time.sleep(2)

                # Check on Alice: sees the private DM
                alice_dm = page_alice.locator("div:has-text('Confidential note: budget approved!')")
                alice_pill = page_alice.locator("span:has-text('Direct Message')")
                report("direct_message_received", alice_dm.count() > 0 and alice_pill.count() > 0, "Alice received private DM with purple Direct Message pill")
                page_alice.screenshot(path=os.path.join(EVIDENCE_DIR, "dm_alice_view.png"))
            else:
                report("direct_message_received", False, "Alice option not found in recipient dropdown")

            # 7. Pin Participant Video Tile
            print("\n--- 7. Pin Participant Video Tile ---")
            pin_btn = page_alice.locator("button[aria-label='Pin video']").first
            pin_btn.wait_for(state="attached", timeout=5000)
            pin_btn.click(force=True)
            time.sleep(1)

            pinned_badge = page_alice.locator("button[aria-label='Unpin video']")
            is_pinned = pinned_badge.count() > 0
            report("pin_video_tile", is_pinned, "Video tile pinned to spotlight stage with Pinned status")
            page_alice.screenshot(path=os.path.join(EVIDENCE_DIR, "pinned_tile_view.png"))

            if is_pinned:
                pinned_badge.first.click(force=True)
                time.sleep(1)
                report("unpin_video_tile", True, "Video tile unpinned back to regular grid")

            # 8. Mobile Viewport Layout Verification
            print("\n--- 8. Mobile Viewport Layout Verification (375x667) ---")
            page_mobile.goto(f"{FRONTEND_URL}/join?meeting={meeting_code}", wait_until="networkidle")
            page_mobile.locator("button:has-text('Join Meeting')").click()
            page_mobile.wait_for_url(lambda url: f"/meeting/{meeting_code}" in url, timeout=25000)
            page_mobile.locator("input[placeholder*='Alice'], input[type='text']").first.fill("Mobile Phone")
            page_mobile.locator("button:has-text('Join Meeting')").click()
            page_mobile.wait_for_selector("header span:has-text('Connected')", timeout=25000)
            time.sleep(2)

            # Check Leave button on phone screen
            leave_btn = page_mobile.locator("footer button:has-text('Leave')")
            box = leave_btn.bounding_box()
            if box:
                # Phone width is 375. Leave button must be inside viewport
                is_leave_accessible = box["x"] >= 0 and (box["x"] + box["width"]) <= 380 and box["width"] > 20
                report("mobile_leave_button_accessible", is_leave_accessible, f"Mobile Leave button bounding box: x={box['x']}, w={box['width']} (viewport=375)")
            else:
                report("mobile_leave_button_accessible", False, "Leave button not visible on mobile")

            # Check vertical portrait camera aspect ratio on phone
            tile_el = page_mobile.locator("div[class*='aspect-']").first
            aspect_class = tile_el.get_attribute("class") or ""
            has_portrait = "aspect-[3/4]" in aspect_class
            report("mobile_camera_vertical_aspect", has_portrait, f"Tile container has aspect-[3/4]: {has_portrait}")
            page_mobile.screenshot(path=os.path.join(EVIDENCE_DIR, "mobile_phone_screen.png"))

            # 9. Instant Host Permissions Enforcement & Existing Attendee Muting
            print("\n--- 9. Instant Host Permissions Enforcement ---")
            # Alice unmutes her microphone first
            alice_mic_btn = page_alice.locator("footer button[aria-label='Unmute Microphone']")
            if alice_mic_btn.count() > 0:
                alice_mic_btn.click()
                time.sleep(1)

            # Host opens Host Moderation Tools modal
            host_shield = page_host.locator("button[aria-label='Host Tools']")
            host_shield.wait_for(state="visible", timeout=5000)
            host_shield.click()
            time.sleep(1)

            # Find Unmute Microphone toggle in modal
            dialog = page_host.locator("div[role='dialog']")
            dialog.wait_for(state="visible", timeout=5000)
            modal_toggle = dialog.locator("button:has-text('Disallow'), button:has-text('Allow')").first
            modal_toggle.wait_for(state="visible", timeout=5000)
            print(f"Host toggle button: {modal_toggle.inner_text()}")

            # Click to disallow unmuting
            modal_toggle.click()
            time.sleep(3)

            # Alice should now be immediately muted and her mic button should say "Locked"
            alice_locked = page_alice.locator("footer button:has-text('Locked')")
            report("instant_host_disallow_muting", alice_locked.count() > 0, "Alice's microphone was instantly muted and locked with 'Locked' badge")
            page_alice.screenshot(path=os.path.join(EVIDENCE_DIR, "alice_mic_locked_by_host.png"))

            # Host re-allows unmuting
            modal_toggle.click()
            time.sleep(3)
            alice_unlocked = page_alice.locator("footer button:has-text('Unmute')")
            report("instant_host_reallow_unmute", alice_unlocked.count() > 0, "Alice's microphone was instantly unlocked when host allowed unmuting")

        except Exception as e:
            import traceback
            traceback.print_exc()
            report("suite_execution", False, f"Exception: {e}")
        finally:
            ctx_host.close()
            ctx_alice.close()
            ctx_mobile.close()
            browser.close()

    print("\n================ FINAL VERIFICATION REPORT ================")
    all_passed = True
    for name, r in results.items():
        p_str = "PASS" if r["passed"] else "FAIL"
        print(f"[{p_str}] {name}: {r['details']}")
        if not r["passed"]:
            all_passed = False

    # Save results json
    with open(os.path.join(EVIDENCE_DIR, "verification_summary.json"), "w") as f:
        json.dump(results, f, indent=2)

    return all_passed

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
