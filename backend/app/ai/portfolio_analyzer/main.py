# Program entry point.
#
# Run:
#     python main.py
#
# Then enter a portfolio URL.

from .portfolio_analyzer import PortfolioAnalyzer
from .report_writer import ReportWriter


class Application:

    def run(self):

        print("=" * 60)
        print("        ResumeIQ Portfolio Analyzer")
        print("=" * 60)
        print()

        url = input(
            "Enter candidate portfolio URL: "
        ).strip()

        if not url:
            print("URL cannot be empty.")
            return

        print()

        analyzer = PortfolioAnalyzer(
            url
        )

        result = analyzer.analyze()

        writer = ReportWriter(
            "outputs"
        )

        json_file, txt_file = writer.save(
            result
        )

        print()
        print("=" * 60)
        print("ANALYSIS COMPLETED")
        print("=" * 60)
        print()
        print(
            f"Website      : "
            f"{result.domain}"
        )
        print(
            f"Pages        : "
            f"{result.pages_crawled}"
        )
        print(
            f"Technologies : "
            f"{len(result.technologies)}"
        )
        print(
            f"Experience   : "
            f"{len(result.experience)}"
        )
        print(
            f"Projects     : "
            f"{len(result.projects)}"
        )
        print(
            f"Writing      : "
            f"{len(result.writing)}"
        )
        print()
        print(f"TXT output   : {txt_file}")
        print(f"JSON output  : {json_file}")
        print()


if __name__ == "__main__":
    Application().run()
