from playwright.sync_api import sync_playwright, expect
import time

def verify_theme_alert(page):
    # Navigate to the app
    page.goto("http://localhost:3000")

    # Wait for the app to load
    page.wait_for_selector("#scene-container")

    # Verify initial theme (Twilight)
    html = page.locator("html")
    expect(html).to_have_attribute("data-theme", "twilight")
    print("Initial theme is twilight")

    # Take initial screenshot
    page.screenshot(path="verification/1_initial_state.png")

    # Inject a danger alert into the simulation by compromising integrity
    print("Injecting danger alert condition...")
    page.evaluate("""
        const simulation = window.simRefinery.simulation;
        const unitCopy = simulation.getUnits().find(u => u.status === 'online');
        if (unitCopy) {
            const unit = simulation.unitMap[unitCopy.id];
            if (unit) {
                unit.integrity = 0.1; // Critical integrity triggers danger alert
                console.log("Compromised integrity of unit:", unit.id);
            }
        }
    """)

    # Wait for theme change to emergency
    expect(html).to_have_attribute("data-theme", "emergency", timeout=10000)
    print("Theme changed to emergency")

    page.screenshot(path="verification/2_emergency_state.png")

    # Clear the alert by restoring integrity
    print("Clearing alert condition...")
    page.evaluate("""
        const simulation = window.simRefinery.simulation;
        const units = Object.values(simulation.unitMap);
        const unit = units.find(u => u.integrity < 0.2);
        if (unit) {
            unit.integrity = 1.0;
            // The simulation loop will clear the alert eventually when integrity is high
            // But we can force it to speed up
            unit.alert = null;
            unit.alertDetail = null;
            unit.alertTimer = 0;
            console.log("Restored integrity of unit:", unit.id);
        }
    """)

    # Wait for theme change back to twilight
    expect(html).to_have_attribute("data-theme", "twilight", timeout=10000)
    print("Theme reverted to twilight")

    page.screenshot(path="verification/3_reverted_state.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        try:
            verify_theme_alert(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/failure.png")
        finally:
            browser.close()
