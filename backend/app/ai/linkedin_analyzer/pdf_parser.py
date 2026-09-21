import json
import re
from pathlib import Path

import pdfplumber


# ============================================================
# RESUMEIQ
# LINKEDIN PDF PARSER
# ============================================================
#
# IMPORTANT
# ------------------------------------------------------------
# This parser extracts information ONLY from the downloaded
# LinkedIn PDF.
#
# It does NOT access LinkedIn.
# It does NOT generate missing information.
#
# The parser understands that LinkedIn PDFs can contain
# different section names such as:
#
#   Summary
#   About
#   Top Skills
#   Skills
#   Skills & Endorsements
#   Experience
#   Work Experience
#   Education
#   Certifications
#   Licenses & Certifications
#   Projects
#   Languages
#
# It also uses PDF coordinates so LEFT and RIGHT columns
# are processed separately.
# ============================================================


# ============================================================
# TEXT CLEANING
# ============================================================

def clean(text):

    if text is None:
        return ""

    text = str(text)

    text = text.replace(
        "\xa0",
        " "
    )

    text = text.replace(
        "\u00ad",
        ""
    )

    text = text.replace(
        "\ufeff",
        ""
    )

    text = text.replace(
        "\u200b",
        ""
    )

    text = re.sub(
        r"[ \t]+",
        " ",
        text
    )

    return text.strip()


def norm(text):

    return clean(
        text
    ).casefold()


# ============================================================
# LINKEDIN SECTION ALIASES
# ============================================================

SECTION_ALIASES = {

    "summary": {
        "summary",
        "about",
        "about me",
        "profile summary",
        "professional summary",
        "career summary",
        "personal summary",
        "professional profile",
        "career profile",
        "professional overview",
        "career overview",
        "overview",
        "introduction",
    },

    "experience": {
        "experience",
        "work experience",
        "professional experience",
        "employment experience",
        "employment history",
        "work history",
        "career history",
        "career experience",
        "professional history",
        "employment",
        "career",
    },

    "education": {
        "education",
        "educational background",
        "academic background",
        "academic history",
        "education history",
        "academic qualifications",
        "educational qualifications",
        "qualifications",
    },

    "skills": {
        "skills",
        "skill",
        "top skills",
        "key skills",
        "core skills",
        "technical skills",
        "professional skills",
        "relevant skills",
        "primary skills",
        "areas of expertise",
        "area of expertise",
        "expertise",
        "core competencies",
        "key competencies",
        "competencies",
        "technical competencies",
        "professional competencies",
        "professional expertise",
        "technical expertise",
        "skills and expertise",
        "skills & expertise",
        "skills and endorsements",
        "skills & endorsements",
    },

    "certifications": {
        "certifications",
        "certification",
        "licenses and certifications",
        "licenses & certifications",
        "licenses certifications",
        "professional certifications",
        "professional certificates",
        "certificates",
        "credentials",
        "licences and certifications",
        "licences & certifications",
    },

    "projects": {
        "projects",
        "project",
        "project experience",
        "personal projects",
        "academic projects",
        "professional projects",
        "selected projects",
        "featured projects",
        "key projects",
        "notable projects",
    },

    "languages": {
        "languages",
        "language",
        "language skills",
        "languages spoken",
        "spoken languages",
        "language proficiency",
        "languages proficiency",
    },

    "volunteer_experience": {
        "volunteer experience",
        "volunteering",
        "volunteer work",
        "voluntary work",
        "volunteer activities",
        "community involvement",
        "community service",
    },

    "publications": {
        "publications",
        "publication",
        "research publications",
        "papers",
        "research papers",
        "articles",
        "published works",
    },

    "awards": {
        "awards",
        "award",
        "honors and awards",
        "honours and awards",
        "honors",
        "honours",
        "achievements",
        "recognition",
    },

    "courses": {
        "courses",
        "coursework",
        "training",
        "trainings",
        "professional training",
        "relevant coursework",
        "completed courses",
    },
}


