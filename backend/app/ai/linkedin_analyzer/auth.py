from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .config import Config


class LinkedInAuth:

    def __init__(self, driver, wait):

        self.driver = driver
        self.wait = wait

    def is_logged_in(self):

        try:

            self.driver.get(
                "https://www.linkedin.com/feed/"
            )

            self.wait.until(
                lambda d:
                d.execute_script(
                    "return document.readyState"
                ) == "complete"
            )

            url = self.driver.current_url.lower()

            return not any(
                x in url
                for x in [
                    "/login",
                    "/checkpoint",
                    "/challenge"
                ]
            )

        except Exception:

            return False

    def login(self):

        if self.is_logged_in():

            print(
                "[OK] Existing LinkedIn session found."
            )

            return True

        if not Config.EMAIL:

            raise RuntimeError(
                "LINKEDIN_EMAIL is missing."
            )

        if not Config.PASSWORD:

            raise RuntimeError(
                "LINKEDIN_PASSWORD is missing."
            )

        print("Opening LinkedIn login...")

        self.driver.get(
            Config.LOGIN_URL
        )

        email = self.wait.until(
            EC.visibility_of_element_located(
                (
                    By.CSS_SELECTOR,
                    "input[type='email']"
                )
            )
        )

        password = self.wait.until(
            EC.visibility_of_element_located(
                (
                    By.CSS_SELECTOR,
                    "input[type='password']"
                )
            )
        )

        email.send_keys(
            Config.EMAIL
        )

        password.send_keys(
            Config.PASSWORD
        )

        buttons = self.driver.find_elements(
            By.CSS_SELECTOR,
            "button, input[type='submit']"
        )

        login_button = next(
            (
                button
                for button in buttons
                if button.is_displayed()
                and button.is_enabled()
                and (
                    button.text
                    or button.get_attribute("value")
                    or ""
                ).strip().lower()
                == "sign in"
            ),
            None
        )

        if login_button is None:

            raise RuntimeError(
                "LinkedIn Sign in button not found."
            )

        login_button.click()

        self.wait.until(
            lambda d:
            "/login" not in d.current_url.lower()
        )

        url = self.driver.current_url.lower()

        if (
            "/checkpoint" in url
            or "/challenge" in url
        ):

            raise RuntimeError(
                "LinkedIn security verification is required."
            )

        print(
            "[OK] LinkedIn authentication successful."
        )

        return True