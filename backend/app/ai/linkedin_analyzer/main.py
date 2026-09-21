from .browser import Browser
from .auth import LinkedInAuth
from .processor import CandidateProcessor

from .config import Config


class ResumeIQWorker:

    def __init__(self):

        self.browser = Browser()

    def read_urls(self):

        print("\n" + "=" * 60)
        print("RESUMEIQ LINKEDIN WORKER")
        print("=" * 60)

        print(
            "\nEnter LinkedIn URLs."
        )

        print(
            "Type EXIT when finished."
        )

        urls = []

        while True:

            url = input(
                "\nLinkedIn URL: "
            ).strip()

            if url.upper() == "EXIT":
                break

            if not url.startswith(
                Config.PROFILE_PREFIX
            ):

                print(
                    "Invalid LinkedIn URL."
                )

                continue

            if url in urls:

                print(
                    "URL already added."
                )

                continue

            urls.append(url)

            print(
                "[OK] URL added."
            )

        return urls

    def run(self):

        Config.create_folders()

        urls = self.read_urls()

        if not urls:

            print(
                "No URLs entered."
            )

            return

        driver = None

        try:

            driver, wait = (
                self.browser.start()
            )

            print(
                "[OK] Background browser started."
            )

            auth = LinkedInAuth(
                driver,
                wait
            )

            auth.login()

            processor = CandidateProcessor(
                driver,
                wait
            )

            results = []

            for index, url in enumerate(
                urls,
                1
            ):

                print(
                    f"\n[{index}/{len(urls)}]"
                )

                results.append(
                    processor.process(
                        url
                    )
                )

            successful = sum(
                r["status"] == "completed"
                for r in results
            )

            print("\n" + "=" * 60)
            print("PROCESSING COMPLETED")
            print("=" * 60)

            print(
                "Total:",
                len(results)
            )

            print(
                "Successful:",
                successful
            )

            print(
                "Failed:",
                len(results) - successful
            )

        finally:

            self.browser.close()

            print(
                "\nBackground browser closed."
            )


if __name__ == "__main__":

    ResumeIQWorker().run()