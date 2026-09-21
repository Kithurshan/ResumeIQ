from typing import List, Dict


class MatchScorer:
    """
    Combines individual matching scores into
    the final ResumeIQ candidate score.

    Weights are aligned with XGBoostInference's
    transparent weighted scoring.
    """

    SKILL_WEIGHT = 0.40
    EXPERIENCE_WEIGHT = 0.20
    EDUCATION_WEIGHT = 0.10
    PROJECT_WEIGHT = 0.15
    SEMANTIC_WEIGHT = 0.15

    def calculate_final_score(
        self,
        skill_score: float,
        experience_score: float,
        education_score: float,
        project_score: float,
    ) -> float:

        final_score = (
            skill_score * self.SKILL_WEIGHT
            + experience_score * self.EXPERIENCE_WEIGHT
            + education_score * self.EDUCATION_WEIGHT
            + project_score * self.PROJECT_WEIGHT
        )

        return round(
            final_score,
            2,
        )

    @staticmethod
    def recommendation(score: float) -> str:

        if score >= 75:
            return "Highly Recommended"

        if score >= 50:
            return "Recommended"

        if score >= 35:
            return "Potential Match"

        return "Low Match"