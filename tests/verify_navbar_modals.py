import time
from playwright.sync_api import sync_playwright

BASE_URL = "https://orbitmeet-nu.vercel.app"

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        
        # 1. Sign up test user to access Dashboard
        test_email = f"modal_test_{int(time.time())}@orbitmeet.test"
        print(f"Signing up test user {test_email}...")
        page.goto(f"{BASE_URL}/signup", wait_until="networkidle")
        page.fill('input[placeholder="Rohan Sharma"]', "Modal Tester")
        page.fill('input[placeholder="you@example.com"]', test_email)
        page.locator('input[type="password"]').fill("Password123!")
        page.click('button[type="submit"]')
        page.wait_for_url(f"{BASE_URL}/", timeout=15000)
        time.sleep(1)
        print("Logged in, currently on Dashboard:", page.url)
        
        # 2. Test Help Button
        help_btn = page.locator('button[aria-label="Help"]')
        assert help_btn.is_visible(), "Help button not found on Navbar"
        print("Found Help button on Navbar. Clicking...")
        help_btn.click()
        
        help_title = page.locator('text=Help & Conferencing Guide')
        help_title.wait_for(state="visible", timeout=5000)
        print("Help modal successfully opened.")
        
        # Verify shortcut content
        assert page.locator('text=Toggle Mute / Unmute').is_visible()
        assert page.locator('text=Start / Stop Camera').is_visible()
        assert page.locator('text=Toggle Screen Sharing').is_visible()
        assert page.locator('text=Alt + A').is_visible()
        print("Help modal shortcut content verified.")
        
        # Close Help modal using 'Got it'
        close_btn = page.locator('button:has-text("Got it")')
        close_btn.click()
        help_title.wait_for(state="hidden", timeout=5000)
        print("Help modal closed.")
        
        # 3. Test Settings Button
        settings_btn = page.locator('button[aria-label="Settings"]')
        assert settings_btn.is_visible(), "Settings button not found on Navbar"
        print("Found Settings button on Navbar. Clicking...")
        settings_btn.click()
        
        settings_title = page.locator('text=Application Settings')
        settings_title.wait_for(state="visible", timeout=5000)
        print("Settings modal successfully opened.")
        
        infra_text = page.locator('text=Live Infrastructure')
        assert infra_text.is_visible(), "Live Infrastructure section not found in settings"
        assert page.locator('text=LiveKit Cloud Online').is_visible()
        assert page.locator('text=Railway Production').is_visible()
        print("Settings infrastructure status verified.")
        
        # Verify preference toggles
        toggles = page.locator('input[type="checkbox"]')
        assert toggles.count() >= 2, "Expected preference toggles not found"
        print(f"Found {toggles.count()} preference toggles in Settings.")
        
        # Save Preferences
        save_btn = page.locator('button:has-text("Save Preferences")')
        save_btn.click()
        settings_title.wait_for(state="hidden", timeout=5000)
        print("Settings saved and modal closed.")
        
        # 4. Test Profile dropdown Help/Settings triggers
        user_menu_btn = page.locator('button:has-text("MT")')
        assert user_menu_btn.is_visible(), "User profile menu avatar not found"
        user_menu_btn.click()
        time.sleep(0.5)
        
        dropdown_help = page.locator('button:has-text("Help & Shortcuts")')
        assert dropdown_help.is_visible(), "Dropdown 'Help & Shortcuts' item not visible"
        dropdown_help.click()
        help_title.wait_for(state="visible", timeout=5000)
        print("Profile dropdown 'Help & Shortcuts' item opens Help modal successfully.")
        page.locator('button:has-text("Got it")').click()
        help_title.wait_for(state="hidden", timeout=5000)
        
        # Open Settings via dropdown
        user_menu_btn.click()
        time.sleep(0.5)
        dropdown_settings = page.locator('button:has-text("Settings")').last
        assert dropdown_settings.is_visible(), "Dropdown 'Settings' item not visible"
        dropdown_settings.click()
        settings_title.wait_for(state="visible", timeout=5000)
        print("Profile dropdown 'Settings' item opens Settings modal successfully.")
        page.locator('button:has-text("Cancel")').click()
        settings_title.wait_for(state="hidden", timeout=5000)
        
        browser.close()
        print("ALL_MODAL_TESTS_PASSED_ON_PRODUCTION")

if __name__ == "__main__":
    verify()
