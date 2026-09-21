from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import pymupdf
except ImportError:
    pymupdf = None

try:
    from docx import Document
except ImportError:
    Document = None

try:
    import spacy
    from spacy.language import Language
except ImportError:
    spacy = None
    Language = None

try:
    import pytesseract
    from PIL import Image
except ImportError:
    pytesseract = None
    Image = None


# ============================================================
# NLP DEPENDENCIES
# ============================================================
# Required:
#   pip install PyMuPDF python-docx spacy pytesseract pillow
#
# Recommended statistical NLP model:
#   python -m spacy download en_core_web_sm
#
# The parser can fall back to spaCy blank + EntityRuler if the
# statistical model is not installed, but for your final project
# install en_core_web_sm so the reported NLP pipeline is genuine.
# ============================================================

# ResumeIQ Universal Hybrid NLP Resume Parser v8.0
# ============================================================
# Main principle:
#   Never assume one fixed resume layout.
#
# This version is:
#   - section aware
#   - layout aware for PDF
#   - date aware (years + month/year ranges)
#   - contact aware
#   - education-record aware
#   - project-record aware
#   - skill-category aware
#   - conservative: does not invent missing information
#
# Supported:
#   PDF, DOCX
#
# Optional OCR is intentionally not required. For scanned/image-only
# PDFs, install Tesseract + pytesseract separately if you later want
# OCR support. Digital PDFs are parsed with PyMuPDF coordinates.
# ============================================================

VERSION = "8.0"

SECTION_ALIASES = {
    "summary": [
        "summary", "professional summary", "career summary", "profile",
        "professional profile", "about me", "about", "objective",
        "career objective", "professional objective", "personal statement",
        "introduction", "overview", "executive summary"
    ],
    "education": [
        "education", "educational background", "academic background",
        "academic qualifications", "qualifications", "education background",
        "academic history", "education and qualifications"
    ],
    "experience": [
        "experience", "work experience", "professional experience",
        "employment history", "work history", "career history",
        "professional history", "employment experience", "career experience",
        "internships", "work history and experience"
    ],
    "projects": [
        "projects", "project experience", "personal projects",
        "academic projects", "selected projects", "key projects",
        "project work", "major projects", "professional projects"
    ],
    "skills": [
        "skills", "skill summary", "skills summary", "technical skills",
        "technical expertise", "core skills", "key skills",
        "professional skills", "competencies", "technical competencies",
        "technologies", "technical proficiencies", "areas of expertise",
        "skills and competencies", "skills & competencies"
    ],
    "certifications": [
        "certifications", "certificates", "professional certifications",
        "licenses", "licences", "certifications and licenses",
        "certifications & licenses"
    ],
    "awards": ["awards", "honors", "honours", "achievements", "accomplishments"],
    "publications": ["publications", "research publications", "papers", "articles"],
    "volunteering": ["volunteering", "volunteer experience", "community involvement"],
    "languages": ["languages", "language skills", "spoken languages"],
    "interests": ["interests", "hobbies", "interests and hobbies"],
    "references": ["references", "referees"],
}

SECTION_LOOKUP = {}
for canonical, aliases in SECTION_ALIASES.items():
    for alias in aliases:
        SECTION_LOOKUP[alias.lower()] = canonical


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_unicode(text: str) -> str:
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u2212": "-",
        "\u00a0": " ",
        "\u2022": "•",
        "\u00b7": "•",
        "\u2026": "...",
        "\ufffd": "",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def clean_markdown_artifacts(text: str) -> str:
    # [person@gmail.com](mailto\:person@gmail.com)
    # -> person@gmail.com
    text = re.sub(
        r"\[[^\]]+\]\(\s*mailto\\?:([^)]+)\)",
        r"\1",
        text,
        flags=re.I,
    )

    # [text](https://...)
    # -> text
    text = re.sub(
        r"\[([^\]]+)\]\(https?://[^)]+\)",
        r"\1",
        text,
        flags=re.I,
    )

    text = text.replace("\\:", ":")
    return text


def normalize_text(text: str) -> str:
    text = normalize_unicode(clean_markdown_artifacts(text))
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def normalize_heading_key(text: str) -> str:
    text = normalize_unicode(clean_markdown_artifacts(text)).strip()
    text = re.sub(r"^[\s•●▪◦‣*|:_-]+|[\s•●▪◦‣*|:_-]+$", "", text)
    text = re.sub(r"\s+", " ", text)

    # Normal heading
    key = re.sub(r"[^a-z0-9]", "", text.lower())

    # Letter-spaced heading:
    # S K I L L S
    compact = re.sub(r"(?<=[A-Za-z])\s(?=[A-Za-z])", "", text)
    compact_key = re.sub(r"[^a-z0-9]", "", compact.lower())

    return key if key in SECTION_LOOKUP_COMPACT else compact_key


SECTION_LOOKUP_COMPACT = {
    re.sub(r"[^a-z0-9]", "", alias.lower()): canonical
    for alias, canonical in SECTION_LOOKUP.items()
}


def looks_like_heading(text: str) -> Optional[str]:
    if not text:
        return None

    raw = normalize_unicode(text).strip()

    # "Languages:" is a skill label, not a section heading.
    if ":" in raw:
        return None

    if len(raw) > 70:
        return None

    key = normalize_heading_key(raw)
    return SECTION_LOOKUP_COMPACT.get(key)


def is_bullet(text: str) -> bool:
    return bool(re.match(r"^\s*(?:[•●▪◦‣*-]|\d+[.)])\s+", text))


def strip_bullet(text: str) -> str:
    value = text.strip()

    if value in {"•", "●", "▪", "◦", "‣", "-", "*"}:
        return ""

    return re.sub(
        r"^\s*(?:[•●▪◦‣*-]|\d+[.)])(?:\s+|$)",
        "",
        text,
    ).strip()


# ============================================================
# DATE EXTRACTION
# ============================================================

MONTHS = (
    r"January|February|March|April|May|June|July|August|"
    r"September|October|November|December"
)

MONTH_MAP = {
    "january": "01",
    "february": "02",
    "march": "03",
    "april": "04",
    "may": "05",
    "june": "06",
    "july": "07",
    "august": "08",
    "september": "09",
    "october": "10",
    "november": "11",
    "december": "12",
}


def extract_date_range(text: str) -> Dict[str, Optional[str]]:
    """
    Extract dates without inventing dates.

    Supports:
        February 2024 - September 2025
        June 2024 - February 2025
        January 2020 - December 2022
        2024 - 2026
        2024 - Present
        2024 to 2026
        April 24 - December 2024

    Returns both readable values and years.
    """

    text = normalize_unicode(text)

    # Month YYYY - Month YYYY / Month YYYY - Present
    pattern = re.compile(
        rf"\b({MONTHS})\s+((?:19|20)\d{{2}})\s*"
        rf"(?:-|–|—|to)\s*"
        rf"({MONTHS})?\s*"
        rf"((?:19|20)\d{{2}}|Present|Current|Now)\b",
        re.I,
    )

    m = pattern.search(text)
    if m:
        start_month = m.group(1).capitalize()
        start_year = m.group(2)
        end_month = m.group(3).capitalize() if m.group(3) else None
        end_raw = m.group(4)

        if end_raw.lower() in {"present", "current", "now"}:
            end_value = "Present"
            end_year = "Present"
        else:
            end_value = f"{end_month} {end_raw}" if end_month else end_raw
            end_year = end_raw

        return {
            "start": f"{start_month} {start_year}",
            "end": end_value,
            "start_year": start_year,
            "end_year": end_year,
            "matched_text": m.group(0),
        }

    # Month YY - Month YYYY
    # Example: April 24 - December 2024
    short_year_pattern = re.compile(
        rf"\b({MONTHS})\s+(\d{{2}})\s*"
        rf"(?:-|–|—|to)\s*"
        rf"({MONTHS})\s+((?:19|20)\d{{2}})\b",
        re.I,
    )

    m = short_year_pattern.search(text)
    if m:
        short_year = int(m.group(2))
        century = 2000 if short_year <= 69 else 1900
        start_year = str(century + short_year)
        end_year = m.group(4)

        return {
            "start": f"{m.group(1).capitalize()} {start_year}",
            "end": f"{m.group(3).capitalize()} {end_year}",
            "start_year": start_year,
            "end_year": end_year,
            "matched_text": m.group(0),
        }

    # YYYY - YYYY / YYYY - Present
    year_pattern = re.compile(
        r"\b((?:19|20)\d{2})\s*"
        r"(?:-|–|—|to)\s*"
        r"((?:19|20)\d{2}|Present|Current|Now)\b",
        re.I,
    )

    m = year_pattern.search(text)
    if m:
        end_raw = m.group(2)
        end_year = (
            "Present"
            if end_raw.lower() in {"present", "current", "now"}
            else end_raw
        )

        return {
            "start": m.group(1),
            "end": end_year,
            "start_year": m.group(1),
            "end_year": end_year,
            "matched_text": m.group(0),
        }

    # MM/YYYY - MM/YYYY or MM/YYYY - Present
    numeric_pattern = re.compile(
        r"\b(\d{1,2})/(19\d{2}|20\d{2})\s*"
        r"(?:-|–|—|to)\s*"
        r"(?:(\d{1,2})/)?(19\d{2}|20\d{2}|Present|Current|Now)\b",
        re.I,
    )

    m = numeric_pattern.search(text)
    if m:
        start_month = m.group(1).zfill(2)
        start_year = m.group(2)
        end_month = m.group(3).zfill(2) if m.group(3) else None
        end_raw = m.group(4)
        
        end_year = (
            "Present"
            if end_raw.lower() in {"present", "current", "now"}
            else end_raw
        )
        
        start_str = f"{start_month}/{start_year}"
        end_str = f"{end_month}/{end_year}" if end_month else end_year

        return {
            "start": start_str,
            "end": end_str if end_year != "Present" else "Present",
            "start_year": start_year,
            "end_year": end_year,
            "matched_text": m.group(0),
        }

    # Single Present / Current
    if re.search(r"\bPresent\b", text, re.I):
        return {
            "start": None,
            "end": "Present",
            "start_year": None,
            "end_year": "Present",
            "matched_text": "Present",
        }

    return {
        "start": None,
        "end": None,
        "start_year": None,
        "end_year": None,
        "matched_text": None,
    }


