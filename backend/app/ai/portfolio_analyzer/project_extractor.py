# Extracts projects ONLY from a Projects/Work section or project archive.
# This is the most important protection against the old false "Brittany Chiang"
# project problem.

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .models import Project


class ProjectExtractor:

    def __init__(self, content_extractor, technology_extractor):
        self.content = content_extractor
        self.technology = technology_extractor

    def is_generic_project_title(self, title):
        """Reject noisy titles that are not real project work."""
        text = (title or "").strip().lower()
        if not text:
            return True

        generic_words = [
            "portfolio", "projects", "featured projects", "all projects",
            "work", "case studies", "kaggle", "notebook", "notebooks",
            "competitions", "archive", "featured work", "my work", "view all",
            "github", "read more", "learn more"
        ]

        return any(word in text for word in generic_words)

    def get_containers(self, section_element):
        if section_element is None:
            return []

        selectors = [
            "article, li, .project-item, .card, .portfolio-item, .work-item, .carousel-item, .project-card, .project-tile"
        ]

        cards = []
        for selector in selectors:
            cards.extend(section_element.select(selector))

        cards = [
            card for card in cards
            if len(self.content.get_visible_text(card)) >= 20
            and (card.find(["h3", "h4", "h5"]) or any(word in self.content.get_visible_text(card).lower() for word in ["project", "game", "portfolio", "build"]))
        ]

        if len(cards) >= 1:
            return cards

        # Fallback: group section content by headings.
        headings = section_element.find_all(["h3", "h4", "h5"])

        containers = []
        soup = BeautifulSoup("", "html.parser")

        for heading in headings:
            wrapper = soup.new_tag("div")
            wrapper.append(heading.extract())

            for sibling in list(heading.parent.children):
                if sibling is heading:
                    continue
                if getattr(sibling, "name", None):
                    wrapper.append(sibling.extract())

            if len(self.content.get_visible_text(wrapper)) >= 20:
                containers.append(wrapper)

        if containers:
            return containers

        # Final fallback: a whole section with repeated project-like text can still be useful.
        visible = self.content.get_visible_text(section_element)
        if len(visible) >= 60 and "" not in visible:
            return [section_element]

        return []

    def get_title(self, card):
        heading = card.find(
            ["h3", "h4", "h5"]
        )

        if heading:
            return self.content.clean_text(
                heading.get_text(" ", strip=True)
            )

        # Some cards have a strong or bold title.
        strong = card.find(
            ["strong", "b"]
        )

        if strong:
            return self.content.clean_text(
                strong.get_text(" ", strip=True)
            )

        return ""

    def get_description(self, card, title):
        paragraphs = card.find_all(["p", "div"])

        for element in paragraphs:
            text = self.content.clean_text(
                element.get_text(" ", strip=True)
            )

            if not text or text == title:
                continue

            if any(tag in text.lower() for tag in ["techstack", "tech stack", "c#", "python", "javascript"]):
                continue

            return text

        return ""

    def get_date(self, card):
        text = self.content.get_visible_text(card)

        pattern = re.compile(
            r"\b(19|20)\d{2}\b"
        )

        match = pattern.search(text)

        return match.group(0) if match else ""

    def get_url(self, card, base_url):
        link = card.find(
            "a",
            href=True
        )

        if not link:
            return ""

        return urljoin(
            base_url,
            link["href"]
        )

    def extract(self, section, page_url):
        if section is None:
            return []

        cards = self.get_containers(
            section["element"]
        )

        projects = []

        for card in cards:
            title = self.get_title(card)

            if not title:
                continue

            if self.is_generic_project_title(title):
                continue

            description = self.get_description(card, title)
            text = self.content.get_visible_text(card)
            technologies = self.technology.find(text)

            project = Project(
                title=title,
                description=description,
                date=self.get_date(card),
                technologies=technologies,
                url=self.get_url(card, page_url),
                source=page_url
            )

            if project.title and project.title.lower() not in {"project", "projects"}:
                projects.append(project)

        return self.remove_duplicates(projects)

    def remove_duplicates(self, projects):
        unique = []
        seen = set()

        for project in projects:
            title = (project.title or "").strip()
            url = (project.url or "").strip()

            if not title:
                continue

            if self.is_generic_project_title(title):
                continue

            key = (
                title.lower(),
                url.lower()
            )

            if key in seen:
                continue

            seen.add(key)
            unique.append(project)

        return unique

    def extract_archive_rows(self, soup, page_url):
        """
        Handles table-style project archives.
        The archive page itself is NEVER returned as a project.
        """

        projects = []

        for row in soup.select("table tr"):

            cells = row.find_all(
                ["td", "th"]
            )

            if len(cells) < 2:
                continue

            values = [
                self.content.clean_text(
                    cell.get_text(
                        " ",
                        strip=True
                    )
                )
                for cell in cells
            ]

            if values[0].lower() in {
                "year",
                "date"
            }:
                continue

            title = values[1]

            if not title:
                continue

            link = cells[1].find(
                "a",
                href=True
            )

            project_url = ""

            if link:
                project_url = urljoin(
                    page_url,
                    link["href"]
                )

            full_text = " ".join(values)

            projects.append(
                Project(
                    title=title,
                    date=values[0] if re.fullmatch(
                        r"(19|20)\d{2}",
                        values[0]
                    ) else "",
                    technologies=self.technology.find(
                        full_text
                    ),
                    url=project_url,
                    source=page_url
                )
            )

        return self.remove_duplicates(
            projects
        )
