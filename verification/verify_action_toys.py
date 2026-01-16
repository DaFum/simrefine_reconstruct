from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Serving current directory via python http server in background is needed
        # Assuming the environment has it running or I can start it.
        # Since I cannot start a background server easily within python script here without blocking
        # I will assume I can access file:// or I should start server in bash first.
        # But this environment is "plain HTML/CSS/JS", so local file access might work if no CORS issues.
        # However, modules require HTTP.
        # I will rely on "python3 -m http.server" being run in another step or just try to access localhost:8000
        # If I need to start it, I should do it in bash.

        page.goto("http://localhost:8000/index.html")

        # Wait for simulation to init
        page.wait_for_timeout(2000)

        # Trigger "Call Emergency Ship" (Road)
        # Check if button exists
        expedite_btn = page.locator("#logistics-expedite")
        if expedite_btn.is_visible():
            expedite_btn.click()
            print("Clicked Expedite")

        # Wait for visual effect (trucks)
        page.wait_for_timeout(2000)

        page.screenshot(path="verification/action_toys.png")
        print("Screenshot saved")

        browser.close()

if __name__ == "__main__":
    run()
