import time

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .config import Config


class LinkedInPDF:

    def __init__(self, driver, wait, download_dir):

        self.driver = driver
        self.wait = wait
        self.download_dir = download_dir

    # ========================================================
    # CLEAR OLD PDF FILES
    # ========================================================

    def clear_downloads(self):

        self.download_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        for file in self.download_dir.iterdir():

            if file.is_file():

                try:
                    file.unlink()

                except Exception:
                    pass

    # ========================================================
    # FIND MORE BUTTON
    # ========================================================

    def find_more_button(self):

        selectors = [

            "button[aria-label*='More']",

            "button[aria-label*='more']",

            "button[aria-label*='More actions']",

            "button[data-control-name*='more']",

        ]

        for selector in selectors:

            buttons = self.driver.find_elements(
                By.CSS_SELECTOR,
                selector
            )

            for button in buttons:

                try:

                    if (
                        button.is_displayed()
                        and
                        button.is_enabled()
                    ):

                        return button

                except Exception:

                    continue

        # ====================================================
        # FALLBACK
        # ====================================================

        for button in self.driver.find_elements(
            By.TAG_NAME,
            "button"
        ):

            try:

                if not button.is_displayed():
                    continue

                if not button.is_enabled():
                    continue

                aria = (
                    button.get_attribute(
                        "aria-label"
                    )
                    or
                    ""
                ).lower()

                title = (
                    button.get_attribute(
                        "title"
                    )
                    or
                    ""
                ).lower()

                text = (
                    button.text
                    or
                    ""
                ).strip().lower()

                if (
                    "more" in aria
                    or
                    "more" in title
                    or
                    text == "more"
                ):

                    return button

            except Exception:

                continue

        return None

    # ========================================================
    # OPEN MORE MENU
    # ========================================================

    def open_more_menu(self):

        more = self.wait.until(
            lambda driver:
            self.find_more_button()
        )

        self.driver.execute_script(
            """
            arguments[0].scrollIntoView({
                block: 'center'
            });
            """,
            more
        )

        try:

            more.click()

        except Exception:

            self.driver.execute_script(
                "arguments[0].click();",
                more
            )

        # Wait until Save to PDF appears

        self.wait.until(
            EC.presence_of_element_located(
                (
                    By.XPATH,
                    "//*[contains(normalize-space(), 'Save to PDF')]"
                )
            )
        )

    # ========================================================
    # CLICK SAVE TO PDF
    # ========================================================

    def click_save_to_pdf(self):

        self.open_more_menu()

        save_element = None

        selectors = [

            (
                By.XPATH,
                "//*[normalize-space()='Save to PDF']"
            ),

            (
                By.XPATH,
                "//*[contains(normalize-space(), 'Save to PDF')]"
            ),

            (
                By.XPATH,
                "//button[contains(., 'Save to PDF')]"
            ),

            (
                By.XPATH,
                "//a[contains(., 'Save to PDF')]"
            ),

        ]

        for by, selector in selectors:

            elements = self.driver.find_elements(
                by,
                selector
            )

            for element in elements:

                try:

                    if (
                        element.is_displayed()
                        and
                        element.is_enabled()
                    ):

                        save_element = element

                        break

                except Exception:

                    continue

            if save_element:

                break

        if save_element is None:

            raise RuntimeError(
                "LinkedIn 'Save to PDF' "
                "button was not found."
            )

        self.driver.execute_script(
            """
            arguments[0].scrollIntoView({
                block: 'center'
            });
            """,
            save_element
        )

        try:

            save_element.click()

        except Exception:

            self.driver.execute_script(
                "arguments[0].click();",
                save_element
            )

        print(
            "[OK] Save to PDF clicked."
        )

    # ========================================================
    # WAIT FOR PDF
    # ========================================================

    def wait_for_pdf(self):

        print(
            "Waiting for PDF download..."
        )

        start_time = time.time()

        while (
            time.time() - start_time
            <
            Config.DOWNLOAD_TIMEOUT
        ):

            # ----------------------------------------------
            # Check unfinished downloads
            # ----------------------------------------------

            partial_files = list(
                self.download_dir.glob(
                    "*.crdownload"
                )
            )

            # ----------------------------------------------
            # Check PDF files
            # ----------------------------------------------

            pdf_files = list(
                self.download_dir.glob(
                    "*.pdf"
                )
            )

            if pdf_files:

                latest_pdf = max(
                    pdf_files,
                    key=lambda file:
                    file.stat().st_mtime
                )

                # ------------------------------------------
                # Make sure download is complete
                # ------------------------------------------

                if not partial_files:

                    try:

                        size = (
                            latest_pdf.stat().st_size
                        )

                        if size > 1000:

                            print(
                                "[OK] PDF downloaded:"
                            )

                            print(
                                latest_pdf
                            )

                            return latest_pdf

                    except FileNotFoundError:

                        pass

            # Check frequently instead of every 1 second

            time.sleep(
                0.25
            )

        raise TimeoutError(
            "LinkedIn PDF download timed out."
        )

    # ========================================================
    # DOWNLOAD PROFILE PDF
    # ========================================================

    def download(self, profile_url):

        self.clear_downloads()

        print(
            "Opening profile..."
        )

        self.driver.get(
            profile_url
        )

        # ----------------------------------------------------
        # Wait for page to finish loading
        # ----------------------------------------------------

        self.wait.until(
            lambda driver:
            driver.execute_script(
                "return document.readyState"
            )
            ==
            "complete"
        )

        # ----------------------------------------------------
        # Give LinkedIn a short time to render profile
        # ----------------------------------------------------

        self.wait.until(
            lambda driver:
            self.find_more_button()
            is not None
        )

        print(
            "[OK] Candidate profile loaded."
        )

        # ----------------------------------------------------
        # Save PDF
        # ----------------------------------------------------

        self.click_save_to_pdf()

        # ----------------------------------------------------
        # Wait for actual PDF
        # ----------------------------------------------------

        return self.wait_for_pdf()