def remove_date_range(text: str) -> str:
    info = extract_date_range(text)
    matched = info.get("matched_text")

    if matched:
        text = text.replace(matched, "")

    # Remove dangling separators
    text = re.sub(r"\s*\|\s*$", "", text)
    text = re.sub(r"\s{2,}", " ", text)

    return text.strip(" -|:")


# Backward-compatible helper
def first_year_range(text: str) -> Tuple[Optional[str], Optional[str]]:
    info = extract_date_range(text)
    return info["start_year"], info["end_year"]


# ============================================================
# CONTACT EXTRACTION
# ============================================================

def extract_email(text: str) -> Optional[str]:
    text = clean_markdown_artifacts(text)

    pattern = (
        r"[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+"
        r"@"
        r"[A-Za-z0-9-]+"
        r"(?:\.[A-Za-z0-9-]+)+"
    )

    for match in re.findall(pattern, text):
        value = match.strip(" <>[](){}.,;:'\"")
        if 5 <= len(value) <= 254:
            return value

    return None


def extract_phone(text: str) -> Optional[str]:
    patterns = [
        # International format with optional parentheses: +1-(234)-555-1234, +1 (234) 555-1234
        r"(?<!\d)\+\d{1,3}[\s.-]*\(?\d{2,4}\)?[\s.-]*\d{3,4}[\s.-]*\d{0,4}(?!\d)",
        # Domestic with parentheses: (234) 555-1234
        r"(?<!\d)\(\d{2,4}\)[\s.-]*\d{3,4}[\s.-]*\d{3,4}(?!\d)",
        # Plain digits with separators: 0771234567, 077-123-4567
        r"(?<!\d)\+?\d{1,3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{0,4}(?!\d)",
        # Long continuous digits: 0771234567
        r"(?<!\d)\d{9,12}(?!\d)",
    ]

    for pattern in patterns:
        for candidate in re.findall(pattern, text):
            candidate = candidate.strip()
            digits = re.sub(r"\D", "", candidate)

            if 8 <= len(digits) <= 15:
                if not re.fullmatch(r"(19|20)\d{2}", digits):
                    return candidate

    return None


def extract_address(
    lines: List[TextLine],
    candidate_name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
) -> Optional[str]:

    if not lines:
        return None

    # Address labels that may appear in different resumes.
    address_label_pattern = re.compile(
        r"(?i)^\s*(?:"
        r"address|"
        r"home address|"
        r"residential address|"
        r"current address|"
        r"permanent address|"
        r"contact address|"
        r"residential location|"
        r"location"
        r")\s*:?\s*"
    )

    # ---------------------------------------------------------
    # PASS 1
    # Search the ENTIRE resume for an explicit address label.
    # ---------------------------------------------------------

    for index, line in enumerate(lines):

        text = line.text.strip()

        if not text:
            continue

        match = address_label_pattern.match(text)

        if not match:
            continue

        address_parts = []

        # Text after "Address:"
        first_part = text[match.end():].strip()

        if first_part:
            address_parts.append(first_part)

        # Address can continue on the following lines.
        for next_line in lines[index + 1:index + 7]:

            value = next_line.text.strip()

            if not value:
                continue

            # Stop at a recognized resume section.
            if looks_like_heading(value):
                break

            # Never include email.
            if extract_email(value):
                continue

            # Never include phone.
            if extract_phone(value):
                continue

            address_parts.append(value)

        address = _clean_address_parts(address_parts)

        if address:
            return address

    # ---------------------------------------------------------
    # PASS 2
    # Address without "Address:" label.
    # ---------------------------------------------------------

    strong_address_pattern = re.compile(
        r"(?i)\b("
        r"road|rd|"
        r"street|st|"
        r"lane|ln|"
        r"avenue|ave|"
        r"drive|dr|"
        r"boulevard|blvd|"
        r"place|pl|"
        r"crescent|"
        r"close|"
        r"highway|hwy"
        r")\b"
    )

    for index, line in enumerate(lines):

        text = line.text.strip()

        if not text:
            continue

        if looks_like_heading(text):
            continue

        if extract_email(text):
            continue

        if extract_phone(text):
            continue

        # Example:
        # 89 Pre-school Road
        # 25 Main Street
        # 123/4 School Lane
        has_house_number = bool(
            re.search(
                r"^\s*\d{1,5}(?:[/,-]\d{1,5})?\s*",
                text
            )
        )

        has_road = bool(
            strong_address_pattern.search(text)
        )

        if not (has_house_number and has_road):
            continue

        address_parts = [text]

        # Collect nearby continuation lines.
        for next_line in lines[index + 1:index + 5]:

            value = next_line.text.strip()

            if not value:
                continue

            if looks_like_heading(value):
                break

            if extract_email(value):
                break

            if extract_phone(value):
                break

            # Do not accidentally consume a paragraph.
            if len(value) > 100:
                break

            address_parts.append(value)

        address = _clean_address_parts(
            address_parts
        )

        if address:
            return address

    # ---------------------------------------------------------
    # PASS 3
    # Look for "City, State" or "City, State ZIP" patterns
    # in the first ~20 lines (resume header area).
    # Common in resumes that use icons instead of labels.
    # ---------------------------------------------------------

    US_STATES = {
        "alabama", "alaska", "arizona", "arkansas", "california",
        "colorado", "connecticut", "delaware", "florida", "georgia",
        "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas",
        "kentucky", "louisiana", "maine", "maryland", "massachusetts",
        "michigan", "minnesota", "mississippi", "missouri", "montana",
        "nebraska", "nevada", "new hampshire", "new jersey",
        "new mexico", "new york", "north carolina", "north dakota",
        "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island",
        "south carolina", "south dakota", "tennessee", "texas",
        "utah", "vermont", "virginia", "washington",
        "west virginia", "wisconsin", "wyoming",
        "district of columbia",
        # Common abbreviations
        "al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga",
        "hi", "id", "il", "in", "ia", "ks", "ky", "la", "me", "md",
        "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv", "nh", "nj",
        "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa", "ri", "sc",
        "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy",
        "dc",
        # Sri Lankan provinces / common locations
        "colombo", "kandy", "galle", "jaffna", "batticaloa",
        "western province", "central province", "southern province",
        "northern province", "eastern province",
        "sri lanka", "india", "uk", "usa",
    }

    # Pattern: "City, State" or "City, State ZIP"
    city_state_pattern = re.compile(
        r"^([A-Za-z\s.'-]+),\s*([A-Za-z\s]+)(?:\s+\d{5}(?:-\d{4})?)?$"
    )

    header_lines = lines[:20]
    for line in header_lines:
        text = line.text.strip()

        if not text or len(text) > 60:
            continue

        if looks_like_heading(text):
            continue

        if extract_email(text):
            continue

        if extract_phone(text):
            continue

        # Skip if it's the candidate's name
        if candidate_name and text.lower().replace(" ", "") == candidate_name.lower().replace(" ", ""):
            continue

        m = city_state_pattern.match(text)
        if m:
            state_part = m.group(2).strip().lower()
            if state_part in US_STATES:
                return text

    return None


def _clean_address_parts(
    parts: List[str],
) -> Optional[str]:

    cleaned = []

    for part in parts:

        part = normalize_unicode(
            clean_markdown_artifacts(part)
        )

        # PDF often creates huge spaces.
        part = re.sub(
            r"\s{2,}",
            " ",
            part
        ).strip(" ,;|-")

        if not part:
            continue

        if extract_email(part):
            continue

        if extract_phone(part):
            continue

        if part not in cleaned:
            cleaned.append(part)

    if not cleaned:
        return None

    return ", ".join(cleaned)


# ============================================================
# NAME NORMALIZATION
# ============================================================

def normalize_spaced_name(text: str) -> str:
    """
    Remove artificial letter spacing but NEVER invent a name boundary.

    If source contains a larger whitespace gap:
        K I T H U R S H A N    S U V...
    -> KITHURSHAN SUV...

    If source has no larger gap:
        K I T H U R S H A N S U V...
    -> KITHURSHANSUV...

    The parser never hard-codes a surname position.
    """

    text = normalize_unicode(text).strip()

    if not text:
        return ""

    # Preserve larger whitespace groups.
    if re.search(r"\s{2,}", text):
        groups = re.split(r"\s{2,}", text)

        result = []

        for group in groups:
            tokens = group.split()

            if tokens and all(
                len(token) == 1 and token.isalpha()
                for token in tokens
            ):
                result.append("".join(tokens).upper())
            else:
                result.append(
                    re.sub(r"\s+", " ", group).strip()
                )

        return " ".join(x for x in result if x)

    tokens = text.split()

    if (
        len(tokens) >= 5
        and all(
            len(token) == 1 and token.isalpha()
            for token in tokens
        )
    ):
        return "".join(tokens).upper()

    return re.sub(r"\s+", " ", text).strip()


