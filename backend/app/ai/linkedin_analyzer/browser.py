import tempfile
import uuid
import shutil
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

from .config import Config


class Browser:

    def __init__(self):

        self.driver = None
        self.wait = None
        self.temp_profile_dir = Path(tempfile.gettempdir()) / f"chrome_profile_{uuid.uuid4().hex}"
        self.temp_download_dir = Path(tempfile.gettempdir()) / f"chrome_download_{uuid.uuid4().hex}"

    def _prepare_profile(self):
        """Prepare a temporary Chrome profile for concurrent execution."""
        profile_root = Config.CHROME_PROFILE.resolve()
        
        # Copy the base profile to the temporary location to preserve login state
        if profile_root.exists():
            shutil.copytree(profile_root, self.temp_profile_dir, dirs_exist_ok=True)
        else:
            self.temp_profile_dir.mkdir(parents=True, exist_ok=True)
            
        # Clear stale locks only in the temporary profile
        default_profile = self.temp_profile_dir / "Default"
        for parent in [self.temp_profile_dir, default_profile]:
            if parent.exists():
                for lock_name in ["SingletonLock", "LOCK", "DevToolsActivePort"]:
                    lock_path = parent / lock_name
                    if lock_path.exists():
                        try:
                            lock_path.unlink()
                        except Exception:
                            pass

    def start(self):

        self._prepare_profile()

        options = Options()

        # ----------------------------------------------------
        # HEADLESS CHROME
        # ----------------------------------------------------

        if Config.HEADLESS:
            options.add_argument("--headless=new")

        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-notifications")
        options.add_argument("--disable-popup-blocking")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        # ----------------------------------------------------
        # REUSE LINKEDIN SESSION
        # ----------------------------------------------------

        options.add_argument(f"--user-data-dir={self.temp_profile_dir}")
        options.add_argument("--profile-directory=Default")

        # ----------------------------------------------------
        # DOWNLOAD SETTINGS
        # ----------------------------------------------------

        options.add_experimental_option(
            "prefs",
            {
                "download.default_directory": str(self.temp_download_dir.resolve()),
                "download.prompt_for_download": False,
                "download.directory_upgrade": True,
                "download.restrictions": 0,
                "safebrowsing.enabled": True,
                "plugins.always_open_pdf_externally": True,
            }
        )

        # ----------------------------------------------------
        # CREATE DRIVER
        # ----------------------------------------------------

        self.driver = webdriver.Chrome(options=options)

        # ----------------------------------------------------
        # IMPORTANT FOR HEADLESS DOWNLOADS
        # ----------------------------------------------------

        self.driver.execute_cdp_cmd(
            "Browser.setDownloadBehavior",
            {
                "behavior": "allow",
                "downloadPath": str(self.temp_download_dir.resolve()),
            }
        )

        self.wait = WebDriverWait(self.driver, Config.WAIT_SECONDS)

        return self.driver, self.wait

    def close(self):

        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None

        # Clean up temporary profile
        try:
            if self.temp_profile_dir.exists():
                shutil.rmtree(self.temp_profile_dir, ignore_errors=True)
        except Exception:
            pass

        # Clean up temporary download dir
        try:
            if self.temp_download_dir.exists():
                shutil.rmtree(self.temp_download_dir, ignore_errors=True)
        except Exception:
            pass