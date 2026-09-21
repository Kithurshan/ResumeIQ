# Converts the result into JSON and a beginner-friendly TXT report.

import json
import re
from dataclasses import asdict
from pathlib import Path


class ReportWriter:

    def __init__(self, output_folder="outputs"):
        self.output_folder = Path(
            output_folder
        )

        self.output_folder.mkdir(
            parents=True,
            exist_ok=True
        )

    def make_filename(self, domain):
        filename = re.sub(
            r"[^a-zA-Z0-9]+",
            "_",
            domain
        )

        return filename.strip("_").lower()

    def save(self, result):

        filename = self.make_filename(
            result.domain
        )

        json_file = (
            self.output_folder
            / f"{filename}.json"
        )

        txt_file = (
            self.output_folder
            / f"{filename}.txt"
        )

        self.save_json(
            result,
            json_file
        )

        self.save_text(
            result,
            txt_file
        )

        return json_file, txt_file

    def save_json(self, result, file_path):

        data = asdict(result)
        data["normalized_profile"] = result.to_normalized_profile()

        with open(
            file_path,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                data,
                file,
                indent=2,
                ensure_ascii=False
            )

    def bullet_list(self, items):

        if not items:
            return "- None explicitly evidenced"

        return "\n".join(
            f"- {item}"
            for item in items
        )

    def save_text(self, result, file_path):

        lines = []

        lines.extend([
            "**Portfolio URL**",
            result.portfolio_url,
            "",
            "**Domain**",
            result.domain,
            "",
            "**Website Title**",
            result.website_title
                or "Not publicly available",
            "",
            "**Website Description**",
            result.website_description
                or "Not publicly available",
            "",
            "### About",
            result.about
                or "Not explicitly identified.",
            "",
            "### Technology Stack",
            self.bullet_list(
                result.technologies
            ),
            "",
            "### Experience"
        ])

        if not result.experience:

            lines.append(
                "No structured experience items identified."
            )

        for number, item in enumerate(
            result.experience,
            start=1
        ):

            lines.extend([
                "",
                f"**Experience {number}**",
                f"Role: {item.role}",
                f"Company: "
                f"{item.company or 'Not stated'}",
                f"Date: "
                f"{item.date or 'Not stated'}",
                f"Description: "
                f"{item.description or 'Not stated'}",
                "Technologies:",
                self.bullet_list(
                    item.technologies
                ),
                f"Source: {item.source}"
            ])

        lines.extend([
            "",
            "### Projects"
        ])

        if not result.projects:

            lines.append(
                "No structured project items identified."
            )

        for number, project in enumerate(
            result.projects,
            start=1
        ):

            lines.extend([
                "",
                f"**Project {number}**",
                f"Project Title: {project.title}",
                f"Description: "
                f"{project.description or 'Not stated'}",
                f"Date: "
                f"{project.date or 'Not stated'}",
                "Technologies Used:",
                self.bullet_list(
                    project.technologies
                ),
                f"Project URL: "
                f"{project.url or 'Not stated'}",
                f"Source: {project.source}"
            ])

        lines.extend([
            "",
            "### Writing"
        ])

        if not result.writing:

            lines.append(
                "No structured writing items identified."
            )

        for number, item in enumerate(
            result.writing,
            start=1
        ):

            lines.extend([
                "",
                f"**Writing {number}**",
                f"Title: {item.title}",
                f"Date: "
                f"{item.date or 'Not stated'}",
                f"URL: "
                f"{item.url or 'Not stated'}",
                f"Source: {item.source}"
            ])

        lines.extend([
            "",
            "### Page Inventory"
        ])

        for url in result.page_urls:
            lines.append(
                f"- {url}"
            )

        lines.extend([
            "",
            "### Analysis Summary",
            f"Pages crawled: "
            f"{result.pages_crawled}",
            f"Technologies identified: "
            f"{len(result.technologies)}",
            f"Experience items: "
            f"{len(result.experience)}",
            f"Projects: "
            f"{len(result.projects)}",
            f"Writing items: "
            f"{len(result.writing)}",
            "",
            "### Accuracy Rule",
            "The analyzer does not create a project from a "
            "homepage title, an archive page title, or a "
            "technology list. Structured items must come from "
            "the corresponding website section or project archive."
        ])

        file_path.write_text(
            "\n".join(lines),
            encoding="utf-8"
        )