def looks_like_person_name(text: str) -> bool:
    text = normalize_spaced_name(text.strip())

    if not text or len(text) > 80:
        return False

    if any(ch.isdigit() for ch in text):
        return False

    if "@" in text or "http" in text.lower():
        return False

    if looks_like_heading(text):
        return False

    words = text.split()

    if not 1 <= len(words) <= 6:
        return False

    for word in words:
        cleaned = re.sub(r"[^A-Za-z.'-]", "", word)

        if not cleaned:
            return False

        if len(cleaned) > 35:
            return False

    return True


# ============================================================
# URL EXTRACTION
# ============================================================

# ============================================================
# EXTERNAL URL DETECTION
# ============================================================

def extract_urls(text: str) -> List[str]:
    """
    Extract URLs that are actually present in the resume.

    This function does NOT invent URLs.
    It only returns URLs found in the extracted resume text.
    """

    text = clean_markdown_artifacts(text)

    urls = []

    # Full URLs:
    # https://linkedin.com/in/example
    # http://www.example.com
    # www.example.com
    full_url_pattern = re.compile(
        r"(?i)\b(?:https?://|www\.)"
        r"[a-z0-9.-]+\.[a-z]{2,}"
        r"(?:/[^\s<>\[\]{}()\"']*)?"
    )

    for match in full_url_pattern.findall(text):

        url = match.strip(
            ".,;:!?)]}>\"'"
        )

        if url and url not in urls:
            urls.append(url)

    # Bare LinkedIn URL:
    # linkedin.com/in/username
    bare_linkedin_pattern = re.compile(
        r"(?i)(?<!https://)(?<!http://)"
        r"\blinkedin\.com/in/[a-z0-9._%-]+"
    )

    for match in bare_linkedin_pattern.findall(text):

        url = "https://" + match

        if url not in urls:
            urls.append(url)

    return urls


def detect_external_urls(text: str) -> Dict[str, Any]:
    """
    Detect LinkedIn and portfolio URLs.

    Result:
        {
            "linkedin": URL or None,
            "portfolio": URL or None,
            "all": [...]
        }

    Important:
    - LinkedIn is detected only when linkedin.com exists.
    - Portfolio is any other personal/professional website.
    - GitHub, Facebook, Instagram, etc. are not treated as portfolio.
    - No URL is invented.
    """

    urls = extract_urls(text)

    linkedin = None
    portfolio = None

    ignored_domains = {
        "github.com",
        "facebook.com",
        "instagram.com",
        "twitter.com",
        "x.com",
        "youtube.com",
        "gmail.com",
        "outlook.com",
        "yahoo.com",
        "hotmail.com",
    }

    for url in urls:

        normalized = url.lower()

        # ----------------------------------------------------
        # LinkedIn
        # ----------------------------------------------------
        if "linkedin.com/" in normalized:

            if linkedin is None:
                linkedin = url

            continue

        # ----------------------------------------------------
        # Ignore social/contact platforms
        # ----------------------------------------------------
        if any(
            domain in normalized
            for domain in ignored_domains
        ):
            continue

        # ----------------------------------------------------
        # Portfolio
        # ----------------------------------------------------
        if portfolio is None:
            portfolio = url

    return {
        "linkedin": linkedin,
        "portfolio": portfolio,
        "all": urls,
    }


# ============================================================
# GENERAL HELPERS
# ============================================================

def dedupe(items: List[str]) -> List[str]:
    result = []
    seen = set()

    for item in items:
        clean = re.sub(r"\s+", " ", item.strip())

        if not clean:
            continue

        key = clean.lower()

        if key not in seen:
            seen.add(key)
            result.append(clean)

    return result


def join_wrapped_lines(lines: List[str]) -> List[str]:
    """
    Join PDF line wraps without destroying separate bullets.
    """

    result = []

    for raw in lines:
        text = strip_bullet(raw)

        if not text:
            continue

        if not result:
            result.append(text)
            continue

        previous = result[-1]

        # If source item is a new bullet, preserve it.
        if is_bullet(raw):
            result.append(text)
            continue

        # If previous ends with punctuation, normally start a new sentence.
        if re.search(r"[.!?:;]$", previous):
            result.append(text)
            continue

        # Otherwise this is likely a PDF line wrap.
        result[-1] = previous + " " + text

    return result


# ============================================================
# DOCUMENT MODEL
# ============================================================

@dataclass
class TextLine:
    text: str
    page: int = 1
    x0: float = 0
    y0: float = 0
    x1: float = 0
    y1: float = 0
    font_size: float = 0
    bold: bool = False
    bullet: bool = False


@dataclass
class Section:
    name: str
    title: str
    lines: List[TextLine]
    start_index: int


# ============================================================
# DOCUMENT EXTRACTION
# ============================================================

class DocumentExtractor:

    MIN_USABLE_TEXT = 40

    def extract(self, path: Path) -> Tuple[List[TextLine], str, bool]:
        if path.suffix.lower() == ".pdf":
            return self._pdf(path)

        if path.suffix.lower() == ".docx":
            return self._docx(path)

        raise ValueError("Only PDF and DOCX files are supported.")

    @staticmethod
    def _usable_text(text: str) -> bool:
        compact = re.sub(r"\s+", "", text or "")
        return len(compact) >= DocumentExtractor.MIN_USABLE_TEXT

    def _ocr_pdf(self, path: Path):
        """
        Optional OCR fallback for scanned/image-only PDFs.

        Requires:
            pip install pytesseract pillow

        and a working Tesseract installation available on PATH.
        """
        if pytesseract is None or Image is None:
            return [], "", False

        if pymupdf is None:
            return [], "", False

        try:
            doc = pymupdf.open(path)
        except Exception:
            return [], "", False

        ocr_lines = []

        try:
            for page_index, page in enumerate(doc, start=1):
                pix = page.get_pixmap(
                    matrix=pymupdf.Matrix(2.0, 2.0),
                    alpha=False,
                )

                image = Image.frombytes(
                    "RGB",
                    [pix.width, pix.height],
                    pix.samples,
                )

                text = pytesseract.image_to_string(image)

                for row_index, raw in enumerate(
                    text.splitlines()
                ):
                    value = raw.strip()

                    if not value:
                        continue

                    ocr_lines.append(
                        TextLine(
                            text=value,
                            page=page_index,
                            y0=float(row_index),
                            y1=float(row_index + 1),
                            font_size=0,
                            bold=False,
                            bullet=is_bullet(value),
                        )
                    )

        except Exception:
            doc.close()
            return [], "", False

        doc.close()

        full_text = "\n".join(
            line.text for line in ocr_lines
        )

        if not self._usable_text(full_text):
            return [], "", False

        return ocr_lines, full_text, True

    def _pdf(self, path: Path):
        if pymupdf is None:
            raise RuntimeError(
                "PyMuPDF is required. Install with: pip install PyMuPDF"
            )

        doc = pymupdf.open(path)
        lines = []

        for page_index, page in enumerate(doc, start=1):

            data = page.get_text("dict")

            for block in data.get("blocks", []):

                if block.get("type") != 0:
                    continue

                for line in block.get("lines", []):

                    spans = line.get("spans", [])

                    if not spans:
                        continue

                    text = "".join(
                        span.get("text", "")
                        for span in spans
                    ).strip()

                    if not text:
                        continue

                    x0 = min(
                        span["bbox"][0]
                        for span in spans
                    )

                    y0 = min(
                        span["bbox"][1]
                        for span in spans
                    )

                    x1 = max(
                        span["bbox"][2]
                        for span in spans
                    )

                    y1 = max(
                        span["bbox"][3]
                        for span in spans
                    )

                    font_size = max(
                        float(span.get("size", 0))
                        for span in spans
                    )

                    bold = any(
                        "bold" in str(
                            span.get("font", "")
                        ).lower()
                        for span in spans
                    )

                    lines.append(
                        TextLine(
                            text=text,
                            page=page_index,
                            x0=x0,
                            y0=y0,
                            x1=x1,
                            y1=y1,
                            font_size=font_size,
                            bold=bold,
                            bullet=is_bullet(text),
                        )
                    )

        doc.close()

        lines.sort(
            key=lambda line: (
                line.page,
                round(line.y0, 1),
                line.x0,
            )
        )

        full_text = "\n".join(
            line.text for line in lines
        )

        # Scanned PDF fallback.
        if not self._usable_text(full_text):
            ocr_lines, ocr_text, ocr_used = self._ocr_pdf(path)

            if ocr_used:
                return ocr_lines, ocr_text, True

        return lines, full_text, False

    def _pdf(self, path: Path):
        if pymupdf is None:
            raise RuntimeError(
                "PyMuPDF is required. Install with: pip install PyMuPDF"
            )

        doc = pymupdf.open(path)
        lines = []

        for page_index, page in enumerate(doc, start=1):

            data = page.get_text("dict")

            for block in data.get("blocks", []):

                if block.get("type") != 0:
                    continue

                for line in block.get("lines", []):

                    spans = line.get("spans", [])

                    if not spans:
                        continue

                    text = "".join(
                        span.get("text", "")
                        for span in spans
                    ).strip()

                    if not text:
                        continue

                    x0 = min(
                        span["bbox"][0]
                        for span in spans
                    )

                    y0 = min(
                        span["bbox"][1]
                        for span in spans
                    )

                    x1 = max(
                        span["bbox"][2]
                        for span in spans
                    )

                    y1 = max(
                        span["bbox"][3]
                        for span in spans
                    )

                    font_size = max(
                        float(span.get("size", 0))
                        for span in spans
                    )

                    bold = any(
                        "bold" in str(
                            span.get("font", "")
                        ).lower()
                        for span in spans
                    )

                    lines.append(
                        TextLine(
                            text=text,
                            page=page_index,
                            x0=x0,
                            y0=y0,
                            x1=x1,
                            y1=y1,
                            font_size=font_size,
                            bold=bold,
                            bullet=is_bullet(text),
                        )
                    )

        doc.close()

        # Reading order.
        lines.sort(
            key=lambda line: (
                line.page,
                round(line.y0, 1),
                line.x0,
            )
        )

        full_text = "\n".join(
            line.text for line in lines
        )

        return lines, full_text, False

    def _docx(self, path: Path):
        if Document is None:
            raise RuntimeError(
                "python-docx is required. Install with: pip install python-docx"
            )

        doc = Document(path)
        lines = []
        order = 0

        for paragraph in doc.paragraphs:

            text = paragraph.text.strip()

            if not text:
                continue

            bold = any(
                bool(run.bold)
                for run in paragraph.runs
            )

            lines.append(
                TextLine(
                    text=text,
                    page=1,
                    y0=order,
                    y1=order + 1,
                    font_size=0,
                    bold=bold,
                    bullet=is_bullet(text),
                )
            )

            order += 1

        # Resume tables are common.
        for table in doc.tables:

            for row in table.rows:

                for cell in row.cells:

                    text = cell.text.strip()

                    if not text:
                        continue

                    lines.append(
                        TextLine(
                            text=text,
                            page=1,
                            y0=order,
                            y1=order + 1,
                            font_size=0,
                            bold=False,
                            bullet=is_bullet(text),
                        )
                    )

                    order += 1

        full_text = "\n".join(
            line.text for line in lines
        )

        return lines, full_text, False


