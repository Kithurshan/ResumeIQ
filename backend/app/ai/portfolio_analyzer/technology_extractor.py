# Finds technologies that are actually written in the website content.
# It never creates a project by itself.

import re

from .config import TECHNOLOGIES
from .models import Evidence


class TechnologyExtractor:

    def __init__(self):
        self.patterns = {}

        for technology in TECHNOLOGIES:
            self.patterns[technology] = re.compile(
                r"(?<![\w])"
                + re.escape(technology)
                + r"(?![\w])",
                re.IGNORECASE
            )

    def find(self, text):
        found = []

        for technology, pattern in self.patterns.items():

            if pattern.search(text or ""):
                found.append(technology)

        return sorted(
            set(found),
            key=str.lower
        )

    def get_evidence(self, text, url, section):
        evidence = []

        for technology in self.find(text):

            match = self.patterns[technology].search(text)

            if match:
                start = max(
                    0,
                    match.start() - 120
                )

                end = min(
                    len(text),
                    match.end() + 180
                )

                snippet = text[start:end]

                evidence.append(
                    Evidence(
                        url=url,
                        text=snippet,
                        section=section
                    )
                )

        return evidence
