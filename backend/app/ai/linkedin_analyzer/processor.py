import re
from pathlib import Path

from .linkedin_pdf import LinkedInPDF
from .pdf_parser import parse_profile, save_outputs

from .config import Config


class CandidateProcessor:

    def __init__(self, driver, wait, download_dir):

        self.pdf = LinkedInPDF(
            driver,
            wait,
            download_dir
        )

    def candidate_name(self, url):

        value = url.rstrip(
            "/"
        ).split(
            "/"
        )[-1]

        value = re.sub(
            r"[^A-Za-z0-9_-]",
            "_",
            value
        )

        return value[:80] or "candidate"

    def process(self, url):

        folder = (
            Config.OUTPUT_DIR
            /
            self.candidate_name(url)
        )

        pdf = None

        try:

            print(
                "\nProcessing:"
            )

            print(url)

            # Download PDF
            pdf = self.pdf.download(
                url
            )

            # Extract information
            data = parse_profile(
                pdf,
                url
            )

            # Save JSON + TXT
            json_path, text_path = save_outputs(
                data,
                folder
            )

            # Delete temporary outputs
            if (
                Config.DELETE_PDF_AFTER_SUCCESS
            ):
                if pdf and pdf.exists():
                    pdf.unlink()
                if Path(json_path).exists():
                    Path(json_path).unlink()
                if Path(text_path).exists():
                    Path(text_path).unlink()
                # Try to remove the folder if empty
                try:
                    folder.rmdir()
                except OSError:
                    pass

            print(
                "[OK] Completed:",
                self.candidate_name(url)
            )

            return {
                "status": "completed",
                "url": url,
                "data": data
            }

        except Exception as error:

            print(
                "[FAIL] Failed:",
                error
            )

            if pdf and Path(pdf).exists():

                failed_dir = (
                    Config.OUTPUT_DIR
                    /
                    "_failed_pdfs"
                )

                failed_dir.mkdir(
                    parents=True,
                    exist_ok=True
                )

                target = (
                    failed_dir
                    /
                    f"{self.candidate_name(url)}.pdf"
                )

                Path(pdf).replace(
                    target
                )

            return {
                "status": "failed",
                "url": url,
                "error": str(error)
            }