class TextNormalizer:

    def normalize_lines(self, lines: List[TextLine]):
        result = []

        for line in lines:

            text = normalize_unicode(
                clean_markdown_artifacts(line.text)
            ).strip()

            if not text:
                continue

            result.append(
                TextLine(
                    text=text,
                    page=line.page,
                    x0=line.x0,
                    y0=line.y0,
                    x1=line.x1,
                    y1=line.y1,
                    font_size=line.font_size,
                    bold=line.bold,
                    bullet=is_bullet(text),
                )
            )

        return result

    def full_text(self, lines):
        return normalize_text(
            "\n".join(
                line.text for line in lines
            )
        )


# ============================================================
# NLP PROCESSING - spaCy
# ============================================================
# spaCy is the NLP engine. Generic statistical NER is treated as
# evidence, not unquestioned truth. ResumeIQ adds a resume-specific
# EntityRuler and context validation before exposing entities.
# ============================================================

class NLPProcessor:

    MODEL_NAME = "en_core_web_sm"

    TECH_SKILLS = [
        "Python", "Java", "JavaScript", "TypeScript", "C++", "C#",
        "PHP", "Ruby", "Go", "Kotlin", "Swift", "React", "React.js",
        "Angular", "Vue.js", "Node.js", "Express.js", "Django", "Flask",
        "FastAPI", "HTML", "HTML5", "CSS", "CSS3", "Bootstrap",
        "Tailwind CSS", "jQuery", "SQL", "MySQL", "PostgreSQL", "SQLite",
        "MongoDB", "Oracle", "SQL Server", "Git", "GitHub", "Git & GitHub",
        "GitLab", "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud",
        "Machine Learning", "Deep Learning", "Artificial Intelligence",
        "Natural Language Processing", "NLP", "TensorFlow", "PyTorch",
        "scikit-learn", "Pandas", "NumPy", "spaCy", "Power BI", "Excel",
        "PowerPoint", "REST API", "RESTful API", "API", "Figma", "UI/UX",
        "UI/UX Design", "UI/UX Designing", ".NET", ".NET Framework", "SPSS",
        "Visual Studio", "Visual Studio Code", "IntelliJ IDEA", "PyCharm",
        "OOP", "Object-Oriented Programming", "Agile", "Scrum", "SDLC",
        "STLC", "Test Case Design", "Test Case Design & Execution",
        "Bug Reporting", "Bug Reporting & Defect Lifecycle",
        "Requirement Analysis", "Database Management",
        "System Analysis", "System Analysis and Development",
        "Data Entries", "Test Documentation"
    ]

    SOFT_SKILLS = [
        "Problem Solving", "Problem-Solving", "Teamwork", "Communication",
        "Written Communication", "Verbal Communication",
        "Written & Verbal Communication", "Excellent Communication",
        "Leadership", "Adaptability", "Time Management",
        "Critical Thinking", "Creativity", "Collaboration",
        "Attention to Detail", "Decision Making", "Decision-Making",
        "Team Player", "People Management", "Team Management",
        "Interpersonal Skills", "Fast Learner"
    ]

    DEGREE_TERMS = [
        "BSc", "B.Sc", "BEng", "B.Eng", "BCA", "BA", "BS",
        "MSc", "M.Sc", "MEng", "M.Eng", "MA", "MBA", "PhD", "Ph.D",
        "Higher National Diploma", "HND", "Diploma", "Advanced Level",
        "Ordinary Level", "GCSE", "O/L", "A/L"
    ]

    ADDRESS_WORDS = {
        "road", "street", "lane", "avenue", "drive", "boulevard",
        "place", "crescent", "highway", "district", "province",
        "city", "town", "village", "county", "state", "country"
    }

    BAD_PHRASES = {
        "email", "mobile", "phone", "telephone", "address", "profile",
        "summary", "objective", "education", "skills", "skill summary",
        "skills summary", "projects", "experience", "work experience",
        "languages", "certifications", "references", "technical skills",
        "soft skills", "technical", "frameworks", "tools", "platforms",
        "qa skills", "key focus area", "awarding body", "detail", "details",
        "ui", "qa", "lms", "oop", "network security"
    }

    def __init__(self):
        self.nlp = None
        self.model_loaded = False
        self.model_error = None
        self.entity_ruler_name = "resume_entity_ruler"

        if spacy is None:
            self.model_error = (
                "spaCy is not installed. Install with: pip install spacy"
            )
            return

        try:
            self.nlp = spacy.load(self.MODEL_NAME)
            self.model_loaded = True
        except Exception as exc:
            self.model_error = str(exc)
            try:
                self.nlp = spacy.blank("en")
                self.nlp.add_pipe("sentencizer")
            except Exception as fallback_exc:
                self.nlp = None
                self.model_error = (
                    f"{self.model_error}; fallback failed: {fallback_exc}"
                )

        if self.nlp is not None:
            self._add_resume_entity_ruler()

    def _add_resume_entity_ruler(self):
        if self.nlp is None or self.entity_ruler_name in self.nlp.pipe_names:
            return

        ruler = self.nlp.add_pipe(
            "entity_ruler",
            name=self.entity_ruler_name,
            last=True,
            config={"phrase_matcher_attr": "LOWER"},
        )

        patterns = (
            [{"label": "SKILL", "pattern": x} for x in self.TECH_SKILLS]
            + [{"label": "SOFT_SKILL", "pattern": x} for x in self.SOFT_SKILLS]
            + [{"label": "DEGREE", "pattern": x} for x in self.DEGREE_TERMS]
        )
        ruler.add_patterns(patterns)

    def process(self, text: str):
        if self.nlp is None or not text or not text.strip():
            return None
        return self.nlp(text)

    @staticmethod
    def _normalize(value: str) -> str:
        value = normalize_unicode(clean_markdown_artifacts(value))
        return re.sub(r"\s+", " ", value).strip()

    @classmethod
    def _dedupe(cls, values):
        result, seen = [], set()
        for value in values:
            value = cls._normalize(value)
            if not value:
                continue
            key = value.lower()
            if key not in seen:
                seen.add(key)
                result.append(value)
        return result

    @classmethod
    def _is_skill(cls, value):
        low = value.lower().strip()
        return any(
            low == item.lower()
            for item in cls.TECH_SKILLS + cls.SOFT_SKILLS
        )

    @classmethod
    def _bad(cls, value):
        low = value.lower().strip()

        if not low or low in cls.BAD_PHRASES:
            return True

        if cls._is_skill(value):
            return True

        if extract_email(value) or extract_phone(value):
            return True

        if looks_like_heading(value):
            return True

        if len(value) > 100:
            return True

        return False

    @classmethod
    def _address_component(cls, value):
        low = value.lower()

        if re.search(r"\b\d{1,6}\b", low):
            return True

        return any(
            re.search(rf"\b{re.escape(word)}\b", low)
            for word in cls.ADDRESS_WORDS
        )

    @classmethod
    def _valid_person(cls, value, candidate_name=None):
        value = cls._normalize(value)

        if cls._bad(value):
            return False

        # CandidateExtractor is authoritative for the actual candidate
        # name. Generic spaCy PERSON entities are accepted only when
        # they exactly match it.
        if candidate_name:
            candidate = cls._normalize(candidate_name)

            if value.lower() == candidate.lower():
                return True

            return False

        return False

    @classmethod
    def _valid_org(cls, value):
        value = cls._normalize(value)

        if cls._bad(value) or cls._address_component(value):
            return False

        low = value.lower()

        if re.search(
            r"\b(?:intern|internship|profile|summary|technical|"
            r"soft skills?|qa|ui/ux|network security|key focus area|"
            r"awarding body)\b",
            low,
        ):
            return False

        # A one/two-word technical item is more likely a skill than an ORG.
        if cls._is_skill(value):
            return False

        return True

    @classmethod
    def _valid_location(cls, value):
        value = cls._normalize(value)

        if cls._bad(value):
            return False

        if cls._is_skill(value):
            return False

        if re.search(
            r"^(?:key focus area|awarding body|profile|skills?)$",
            value,
            re.I,
        ):
            return False

        return True

    @classmethod
    def _valid_date(cls, value):
        value = cls._normalize(value)

        if re.fullmatch(
            r"(?i)(annual|yearly|daily|monthly|weekly|present|current|now)",
            value,
        ):
            return False

        return bool(
            re.search(
                r"\b(?:19|20)\d{2}\b"
                r"|\b(?:" + MONTHS + r")\b"
                r"|\b(?:present|current|now)\b",
                value,
                re.I,
            )
        )

    def _ruler_entities(self, doc, label):
        if doc is None:
            return []

        return self._dedupe([
            ent.text
            for ent in doc.ents
            if ent.label_ == label
        ])

    def extract_entities(self, doc, candidate_name=None):
        result = {
            "PERSON": [],
            "ORG": [],
            "GPE": [],
            "LOC": [],
            "DATE": [],
            "SKILL": self._ruler_entities(doc, "SKILL"),
            "SOFT_SKILL": self._ruler_entities(doc, "SOFT_SKILL"),
            "DEGREE": self._ruler_entities(doc, "DEGREE"),
        }

        if doc is None:
            return result

        for ent in doc.ents:
            value = self._normalize(ent.text)

            if ent.label_ == "PERSON":
                if self._valid_person(value, candidate_name):
                    result["PERSON"].append(value)

            elif ent.label_ == "ORG":
                if self._valid_org(value):
                    result["ORG"].append(value)

            elif ent.label_ == "GPE":
                if self._valid_location(value):
                    result["GPE"].append(value)

            elif ent.label_ == "LOC":
                if self._valid_location(value):
                    result["LOC"].append(value)

            elif ent.label_ == "DATE":
                if self._valid_date(value):
                    result["DATE"].append(value)

        for key in result:
            result[key] = self._dedupe(result[key])

        return result

    def extract_nlp_skills(self, doc):
        return {
            "technical": self._ruler_entities(doc, "SKILL"),
            "soft": self._ruler_entities(doc, "SOFT_SKILL"),
        }

    def get_metadata(self):
        return {
            "enabled": self.nlp is not None,
            "library": "spaCy" if self.nlp is not None else None,
            "model": (
                self.MODEL_NAME if self.model_loaded
                else (
                    "spaCy blank pipeline + EntityRuler"
                    if self.nlp is not None else None
                )
            ),
            "statistical_model_loaded": self.model_loaded,
            "fallback_used": (
                self.nlp is not None and not self.model_loaded
            ),
            "entity_filtering": True,
            "context_validation": True,
            "resume_domain_entity_ruler": self.nlp is not None,
            "error": self.model_error if self.nlp is None else None,
        }

