# Extracts work experience from the Experience section.

import re

from .models import Experience


class ExperienceExtractor:

    def __init__(self, content_extractor, technology_extractor):
        self.content = content_extractor
        self.technology = technology_extractor

    def split_role_company(self, title):
        """Split a heading like 'Senior Data Scientist @ Company' into role and company."""
        text = self.content.clean_text(title)
        if not text:
            return "", ""

        for separator in ["·", "-", "|", "@"]:
            if separator in text:
                left, right = [self.content.clean_text(part) for part in text.split(separator, 1)]
                if left and right:
                    return left, right

        if " at " in text.lower():
            parts = re.split(r"\s+at\s+", text, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2:
                return parts[0].strip(), parts[1].strip()

        if " in " in text.lower():
            parts = re.split(r"\s+in\s+", text, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2:
                return parts[0].strip(), parts[1].strip()

        return text, ""

    def find_date(self, text):
        """Look for a year range like '2022 - Present'."""
        date_patterns = [
            r"\b(19|20)\d{2}\s*[—–-]\s*(Present|(19|20)\d{2})\b",
            r"\b(19|20)\d{2}\s*[—–-]\s*(Present)\b",
            r"\b(19|20)\d{2}\b"
        ]

        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)

        return ""

    def extract(self, section, page_url):

        if section is None:
            return []

        cards = section["element"].select(
            "article, .experience-item, .job, .work-item, .timeline-item, [role='tabpanel'], [id*='tabpanel'], .job-card, .experience-card"
        )

        cards = [
            card
            for card in cards
            if len(self.content.get_visible_text(card)) >= 20
        ]

        if cards:
            cards = [
                card for card in cards
                if not any(item in card.get("id", "") for item in ["vertical-tab-", "tab-"])
            ]

        if not cards:
            cards = [section["element"]]

        experiences = []

        for card in cards:
            heading = card.find(["h3", "h4", "h5"])
            title = self.content.clean_text(heading.get_text(" ", strip=True)) if heading else ""

            if not title:
                job_title = card.select_one(".joblist-job-title")
                company = card.select_one(".joblist-job-company")
                job_title_text = self.content.clean_text(job_title.get_text(" ", strip=True)).rstrip("@").rstrip() if job_title else ""
                company_text = self.content.clean_text(company.get_text(" ", strip=True)).lstrip("@").strip() if company else ""

                if job_title_text and company_text:
                    title = self.content.clean_text(job_title_text + " @ " + company_text)
                elif job_title_text:
                    title = job_title_text
                else:
                    title = self.content.clean_text(self.content.get_visible_text(card)[:150])

            role, company = self.split_role_company(title)
            text = self.content.get_visible_text(card)
            date = self.find_date(text)

            description_parts = []
            for item in card.find_all(["p", "li"]):
                value = self.content.clean_text(item.get_text(" ", strip=True))
                if value and value not in description_parts:
                    description_parts.append(value)

            description = " ".join(description_parts)

            if not role and not company and not description:
                continue

            experiences.append(
                Experience(
                    role=role or title,
                    company=company,
                    date=date,
                    description=description,
                    technologies=self.technology.find(text),
                    source=page_url
                )
            )

        return self.remove_duplicates(experiences)

    def remove_duplicates(self, items):

        unique = []
        seen = set()

        for item in items:

            key = (
                item.role.lower().strip(),
                item.company.lower().strip(),
                item.date.lower().strip()
            )

            if key in seen:
                continue

            seen.add(key)
            unique.append(item)

        return unique
