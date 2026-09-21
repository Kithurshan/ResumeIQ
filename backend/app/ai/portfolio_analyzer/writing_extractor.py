# Extracts articles/blog posts from the Writing section.

from urllib.parse import urljoin

from .models import Writing


class WritingExtractor:

    def __init__(self, content_extractor):
        self.content = content_extractor

    def extract(self, section, page_url):

        if section is None:
            return []

        cards = section["element"].select(
            "article, li"
        )

        writing = []

        for card in cards:

            heading = card.find(
                ["h3", "h4", "h5"]
            )

            if heading:
                title = self.content.clean_text(
                    heading.get_text(
                        " ",
                        strip=True
                    )
                )
            else:
                link = card.find(
                    "a",
                    href=True
                )

                title = (
                    self.content.clean_text(
                        link.get_text(
                            " ",
                            strip=True
                        )
                    )
                    if link
                    else ""
                )

            if not title:
                continue

            link = card.find(
                "a",
                href=True
            )

            url = ""

            if link:
                url = urljoin(
                    page_url,
                    link["href"]
                )

            writing.append(
                Writing(
                    title=title,
                    url=url,
                    source=page_url
                )
            )

        return self.remove_duplicates(
            writing
        )

    def remove_duplicates(self, items):

        unique = []
        seen = set()

        for item in items:

            key = (
                item.title.lower().strip(),
                item.url.lower().strip()
            )

            if key in seen:
                continue

            seen.add(key)
            unique.append(item)

        return unique
