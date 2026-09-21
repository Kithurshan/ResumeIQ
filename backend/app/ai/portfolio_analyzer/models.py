# Simple data classes.
# These classes make the program easier to understand and maintain.

from dataclasses import dataclass, field
from typing import List


@dataclass
class Evidence:
    url: str
    text: str
    section: str = ""


@dataclass
class Project:
    title: str
    description: str = ""
    date: str = ""
    technologies: List[str] = field(default_factory=list)
    url: str = ""
    source: str = ""


@dataclass
class Experience:
    role: str
    company: str = ""
    date: str = ""
    description: str = ""
    technologies: List[str] = field(default_factory=list)
    source: str = ""


@dataclass
class Writing:
    title: str
    date: str = ""
    url: str = ""
    source: str = ""


@dataclass
class Education:
    institution: str = ""
    degree: str = ""
    start_date: str = ""
    end_date: str = ""
    details: str = ""
    source: str = ""


@dataclass
class Certification:
    name: str = ""
    issuer: str = ""
    date: str = ""
    source: str = ""


@dataclass
class PortfolioResult:
    portfolio_url: str
    domain: str

    website_title: str = ""
    website_description: str = ""
    about: str = ""

    technologies: List[str] = field(default_factory=list)
    technology_evidence: List[Evidence] = field(default_factory=list)

    projects: List[Project] = field(default_factory=list)
    experience: List[Experience] = field(default_factory=list)
    writing: List[Writing] = field(default_factory=list)
    education: List[Education] = field(default_factory=list)
    certifications: List[Certification] = field(default_factory=list)

    pages_crawled: int = 0
    page_urls: List[str] = field(default_factory=list)

    def extract_job_title(self):
        """Return the most likely job title from website title or about text."""
        title = (self.website_title or "").strip()
        if not title:
            return ""

        for separator in ["//", "-", "|"]:
            if separator in title:
                parts = [part.strip() for part in title.split(separator)]
                for part in parts:
                    if len(part.split()) <= 8 and any(
                        keyword in part.lower() for keyword in [
                            "developer", "engineer", "scientist", "analyst",
                            "architect", "designer", "researcher", "data"
                        ]
                    ):
                        return part

        about_text = (self.about or "").strip()
        if about_text:
            lower = about_text.lower()
            for marker in ["i am a ", "i'm a ", "i am an "]:
                if marker in lower:
                    candidate_text = lower.split(marker, 1)[1]
                    candidate_text = candidate_text.split(".", 1)[0]
                    candidate_text = candidate_text.strip()
                    if candidate_text:
                        return candidate_text[:80]

        return title[:80]

    def to_normalized_profile(self):
        """Return the UI-friendly schema expected by recruiters."""
        skills = []
        for skill in self.technologies:
            cleaned = (skill or "").strip()
            if cleaned and cleaned not in skills:
                skills.append(cleaned)

        experience_list = []
        for item in self.experience:
            experience_list.append({
                "role": item.role,
                "company": item.company,
                "date": item.date,
                "description": item.description,
                "technologies": item.technologies
            })

        project_list = []
        for item in self.projects:
            project_list.append({
                "title": item.title,
                "description": item.description,
                "date": item.date,
                "url": item.url,
                "technologies": item.technologies
            })

        return {
            "candidateName": (self.website_title or self.domain or "").split("//", 1)[0].strip()[:80],
            "job": self.extract_job_title(),
            "profile": {
                "domain": self.domain,
                "website_title": self.website_title,
                "website_description": self.website_description,
                "portfolio_url": self.portfolio_url,
            },
            "about": self.about,
            "experience": experience_list,
            "education": [
                {
                    "institution": item.institution,
                    "degree": item.degree,
                    "start_date": item.start_date,
                    "end_date": item.end_date,
                    "details": item.details
                }
                for item in self.education
            ],
            "skills": skills,
            "certifications": [
                {
                    "name": item.name,
                    "issuer": item.issuer,
                    "date": item.date
                }
                for item in self.certifications
            ],
            "projects": project_list
        }
