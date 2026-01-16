
from playwright.sync_api import sync_playwright
import os

def run():
    # Ensure directory exists
    os.makedirs("verification", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        # Load via http server
        page.goto("http://localhost:8080/index.html")

        page.wait_for_timeout(1000)

        hint_layer = page.locator("#ui-hint-layer")
        if hint_layer.count() > 0:
            print("Hint Layer Found")
            print(f"Text: {hint_layer.text_content()}")
            page.screenshot(path="verification/4_success.png")
        else:
            print("Hint Layer NOT Found")

        browser.close()

if __name__ == "__main__":
    run()
