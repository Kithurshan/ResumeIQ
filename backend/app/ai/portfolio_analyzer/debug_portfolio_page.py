import sys
from bs4 import BeautifulSoup

from .website_crawler import WebsiteCrawler


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else "https://marwan-eslam-data-verse.vercel.app/"
    print(f"Debugging portfolio page: {url}")

    crawler = WebsiteCrawler(url)
    page = crawler.download_page(url)

    if page is None:
        print("Failed to download page.")
        return

    soup = BeautifulSoup(page.html, "html.parser")
    for tag in soup.select("script, style, noscript, svg, template"):
        tag.decompose()

    text = soup.get_text(" ", strip=True)
    print("=" * 80)
    print(f"URL: {page.url}")
    print(f"Visible text length: {len(text.strip())}")
    print(f"Word count: {len(text.split())}")
    print("=" * 80)
    print(text[:4000])
    print("=" * 80)


if __name__ == "__main__":
    main()