# ============================================================
# SECTION DETECTION
# ============================================================

class SectionDetector:

    def detect(
        self,
        lines: List[TextLine],
    ) -> Tuple[List[Section], List[TextLine]]:

        sections = []
        preamble = []
        current = None

        for index, line in enumerate(lines):

            section_name = looks_like_heading(
                line.text
            )

            if section_name:

                if current:
                    current.lines = [
                        x for x in current.lines
                        if x.text.strip()
                    ]
                    sections.append(current)

                current = Section(
                    name=section_name,
                    title=line.text,
                    lines=[],
                    start_index=index,
                )

                continue

            if current:
                current.lines.append(line)
            else:
                preamble.append(line)

        if current:
            sections.append(current)

        return sections, preamble


# ============================================================
# CANDIDATE
# ============================================================

class CandidateExtractor:

    def extract(
        self,
        lines: List[TextLine],
        preamble: List[TextLine],
    ) -> Dict[str, Any]:

        full_text = "\n".join(
            line.text for line in lines
        )

        email = extract_email(full_text)
        phone = extract_phone(full_text)

        candidates = []

        # Strong header candidates.
        for index, line in enumerate(preamble[:30]):

            raw = line.text.strip()

            if not looks_like_person_name(raw):
                continue

            name = normalize_spaced_name(raw)

            score = 0.0

            if index < 5:
                score += 0.30

            if line.y0 < 180:
                score += 0.25

            if line.font_size >= 16:
                score += 0.25

            if line.bold:
                score += 0.10

            if 1 <= len(name.split()) <= 4:
                score += 0.10

            candidates.append(
                (score, name)
            )

        # Letter-spaced header.
        for line in preamble[:15]:

            raw = line.text.strip()

            tokens = raw.split()

            if (
                len(tokens) >= 8
                and all(
                    len(t) == 1 and t.isalpha()
                    for t in tokens
                )
            ):
                candidates.append(
                    (
                        0.95,
                        normalize_spaced_name(raw)
                    )
                )

        # Fallback search.
        if not candidates:

            for index, line in enumerate(lines[:40]):

                raw = line.text.strip()

                if not looks_like_person_name(raw):
                    continue

                name = normalize_spaced_name(raw)

                score = 0.35

                if index < 10:
                    score += 0.25

                if line.font_size >= 16:
                    score += 0.20

                candidates.append(
                    (score, name)
                )

        # Remove obvious contact/location candidates.
        filtered = []

        for score, name in candidates:

            if extract_email(name):
                continue

            if extract_phone(name):
                continue

            if re.search(
                r"\b(?:road|street|lane|city|country|"
                r"sri lanka|university|college)\b",
                name,
                re.I,
            ):
                continue

            filtered.append(
                (score, name)
            )

        if not filtered:

            address = extract_address(
                lines=lines,
                candidate_name=None,
                email=email,
                phone=phone,
            )

            return {
                "name": None,
                "email": email,
                "phone": phone,
                "address": address,
                "name_confidence": 0.0,
            }

        filtered.sort(
            key=lambda item: item[0],
            reverse=True,
        )

        score, name = filtered[0]

        address = extract_address(
            lines=lines,
            candidate_name=name,
            email=email,
            phone=phone,
        )

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "address": address,
            "name_confidence": round(
                min(0.99, max(0.60, score)),
                2,
            ),
        }


# ============================================================
# SUMMARY
# ============================================================

class SummaryExtractor:

    def extract(
        self,
        section: Optional[Section],
    ) -> Optional[str]:

        if not section:
            return None

        values = [
            strip_bullet(line.text)
            for line in section.lines
            if line.text.strip()
        ]

        return normalize_text(
            " ".join(values)
        ) or None


# ============================================================
# EDUCATION
# ============================================================

