# This class converts HTML into clean text and identifies semantic sections.
#
# Beginner-friendly idea:
# Instead of matching only a few exact headings like "About" or "Projects",
# we give each heading a score based on many similar words.
# This makes the analyzer work on more portfolio styles.

import re
from copy import deepcopy

from bs4 import BeautifulSoup, Tag


class ContentExtractor:

    # Suggested section keywords for a more flexible matching system.
    # The more similar words you include here, the easier it is to support
    # different portfolio styles and naming conventions.
    SECTION_KEYWORDS = {
        "about": [
            "about", "profile", "summary", "intro", "introduction",
            "who i am", "bio", "overview", "hello"
        ],
        "experience": [
            "experience", "work experience", "employment", "career",
            "work history", "jobs", "role", "roles", "professional experience"
        ],
        "education": [
            "education", "training", "qualifications", "degree",
            "university", "school", "academic background"
        ],
        "projects": [
            "projects", "project", "featured projects", "selected work",
            "featured work", "portfolio", "my work", "case studies",
            "case study", "work samples", "software", "hardware", "art",
            "gallery", "creative work", "selected projects", "featured art"
        ],
        "skills": [
            "skills", "expertise", "technologies", "stack", "tools",
            "languages", "tech stack", "capabilities"
        ],
        "certifications": [
            "certifications", "certificate", "certificates", "credentials",
            "awards", "badges", "achievements"
        ],
        "writing": [
            "writing", "articles", "blog", "posts", "publications",
            "insights", "articles and insights"
        ],
    }

    def clean_text(self, text):
        """Convert multiple spaces/newlines into a clean single text block."""
        return re.sub(r"\s+", " ", text or "").strip()

    def normalize_heading(self, text):
        """Make headings lowercase and remove punctuation to compare them easier."""
        text = self.clean_text(text).lower()
        text = re.sub(r"[^a-z0-9+#.&/\- ]", " ", text)
        return re.sub(r"\s+", " ", text).strip()

    def remove_unwanted_elements(self, soup):
        """Remove script/style/html extras so we only read real visible content."""
        for element in soup.select("script, style, noscript, template, svg"):
            element.decompose()

    def get_title(self, soup):
        if soup.title:
            return self.clean_text(soup.title.get_text(" ", strip=True))
        return ""

    def get_description(self, soup):
        meta = soup.find("meta", attrs={"name": "description"})
        if meta:
            return self.clean_text(meta.get("content", ""))
        return ""

    def get_page_text(self, soup):
        return self.clean_text(soup.get_text(" ", strip=True))

    def heading_score(self, heading_text, target_section):
        """
        Give a section a score based on similar keywords.
        Example:
        "Featured Projects" -> score high for 'projects'
        "Experience & Work" -> score high for 'experience'
        "About Me" -> score high for 'about'
        """
        normalized = self.normalize_heading(heading_text)
        keywords = self.SECTION_KEYWORDS.get(target_section, [])

        score = 0
        for keyword in keywords:
            clean_keyword = self.normalize_heading(keyword)
            if normalized == clean_keyword:
                score += 5
            elif normalized.startswith(clean_keyword + " "):
                score += 4
            elif clean_keyword in normalized:
                score += 3

        return score

    def identify_section_name(self, heading_text):
        """Return the best matching section name for a heading."""
        best_name = None
        best_score = 0

        for section_name in self.SECTION_KEYWORDS:
            score = self.heading_score(heading_text, section_name)
            if score > best_score:
                best_score = score
                best_name = section_name

        # Only accept strong matches.
        # This reduces false matches like "my work" accidentally matching a different area.
        if best_score >= 3:
            return best_name

        return None

    def build_virtual_section(self, heading):
        """
        If a website does not use <section> tags, we still build a temporary block
        from the heading until the next heading at the same or higher level.
        """
        wrapper = BeautifulSoup("<div></div>", "html.parser").div
        wrapper.append(deepcopy(heading))

        parent = heading.parent
        if parent is None:
            return wrapper

        collecting = False
        level = int(heading.name[1])

        for node in parent.children:
            if node is heading:
                collecting = True
                continue

            if not collecting:
                continue

            if isinstance(node, Tag):
                if re.match(r"^h[1-6]$", node.name or ""):
                    next_level = int(node.name[1])
                    if next_level <= level:
                        break

                wrapper.append(deepcopy(node))

        return wrapper

    def find_sections(self, soup):
        """Find sections even when portfolio pages use IDs or anchored single-page navigation."""
        candidate_tags = [
            "h1", "h2", "h3", "h4", "h5", "h6",
            "a", "button", "li", "p", "span", "div"
        ]

        sections = []

        for element in soup.find_all(candidate_tags):
            text = element.get_text(" ", strip=True)
            section_name = None

            element_id = (element.get("id") or "").strip()
            if element_id:
                section_name = self.identify_section_name(element_id)

            if not section_name and element_id == "":
                # Ignore large menu / root text blocks that include several section labels at once.
                if len(text) > 120 or "/" in text or ("about" in text.lower() and "experience" in text.lower()):
                    continue
                section_name = self.identify_section_name(text)

            if not section_name:
                continue

            # Ignore tiny nav labels or generic menu text when they are not a real section container.
            if not element_id and len(text) <= 2:
                continue

            parent_section = element.find_parent("section")
            if parent_section is None:
                parent_section = element.find_parent("article")
            if parent_section is None:
                parent_section = element

            section_element = element if element_id else parent_section
            sections.append({
                "name": section_name,
                "heading": self.clean_text(text or element_id),
                "element": section_element
            })

        unique_sections = []
        used = set()

        for section in sections:
            key = (section["name"], section["heading"])
            if key not in used:
                unique_sections.append(section)
                used.add(key)

        return unique_sections

    def find_section(self, soup, section_name):
        sections = self.find_sections(soup)
        direct_matches = []
        fuzzy_matches = []

        for section in sections:
            if section["name"] != section_name:
                continue

            element_id = (section["element"].get("id") or "").lower().replace("-", " ") if hasattr(section["element"], "get") else ""
            if element_id == section_name:
                return section
            if element_id and section_name in element_id:
                direct_matches.append(section)
            else:
                fuzzy_matches.append(section)

        if direct_matches:
            return direct_matches[0]
        if fuzzy_matches:
            return fuzzy_matches[0]
        return None

    def get_visible_text(self, element):
        """Return only the visible human text from a section."""
        copied = BeautifulSoup(str(element), "html.parser")
        self.remove_unwanted_elements(copied)
        return self.clean_text(copied.get_text(" ", strip=True))
