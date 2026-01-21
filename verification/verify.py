
from playwright.sync_api import sync_playwright

def verify_ui(page):
    # Go to the local server
    page.goto("http://localhost:3000")

    # Wait for the map to load (canvas element)
    page.wait_for_selector("#scene-container canvas")

    # Check accessibility: "Skip to content" link should exist (even if hidden)
    skip_link = page.locator(".skip-link")
    # It might be hidden until focused, but it should be in the DOM
    if skip_link.count() > 0:
        print("Skip link found")
    else:
        print("Skip link NOT found")

    # Check aria-label on pause button
    pause_btn = page.get_by_role("menuitem", name="Pause Simulation")
    if pause_btn.count() > 0:
        print("Pause button with aria-label found")
    else:
        print("Pause button NOT found or aria-label missing")

    # Take a screenshot
    page.screenshot(path="verification/ui_check.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_ui(page)
        finally:
            browser.close()
