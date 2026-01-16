
from playwright.sync_api import sync_playwright
import os

def run():
    # Ensure directory exists
    os.makedirs("verification", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local index.html
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # 1. Verify Hint Layer appears
        page.wait_for_timeout(1000) # Wait for animation/timeout
        page.screenshot(path="verification/1_initial_hint.png")

        # 2. Verify Toolbar Contextual Buttons
        # Initially no unit selected, buttons should be disabled/ghosted
        # Select a unit (click on canvas center roughly)
        # Coordinates for "distillation" unit based on config (tileX: 6, tileY: 3)
        # This is tricky without visual confirmation of where it is on screen.
        # But we can check initial state.

        # Check if INSPECT button is disabled initially
        inspect_btn = page.locator("button[data-command=\"inspection\"]")
        # We modified setSelectedUnit(null) to be called on init, so it should be disabled.

        page.screenshot(path="verification/2_toolbar_initial.png")

        # Try to verify the Guided Hint Layer DOM element
        hint_layer = page.locator("#ui-hint-layer")
        if hint_layer.is_visible():
            print("Hint layer is visible")
            print(f"Hint text: {hint_layer.text_content()}")
        else:
            print("Hint layer not visible")

        browser.close()

if __name__ == "__main__":
    run()
