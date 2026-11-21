"""Browser-level smoke test for the CivicPulse demo UI and FastAPI backend."""
import os
import time
from pathlib import Path
from urllib.request import urlopen

from playwright.sync_api import sync_playwright


def wait_healthy(url: str, timeout_s: int = 45):
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        try:
            with urlopen(url, timeout=3) as response:
                if response.status == 200:
                    return
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError(f"Service did not become healthy: {url}")


def main():
    wait_healthy("http://127.0.0.1:8000/health")
    wait_healthy("http://127.0.0.1:5173/")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(str(err)))
        page.goto("http://127.0.0.1:5173/", wait_until="domcontentloaded", timeout=45_000)
        page.wait_for_timeout(9500)  # Home page's 8s onboarding animation
        page.screenshot(path=os.getenv("CIVICPULSE_SCREENSHOT", "/tmp/civicpulse-home.png"), full_page=True)
        title = page.title()
        assert "CivicPulse" in title, f"Unexpected page title: {title!r}"
        assert page.locator("button[aria-label='Report issue']").count() == 1, "Main report button not rendered"
        response = page.request.get("http://127.0.0.1:8000/api/issues")
        assert response.ok, f"Backend issues returned {response.status}"
        issues = response.json()
        assert len(issues.get("items", [])) >= 1, "Demo issue feed unexpectedly empty"
        assert not page_errors, f"JavaScript errors in UI: {page_errors[:5]}"
        print(f"PASS: browser loaded {title}, report button shown, {len(issues['items'])} backend issues, no page errors")
        browser.close()


if __name__ == "__main__":
    main()