class EducationExtractor:

    DEGREE_PATTERNS = [
        r"\bb(?:\.?sc|\.?eng|eng|\.?s)\b",
        r"\bm(?:\.?sc|\.?eng|eng|\.?a)\b",
        r"\bph\.?\s*d\b",
        r"\bbachelor(?:'s)?\b",
        r"\bmaster(?:'s)?\b",
        r"\bhigher national diploma\b",
        r"\bhnd\b",
        r"\bdiploma\b",
        r"\bassociate(?:'s)? degree\b",
        r"\bdoctor(?:ate)?\b",
        r"\badvanced level\b",
        r"\bordinary level\b",
        r"\bogcse\b",
        r"\bgcse\b",
    ]

    INSTITUTION_WORDS = [
        "university",
        "college",
        "institute",
        "campus",
        "school",
        "academy",
        "polytechnic",
        "vidyalaya",
    ]

    def extract(self, section: Optional[Section]) -> List[Dict[str, Any]]:
        if not section:
            return []

        lines = [
            line for line in section.lines
            if line.text.strip()
        ]

        degree_indexes = [
            i for i, line in enumerate(lines)
            if self._is_degree_line(line.text)
        ]

        records = []

        for position, degree_index in enumerate(degree_indexes):

            next_degree_index = (
                degree_indexes[position + 1]
                if position + 1 < len(degree_indexes)
                else len(lines)
            )

            # Find the institution that belongs to this degree.
            institution_index = self._find_institution_before(
                lines,
                degree_index,
                previous_degree_index=(
                    degree_indexes[position - 1]
                    if position > 0 else -1
                ),
            )

            # Everything from the institution through the degree belongs
            # to this record. Details after the degree belong to this record
            # until the institution for the next qualification.
            next_institution_index = None

            if position + 1 < len(degree_indexes):
                next_institution_index = self._find_institution_before(
                    lines,
                    next_degree_index,
                    previous_degree_index=degree_index,
                )

            record_end = (
                next_institution_index
                if next_institution_index is not None
                else next_degree_index
            )

            start_index = (
                institution_index
                if institution_index is not None
                else degree_index
            )

            block = lines[start_index:record_end]

            relative_degree_index = degree_index - start_index

            record = self._parse_record(
                block,
                relative_degree_index,
            )

            if record:
                records.append(record)

        return self._dedupe(records)

    def _is_degree_line(self, text: str) -> bool:
        low = text.lower()

        return any(
            re.search(pattern, low, re.I)
            for pattern in self.DEGREE_PATTERNS
        )

    def _find_institution_before(
        self,
        lines: List[TextLine],
        degree_index: int,
        previous_degree_index: int,
    ) -> Optional[int]:

        # Prefer the closest institution-looking line immediately before
        # the degree, but never cross the previous degree.
        lower_bound = previous_degree_index + 1

        for i in range(degree_index - 1, lower_bound - 1, -1):
            value = lines[i].text.strip()

            if not value:
                continue

            if self._is_degree_line(value):
                break

            if extract_date_range(value)["matched_text"]:
                continue

            if re.match(
                r"(?i)^(awarding body|key focus area)\s*:",
                value,
            ):
                continue

            if any(
                word in value.lower()
                for word in self.INSTITUTION_WORDS
            ):
                return i

        # Fallback: closest non-date, non-detail line before degree.
        for i in range(degree_index - 1, lower_bound - 1, -1):
            value = lines[i].text.strip()

            if not value:
                continue

            if self._is_degree_line(value):
                break

            if extract_date_range(value)["matched_text"]:
                continue

            if re.match(
                r"(?i)^(awarding body|key focus area)\s*:",
                value,
            ):
                continue

            return i

        return None

    def _clean_institution(self, text: str) -> str:
        # PDF columns can leave very large horizontal gaps.
        # They are layout spacing, not meaningful text.
        text = re.sub(r"\s{2,}", " ", text).strip()
        return text

    def _parse_record(
        self,
        block: List[TextLine],
        degree_index: int,
    ) -> Optional[Dict[str, Any]]:

        if not block or not (0 <= degree_index < len(block)):
            return None

        degree_line = block[degree_index].text.strip()

        if not self._is_degree_line(degree_line):
            return None

        # First prefer a date on the degree line itself.
        date_info = extract_date_range(degree_line)

        # Otherwise search the complete local record.
        if not date_info["matched_text"]:
            date_info = extract_date_range(
                " ".join(line.text for line in block)
            )

        clean_degree = remove_date_range(degree_line)
        clean_degree = re.sub(r"\s{2,}", " ", clean_degree)
        clean_degree = clean_degree.strip(" -|:")

        institution = None

        # Institution is normally before the degree.
        for i in range(degree_index - 1, -1, -1):
            value = block[i].text.strip()

            if not value:
                continue

            if extract_date_range(value)["matched_text"]:
                continue

            if self._is_degree_line(value):
                continue

            if re.match(
                r"(?i)^(awarding body|key focus area)\s*:",
                value,
            ):
                continue

            institution = self._clean_institution(value)
            break

        # Fallback: institution after degree.
        if institution is None:
            for i in range(degree_index + 1, len(block)):
                value = block[i].text.strip()

                if not value:
                    continue

                if extract_date_range(value)["matched_text"]:
                    continue

                if re.match(
                    r"(?i)^(awarding body|key focus area)\s*:",
                    value,
                ):
                    continue

                if any(
                    word in value.lower()
                    for word in self.INSTITUTION_WORDS
                ):
                    institution = self._clean_institution(value)
                    break

        details = []

        if institution:
            details.append(institution)

        if date_info["start"] and date_info["end"]:
            details.append(
                f'{date_info["start"]} - {date_info["end"]}'
            )
        elif date_info["end"] == "Present":
            details.append("Present")

        details.append(clean_degree)

        # Keep only details belonging to this education record.
        for line in block[degree_index + 1:]:
            value = line.text.strip()

            if re.match(
                r"(?i)^(awarding body|key focus area)\s*:",
                value,
            ):
                details.append(
                    re.sub(r"\s{2,}", " ", value)
                )

        return {
            "degree": clean_degree,
            "institution": institution,
            "start_year": date_info["start_year"],
            "end_year": date_info["end_year"],
            "details": dedupe(details),
        }

    @staticmethod
    def _dedupe(records):
        result = []
        seen = set()

        for record in records:
            key = (
                (record.get("degree") or "").lower(),
                (record.get("institution") or "").lower(),
                record.get("start_year"),
                record.get("end_year"),
            )

            if key not in seen:
                seen.add(key)
                result.append(record)

        return result


# ============================================================
# EXPERIENCE
# ============================================================

class ExperienceExtractor:

    JOB_TERMS = re.compile(
        r"\b(?:software|web|frontend|backend|full[- ]?stack|"
        r"mobile|data|ml|ai|qa|test|devops|cloud|network|"
        r"system|database|product|project|business|marketing|"
        r"sales|hr|human resources|account|finance|designer|"
        r"analyst|consultant|manager|developer|engineer|"
        r"intern|internship)\b",
        re.I,
    )

    def extract(self, section: Optional[Section]) -> List[Dict[str, Any]]:
        if not section:
            return []

        lines = [line.text.strip() for line in section.lines if line.text.strip()]
        if not lines:
            return []

        records = []
        current = None
        bullets = ("-", "•", "*", "▪", "●", "◦", "‣", "➢", "➣", "✓", "✔")

        for line in lines:
            date = extract_date_range(line)
            clean_line = remove_date_range(line).strip()
            
            title_like = bool(self.JOB_TERMS.search(clean_line)) and len(clean_line) < 100
            
            # Start a new record if we find a date and already have one
            if current and date["matched_text"] and current.get("start_year"):
                # Look behind in the description for the title/company of this NEW job
                desc = current["description"]
                popped = []
                while len(desc) > 0 and len(desc[-1]) < 100:
                    last_line = desc[-1].strip()
                    if any(last_line.startswith(b) for b in bullets):
                        break
                    popped.insert(0, desc.pop())
                    if len(popped) >= 2:
                        break
                        
                self._finalize(current, records)
                current = None

                # Seed the new record with the popped lines
                if len(popped) > 0:
                    current = {
                        "job_title": None,
                        "company": None,
                        "start_year": date["start_year"],
                        "end_year": date["end_year"],
                        "description": [],
                    }
                    if len(popped) == 1:
                        current["job_title"] = popped[0]
                    elif len(popped) == 2:
                        if self.JOB_TERMS.search(popped[1]) and not self.JOB_TERMS.search(popped[0]):
                            current["company"] = popped[0]
                            current["job_title"] = popped[1]
                        else:
                            current["job_title"] = popped[0]
                            current["company"] = popped[1]

            if current is None:
                current = {
                    "job_title": None,
                    "company": None,
                    "start_year": date["start_year"],
                    "end_year": date["end_year"],
                    "description": [],
                }
                
            if date["matched_text"]:
                if not current.get("start_year"):
                    current["start_year"] = date["start_year"]
                if not current.get("end_year"):
                    current["end_year"] = date["end_year"]

            if not clean_line:
                continue

            if current["job_title"] is None and current["company"] is None:
                if self._looks_company(clean_line):
                    current["company"] = clean_line
                else:
                    current["job_title"] = clean_line
            elif current["job_title"] is not None and current["company"] is None:
                if title_like and not self.JOB_TERMS.search(current["job_title"]):
                    current["company"] = current["job_title"]
                    current["job_title"] = clean_line
                else:
                    current["company"] = clean_line
            elif current["company"] is not None and current["job_title"] is None:
                current["job_title"] = clean_line
            else:
                current["description"].append(clean_line)

        if current:
            self._finalize(current, records)

        return [record for record in records if self._credible(record)]

    @staticmethod
    def _looks_company(line: str) -> bool:
        low = line.lower()

        return (
            any(
                key in low
                for key in [
                    "ltd",
                    "limited",
                    "inc",
                    "llc",
                    "company",
                    "technologies",
                    "solutions",
                    "group",
                ]
            )
            or "|" in line
        )

    @staticmethod
    def _finalize(record, records):
        record["description"] = join_wrapped_lines(
            record.get("description", [])
        )
        records.append(record)

    @staticmethod
    def _credible(record) -> bool:
        if (
            record.get("start_year")
            or record.get("end_year")
            or record.get("company")
        ):
            return True

        text = " ".join(
            record.get("description", [])
        )

        return bool(
            re.search(
                r"\b(?:worked|working|employed|"
                r"responsible|developed|managed|"
                r"interned|internship|joined|promoted)\b",
                text,
                re.I,
            )
        )


# ============================================================
# PROJECTS
# ============================================================

class ProjectExtractor:

    def extract(
        self,
        section: Optional[Section],
    ) -> List[Dict[str, Any]]:

        if not section:
            return []

        lines = section.lines
        projects = []
        current = None

        for index, line in enumerate(lines):

            raw = line.text.strip()

            if not raw:
                continue

            # A standalone PDF bullet is only a marker.
            if is_bullet(raw) and not strip_bullet(raw):
                continue

            clean = strip_bullet(raw)

            # A non-bullet short line is a possible project title.
            if (
                not line.bullet
                and self._is_project_title(
                    clean,
                    lines,
                    index,
                )
            ):

                if current:
                    current["description"] = join_wrapped_lines(
                        current["description"]
                    )
                    projects.append(current)

                date = extract_date_range(clean)

                current = {
                    "name": remove_date_range(clean).strip(" -|"),
                    "start_year": date["start_year"],
                    "end_year": date["end_year"],
                    "description": [],
                }

                continue

            if current is None:
                continue

            # Date-only line immediately following a project title.
            # Example:
            # Grifindo Company Leave Management System (LMS) |
            # April 24 - December 2024
            date = extract_date_range(clean)

            if (
                date["matched_text"]
                and not re.search(
                    r"[A-Za-z].*[A-Za-z]",
                    remove_date_range(clean),
                )
            ):
                if not current.get("start_year"):
                    current["start_year"] = date["start_year"]
                if not current.get("end_year"):
                    current["end_year"] = date["end_year"]
                continue

            current["description"].append(clean)

        if current:
            current["description"] = join_wrapped_lines(
                current["description"]
            )
            if current.get("name"):
                projects.append(current)

        return [
            project
            for project in projects
            if project.get("name")
        ]

    @staticmethod
    def _is_project_title(
        text: str,
        lines: List[TextLine],
        index: int,
    ) -> bool:

        if not text:
            return False

        if len(text) > 120:
            return False

        # A date-only line is metadata, not a project title.
        date = extract_date_range(text)
        without_date = remove_date_range(text)

        if date["matched_text"] and not without_date.strip(" -|"):
            return False

        if re.search(r"[.!?]$", text):
            return False

        words = text.split()

        if not 1 <= len(words) <= 12:
            return False

        # Long prose is a description, not a title.
        if len(words) > 8:
            return False

        return True


