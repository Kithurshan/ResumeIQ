import sys
import os
import re
import traceback
import json
from pathlib import Path
from typing import Dict, Any

import app.ai.worker_pool as worker_pool
from app.features.resume.repository import ResumeRepository
from app.features.matching.service import MatchingService
from app.ai.xgboost_inference import XGBoostInference
from app.ai.resume_pipeline_cache import SimpleResumeCache
from app.features.setting.repository import SettingsRepository


class ResumeProcessingService:
    """
    Orchestrates the background AI pipeline for resume processing.
    
    Pipeline stages:
        Extracting -> NLP Completed -> URLs Detected
        -> LinkedIn Analysis (optional)
        -> Portfolio Analysis (optional)
        -> AI Scoring -> Completed
    """

    def __init__(self):
        self.repository = ResumeRepository()
        self.matching_service = MatchingService()
        self.xgboost = XGBoostInference()
        self.url_cache = SimpleResumeCache(ttl_seconds=1800)
        self.settings_repo = SettingsRepository()

    def _should_skip_optional_analysis(self, parsed_data: Dict[str, Any]) -> bool:
        """Reject obviously empty or low-value inputs before scraping.

        This saves time on bad files and avoids doing expensive browser work
        when the text is too weak or absent.
        """
        text = (parsed_data.get("extracted_text") or "").strip()
        if len(text) < 50:
            return True
        return False

    def _get_cached_result(self, key: str, default_value: Any):
        """Return cached external analysis result if it exists."""
        cached_value = self.url_cache.get(key)
        if cached_value is not None:
            return cached_value
        return default_value

    def _save_cached_result(self, key: str, value: Any) -> None:
        """Store external analysis result for reuse."""
        self.url_cache.set(key, value)

    def _get_analyzer_root(self) -> Path:
        """Return the project backend root so analyzer modules are found reliably."""
        return Path(__file__).resolve().parents[2]

    def process_background(self, resume_id: int, candidate_id: int, job_id: int, parsed_data: Dict[str, Any]):
        """
        Main background task entry point.
        Called by FastAPI BackgroundTasks after the upload endpoint returns.
        """
        try:
            # ── Stage 1: Extract & store NLP data ──────────────
            self.repository.update_resume_status(resume_id, "Text Extracted")
            self.repository.save_extracted_data(resume_id, parsed_data)
            self.repository.update_resume_status(resume_id, "Natural Language Processing (NLP) Completed")

            # ── Stage 2: Detect & store URLs ───────────────────
            detected_urls = parsed_data.get("detected_urls", {})
            self.repository.save_detected_urls(resume_id, detected_urls)
            self.repository.update_resume_status(resume_id, "URLs Detected")

            # ── Stage 3: LinkedIn Analysis (optional) ──────────
            linkedin_url = detected_urls.get("linkedin")
            linkedin_score = 0.0
            if linkedin_url and not self._should_skip_optional_analysis(parsed_data):
                cache_key = f"linkedin:{linkedin_url.lower()}"
                cached_payload = self._get_cached_result(cache_key, None)
                if cached_payload is not None:
                    linkedin_score = cached_payload.get("linkedin_score", 0.0)
                    self.repository.save_linkedin_analysis(resume_id, cached_payload)
                else:
                    future = worker_pool.submit_scrape_task(self._run_linkedin_analysis, resume_id, linkedin_url)
                    linkedin_payload = future.result()
                    linkedin_score = linkedin_payload.get("linkedin_score", 0.0)
                    self._save_cached_result(cache_key, linkedin_payload)

            # ── Stage 4: Portfolio Analysis (optional) ─────────
            portfolio_url = detected_urls.get("portfolio")
            portfolio_score = 0.0
            if portfolio_url and not self._should_skip_optional_analysis(parsed_data):
                cache_key = f"portfolio:{portfolio_url.lower()}"
                cached_payload = self._get_cached_result(cache_key, None)
                if cached_payload is not None:
                    portfolio_score = cached_payload.get("portfolio_score", 0.0)
                    self.repository.save_portfolio_analysis(resume_id, cached_payload)
                else:
                    future = worker_pool.submit_scrape_task(self._run_portfolio_analysis, resume_id, portfolio_url)
                    portfolio_payload = future.result()
                    portfolio_score = portfolio_payload.get("portfolio_score", 0.0)
                    self._save_cached_result(cache_key, portfolio_payload)

            # ── Stage 5: SBERT + Component Scores + XGBoost ────
            self.repository.update_resume_status(resume_id, "Semantic Matching (SBERT)")

            # Fetch job details
            job_data = self.repository.get_job(job_id)
            if not job_data:
                raise Exception(f"Job {job_id} not found for semantic matching.")

            # Build normalized structures for MatchingService.calculate_match()
            required_skills_raw = job_data.get("required_skills", "")
            required_skills_list = []
            if required_skills_raw:
                try:
                    required_skills_list = json.loads(required_skills_raw)
                except (json.JSONDecodeError, TypeError):
                    required_skills_list = [s.strip() for s in str(required_skills_raw).split(",") if s.strip()]

            norm_job = {
                "title": job_data.get("job_title", ""),
                "description": job_data.get("job_description", ""),
                "experience": job_data.get("experience_required", ""),
                "education": job_data.get("qualifications", ""),
                "requiredSkills": required_skills_list,
            }

            norm_candidate = {
                "candidate_id": candidate_id,
                "name": parsed_data.get("candidate", {}).get("name", "Unknown"),
                "summary": parsed_data.get("summary", ""),
                "skills": parsed_data.get("skills", {}),
                "work_experience": parsed_data.get("work_experience", []),
                "education": parsed_data.get("education", []),
                "projects": parsed_data.get("projects", []),
            }

            # Use existing MatchingService.calculate_match() for all SBERT scoring
            match_result = self.matching_service.calculate_match(norm_job, norm_candidate)

            # Save semantic scores
            semantic_score = float(match_result.get("semantic_score", 0.0))
            self.repository.save_semantic_scores(candidate_id, job_id, {
                "similarity_score": semantic_score,
                "matched_keywords": match_result.get("matched_skills", []),
                "missing_keywords": match_result.get("missing_skills", []),
            })

            # Gather all component scores for weighted scoring + XGBoost label
            skill_score = float(match_result.get("skill_score", 0.0))
            experience_score = float(match_result.get("experience_score", 0.0))
            education_score = float(match_result.get("education_score", 0.0))
            project_score = float(match_result.get("project_score", 0.0))
            certification_score = 100.0 if parsed_data.get("certifications") else 0.0

            features = {
                "skill_score": skill_score,
                "experience_score": experience_score,
                "education_score": education_score,
                "certification_score": certification_score,
                "semantic_score": semantic_score,
                "project_score": project_score,
                "portfolio_score": portfolio_score,
                "linkedin_score": linkedin_score,
            }

            self.repository.update_resume_status(resume_id, "AI Evaluation (XGBoost)")

            # Run weighted scoring + XGBoost recommendation label
            prediction = self.xgboost.predict(features)

            # Simple early filter: if skill overlap is very low, skip extra heavy work.
            # This keeps large resume batches moving quickly.
            if hasattr(self, "matching_service") and match_result.get("skill_score", 0.0) < 10:
                prediction["recommendation"] = "Low Match"
                prediction["overall_score"] = min(prediction.get("overall_score", 0.0), 35.0)

            # Fetch AI settings for dynamic minScore
            ai_settings = self.settings_repo.get_setting("global_ai_settings") or {}
            min_score = ai_settings.get("minScore", 70)
            
            # Auto-reject based on minScore
            if prediction.get("overall_score", 0.0) < min_score:
                prediction["recommendation"] = "Not Recommended"

            # Combine all scores
            final_scores = {**features, **prediction}
            self.repository.save_candidate_scores(candidate_id, job_id, resume_id, final_scores)
            
            # If they scored lower than minScore, auto-reject them in selection
            if prediction.get("overall_score", 0.0) < min_score:
                from app.features.ranking.repository import RankingRepository
                RankingRepository().update_candidate_selection_status(job_id, candidate_id, "Rejected", 0)

            # ── Stage 6: Update Rankings ───────────────────────
            self.repository.update_resume_status(resume_id, "Ranking Generated")
            self.repository.update_rankings(job_id)

            self.repository.update_resume_status(resume_id, "Completed")
            
            # Check Notification settings
            notif_settings = self.settings_repo.get_setting("global_notification_settings") or {}
            if notif_settings.get("resumeUploaded", True) or notif_settings.get("reportGenerated", True):
                self._send_notification(job_id, "Resume Analysis Completed", f"AI has successfully analyzed the resume for job #{job_id}.")
                self._send_notification(job_id, "AI Recommendation Ready", f"New candidate recommendations are ready for job #{job_id}.")

        except Exception as e:
            print(f"[RESUME ERROR] Pipeline failed for resume {resume_id}: {e}")
            traceback.print_exc()
            self.repository.update_resume_status(resume_id, "Failed")
            
            notif_settings = self.settings_repo.get_setting("global_notification_settings") or {}
            if notif_settings.get("aiFailed", True):
                self._send_notification(job_id, "Analysis Failed", f"Failed to process the uploaded resume for job #{job_id}.")

    def _send_notification(self, job_id: int, title: str, message: str):
        from app.core.database import get_database_connection
        from app.features.notification.repository import NotificationRepository
        
        conn = get_database_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT recruiter_id FROM job_descriptions WHERE job_id = %s", (job_id,))
            row = cur.fetchone()
            if row:
                NotificationRepository().create_notification(row['recruiter_id'], title, message)
        except Exception as e:
            print("Failed to send background notification:", e)
        finally:
            conn.close()

    @staticmethod
    def _extract_skills_from_text(text: Any) -> list[str]:
        """Infer likely skill names from a summary/about string when the explicit skills section is empty."""
        if text is None:
            return []

        content = str(text).strip()
        if not content:
            return []

        skill_aliases = {
            "odoo": "Odoo",
            "erp": "ERP",
            "python": "Python",
            "fastapi": "FastAPI",
            "flask": "Flask",
            "django": "Django",
            "javascript": "JavaScript",
            "typescript": "TypeScript",
            "react": "React",
            "vue": "Vue",
            "node.js": "Node.js",
            "nodejs": "Node.js",
            "sql": "SQL",
            "postgresql": "PostgreSQL",
            "mysql": "MySQL",
            "mongodb": "MongoDB",
            "redis": "Redis",
            "aws": "AWS",
            "azure": "Azure",
            "docker": "Docker",
            "kubernetes": "Kubernetes",
            "java": "Java",
            "c#": "C#",
            "csharp": "C#",
            "c++": "C++",
            "php": "PHP",
            ".net": ".NET",
            "dotnet": ".NET",
            "dot net": ".NET",
            "html": "HTML",
            "css": "CSS",
            "tailwind": "Tailwind CSS",
            "bootstrap": "Bootstrap",
            "rest api": "REST API",
            "api": "API",
            "machine learning": "Machine Learning",
            "ml": "ML",
            "artificial intelligence": "Artificial Intelligence",
            "ai": "AI",
            "data science": "Data Science",
            "pandas": "Pandas",
            "numpy": "NumPy",
            "scikit-learn": "Scikit-learn",
            "pytorch": "PyTorch",
            "tensorflow": "TensorFlow",
            "selenium": "Selenium",
            "opencv": "OpenCV",
            "linux": "Linux",
            "git": "Git",
            "github": "GitHub",
            "agile": "Agile",
            "scrum": "Scrum",
            "problem solving": "Problem Solving",
            "data analysis": "Data Analysis",
        }

        found: list[str] = []
        seen = set()

        # Match known aliases case-insensitively in their natural text order.
        for alias, label in skill_aliases.items():
            if alias in content.lower() and label not in seen:
                found.append(label)
                seen.add(label)

        # Also capture hash tags like #Python, #DotNet, #CSharp and other common token forms.
        for match in re.findall(r"#?([A-Za-z0-9_.+-]+)", content):
            normalized = match.strip().lower().replace("_", " ")
            label = skill_aliases.get(normalized)
            if label and label not in seen:
                found.append(label)
                seen.add(label)

            if normalized in {"csharp", "dotnet"} and label is None:
                label = ".NET" if normalized == "dotnet" else "C#"
                if label not in seen:
                    found.append(label)
                    seen.add(label)

        # Keep a few generic but useful technology mentions without flooding the list with non-skills.
        return found

    def _prepare_linkedin_db_payload(self, raw_data: Dict[str, Any] | None, url: str) -> Dict[str, Any]:
        """Normalize the parsed LinkedIn profile into the columns currently used by the database."""
        import re

        profile_data = raw_data or {}
        profile_info = profile_data.get("profile_information") or {}

        explicit_skills = profile_data.get("skills") or []
        if isinstance(explicit_skills, str):
            explicit_skills = [skill.strip() for skill in explicit_skills.split(",") if skill.strip()]

        summary_text = " ".join(
            part for part in [
                profile_data.get("about"),
                profile_data.get("summary"),
                profile_info.get("headline"),
                profile_info.get("current_position"),
            ] if part
        )
        inferred_skills = self._extract_skills_from_text(summary_text)

        skills_detected = []
        for skill in list(explicit_skills) + list(inferred_skills):
            if skill and skill not in skills_detected:
                skills_detected.append(skill)

        experience_detected = profile_data.get("experience_timeline") or \
            profile_data.get("professional_experience", {}).get("experience") or []

        profile_completeness = 100.0 if profile_data else 0.0
        if profile_data and not any([
            profile_info,
            profile_data.get("about"),
            skills_detected,
            experience_detected,
            profile_data.get("education"),
            profile_data.get("skills"),
        ]):
            profile_completeness = 0.0

        return {
            "profile_completeness": profile_completeness,
            "skills_detected": skills_detected,
            "experience_detected": experience_detected,
            "linkedin_score": 75.0 if profile_completeness else 0.0,
            "analysis_summary": json.dumps(profile_data, ensure_ascii=False),
        }

    # ──────────────────────────────────────────────────────────
    # LinkedIn Analysis
    # ──────────────────────────────────────────────────────────

    def _run_linkedin_analysis(self, resume_id: int, url: str) -> Dict[str, Any]:
        """
        Wraps the existing LinkedIn analyzer.
        Returns the linkedin payload dict on success.
        """
        try:
            from app.ai.linkedin_analyzer.browser import Browser
            from app.ai.linkedin_analyzer.processor import CandidateProcessor

            browser_instance = Browser()
            driver, wait = browser_instance.start()
            try:
                processor = CandidateProcessor(driver, wait, browser_instance.temp_download_dir)
                result = processor.process(url)

                if result.get("status") == "completed":
                    linkedin_payload = self._prepare_linkedin_db_payload(result.get("data"), url)
                    self.repository.save_linkedin_analysis(resume_id, linkedin_payload)
                    return linkedin_payload
                else:
                    error_msg = result.get("error", "Unknown error")
                    print(f"[RESUME WARNING] LinkedIn analysis returned non-completed for {url}: {error_msg}")
                    payload = {
                        "linkedin_score": 0.0,
                        "analysis_summary": f"LinkedIn analysis failed: {error_msg}",
                    }
                    self.repository.save_linkedin_analysis(resume_id, payload)
                    return payload
            finally:
                browser_instance.close()

        except Exception as e:
            print(f"[RESUME WARNING] LinkedIn analysis exception for {url}: {e}")
            payload = {
                "linkedin_score": 0.0,
                "analysis_summary": f"LinkedIn analysis unavailable: {e}",
            }
            self.repository.save_linkedin_analysis(resume_id, payload)
            return payload

    # ──────────────────────────────────────────────────────────
    # Portfolio Analysis
    # ──────────────────────────────────────────────────────────

    def _run_portfolio_analysis(self, resume_id: int, url: str) -> Dict[str, Any]:
        """
        Wraps the existing Portfolio analyzer.
        Returns the portfolio payload dict on success.
        """
        try:
            from app.ai.portfolio_analyzer.portfolio_analyzer import PortfolioAnalyzer
            import traceback

            analyzer = PortfolioAnalyzer(url)
            result = analyzer.analyze()

            try:
                techs = list(result.technologies or [])
                projects_raw = list(result.projects or [])

                tech_count = len(techs)
                project_count = len(projects_raw)

                # Build structured projects list (name, description, technologies, url)
                projects = []
                for p in projects_raw:
                    try:
                        projects.append({
                            "name": getattr(p, "title", "") or "",
                            "description": getattr(p, "description", "") or "",
                            "technologies": list(getattr(p, "technologies", []) or []),
                            "url": getattr(p, "url", "") or "",
                        })
                    except Exception:
                        # If one project object is malformed, skip it but continue.
                        print("[RESUME WARNING] Skipping malformed project during portfolio post-processing")

                # Simple heuristic: more tech & projects = higher score
                score = min(100.0, (tech_count * 5.0) + (project_count * 10.0))

                analysis_summary = {
                    "portfolio_url": getattr(result, "portfolio_url", url),
                    "domain": getattr(result, "domain", ""),
                    "pages_crawled": getattr(result, "pages_crawled", 0),
                    "projects_found": project_count,
                    "technologies_used": tech_count,
                    # Placeholder fields - can be improved with additional checks
                    "responsive_design": None,
                    "documentation": None,
                    "last_updated": None,
                }

                payload = {
                    "technologies_detected": techs,
                    "projects_detected": projects,
                    "github_projects": [],
                    "portfolio_score": score,
                    "analysis_summary": analysis_summary,
                }
                self.repository.save_portfolio_analysis(resume_id, payload)
                return payload

            except Exception as post_exc:
                tb = traceback.format_exc()
                print(f"[RESUME WARNING] Portfolio analysis post-processing failed for {url}: {post_exc}\n{tb}")

                # Attempt a safe fallback save using only the raw, best-effort fields
                try:
                    safe_techs = []
                    try:
                        safe_techs = list(result.technologies or [])
                    except Exception:
                        safe_techs = []

                    safe_projects = []
                    try:
                        for p in list(result.projects or []):
                            safe_projects.append({
                                "name": getattr(p, "title", "") or "",
                                "description": getattr(p, "description", "") or "",
                                "technologies": list(getattr(p, "technologies", []) or []),
                                "url": getattr(p, "url", "") or "",
                            })
                    except Exception:
                        safe_projects = []

                    payload = {
                        "technologies_detected": safe_techs,
                        "projects_detected": safe_projects,
                        "github_projects": [],
                        "portfolio_score": 0.0,
                        "analysis_summary": {
                            "error": str(post_exc) or "Post-processing error",
                            "traceback": tb,
                        },
                    }
                    self.repository.save_portfolio_analysis(resume_id, payload)
                    return payload
                except Exception as save_exc:
                    print(f"[RESUME ERROR] Failed to save portfolio analysis fallback for {url}: {save_exc}\n{traceback.format_exc()}")

                return {"portfolio_score": 0.0, "analysis_summary": f"Error: {post_exc}"}

        except Exception as e:
            print(f"[RESUME WARNING] Portfolio analysis exception for {url}: {e}")
            payload = {
                "portfolio_score": 0.0,
                "analysis_summary": f"Portfolio analysis unavailable: {e}",
            }
            self.repository.save_portfolio_analysis(resume_id, payload)
            return payload
