# Main business logic.
#
# This class connects the smaller OOP classes together.
# Each class has one clear responsibility.

from urllib.parse import urlparse, urljoin

from bs4 import BeautifulSoup

from .models import PortfolioResult, Evidence
from .website_crawler import WebsiteCrawler
from .content_extractor import ContentExtractor
from .technology_extractor import TechnologyExtractor
from .project_extractor import ProjectExtractor
from .experience_extractor import ExperienceExtractor
from .writing_extractor import WritingExtractor
from .pdf_extractor import PDFExtractor


class PortfolioAnalyzer:

    def __init__(self, portfolio_url):

        self.portfolio_url = portfolio_url

        self.crawler = WebsiteCrawler(
            portfolio_url
        )

        self.content = ContentExtractor()
        self.technology = TechnologyExtractor()

        self.projects = ProjectExtractor(
            self.content,
            self.technology
        )

        self.experience = ExperienceExtractor(
            self.content,
            self.technology
        )

        self.writing = WritingExtractor(
            self.content
        )

        self.pdf = PDFExtractor()

    def analyze(self):

        result = PortfolioResult(
            portfolio_url=self.portfolio_url,
            domain=urlparse(
                self.crawler.start_url
            ).netloc.lower()
        )

        print("[1/3] Crawling website...")

        pages = self.crawler.crawl()

        result.pages_crawled = len(pages)
        result.page_urls = [
            page.url
            for page in pages
        ]

        print(
            f"      {len(pages)} pages discovered"
        )

        all_technologies = set()
        technology_evidence = []

        print("[2/3] Extracting structured information...")

        for page in pages:

            soup = BeautifulSoup(
                page.html,
                "html.parser"
            )

            self.content.remove_unwanted_elements(
                soup
            )

            # Website information.
            if not result.website_title:
                result.website_title = (
                    self.content.get_title(soup)
                )

            if not result.website_description:
                result.website_description = (
                    self.content.get_description(
                        soup
                    )
                )

            # General technology evidence.
            page_text = self.content.get_page_text(
                soup
            )

            page_technologies = (
                self.technology.find(
                    page_text
                )
            )

            all_technologies.update(
                page_technologies
            )

            technology_evidence.extend(
                self.technology.get_evidence(
                    page_text,
                    page.url,
                    "website"
                )
            )

            # Find semantic sections.
            about_section = self.content.find_section(
                soup,
                "about"
            )

            experience_section = self.content.find_section(
                soup,
                "experience"
            )

            project_section = self.content.find_section(
                soup,
                "projects"
            )

            writing_section = self.content.find_section(
                soup,
                "writing"
            )

            # ABOUT
            if (
                about_section
                and not result.about
            ):
                result.about = (
                    self.content.get_visible_text(
                        about_section["element"]
                    )
                )

            # EXPERIENCE
            if experience_section:

                experience_items = (
                    self.experience.extract(
                        experience_section,
                        page.url
                    )
                )

                result.experience.extend(
                    experience_items
                )

            # PROJECTS
            if project_section:

                project_items = (
                    self.projects.extract(
                        project_section,
                        page.url
                    )
                )

                result.projects.extend(
                    project_items
                )

            # PROJECT ARCHIVE
            archive_projects = (
                self.projects.extract_archive_rows(
                    soup,
                    page.url
                )
            )

            result.projects.extend(
                archive_projects
            )

            # WRITING
            if writing_section:

                writing_items = (
                    self.writing.extract(
                        writing_section,
                        page.url
                    )
                )

                result.writing.extend(
                    writing_items
                )

            # PDF resume links.
            self.extract_pdf_links(
                soup,
                page.url,
                all_technologies,
                technology_evidence
            )

        result.technologies = sorted(
            all_technologies,
            key=str.lower
        )

        result.technology_evidence = (
            technology_evidence
        )

        result.projects = (
            self.remove_duplicate_projects(
                result.projects
            )
        )

        result.experience = (
            self.remove_duplicate_experience(
                result.experience
            )
        )

        result.writing = (
            self.remove_duplicate_writing(
                result.writing
            )
        )

        print("[3/3] Analysis completed.")

        return result

    def extract_pdf_links(
        self,
        soup,
        page_url,
        all_technologies,
        evidence_list
    ):

        for link in soup.find_all(
            "a",
            href=True
        ):

            href = link["href"]

            if not href.lower().split("?")[0].endswith(
                ".pdf"
            ):
                continue

            pdf_url = urljoin(
                page_url,
                href
            )

            pdf_text = self.pdf.extract_text(
                pdf_url
            )

            if not pdf_text:
                continue

            technologies = (
                self.pdf.get_technologies(
                    pdf_text
                )
            )

            all_technologies.update(
                technologies
            )

            for technology in technologies:
                evidence_list.append(
                    Evidence(
                        url=pdf_url,
                        text=(
                            f"Technology '{technology}' "
                            "was found in the candidate PDF."
                        ),
                        section="resume"
                    )
                )

    def remove_duplicate_projects(
        self,
        projects
    ):

        unique = []
        seen = set()

        for project in projects:

            key = (
                project.title.lower().strip(),
                project.url.lower().strip()
            )

            if key in seen:
                continue

            seen.add(key)
            unique.append(project)

        return unique

    def remove_duplicate_experience(
        self,
        experiences
    ):

        unique = []
        seen = set()

        for item in experiences:

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

    def remove_duplicate_writing(
        self,
        writing
    ):

        unique = []
        seen = set()

        for item in writing:

            key = (
                item.title.lower().strip(),
                item.url.lower().strip()
            )

            if key in seen:
                continue

            seen.add(key)
            unique.append(item)

        return unique
