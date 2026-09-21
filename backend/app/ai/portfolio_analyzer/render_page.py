"""
Render a URL with Playwright in a separate process and print the HTML to stdout.

This subprocess avoids calling Playwright from a non-main thread on Windows.
Keep this file minimal and beginner-friendly.
"""
import sys


def main():
    try:
        from playwright.sync_api import sync_playwright
    except Exception as e:
        # Write bytes to stderr to avoid Python trying to encode using a limited
        # Windows code page. Parent process will decode using utf-8.
        sys.stderr.buffer.write(f"PLAYWRIGHT_IMPORT_ERROR: {e}\n".encode("utf-8", errors="replace"))
        sys.exit(2)

    if len(sys.argv) < 2:
        sys.stderr.buffer.write(b"Usage: render_page.py <url>\n")
        sys.exit(2)

    url = sys.argv[1]

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1440, "height": 2200})
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(4000)
            html = page.content()
            browser.close()

            # Write UTF-8 bytes directly to stdout so the parent process can decode
            # deterministically regardless of the Windows console code page.
            sys.stdout.buffer.write(html.encode("utf-8", errors="replace"))
            sys.exit(0)
    except Exception as e:
        sys.stderr.buffer.write(f"PLAYWRIGHT_RENDER_ERROR: {e}\n".encode("utf-8", errors="replace"))
        sys.exit(3)


if __name__ == "__main__":
    main()
