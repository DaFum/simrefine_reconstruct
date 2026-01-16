from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000/index.html")
        page.wait_for_timeout(2000)

        # Trigger Pipeline Bypass (PIPE)
        # 1. Select a unit (e.g. Reformer)
        # 2. Click "Deploy PIPE"

        # We need to click a unit first. Lets try clicking on the map.
        # But units are on canvas.
        # Alternatively, use "Select Unit" menu if available?
        # Or dispatch event manually?

        # Lets try to click a unit button if there is a shortcut or use the menu.
        # The menu bar has "Units".

        page.locator("#menu-bar button:has-text(\"Units\")").click()
        page.wait_for_timeout(500)

        # Click "Naphtha Reformer"
        page.locator("#unit-menu button:has-text(\"Naphtha Reformer\")").click()
        page.wait_for_timeout(500)

        # Now click "Deploy PIPE" (Build Pipe button)
        # Assuming the button has data-command="build-pipe"
        build_pipe_btn = page.locator("button[data-command=\"build-pipe\"]")
        if build_pipe_btn.is_visible() and not build_pipe_btn.is_disabled():
            build_pipe_btn.click()
            print("Clicked Build Pipe")
        else:
            print("Build Pipe button not visible or disabled")

        page.wait_for_timeout(2000)
        page.screenshot(path="verification/pipe_visual.png")
        print("Screenshot saved")

        browser.close()

if __name__ == "__main__":
    run()
