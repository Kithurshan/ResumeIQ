# Small PDF helper for resume/CV links.

import io
import requests

from pypdf import PdfReader

from .config import REQUEST_TIMEOUT
from .technology_extractor import TechnologyExtractor


class PDFExtractor:

    def __init__(self):
        self.technology = TechnologyExtractor()

    def extract_text(self, url):

        try:
            response = requests.get(
                url,
                timeout=REQUEST_TIMEOUT,
                headers={
                    "User-Agent":
                        "ResumeIQ Portfolio Analyzer/3.0"
                }
            )

            response.raise_for_status()

            reader = PdfReader(
                io.BytesIO(response.content)
            )

            text = ""

            for page in reader.pages:
                text += (
                    page.extract_text()
                    or ""
                )
                text += "\n"

            return text

        except Exception:
            return ""

    def get_technologies(self, text):
        return self.technology.find(text)