# ============================================================
# SKILLS
# ============================================================

class SkillsExtractor:

    TECH_TERMS = [
        "python", "java", "javascript", "typescript", "c++", "c#",
        "php", "ruby", "go", "kotlin", "swift",
        "react", "react.js", "angular", "vue", "node.js", "nodejs",
        "express", "django", "flask", "fastapi",
        "html", "html5", "css", "css3", "bootstrap", "tailwind",
        "jquery", "sql", "mysql", "postgresql", "postgres", "sqlite",
        "mongodb", "oracle", "sql server",
        "git", "github", "gitlab", "docker", "kubernetes",
        "aws", "azure", "google cloud",
        "machine learning", "deep learning",
        "artificial intelligence", "natural language processing", "nlp",
        "tensorflow", "pytorch", "scikit-learn",
        "pandas", "numpy", "spacy",
        "power bi", "excel", "rest api", "restful api", "api",
        "figma", "ui/ux", "ui/ux design",
        ".net", ".net framework",
        "spss", "powerpoint", "visual studio code",
        "intellij idea", "pycharm",
    ]

    SOFT_TERMS = [
        "problem solving", "problem-solving",
        "teamwork", "communication",
        "written communication", "verbal communication",
        "written & verbal communication",
        "leadership", "adaptability",
        "time management", "critical thinking",
        "creativity", "collaboration",
        "attention to detail", "decision making",
        "decision-making", "team player",
        "people management", "team management",
        "interpersonal skills",
    ]

    LABEL_MAP = {
        "languages": "technical",
        "frameworks": "technical",
        "tools": "technical",
        "platforms": "technical",
        "technical skills": "technical",
        "technical": "technical",
        "technologies": "technical",
        "programming languages": "technical",
        "soft skills": "soft",
        "soft": "soft",
        "interpersonal skills": "soft",
        "qa skills": "technical",
    }

    def extract(
        self,
        section: Optional[Section],
    ) -> Dict[str, List[str]]:

        if not section:
            return {
                "technical": [],
                "soft": [],
            }

        technical = []
        soft = []

        raw_lines = [
            strip_bullet(line.text)
            for line in section.lines
            if line.text.strip()
        ]

        # PDF layouts often put:
        #
        # Soft Skills:
        # People Management, Communication, ...
        #
        # on two separate extracted lines. Reconstruct that logical row.
        lines = []
        i = 0

        while i < len(raw_lines):

            current = raw_lines[i].strip()

            if not current:
                i += 1
                continue

            if (
                current.endswith(":")
                and i + 1 < len(raw_lines)
                and raw_lines[i + 1].strip()
                and ":" not in raw_lines[i + 1]
            ):
                lines.append(
                    current + " " + raw_lines[i + 1].strip()
                )
                i += 2
                continue

            lines.append(current)
            i += 1

        explicit_categories = set()

        for line in lines:

            if ":" not in line:
                continue

            label, values = line.split(":", 1)

            label_key = re.sub(
                r"\s+",
                " ",
                label.lower().strip()
            )

            category = self.LABEL_MAP.get(
                label_key
            )

            if category == "technical":
                explicit_categories.add("technical")
                technical.extend(
                    self._split(values)
                )

            elif category == "soft":
                explicit_categories.add("soft")
                soft.extend(
                    self._split(values)
                )

        # Only use dictionary matching for categories that were NOT
        # explicitly provided by the resume.
        text = "\n".join(lines)

        if "technical" not in explicit_categories:
            technical.extend(
                self._find_terms(
                    text,
                    self.TECH_TERMS,
                )
            )

        if "soft" not in explicit_categories:
            soft.extend(
                self._find_terms(
                    text,
                    self.SOFT_TERMS,
                )
            )

        return {
            "technical": self._canonicalize(
                technical
            ),
            "soft": self._canonicalize(
                soft
            ),
        }

    @staticmethod
    def _split(value: str) -> List[str]:
        return [
            item.strip()
            for item in re.split(
                r",|;|\||•",
                value,
            )
            if item.strip()
        ]

    @staticmethod
    def _find_terms(
        text: str,
        terms: List[str],
    ) -> List[str]:

        found = []
        low = text.lower()

        for term in terms:

            pattern = (
                r"(?<![\w+#.-])"
                + re.escape(term.lower())
                + r"(?![\w+#.-])"
            )

            if re.search(
                pattern,
                low,
            ):
                found.append(term)

        return found

    @staticmethod
    def _canonicalize(
        values: List[str],
    ) -> List[str]:

        aliases = {
            "react": "React.js",
            "react.js": "React.js",
            "html": "HTML",
            "html5": "HTML5",
            "css": "CSS",
            "css3": "CSS3",
            "github": "GitHub",
            "git & github": "Git & GitHub",
            "javascript": "JavaScript",
            "python": "Python",
            "mysql": "MySQL",
            "php": "PHP",
            "c#": "C#",
            "nlp": "NLP",
            "natural language processing":
                "Natural Language Processing",
            "ui/ux": "UI/UX",
            "ui/ux design": "UI/UX Design",
            "problem-solving": "Problem Solving",
            "spss": "SPSS",
            "sp ss": "SPSS",
            "bootstrap": "Bootstrap",
            "sql": "SQL",
            "git": "Git",
            "pandas": "Pandas",
            "power bi": "Power BI",
            "excel": "Excel",
            "powerpoint": "PowerPoint",
            "figma": "Figma",
            "visual studio code": "Visual Studio Code",
            "intellij idea": "IntelliJ IDEA",
            "pycharm": "PyCharm",
            ".net": ".NET",
            ".net framework": ".NET Framework",
            "excellent communication": "Excellent Communication",
            "people management": "People Management",
            "time management": "Time Management",
            "team management": "Team Management",
        }

        result = []
        seen = set()

        for value in values:

            value = re.sub(
                r"\s+",
                " ",
                value.strip()
            )

            if not value:
                continue

            canonical = aliases.get(
                value.lower(),
                value,
            )

            key = canonical.lower()

            if key not in seen:
                seen.add(key)
                result.append(canonical)

        return result


# ============================================================
# LANGUAGES
# ============================================================

class LanguagesExtractor:

    LANGUAGE_NAMES = [
        "English", "Tamil", "Sinhala", "Sinhalese", "Hindi",
        "Malayalam", "Telugu", "Kannada", "Urdu", "Bengali",
        "Arabic", "French", "German", "Spanish", "Italian",
        "Portuguese", "Russian", "Chinese", "Mandarin", "Japanese",
        "Korean", "Nepali", "Marathi", "Gujarati", "Punjabi",
        "Dutch", "Swedish", "Norwegian", "Danish", "Finnish"
    ]

    def extract(self, section: Optional[Section]) -> List[str]:
        if not section:
            return []

        values = []

        for line in section.lines:
            text = strip_bullet(line.text).strip()

            if not text:
                continue

            # Support:
            # Languages: English, Tamil
            if ":" in text:
                label, content = text.split(":", 1)

                if "language" in label.lower():
                    values.extend(
                        self._split(content)
                    )
                    continue

            values.extend(
                self._split(text)
            )

        # Prefer actual language names and avoid prose.
        result = []

        for value in values:
            clean = re.sub(r"\s+", " ", value).strip()

            if not clean:
                continue

            if len(clean) > 40:
                continue

            if any(
                clean.lower() == language.lower()
                for language in self.LANGUAGE_NAMES
            ):
                result.append(clean)

        # If the section has explicit values that aren't in the
        # dictionary, keep short entries rather than dropping them.
        if not result:
            for value in values:
                clean = re.sub(
                    r"\s+", " ", value
                ).strip(" ,;|:-")

                if (
                    clean
                    and len(clean) <= 30
                    and not looks_like_heading(clean)
                ):
                    result.append(clean)

        return dedupe(result)

    @staticmethod
    def _split(value: str) -> List[str]:
        return [
            item.strip()
            for item in re.split(
                r",|;|\||•",
                value,
            )
            if item.strip()
        ]


# ============================================================
# CERTIFICATIONS
# ============================================================

class CertificationExtractor:

    def extract(
        self,
        section: Optional[Section],
    ) -> List[str]:

        if not section:
            return []

        return dedupe([
            strip_bullet(line.text)
            for line in section.lines
            if line.text.strip()
        ])


# ============================================================
# VALIDATION
# ============================================================

