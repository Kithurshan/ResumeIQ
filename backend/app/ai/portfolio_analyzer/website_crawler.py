# This class is responsible only for visiting the candidate's website.
# It does NOT decide whether a page is a project or experience page.

import os
import threading
import subprocess
import sys
from collections import deque
from urllib.parse import urljoin, urlparse, urldefrag

import requests
from bs4 import BeautifulSoup

try:
    from playwright.sync_api import sync_playwright
except ImportError:  # pragma: no cover
    sync_playwright = None

from .config import MAX_PAGES, REQUEST_TIMEOUT, USER_AGENT, IMPORTANT_WORDS


class WebsitePage:
    """Stores one downloaded web page."""

    def __init__(self, url, html, status_code=200):
        self.url = url
        self.html = html
        self.status_code = status_code


class WebsiteCrawler:
    """Finds readable pages belonging to the candidate's website."""

    def __init__(self, start_url):
        self.start_url = self.clean_url(start_url)
        self.domain = urlparse(self.start_url).netloc.lower()

        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": USER_AGENT
        })

    def clean_url(self, url):
        url = url.strip()

        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        url, _ = urldefrag(url)
        return url.rstrip("/")

    def is_same_website(self, url):
        current_domain = urlparse(url).netloc.lower()
        base_domain = self.domain

        return (
            current_domain == base_domain
            or current_domain.endswith("." + base_domain)
        )

    def is_html_page(self, url):
        path = urlparse(url).path.lower()

        blocked_extensions = [
            ".jpg", ".jpeg", ".png", ".gif", ".svg",
            ".webp", ".mp4", ".mp3", ".zip",
            ".css", ".js", ".ico"
        ]

        return not any(path.endswith(ext) for ext in blocked_extensions)

    def _text_length(self, html):
        if not html:
            return 0

        soup = BeautifulSoup(html, "html.parser")
        for tag in soup.select("script, style, noscript, svg, template"):
            tag.decompose()

        text = soup.get_text(" ", strip=True)
        return len(text.strip())

    def _looks_like_sparse_html(self, html):
        if not html:
            return True

        text_length = self._text_length(html)
        return text_length < 600

    def _render_with_playwright(self, url):
        """
        Render `url` using a separate Python subprocess that runs Playwright.

        Running Playwright inside a subprocess avoids Windows worker-thread
        issues (async subprocess NotImplementedError) while keeping this
        crawler beginner-friendly and isolated from other analyzers.
        """

        script = os.path.join(
            os.path.dirname(__file__),
            "render_page.py"
        )

        if not os.path.exists(script):
            return None

        try:
            proc = subprocess.run(
                [sys.executable, script, url],
                capture_output=True,
                text=False,
                timeout=70
            )

            # Decode stdout/stderr as UTF-8, replace invalid bytes to avoid crashes.
            stdout = proc.stdout.decode("utf-8", errors="replace") if proc.stdout else ""
            stderr = proc.stderr.decode("utf-8", errors="replace") if proc.stderr else ""

            if proc.returncode == 0:
                return stdout

            # Print helpful debug messages on failure.
            print(f"[Playwright subprocess failed for {url}: {stderr} returncode={proc.returncode}]")
            return None

        except subprocess.TimeoutExpired:
            print(f"[Playwright subprocess timed out for {url}]")
            return None
        except Exception as exc:
            print(f"[Playwright subprocess exception for {url}: {exc}]")
            return None

    def download_page(self, url):
        try:
            response = self.session.get(
                url,
                timeout=REQUEST_TIMEOUT,
                allow_redirects=True
            )

            content_type = response.headers.get(
                "content-type", ""
            ).lower()

            if response.status_code >= 400:
                return None

            if "html" not in content_type:
                return None

            html = response.text

            if self._looks_like_sparse_html(html):
                rendered_html = self._render_with_playwright(response.url)
                if rendered_html and not self._looks_like_sparse_html(rendered_html):
                    print(f"[Browser-render fallback used for: {response.url}]")
                    html = rendered_html

            return WebsitePage(
                response.url,
                html,
                response.status_code
            )

        except requests.RequestException:
            return None

    def get_links(self, page):
        soup = BeautifulSoup(page.html, "html.parser")

        links = []

        for anchor in soup.find_all("a", href=True):
            href = anchor["href"].strip()

            if href.startswith((
                "#", "mailto:", "tel:", "javascript:"
            )):
                continue

            full_url = urljoin(page.url, href)
            full_url, _ = urldefrag(full_url)

            if not self.is_same_website(full_url):
                continue

            if not self.is_html_page(full_url):
                continue

            links.append(full_url.rstrip("/"))

        return list(dict.fromkeys(links))

    def link_priority(self, url):
        path = urlparse(url).path.lower()

        score = 0

        for word in IMPORTANT_WORDS:
            if word in path:
                score += 10

        return score

    def crawl(self):
        queue = deque()
        queue.append(self.start_url)

        visited = set()
        pages = []

        while queue and len(pages) < MAX_PAGES:

            current_url = queue.popleft()

            if current_url in visited:
                continue

            visited.add(current_url)

            page = self.download_page(current_url)

            if page is None:
                continue

            pages.append(page)

            links = self.get_links(page)

            # Important pages are visited earlier.
            links.sort(
                key=self.link_priority,
                reverse=True
            )

            for link in links:
                if link not in visited:
                    queue.append(link)

        return pages
