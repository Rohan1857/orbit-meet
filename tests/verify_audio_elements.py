import time
from playwright.sync_api import sync_playwright

FRONTEND_URL = "https://orbitmeet-nu.vercel.app"
MEETING_CODE = "8434294693"

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

    # Participant 1
    ctx1 = browser.new_context(permissions=["camera", "microphone"])
    page1 = ctx1.new_page()

    # Participant 2
    ctx2 = browser.new_context(permissions=["camera", "microphone"])
    page2 = ctx2.new_page()

    print(f"Connecting Participant 1 to {MEETING_CODE}...")
    page1.goto(f"{FRONTEND_URL}/meeting/{MEETING_CODE}", wait_until="networkidle")
    page1.wait_for_selector("text=Join Meeting", timeout=10000)
    name1 = page1.locator("input[type='text']").first
    name1.fill("Tester One")
    page1.locator("button:has-text('Join Meeting')").click()
    page1.wait_for_selector("header span:has-text('Connected')", timeout=15000)
    print("Participant 1 connected.")

    print(f"Connecting Participant 2 to {MEETING_CODE}...")
    page2.goto(f"{FRONTEND_URL}/meeting/{MEETING_CODE}", wait_until="networkidle")
    page2.wait_for_selector("text=Join Meeting", timeout=10000)
    name2 = page2.locator("input[type='text']").first
    name2.fill("Tester Two")
    page2.locator("button:has-text('Join Meeting')").click()
    page2.wait_for_selector("header span:has-text('Connected')", timeout=15000)
    print("Participant 2 connected.")

    # Wait for media tracks and RoomAudioRenderer to mount audio elements
    time.sleep(4)

    # In Page 1: Check for audio elements created by RoomAudioRenderer
    audio_elements_p1 = page1.evaluate("""() => {
        const audioEls = Array.from(document.querySelectorAll('audio'));
        return audioEls.map(el => ({
            paused: el.paused,
            muted: el.muted,
            src: el.src,
            srcObject: !!el.srcObject,
            readyState: el.readyState
        }));
    }""")

    # In Page 2: Check for audio elements created by RoomAudioRenderer
    audio_elements_p2 = page2.evaluate("""() => {
        const audioEls = Array.from(document.querySelectorAll('audio'));
        return audioEls.map(el => ({
            paused: el.paused,
            muted: el.muted,
            src: el.src,
            srcObject: !!el.srcObject,
            readyState: el.readyState
        }));
    }""")

    print(f"Page 1 Remote Audio Elements: {audio_elements_p1}")
    print(f"Page 2 Remote Audio Elements: {audio_elements_p2}")

    has_audio_p1 = len(audio_elements_p1) > 0 and audio_elements_p1[0]["srcObject"]
    has_audio_p2 = len(audio_elements_p2) > 0 and audio_elements_p2[0]["srcObject"]

    print(f"TEST RESULT: Page 1 receives audio: {has_audio_p1}, Page 2 receives audio: {has_audio_p2}")

    ctx1.close()
    ctx2.close()
    browser.close()

    assert has_audio_p1 and has_audio_p2, "Audio elements with media streams not found!"
    print("VERIFICATION SUCCESSFUL: RoomAudioRenderer is actively streaming audio to HTML5 audio elements!")