class ResumeValidator:

    def validate(
        self,
        result: Dict[str, Any],
    ) -> Dict[str, Any]:

        warnings = []

        candidate = result["candidate"]

        if not candidate.get("name"):
            warnings.append(
                "Candidate name could not be identified confidently."
            )

        if not candidate.get("email"):
            warnings.append(
                "Email address was not detected."
            )

        if not candidate.get("phone"):
            warnings.append(
                "Phone number was not detected."
            )

        if not result.get("education"):
            warnings.append(
                "No education record was confidently detected."
            )

        # Warn per education record if a date is absent.
        for record in result.get("education", []):

            if (
                not record.get("start_year")
                and not record.get("end_year")
            ):
                warnings.append(
                    f'Education date not found for "{record.get("degree")}".'
                )

        if (
            not result.get("skills", {}).get("technical")
            and not result.get("skills", {}).get("soft")
        ):
            warnings.append(
                "No skills were confidently detected."
            )

        if (
            any(
                item.get("name") == "languages"
                for item in result.get("sections_detected", [])
            )
            and not result.get("languages")
        ):
            warnings.append(
                "A language section was detected, but no language "
                "values were confidently extracted."
            )

        nlp_info = result.get("nlp", {})

        parser_info = result.get("parser", {})

        if (
            not parser_info.get("ocr_used")
            and not parser_info.get("ocr_available")
        ):
            warnings.append(
                "Optional OCR is not installed. Image-only/scanned "
                "PDFs may require OCR for complete extraction."
            )

        if not nlp_info.get("enabled"):
            warnings.append(
                "spaCy NLP processing was unavailable."
            )

        elif nlp_info.get("fallback_used"):
            warnings.append(
                "spaCy statistical model was not loaded; "
                "domain EntityRuler fallback was used. "
                "Install en_core_web_sm for full statistical NLP."
            )

        return {
            "valid": not warnings,
            "warnings": warnings,
        }



def calculate_extraction_quality(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Conservative quality/coverage report.

    This is NOT an accuracy claim. It reports whether expected resume
    fields were actually populated and whether the NLP pipeline ran.
    """

    candidate = result.get("candidate", {})
    skills = result.get("skills", {})

    checks = {
        "name": bool(candidate.get("name")),
        "email": bool(candidate.get("email")),
        "phone": bool(candidate.get("phone")),
        "address": bool(candidate.get("address")),
        "summary": bool(result.get("summary")),
        "education": bool(result.get("education")),
        "work_experience": bool(result.get("work_experience")),
        "projects": bool(result.get("projects")),
        "technical_skills": bool(skills.get("technical")),
        "soft_skills": bool(skills.get("soft")),
        "certifications": bool(result.get("certifications")),
        "languages": bool(result.get("languages")),
        "nlp": bool(
            result.get("nlp", {}).get("enabled")
        ),
    }

    populated = sum(
        1 for value in checks.values()
        if value
    )

    return {
        "fields_checked": len(checks),
        "fields_populated": populated,
        "coverage_ratio": round(
            populated / len(checks),
            2
        ) if checks else 0.0,
        "field_status": checks,
        "note": (
            "Coverage is not extraction accuracy. A missing field may "
            "simply mean the resume did not contain that information."
        ),
    }


# ============================================================
# MAIN PARSER
# ============================================================

class ResumeIQParser:

    def __init__(self):
        self.document = DocumentExtractor()
        self.normalizer = TextNormalizer()
        self.section_detector = SectionDetector()

        # Real spaCy NLP layer.
        self.nlp_processor = NLPProcessor()

        self.candidate = CandidateExtractor()
        self.summary = SummaryExtractor()
        self.education = EducationExtractor()
        self.experience = ExperienceExtractor()
        self.projects = ProjectExtractor()
        self.skills = SkillsExtractor()
        self.languages = LanguagesExtractor()
        self.certifications = CertificationExtractor()
        self.validator = ResumeValidator()

    def parse(
        self,
        file_path: str,
    ) -> Dict[str, Any]:

        path = Path(
            file_path
        ).expanduser()

        if not path.exists():
            raise FileNotFoundError(
                f"Resume not found: {path}"
            )

        if path.suffix.lower() not in {
            ".pdf",
            ".docx",
        }:
            raise ValueError(
                "Only PDF and DOCX files are supported."
            )

        raw_lines, raw_text, ocr_used = (
            self.document.extract(path)
        )

        lines = self.normalizer.normalize_lines(
            raw_lines
        )

        full_text = self.normalizer.full_text(
            lines
        )

        detected_sections, preamble = (
            self.section_detector.detect(
                lines
            )
        )

        # Keep the first section of a type. If duplicate headings exist,
        # merge them instead of silently losing information.
        section_map = {}

        for section in detected_sections:

            if section.name not in section_map:
                section_map[section.name] = Section(
                    name=section.name,
                    title=section.title,
                    lines=list(section.lines),
                    start_index=section.start_index,
                )

            else:
                section_map[
                    section.name
                ].lines.extend(
                    section.lines
                )

        candidate = self.candidate.extract(
            lines,
            preamble,
        )


        # -----------------------------------------------------
        # spaCy NLP PROCESSING
        # -----------------------------------------------------
        # The same normalized resume text used by the deterministic
        # extractors is passed through spaCy.
        nlp_doc = self.nlp_processor.process(
            full_text
        )

        nlp_entities = self.nlp_processor.extract_entities(
            nlp_doc,
            candidate_name=candidate.get("name"),
        )

        nlp_skills = self.nlp_processor.extract_nlp_skills(
            nlp_doc
        )

        nlp_metadata = self.nlp_processor.get_metadata()

        if len(
            re.sub(r"\s", "", full_text)
        ) < 20:
            raise ValueError(
                "The document contains too little readable text. "
                "OCR may be required."
            )

        summary = self.summary.extract(
            section_map.get("summary")
        )

        education = self.education.extract(
            section_map.get("education")
        )

        experience = self.experience.extract(
            section_map.get("experience")
        )

        projects = self.projects.extract(
            section_map.get("projects")
        )

        skills = self.skills.extract(
            section_map.get("skills")
        )

        languages = self.languages.extract(
            section_map.get("languages")
        )

        # Merge deterministic resume skills with spaCy NLP skills.
        # The deterministic extractor remains authoritative for
        # explicitly labelled skill sections; spaCy adds NLP-detected
        # skills that may occur elsewhere in the resume.
        skills = {
            "technical": dedupe(
                skills.get("technical", [])
                + nlp_skills.get("technical", [])
            ),
            "soft": dedupe(
                skills.get("soft", [])
                + nlp_skills.get("soft", [])
            ),
        }

        certifications = self.certifications.extract(
            section_map.get("certifications")
        )

        urls = detect_external_urls(full_text)

        result = {
            "parser": {
                "name":
                    "ResumeIQ Universal Hybrid NLP Resume Parser",
                "version": VERSION,
                "processing_status":
                    "completed",
                "ocr_used":
                    ocr_used,
                "ocr_available":
                    pytesseract is not None and Image is not None,
            },

            "resume": {
                "file_name":
                    path.name,
                "file_path":
                    str(path.resolve()),
                "file_type":
                    path.suffix.lower(),
            },

            "candidate":
                candidate,

            "nlp": {
                "enabled":
                    nlp_metadata["enabled"],
                "library":
                    nlp_metadata["library"],
                "model":
                    nlp_metadata["model"],
                "statistical_model_loaded":
                    nlp_metadata["statistical_model_loaded"],
                "fallback_used":
                    nlp_metadata["fallback_used"],
                "entities":
                    nlp_entities,
            },

            "summary":
                summary,

            "education":
                education,

            "work_experience":
                experience,

            "projects":
                projects,

            "skills":
                skills,

            "languages":
                languages,

            "certifications":
                certifications,

            "detected_urls":
                urls,
                
            "extracted_text":
                full_text,

            "sections_detected": [
                {
                    "name":
                        section.name,
                    "title":
                        section.title,
                }
                for section in detected_sections
            ],

            "validation": {},
        }

        result["validation"] = (
            self.validator.validate(
                result
            )
        )

        result["field_coverage"] = (
            calculate_extraction_quality(
                result
            )
        )

        # Backward-compatible alias for existing frontend consumers.
        result["extraction_quality"] = result["field_coverage"]

        return result


# ============================================================
# CLI
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description=
        "ResumeIQ Universal Hybrid NLP Resume Parser v8.0"
    )

    parser.add_argument(
        "resume",
        nargs="?",
        help="Path to PDF or DOCX resume",
    )

    parser.add_argument(
        "--output",
        help="Optional JSON output path",
    )

    args = parser.parse_args()

    print("=" * 76)
    print(
        "ResumeIQ - Universal Hybrid NLP Resume Parser v7.0"
    )
    print("=" * 76)
    print(
        f"Running file: {os.path.abspath(__file__)}"
    )
    print(
        f"Parser version: {VERSION}"
    )
    print("=" * 76)

    path = args.resume

    if not path:
        path = input(
            "\nEnter resume path: "
        ).strip().strip('"')

    try:

        result = ResumeIQParser().parse(
            path
        )

        print(
            json.dumps(
                result,
                indent=4,
                ensure_ascii=False,
            )
        )

        output = args.output

        if not output:

            resume_path = Path(path)

            output = str(
                resume_path.with_name(
                    resume_path.stem
                    + "_parsed.json"
                )
            )

        with open(
            output,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                result,
                file,
                indent=4,
                ensure_ascii=False,
            )

        print(
            f"\nSaved: {output}"
        )

    except Exception as exc:

        print(
            f"\nERROR: {exc}"
        )

        sys.exit(1)


if __name__ == "__main__":
    main()