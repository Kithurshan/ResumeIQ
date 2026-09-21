from typing import Any, Dict, List

from app.features.matching.semantic_matcher import SemanticMatcher
from app.features.matching.scoring import MatchScorer


class MatchingService:

    def __init__(self):

        self.semantic_matcher = SemanticMatcher()

        self.scorer = MatchScorer()

    # ======================================================
    # JOB TEXT
    # ======================================================

    def build_job_text(
        self,
        job: Dict[str, Any],
    ) -> str:

        parts = []

        if job.get("title"):
            parts.append(
                f"Job Title: {job['title']}"
            )

        if job.get("description"):
            parts.append(
                f"Description: {job['description']}"
            )

        if job.get("responsibilities"):
            parts.append(
                f"Responsibilities: "
                f"{job['responsibilities']}"
            )

        if job.get("experience"):
            parts.append(
                f"Experience Required: "
                f"{job['experience']}"
            )

        if job.get("education"):
            parts.append(
                f"Education Required: "
                f"{job['education']}"
            )

        return "\n".join(parts)

    # ======================================================
    # CANDIDATE TEXT
    # ======================================================

    def build_candidate_text(
        self,
        candidate: Dict[str, Any],
    ) -> str:

        parts = []

        if candidate.get("summary"):
            parts.append(
                f"Summary: {candidate['summary']}"
            )

        skills = candidate.get(
            "skills",
            {},
        )

        technical_skills = skills.get(
            "technical",
            [],
        )

        soft_skills = skills.get(
            "soft",
            [],
        )

        if technical_skills:
            parts.append(
                "Technical Skills: "
                + ", ".join(
                    technical_skills
                )
            )

        if soft_skills:
            parts.append(
                "Soft Skills: "
                + ", ".join(
                    soft_skills
                )
            )

        education = candidate.get(
            "education",
            [],
        )

        if education:
            education_text = []

            for item in education:

                degree = item.get(
                    "degree",
                    "",
                )

                institution = item.get(
                    "institution",
                    "",
                )

                education_text.append(
                    f"{degree} at {institution}"
                )

            parts.append(
                "Education: "
                + ". ".join(
                    education_text
                )
            )

        experience = candidate.get(
            "work_experience",
            [],
        )

        if experience:
            experience_text = []

            for item in experience:

                title = item.get(
                    "job_title",
                    "",
                )

                company = item.get(
                    "company",
                    "",
                )

                description = " ".join(
                    item.get(
                        "description",
                        [],
                    )
                )

                experience_text.append(
                    f"{title} {company} {description}"
                )

            parts.append(
                "Work Experience: "
                + ". ".join(
                    experience_text
                )
            )

        projects = candidate.get(
            "projects",
            [],
        )

        if projects:
            project_text = []

            for project in projects:

                name = project.get(
                    "name",
                    "",
                )

                description = " ".join(
                    project.get(
                        "description",
                        [],
                    )
                )

                project_text.append(
                    f"{name}: {description}"
                )

            parts.append(
                "Projects: "
                + ". ".join(
                    project_text
                )
            )

        return "\n".join(parts)

    # ======================================================
    # SKILL MATCHING
    # ======================================================

    def match_skills(
        self,
        required_skills: List[str],
        candidate_skills: List[str],
    ) -> Dict[str, Any]:

        if not required_skills:

            return {
                "score": 0.0,
                "matched_skills": [],
                "missing_skills": [],
                "details": [],
            }

        if not candidate_skills:

            return {
                "score": 0.0,
                "matched_skills": [],
                "missing_skills": required_skills,
                "details": [],
            }

        details = []

        matched = []

        missing = []

        for required_skill in required_skills:

            best_similarity = 0.0

            best_candidate = None

            for candidate_skill in candidate_skills:

                similarity = (
                    self.semantic_matcher
                    .calculate_similarity(
                        required_skill,
                        candidate_skill,
                    )
                )

                if similarity > best_similarity:

                    best_similarity = similarity

                    best_candidate = candidate_skill

            # Threshold deliberately conservative.
            if best_similarity >= 70:

                matched.append(
                    required_skill
                )

            else:

                missing.append(
                    required_skill
                )

            details.append({
                "required_skill": required_skill,
                "candidate_skill": best_candidate,
                "similarity": best_similarity,
                "matched": best_similarity >= 70,
            })

        score = (
            sum(
                item["similarity"]
                for item in details
            )
            / len(details)
        )

        return {
            "score": round(
                score,
                2,
            ),
            "matched_skills": matched,
            "missing_skills": missing,
            "details": details,
        }

    # ======================================================
    # EDUCATION MATCHING
    # ======================================================

    def match_education(
        self,
        required_education: str,
        candidate_education: List[Dict],
    ) -> float:

        if not required_education:
            return 0.0

        if not candidate_education:
            return 0.0

        best_score = 0.0

        for education in candidate_education:

            degree = education.get(
                "degree",
                "",
            )

            institution = education.get(
                "institution",
                "",
            )

            candidate_text = (
                f"{degree} {institution}"
            )

            score = (
                self.semantic_matcher
                .calculate_similarity(
                    required_education,
                    candidate_text,
                )
            )

            best_score = max(
                best_score,
                score,
            )

        return round(
            best_score,
            2,
        )

    # ======================================================
    # EXPERIENCE MATCHING
    # ======================================================

    def match_experience(
        self,
        required_experience: str,
        candidate_experience: List[Dict],
    ) -> float:

        if not required_experience:
            return 0.0

        if not candidate_experience:
            return 0.0

        candidate_text_parts = []

        for experience in candidate_experience:

            title = experience.get(
                "job_title",
                "",
            )

            company = experience.get(
                "company",
                "",
            )

            description = " ".join(
                experience.get(
                    "description",
                    [],
                )
            )

            candidate_text_parts.append(
                f"{title} {company} {description}"
            )

        candidate_text = ". ".join(
            candidate_text_parts
        )

        return self.semantic_matcher.calculate_similarity(
            required_experience,
            candidate_text,
        )

    # ======================================================
    # PROJECT MATCHING
    # ======================================================

    def match_projects(
        self,
        job_text: str,
        projects: List[Dict],
    ) -> float:

        if not job_text:
            return 0.0

        if not projects:
            return 0.0

        project_texts = []

        for project in projects:

            name = project.get(
                "name",
                "",
            )

            description = " ".join(
                project.get(
                    "description",
                    [],
                )
            )

            project_texts.append(
                f"{name}: {description}"
            )

        candidate_project_text = ". ".join(
            project_texts
        )

        return self.semantic_matcher.calculate_similarity(
            job_text,
            candidate_project_text,
        )

    # ======================================================
    # COMPLETE MATCH
    # ======================================================

    def calculate_match(
        self,
        job: Dict[str, Any],
        candidate: Dict[str, Any],
    ) -> Dict[str, Any]:

        # ---------------------------------------------
        # 1. Build text
        # ---------------------------------------------

        job_text = self.build_job_text(
            job
        )

        candidate_text = self.build_candidate_text(
            candidate
        )

        # ---------------------------------------------
        # 2. Overall semantic similarity
        # ---------------------------------------------

        semantic_score = (
            self.semantic_matcher
            .calculate_similarity(
                job_text,
                candidate_text,
            )
        )

        # ---------------------------------------------
        # 3. Skill matching
        # ---------------------------------------------

        required_skills = job.get(
            "requiredSkills",
            [],
        )

        candidate_skills = (
            candidate
            .get("skills", {})
            .get("technical", [])
        )

        skill_result = self.match_skills(
            required_skills,
            candidate_skills,
        )

        # ---------------------------------------------
        # 4. Education
        # ---------------------------------------------

        education_score = (
            self.match_education(
                job.get(
                    "education"
                ),
                candidate.get(
                    "education",
                    [],
                ),
            )
        )

        # ---------------------------------------------
        # 5. Experience
        # ---------------------------------------------

        experience_score = (
            self.match_experience(
                job.get(
                    "experience"
                ),
                candidate.get(
                    "work_experience",
                    [],
                ),
            )
        )

        # ---------------------------------------------
        # 6. Projects
        # ---------------------------------------------

        project_score = (
            self.match_projects(
                job_text,
                candidate.get(
                    "projects",
                    [],
                ),
            )
        )

        # ---------------------------------------------
        # 7. Final ResumeIQ score
        # ---------------------------------------------

        final_score = (
            self.scorer.calculate_final_score(
                skill_score=skill_result["score"],
                experience_score=experience_score,
                education_score=education_score,
                project_score=project_score,
            )
        )

        return {
            "candidate_id": candidate.get(
                "candidate_id"
            ),

            "candidate_name": candidate.get(
                "name"
            ),

            "semantic_score": semantic_score,

            "skill_score": skill_result[
                "score"
            ],

            "education_score": education_score,

            "experience_score": experience_score,

            "project_score": project_score,

            "final_score": final_score,

            "matched_skills": skill_result[
                "matched_skills"
            ],

            "missing_skills": skill_result[
                "missing_skills"
            ],

            "skill_matches": skill_result[
                "details"
            ],

            "recommendation":
                self.scorer.recommendation(
                    final_score
                ),
        }