# ============================================================
# NORMALIZE SECTION HEADING
# ============================================================

def normalize_heading(text):

    text = clean(
        text
    ).casefold()

    text = re.sub(
        r"^[•·▪◦●■\-\–—|:]+",
        "",
        text
    )

    text = re.sub(
        r"[•·▪◦●■\-\–—|:]+$",
        "",
        text
    )

    # Examples:
    #
    # Skills (10)
    # Certifications (5)
    #
    text = re.sub(
        r"\(\s*\d+\s*\)$",
        "",
        text
    )

    # Example:
    #
    # Skills 10
    text = re.sub(
        r"\s+\d+\+?$",
        "",
        text
    )

    text = text.replace(
        "&",
        " and "
    )

    text = re.sub(
        r"[/|,:]+",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


def canonical_section(text):

    normalized = normalize_heading(
        text
    )

    if not normalized:
        return None

    for canonical, aliases in SECTION_ALIASES.items():

        normalized_aliases = {
            normalize_heading(alias)
            for alias in aliases
        }

        if normalized in normalized_aliases:

            return canonical

    return None


# ============================================================
# NOISE
# ============================================================

NOISE_PHRASES = {

    "linkedin corporation",
    "privacy & terms",
    "privacy and terms",
    "community guidelines",
    "accessibility",
    "talent solutions",
    "marketing solutions",
    "sales solutions",
    "safety center",
}


def is_noise(text):

    n = norm(
        text
    )

    if not n:
        return True

    if n.startswith(
        "page "
    ):
        return True

    if n in {
        "1",
        "2",
        "3",
        "4",
        "5",
    }:
        return True

    for phrase in NOISE_PHRASES:

        if phrase in n:
            return True

    return False


# ============================================================
# DATE REGEX
# ============================================================

MONTH_PATTERN = (
    r"(?:"
    r"Jan(?:uary)?|"
    r"Feb(?:ruary)?|"
    r"Mar(?:ch)?|"
    r"Apr(?:il)?|"
    r"May|"
    r"Jun(?:e)?|"
    r"Jul(?:y)?|"
    r"Aug(?:ust)?|"
    r"Sep(?:t(?:ember)?)?|"
    r"Oct(?:ober)?|"
    r"Nov(?:ember)?|"
    r"Dec(?:ember)?"
    r")"
)


DATE_RANGE_RE = re.compile(
    rf"(?i)^\s*"
    rf"({MONTH_PATTERN}\s+\d{{4}})"
    rf"\s*[-–—]\s*"
    rf"(Present|{MONTH_PATTERN}\s+\d{{4}})"
    rf"(?:\s*\(([^)]*)\))?"
    rf"\s*$"
)


DURATION_RE = re.compile(
    r"(?i)^\s*"
    r"\d+\s+years?"
    r"(?:\s+\d+\s+months?)?"
    r"\s*$"
)


YEAR_RANGE_RE = re.compile(
    r"(?i)"
    r"(\d{4})\s*[-–—]\s*(\d{4})"
)


YEAR_RE = re.compile(
    r"\b(?:19|20)\d{2}\b"
)


# ============================================================
# PDF WORD EXTRACTION
# ============================================================

def extract_pdf_pages(
    pdf_path
):

    pages = []

    with pdfplumber.open(
        pdf_path
    ) as pdf:

        for page_number, page in enumerate(
            pdf.pages,
            start=1
        ):

            words = page.extract_words(
                x_tolerance=2,
                y_tolerance=3,
                keep_blank_chars=False,
                extra_attrs=["size"]
            )

            pages.append(
                {
                    "page":
                        page_number,

                    "width":
                        float(page.width),

                    "height":
                        float(page.height),

                    "words":
                        words,
                }
            )

    return pages


# ============================================================
# WORDS -> LINES
# ============================================================

def words_to_lines(
    words,
    page_number
):

    if not words:
        return []

    sorted_words = sorted(
        words,
        key=lambda w: (
            float(w["top"]),
            float(w["x0"])
        )
    )

    lines = []

    for word in sorted_words:

        top = float(
            word["top"]
        )

        matched = None

        for line in lines:

            if abs(
                line["top"]
                -
                top
            ) <= 3:

                matched = line
                break

        if matched is None:

            matched = {
                "page":
                    page_number,

                "top":
                    top,

                "words":
                    [],
            }

            lines.append(
                matched
            )

        matched["words"].append(
            word
        )

    result = []

    for line in lines:

        line["words"].sort(
            key=lambda w:
                float(w["x0"])
        )

        text = clean(
            " ".join(
                w["text"]
                for w in line["words"]
            )
        )

        if not text:
            continue

        line["text"] = text

        line["x0"] = min(
            float(w["x0"])
            for w in line["words"]
        )

        line["x1"] = max(
            float(w["x1"])
            for w in line["words"]
        )

        line["font_size"] = max(
            float(
                w.get(
                    "size",
                    0
                )
            )
            for w in line["words"]
        )

        result.append(
            line
        )

    result.sort(
        key=lambda line:
            line["top"]
    )

    return result


# ============================================================
# COLUMN DETECTION
# ============================================================

def extract_columns(
    pdf_path
):

    raw_pages = extract_pdf_pages(
        pdf_path
    )

    pages = []

    for page in raw_pages:

        words = page["words"]

        if not words:

            pages.append(
                {
                    "page":
                        page["page"],

                    "left":
                        [],

                    "right":
                        [],
                }
            )

            continue

        width = page["width"]

        # LinkedIn Save-to-PDF normally has a
        # narrow left sidebar and a wider right
        # content area.
        #
        # 34% works well for standard LinkedIn PDFs.

        split_x = width * 0.34

        left_words = []
        right_words = []

        for word in words:

            center = (
                float(word["x0"])
                +
                float(word["x1"])
            ) / 2

            if center < split_x:

                left_words.append(
                    word
                )

            else:

                right_words.append(
                    word
                )

        left_lines = words_to_lines(
            left_words,
            page["page"]
        )

        right_lines = words_to_lines(
            right_words,
            page["page"]
        )

        pages.append(
            {
                "page":
                    page["page"],

                "left":
                    left_lines,

                "right":
                    right_lines,
            }
        )

    return pages


# ============================================================
# SECTION EXTRACTION FROM ONE COLUMN
# ============================================================

def extract_section(
    lines,
    target
):

    target = canonical_section(
        target
    )

    if not target:
        return []

    start = None

    for index, line in enumerate(
        lines
    ):

        heading = canonical_section(
            line["text"]
        )

        if heading == target:

            start = index + 1
            break

    if start is None:

        return []

    result = []

    for line in lines[start:]:

        text = clean(
            line["text"]
        )

        if not text:
            continue

        heading = canonical_section(
            text
        )

        # Any new LinkedIn section ends the
        # current section.
        if (
            heading is not None
            and
            heading != target
        ):

            break

        if is_noise(
            text
        ):
            continue

        result.append(
            line
        )

    return result


# ============================================================
# UNIQUE
# ============================================================

def unique(
    values
):

    result = []

    seen = set()

    for value in values:

        value = clean(
            value
        )

        if not value:
            continue

        key = norm(
            value
        )

        if key not in seen:

            seen.add(
                key
            )

            result.append(
                value
            )

    return result


# ============================================================
# FULL NAME
# ============================================================

def extract_full_name(
    pages
):

    if not pages:
        return ""

    right = pages[0]["right"]

    candidates = []

    for line in right:

        if line["top"] > 250:
            break

        text = clean(
            line["text"]
        )

        text = re.sub(
            r"(?i)^contact\s+",
            "",
            text
        )

        if not text:
            continue

        if "linkedin.com/in/" in norm(
            text
        ):
            continue

        if canonical_section(
            text
        ):
            continue

        if is_noise(
            text
        ):
            continue

        if len(text) > 80:
            continue

        # Avoid location.
        if looks_like_location(
            text
        ):
            continue

        candidates.append(
            line
        )

    if not candidates:
        return ""

    # Name is normally the largest
    # text in the profile header.
    candidates.sort(
        key=lambda line: (
            -line.get(
                "font_size",
                0
            ),
            line["top"]
        )
    )

    name = candidates[0]["text"]

    name = re.sub(
        r"(?i)^contact\s+",
        "",
        name
    )

    return clean(
        name
    )


# ============================================================
# LOCATION DETECTION
# ============================================================

def looks_like_location(
    text
):

    n = norm(
        text
    )

    location_terms = [

        "india",
        "sri lanka",
        "hyderabad",
        "telangana",
        "bengaluru",
        "bangalore",
        "mumbai",
        "delhi",
        "new delhi",
        "noida",
        "chennai",
        "pune",
        "kolkata",
        "kerala",
        "karnataka",
        "maharashtra",
        "singapore",
        "dubai",
        "uae",
        "united states",
        "usa",
        "united kingdom",
        "uk",
        "canada",
        "australia",
        "remote",
        "area,",
        "district",
        "province",
    ]

    return any(
        term in n
        for term in location_terms
    )


# ============================================================
# PROFILE HEADER
# ============================================================

def extract_header(
    pages
):

    if not pages:

        return {
            "full_name": "",
            "headline": "",
            "location": "",
        }

    right = pages[0]["right"]

    full_name = extract_full_name(
        pages
    )

    name_index = None

    for index, line in enumerate(
        right
    ):

        if normalize_heading(
            line["text"]
        ) == normalize_heading(
            full_name
        ):

            name_index = index
            break

    headline = ""
    location = ""

    if name_index is not None:

        for line in right[
            name_index + 1:
            name_index + 10
        ]:

            text = clean(
                line["text"]
            )

            if not text:
                continue

            if "linkedin.com/in/" in norm(
                text
            ):
                continue

            if canonical_section(
                text
            ):
                continue

            if is_noise(
                text
            ):
                continue

            if looks_like_location(
                text
            ):

                if not location:

                    location = text

                continue

            if not headline:

                headline = text

    return {
        "full_name":
            full_name,

        "headline":
            headline,

        "location":
            location,
    }


# ============================================================
# LINKEDIN URL
# ============================================================

def clean_candidate_url(
    url
):

    url = clean(
        url
    )

    url = (
        url
        .replace("[", "")
        .replace("]", "")
        .replace("(", "")
        .replace(")", "")
    )

    url = url.split(
        "?"
    )[0]

    return url.rstrip(
        "/"
    ) + "/"


# ============================================================
# SUMMARY / ABOUT
# ============================================================

def extract_summary(
    pages
):

    summary = []

    for page in pages:

        right = page["right"]

        section = extract_section(
            right,
            "summary"
        )

        if not section:

            continue

        for line in section:

            text = clean(
                line["text"]
            )

            if not text:
                continue

            if is_noise(
                text
            ):
                continue

            summary.append(
                text
            )

        # LinkedIn summary is normally
        # entirely on the right content
        # column.
        if summary:
            break

    return clean(
        " ".join(
            unique(summary)
        )
    )


# ============================================================
# SKILLS
# ============================================================

def extract_skills(
    pages
):

    skills = []

    for page in pages:

        left = page["left"]

        section = extract_section(
            left,
            "skills"
        )

        # Important:
        #
        # Some PDFs say:
        #
        # Top Skills
        #
        if not section:

            section = extract_section(
                left,
                "top skills"
            )

        for line in section:

            text = clean(
                line["text"]
            )

            if not text:
                continue

            if is_noise(
                text
            ):
                continue

            # LinkedIn can place several skills
            # on the same line.
            parts = re.split(
                r"[•|]",
                text
            )

            for part in parts:

                part = clean(
                    part
                )

                if part:
                    skills.append(
                        part
                    )

    return unique(
        skills
    )


# ============================================================
# CERTIFICATIONS
# ============================================================

def extract_certifications(
    pages
):

    certifications = []

    for page in pages:

        left = page["left"]

        section = extract_section(
            left,
            "certifications"
        )

        if not section:

            continue

        for line in section:

            text = clean(
                line["text"]
            )

            if not text:
                continue

            if is_noise(
                text
            ):
                continue

            certifications.append(
                text
            )

    return unique(
        certifications
    )


# ============================================================
# LANGUAGES
# ============================================================

def extract_languages(
    pages
):

    languages = []

    for page in pages:

        left = page["left"]

        section = extract_section(
            left,
            "languages"
        )

        if not section:
            continue

        for line in section:

            text = clean(
                line["text"]
            )

            if not text:
                continue

            match = re.match(
                r"^(.*?)\s*\((.*?)\)\s*$",
                text
            )

            if match:

                languages.append(
                    {
                        "name":
                            clean(
                                match.group(1)
                            ),

                        "proficiency":
                            clean(
                                match.group(2)
                            ),
                    }
                )

            else:

                languages.append(
                    {
                        "name":
                            text,

                        "proficiency":
                            "",
                    }
                )

    result = []

    seen = set()

    for item in languages:

        key = (
            norm(
                item["name"]
            ),
            norm(
                item["proficiency"]
            )
        )

        if key not in seen:

            seen.add(
                key
            )

            result.append(
                item
            )

    return result


# ============================================================
# DATE RANGE
# ============================================================

def parse_date_range(
    text
):

    match = DATE_RANGE_RE.match(
        clean(text)
    )

    if not match:

        return None

    return {

        "start_date":
            clean(
                match.group(1)
            ),

        "end_date":
            clean(
                match.group(2)
            ),

        "duration":
            clean(
                match.group(3)
                or
                ""
            ),
    }


# ============================================================
# EXPERIENCE
# ============================================================

def extract_experience(
    pages
):

    # Experience belongs to the
    # RIGHT content column.
    lines = []

    for page in pages:

        for line in page["right"]:

            copy = dict(
                line
            )

            copy["page"] = page["page"]

            lines.append(
                copy
            )

    # Find Experience.
    start = None

    for index, line in enumerate(
        lines
    ):

        if canonical_section(
            line["text"]
        ) == "experience":

            start = index + 1
            break

    if start is None:

        return []

    section_lines = []

    for line in lines[start:]:

        heading = canonical_section(
            line["text"]
        )

        if heading in {
            "education",
            "projects",
            "volunteer_experience",
            "publications",
            "awards",
            "courses",
        }:

            break

        if is_noise(
            line["text"]
        ):
            continue

        section_lines.append(
            line
        )

    # Find every date line.
    date_positions = []

    for index, line in enumerate(
        section_lines
    ):

        date_info = parse_date_range(
            line["text"]
        )

        if date_info:

            date_positions.append(
                (
                    index,
                    date_info
                )
            )

    if not date_positions:

        return []

    results = []

    current_company = ""

    for role_number, (
        date_index,
        date_info
    ) in enumerate(
        date_positions
    ):

        position_index = (
            date_index - 1
        )

        if position_index < 0:
            continue

        position = clean(
            section_lines[
                position_index
            ]["text"]
        )

        if not position:
            continue

        company = ""

        # Search backwards for company.
        search_index = (
            position_index - 1
        )

        while search_index >= 0:

            candidate = clean(
                section_lines[
                    search_index
                ]["text"]
            )

            if not candidate:

                search_index -= 1
                continue

            if DATE_RANGE_RE.match(
                candidate
            ):

                search_index -= 1
                continue

            if DURATION_RE.match(
                candidate
            ):

                search_index -= 1
                continue

            if looks_like_location(
                candidate
            ):

                search_index -= 1
                continue

            if canonical_section(
                candidate
            ):

                search_index -= 1
                continue

            company = candidate

            break

        if company:

            current_company = company

        else:

            company = current_company

        # Determine content boundary.
        if role_number + 1 < len(
            date_positions
        ):

            next_date_index = (
                date_positions[
                    role_number + 1
                ][0]
            )

        else:

            next_date_index = len(
                section_lines
            )

        content_lines = section_lines[
            date_index + 1:
            next_date_index
        ]

        location = ""

        description = []

        for line in content_lines:

            text = clean(
                line["text"]
            )

            if not text:
                continue

            if DURATION_RE.match(
                text
            ):
                continue

            if (
                not location
                and
                looks_like_location(
                    text
                )
                and
                len(text) < 120
            ):

                location = text

                continue

            description.append(
                text
            )

        results.append(
            {
                "company":
                    company,

                "position":
                    position,

                "start_date":
                    date_info[
                        "start_date"
                    ],

                "end_date":
                    date_info[
                        "end_date"
                    ],

                "duration":
                    date_info[
                        "duration"
                    ],

                "location":
                    location,

                "description":
                    clean(
                        " ".join(
                            description
                        )
                    ),
            }
        )

    return results


# ============================================================
# EDUCATION
# ============================================================

def extract_education(
    pages
):

    lines = []

    for page in pages:

        for line in page["right"]:

            lines.append(
                line
            )

    start = None

    for index, line in enumerate(
        lines
    ):

        if canonical_section(
            line["text"]
        ) == "education":

            start = index + 1
            break

    if start is None:

        return []

    education_lines = []

    for line in lines[start:]:

        heading = canonical_section(
            line["text"]
        )

        if heading in {
            "experience",
            "projects",
            "volunteer_experience",
            "publications",
            "awards",
            "courses",
        }:

            break

        if is_noise(
            line["text"]
        ):
            continue

        education_lines.append(
            clean(
                line["text"]
            )
        )

    education_lines = [
        x
        for x in education_lines
        if x
    ]

    if not education_lines:

        return []

    result = []

    current = []

    for text in education_lines:

        current.append(
            text
        )

        if (
            YEAR_RANGE_RE.search(
                text
            )
            or
            YEAR_RE.search(
                text
            )
        ):

            texts = current

            institution = texts[0]

            remainder = clean(
                " ".join(
                    texts[1:]
                )
            )

            years = YEAR_RE.findall(
                remainder
            )

            start_year = ""
            end_year = ""

            range_match = YEAR_RANGE_RE.search(
                remainder
            )

            if range_match:

                start_year = (
                    range_match.group(1)
                )

                end_year = (
                    range_match.group(2)
                )

            elif years:

                end_year = years[-1]

            qualification = YEAR_RANGE_RE.sub(
                "",
                remainder
            )

            qualification = YEAR_RE.sub(
                "",
                qualification
            )

            qualification = clean(
                qualification
            ).strip(
                "·|-() "
            )

            result.append(
                {
                    "institution":
                        institution,

                    "qualification":
                        qualification,

                    "start_year":
                        start_year,

                    "end_year":
                        end_year,

                    "year":
                        end_year,
                }
            )

            current = []

    return result


# ============================================================
# PROJECTS
# ============================================================

def extract_projects(
    pages
):

    lines = []

    for page in pages:

        for line in page["right"]:

            lines.append(
                line
            )

    section = []

    start = None

    for index, line in enumerate(
        lines
    ):

        if canonical_section(
            line["text"]
        ) == "projects":

            start = index + 1
            break

    if start is None:

        return []

    for line in lines[start:]:

        heading = canonical_section(
            line["text"]
        )

        if heading is not None:

            break

        text = clean(
            line["text"]
        )

        if text and not is_noise(text):

            section.append(
                text
            )

    if not section:

        return []

    # Conservative project extraction.
    result = []

    current = None

    for text in section:

        if current is None:

            current = {
                "name":
                    text,

                "description":
                    "",
            }

        else:

            if current["description"]:

                current["description"] += " "

            current["description"] += text

    if current:

        result.append(
            current
        )

    return result


# ============================================================
# PROFILE PARSER
# ============================================================

def parse_profile(
    pdf_path,
    candidate_url
):

    pdf_path = Path(
        pdf_path
    )

    # --------------------------------------------------------
    # Coordinate-aware extraction.
    # --------------------------------------------------------

    pages = extract_columns(
        pdf_path
    )

    # --------------------------------------------------------
    # Header
    # --------------------------------------------------------

    header = extract_header(
        pages
    )

    # --------------------------------------------------------
    # Main sections
    # --------------------------------------------------------

    about = extract_summary(
        pages
    )

    experience = extract_experience(
        pages
    )

    education = extract_education(
        pages
    )

    skills = extract_skills(
        pages
    )

    certifications = extract_certifications(
        pages
    )

    projects = extract_projects(
        pages
    )

    languages = extract_languages(
        pages
    )

    # --------------------------------------------------------
    # Current position
    # --------------------------------------------------------

    current_company = ""

    current_position = ""

    for item in experience:

        if norm(
            item.get(
                "end_date",
                ""
            )
        ) == "present":

            current_company = item.get(
                "company",
                ""
            )

            current_position = item.get(
                "position",
                ""
            )

            break

    if (
        not current_company
        and
        experience
    ):

        current_company = experience[0].get(
            "company",
            ""
        )

        current_position = experience[0].get(
            "position",
            ""
        )

    # --------------------------------------------------------
    # URL
    # --------------------------------------------------------

    candidate_url = clean_candidate_url(
        candidate_url
    )

    # --------------------------------------------------------
    # Final structured result
    # --------------------------------------------------------

    return {

        "profile_information": {

            "profile_url":
                candidate_url,

            "full_name":
                header["full_name"],

            "headline":
                header["headline"],

            "current_company":
                current_company,

            "current_position":
                current_position,

            "location":
                header["location"],
        },

        "about":
            about,

        "experience_timeline":
            experience,

        "education":
            education,

        "skills":
            skills,

        "certifications":
            [
                {
                    "name":
                        x
                }
                for x in certifications
            ],

        "projects":
            projects,

        "languages":
            languages,

        "professional_experience": {

            "experience":
                experience,

        },

        "raw_extraction": {

            "pages":
                len(pages),

            "left_column_lines":
                sum(
                    len(
                        page["left"]
                    )
                    for page in pages
                ),

            "right_column_lines":
                sum(
                    len(
                        page["right"]
                    )
                    for page in pages
                ),
        },
    }


# ============================================================
# SAVE OUTPUTS
# ============================================================

def save_outputs(
    data,
    output_dir
):

    output_dir = Path(
        output_dir
    )

    output_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    # --------------------------------------------------------
    # JSON
    # --------------------------------------------------------

    json_path = (
        output_dir /
        "linkedin_analysis.json"
    )

    json_path.write_text(
        json.dumps(
            data,
            indent=4,
            ensure_ascii=False
        ),
        encoding="utf-8"
    )

    # --------------------------------------------------------
    # TXT
    # --------------------------------------------------------

    text_path = (
        output_dir /
        "linkedin_profile.txt"
    )

    p = data[
        "profile_information"
    ]

    report = []

    report.extend(
        [
            "=" * 80,
            "RESUMEIQ - LINKEDIN PROFILE ANALYSIS",
            "=" * 80,
            "",
            "PROFILE INFORMATION",
            "-" * 80,
            f"Full Name: "
            f"{p.get('full_name') or 'Not available'}",
            f"Headline: "
            f"{p.get('headline') or 'Not available'}",
            f"Current Company: "
            f"{p.get('current_company') or 'Not available'}",
            f"Current Position: "
            f"{p.get('current_position') or 'Not available'}",
            f"Location: "
            f"{p.get('location') or 'Not available'}",
            f"LinkedIn URL: "
            f"{p.get('profile_url') or 'Not available'}",
            "",
            "ABOUT / SUMMARY",
            "-" * 80,
            data.get(
                "about"
            )
            or
            "Not available.",
            "",
            "EXPERIENCE",
            "-" * 80,
        ]
    )

    experience = data.get(
        "experience_timeline",
        []
    )

    if experience:

        for index, item in enumerate(
            experience,
            1
        ):

            report.extend(
                [
                    "",
                    f"Experience {index}",
                    f"Company: "
                    f"{item.get('company') or 'Not available'}",
                    f"Position: "
                    f"{item.get('position') or 'Not available'}",
                    f"Start Date: "
                    f"{item.get('start_date') or 'Not available'}",
                    f"End Date: "
                    f"{item.get('end_date') or 'Not available'}",
                    f"Duration: "
                    f"{item.get('duration') or 'Not available'}",
                    f"Location: "
                    f"{item.get('location') or 'Not available'}",
                    f"Description: "
                    f"{item.get('description') or 'Not available'}",
                ]
            )

    else:

        report.append(
            "No Experience section found in the LinkedIn PDF."
        )

    report.extend(
        [
            "",
            "EDUCATION",
            "-" * 80,
        ]
    )

    education = data.get(
        "education",
        []
    )

    if education:

        for index, item in enumerate(
            education,
            1
        ):

            report.extend(
                [
                    "",
                    f"Education {index}",
                    f"Institution: "
                    f"{item.get('institution') or 'Not available'}",
                    f"Qualification: "
                    f"{item.get('qualification') or 'Not available'}",
                    f"Year: "
                    f"{item.get('start_year') or ''}"
                    f" - "
                    f"{item.get('end_year') or item.get('year') or ''}",
                ]
            )

    else:

        report.append(
            "No Education section found in the LinkedIn PDF."
        )

    report.extend(
        [
            "",
            "SKILLS",
            "-" * 80,
        ]
    )

    skills = data.get(
        "skills",
        []
    )

    if skills:

        for skill in skills:

            report.append(
                f"- {skill}"
            )

    else:

        report.append(
            "No Skills section found in the LinkedIn PDF."
        )

    report.extend(
        [
            "",
            "CERTIFICATIONS",
            "-" * 80,
        ]
    )

    certifications = data.get(
        "certifications",
        []
    )

    if certifications:

        for item in certifications:

            report.append(
                f"- {item.get('name', '')}"
            )

    else:

        report.append(
            "No Certifications section found in the LinkedIn PDF."
        )

    report.extend(
        [
            "",
            "PROJECTS",
            "-" * 80,
        ]
    )

    projects = data.get(
        "projects",
        []
    )

    if projects:

        for index, project in enumerate(
            projects,
            1
        ):

            report.extend(
                [
                    "",
                    f"Project {index}",
                    f"Name: "
                    f"{project.get('name') or 'Not available'}",
                    f"Description: "
                    f"{project.get('description') or 'Not available'}",
                ]
            )

    else:

        report.append(
            "No Projects section found in the LinkedIn PDF."
        )

    report.extend(
        [
            "",
            "LANGUAGES",
            "-" * 80,
        ]
    )

    languages = data.get(
        "languages",
        []
    )

    if languages:

        for language in languages:

            name = language.get(
                "name",
                ""
            )

            proficiency = language.get(
                "proficiency",
                ""
            )

            if proficiency:

                report.append(
                    f"- {name} "
                    f"({proficiency})"
                )

            else:

                report.append(
                    f"- {name}"
                )

    else:

        report.append(
            "No Languages section found in the LinkedIn PDF."
        )

    report.extend(
        [
            "",
            "=" * 80,
            "END OF LINKEDIN PROFILE ANALYSIS",
            "=" * 80,
        ]
    )

    text_path.write_text(
        "\n".join(
            report
        ),
        encoding="utf-8"
    )

    return (
        json_path,
        text_path
    )