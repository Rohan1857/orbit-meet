import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "https://orbitmeet-nu.vercel.app"
OUTPUT_DIR = "D:/zoom-clone/tests/visual_polish"
os.makedirs(OUTPUT_DIR, exist_ok=True)

viewports = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 1024, "height": 768},
    "mobile": {"width": 390, "height": 844, "is_mobile": True},
}

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

    for vp_name, vp_config in viewports.items():
        print(f"Capturing post-polish visuals for {vp_name}...")
        context = browser.new_context(
            viewport={"width": vp_config["width"], "height": vp_config["height"]},
            is_mobile=vp_config.get("is_mobile", False),
        )
        page = context.new_page()

        # 1. Login
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=f"{OUTPUT_DIR}/login_{vp_name}.png")

        # 2. Signup
        page.goto(f"{BASE_URL}/signup", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=f"{OUTPUT_DIR}/signup_{vp_name}.png")

        # 3. Join
        page.goto(f"{BASE_URL}/join", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=f"{OUTPUT_DIR}/join_{vp_name}.png")

        # 4. Authenticate & Dashboard
        email = f"polish_{int(time.time())}_{vp_name}@orbitmeet.test"
        page.goto(f"{BASE_URL}/signup", wait_until="networkidle")
        page.fill('input[placeholder="Rohan Sharma"]', f"Tester {vp_name}")
        page.fill('input[placeholder="you@example.com"]', email)
        page.locator('input[type="password"]').fill("Password123!")
        page.click('button[type="submit"]')
        page.wait_for_url(f"{BASE_URL}/", timeout=15000)
        time.sleep(2)
        page.screenshot(path=f"{OUTPUT_DIR}/dashboard_{vp_name}.png")

        # 5. Schedule modal/page
        page.goto(f"{BASE_URL}/schedule", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=f"{OUTPUT_DIR}/schedule_{vp_name}.png")

        # 6. Create instant meeting & capture PreJoin
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        time.sleep(1)
        page.locator('text=New Meeting').first.click()
        page.wait_for_url(lambda u: "/meeting/" in u, timeout=15000)
        time.sleep(3)
        page.screenshot(path=f"{OUTPUT_DIR}/prejoin_{vp_name}.png")

        # 7. Join meeting room
        page.click('button:has-text("Join Meeting")')
        time.sleep(4)
        page.screenshot(path=f"{OUTPUT_DIR}/meeting_room_{vp_name}.png")

        # 8. Open participants drawer
        try:
            drawer_btn = page.locator('button[title="Participants"]')
            if drawer_btn.is_visible():
                drawer_btn.click()
                time.sleep(1)
                page.screenshot(path=f"{OUTPUT_DIR}/participants_drawer_{vp_name}.png")
        except Exception as e:
            print("Drawer click failed:", e)

        context.close()
    browser.close()

print("Post-polish screenshots captured successfully.")
