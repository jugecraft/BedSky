from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Mock require and ipcRenderer to avoid errors in browser environment
    page.add_init_script("""
        window.require = function(module) {
            if (module === 'electron') {
                return {
                    ipcRenderer: {
                        send: (channel, data) => console.log('IPC Send:', channel, data),
                        on: (channel, func) => console.log('IPC On:', channel)
                    }
                };
            }
            return {};
        };
    """)

    cwd = os.getcwd()
    # Go to the local file
    page.goto(f"file://{cwd}/src/index.html")

    # Wait for element to be visible
    page.wait_for_selector(".sidebar")

    # Take screenshot
    page.screenshot(path="verification/ui_preview.png")
    print("Screenshot taken")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
