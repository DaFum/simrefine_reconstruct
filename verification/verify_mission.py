from playwright.sync_api import sync_playwright

def verify_mission_mode():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080")

        # Wait for the Mission Control panel to load
        page.wait_for_selector("#directive-list")

        # Check if the title matches "Mission Control" or similar (we kept the directive-list ID but content changed)
        # We expect "Stabilization Protocol" as the title of the first mission
        page.wait_for_selector(".directive-title")

        # Take a screenshot
        page.screenshot(path="verification/mission_mode.png")
        print("Screenshot taken: verification/mission_mode.png")

        browser.close()

if __name__ == "__main__":
    verify_mission_mode()
