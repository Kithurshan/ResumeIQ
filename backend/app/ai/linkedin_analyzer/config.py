from pathlib import Path
import os

from dotenv import load_dotenv


class Config:

    BASE_DIR = Path(__file__).resolve().parent

    ENV_FILE = BASE_DIR / ".env"

    load_dotenv(ENV_FILE)

    LOGIN_URL = "https://www.linkedin.com/login/"

    PROFILE_PREFIX = "https://www.linkedin.com/in/"

    EMAIL = os.getenv(
        "LINKEDIN_EMAIL",
        ""
    ).strip()

    PASSWORD = os.getenv(
        "LINKEDIN_PASSWORD",
        ""
    ).strip()

    CHROME_PROFILE = (
        BASE_DIR /
        "linkedin_chrome_profile"
    )

    DOWNLOAD_DIR = (
        BASE_DIR /
        "temp_downloads"
    )

    OUTPUT_DIR = (
        BASE_DIR /
        "output"
    )

    HEADLESS = True

    WAIT_SECONDS = 20

    DOWNLOAD_TIMEOUT = 60

    DELETE_PDF_AFTER_SUCCESS = True

    @classmethod
    def create_folders(cls):

        cls.CHROME_PROFILE.mkdir(
            parents=True,
            exist_ok=True
        )

        cls.DOWNLOAD_DIR.mkdir(
            parents=True,
            exist_ok=True
        )

        cls.OUTPUT_DIR.mkdir(
            parents=True,
            exist_ok=True
        )