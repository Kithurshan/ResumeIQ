from typing import Any, Dict, List, Tuple
from fastapi import HTTPException
from app.core.database import get_database_connection
import math
import re

class RankingRepository:
    """
    Handles all database operations related to AI Candidate Rankings.
    """

    def _run_query(self, query: str, values: tuple = (), fetch: str = "none") -> Any:
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Cannot connect to the database.")
            
        try:
            with connection.cursor() as cursor:
                cursor.execute(query, values)
                if fetch == "one":
                    result = cursor.fetchone()
                elif fetch == "all":
                    result = cursor.fetchall()
                else:
                    result = None
            connection.commit()
            return result
        except Exception as e:
            connection.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            connection.close()

    def get_job_rankings_paginated(self, job_id: int, page: int, page_size: int) -> Tuple[List[Dict[str, Any]], int]:
        """
        Fetches a paginated list of candidate rankings for a specific job.
        Returns a tuple: (list of ranking records, total count of records)
        """
        # Calculate OFFSET based on page and page_size
        offset = (page - 1) * page_size
        
        # 1. Get total count of rankings for this job
        count_query = "SELECT COUNT(*) as total FROM rankings WHERE job_id = %s"
        count_result = self._run_query(count_query, (job_id,), fetch="one")
        total_items = count_result["total"] if count_result else 0
        
        if total_items == 0:
            return [], 0

        # 2. Fetch the paginated records by joining related tables
        query = """
            SELECT 
                r.ranking_id, 
                r.candidate_id, 
                r.job_id, 
                r.rank_position, 
                r.created_at,
                
                c.full_name as candidate_name,
                c.email as candidate_email,
                c.phone as candidate_phone,
                
                cs.skill_score, 
                cs.experience_score, 
                cs.education_score, 
                cs.certification_score, 
                cs.semantic_score, 
                cs.project_score,
                cs.portfolio_score, 
                cs.linkedin_score, 
                cs.overall_score, 
                cs.xgboost_probability,
                cs.recommendation,
                
                res.resume_id,
                res.processing_status as resume_status,
                
                COALESCE(csel.status, 'Pending') as selection_status
                
            FROM rankings r
            JOIN candidates c ON r.candidate_id = c.candidate_id
            LEFT JOIN LATERAL (
                SELECT * FROM candidate_scores 
                WHERE candidate_id = r.candidate_id AND job_id = r.job_id 
                ORDER BY created_at DESC LIMIT 1
            ) cs ON true
            LEFT JOIN LATERAL (
                SELECT * FROM resumes 
                WHERE candidate_id = r.candidate_id AND job_id = r.job_id 
                ORDER BY upload_date DESC LIMIT 1
            ) res ON true
            LEFT JOIN candidate_selection csel ON (r.candidate_id = csel.candidate_id AND r.job_id = csel.job_id)
            WHERE r.job_id = %s
            ORDER BY r.rank_position ASC
            LIMIT %s OFFSET %s
        """
        results = self._run_query(query, (job_id, page_size, offset), fetch="all")
        formatted_results = [dict(row) for row in results] if results else []
        return formatted_results, total_items

    def check_job_exists(self, job_id: int) -> bool:
        """Check whether a job with the given ID exists in the database."""
        query = "SELECT 1 FROM job_descriptions WHERE job_id = %s"
        result = self._run_query(query, (job_id,), fetch="one")
        return result is not None

    def _extract_skills_from_text(self, text: Any) -> list:
        """Infer likely skill names from a summary/about string when the explicit skills section is empty."""
        if text is None:
            return []

        content = str(text).strip()
        if not content:
            return []

        skill_aliases = {
            "odoo": "Odoo", "erp": "ERP", "python": "Python", "fastapi": "FastAPI",
            "flask": "Flask", "django": "Django", "javascript": "JavaScript",
            "typescript": "TypeScript", "react": "React", "vue": "Vue",
            "node.js": "Node.js", "nodejs": "Node.js", "sql": "SQL",
            "postgresql": "PostgreSQL", "mysql": "MySQL", "mongodb": "MongoDB",
            "redis": "Redis", "aws": "AWS", "azure": "Azure", "docker": "Docker",
            "kubernetes": "Kubernetes", "java": "Java", "c#": "C#",
            "c++": "C++", "php": "PHP", ".net": ".NET", "html": "HTML",
            "css": "CSS", "tailwind": "Tailwind CSS", "bootstrap": "Bootstrap",
            "rest api": "REST API", "api": "API", "machine learning": "Machine Learning",
            "ml": "ML", "ai": "AI", "data science": "Data Science",
            "pandas": "Pandas", "numpy": "NumPy", "pytorch": "PyTorch",
            "tensorflow": "TensorFlow", "selenium": "Selenium", "opencv": "OpenCV",
            "linux": "Linux", "git": "Git", "agile": "Agile", "scrum": "Scrum",
        }

        found = []
        seen = set()
        for alias, label in skill_aliases.items():
            if alias in content.lower() and label not in seen:
                found.append(label)
                seen.add(label)
        for match in re.findall(r"#?([A-Za-z0-9_.+-]+)", content):
            normalized = match.strip().lower().replace("_", " ")
            label = skill_aliases.get(normalized)
            if label and label not in seen:
                found.append(label)
                seen.add(label)
        return found

    def get_candidate_detailed_ranking(self, job_id: int, candidate_id: int) -> Dict[str, Any]:
        """
        Fetches the complete detailed breakdown for a specific candidate for a job.
        Includes extracted resume data like education, experience, and skills.
        """
        # First, fetch the base ranking info, scores, and status
        base_query = """
            SELECT 
                r.ranking_id, r.candidate_id, r.job_id, r.rank_position,
                c.full_name as candidate_name, c.email as candidate_email, c.phone as candidate_phone, c.address,
                jd.job_title,
                cs.skill_score, cs.experience_score, cs.education_score, cs.certification_score, 
                cs.semantic_score, cs.project_score, cs.portfolio_score, cs.linkedin_score, 
                cs.overall_score, cs.xgboost_probability, cs.recommendation,
                res.resume_id,
                du.linkedin_url, du.portfolio_url,
                la.profile_completeness AS la_profile_completeness,
                la.skills_detected AS skills_detected,
                la.experience_detected AS experience_detected,
                la.linkedin_score AS la_linkedin_score,
                la.analysis_summary AS la_analysis_summary,
                pa.technologies_detected AS technologies_detected,
                pa.projects_detected AS projects_detected,
                pa.github_projects AS github_projects,
                pa.portfolio_score AS pa_portfolio_score,
                pa.analysis_summary AS pa_analysis_summary,
                COALESCE(csel.status, 'Pending') as selection_status
            FROM rankings r
            JOIN candidates c ON r.candidate_id = c.candidate_id
            JOIN job_descriptions jd ON r.job_id = jd.job_id
            LEFT JOIN LATERAL (
                SELECT * FROM candidate_scores 
                WHERE candidate_id = r.candidate_id AND job_id = r.job_id 
                ORDER BY created_at DESC LIMIT 1
            ) cs ON true
            LEFT JOIN LATERAL (
                SELECT resume_id FROM resumes 
                WHERE candidate_id = r.candidate_id AND job_id = r.job_id
                ORDER BY upload_date DESC LIMIT 1
            ) res ON true
            LEFT JOIN detected_urls du ON res.resume_id = du.resume_id
            LEFT JOIN linkedin_analysis la ON res.resume_id = la.resume_id
            LEFT JOIN portfolio_analysis pa ON res.resume_id = pa.resume_id
            LEFT JOIN candidate_selection csel ON (r.candidate_id = csel.candidate_id AND r.job_id = csel.job_id)
            WHERE r.job_id = %s AND r.candidate_id = %s
        """
        base_info = self._run_query(base_query, (job_id, candidate_id), fetch="one")
        
        if not base_info:
            return None
            
        base_info = dict(base_info)
        resume_id = base_info.get("resume_id")

        # Parse LinkedIn and Portfolio analysis columns (they are stored as TEXT JSON or CSV)
        import json

        def parse_json_or_csv(value):
            if not value:
                return []
            if isinstance(value, (list, dict)):
                return value
            text = str(value)
            try:
                return json.loads(text)
            except Exception:
                # fall back to lines then commas
                lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
                if len(lines) > 1:
                    return [part.strip() for ln in lines for part in ln.split(",") if part.strip()]
                return [part.strip() for part in text.split(",") if part.strip()]

        linked_in_json = None
        raw_sum = base_info.get("analysis_summary") or base_info.get("la_analysis_summary")
        if raw_sum:
            try:
                linked_in_json = json.loads(raw_sum) if isinstance(raw_sum, str) else raw_sum
            except Exception:
                linked_in_json = {}
        elif base_info.get("linkedin_parsed"):
            linked_in_json = base_info.get("linkedin_parsed")

        # LinkedIn
        la_skills = []
        la_experience = []
        la_summary = []
        la_confidence = 0

        if linked_in_json:
            profile_info = linked_in_json.get("profile_information") or {}
            explicit_skills = linked_in_json.get("skills") or []
            summary_text = " ".join(
                part for part in [
                    linked_in_json.get("about"),
                    linked_in_json.get("summary"),
                    profile_info.get("headline"),
                    profile_info.get("current_position"),
                ] if part
            )
            inferred_skills = self._extract_skills_from_text(summary_text)
            la_skills = []
            for skill in list(explicit_skills) + list(inferred_skills):
                if skill and skill not in la_skills:
                    la_skills.append(skill)
            la_experience = linked_in_json.get("experience_timeline") or linked_in_json.get("professional_experience", {}).get("experience") or []
            la_summary = linked_in_json.get("aiAnalysis", {}).get("summary") or []
            la_confidence = int(float((linked_in_json.get("aiAnalysis") or {}).get("confidenceScore") or 0))
        else:
            # skills
            raw_skills = base_info.get("skills_detected") or base_info.get("la_skills_detected")
            la_skills = parse_json_or_csv(raw_skills)

            # experience
            raw_exp = base_info.get("experience_detected") or base_info.get("la_experience_detected")
            if raw_exp:
                try:
                    la_experience = json.loads(raw_exp) if not isinstance(raw_exp, (list, dict)) else raw_exp
                except Exception:
                    # fallback parsing lines with | or commas
                    la_experience = []
                    for ln in str(raw_exp).splitlines():
                        ln = ln.strip()
                        if not ln:
                            continue
                        parts = [p.strip() for p in ln.split("|") if p.strip()]
                        if len(parts) >= 2:
                            la_experience.append({"company": parts[0], "position": parts[1], "duration": parts[2] if len(parts) > 2 else ""})
                        else:
                            parts = [p.strip() for p in ln.split(",") if p.strip()]
                            if len(parts) >= 2:
                                la_experience.append({"company": parts[0], "position": parts[1], "duration": parts[2] if len(parts) > 2 else ""})

            # analysis summary
            raw_sum = base_info.get("analysis_summary") or base_info.get("la_analysis_summary")
            if raw_sum:
                try:
                    la_summary = json.loads(raw_sum) if not isinstance(raw_sum, (list, dict)) else (raw_sum if isinstance(raw_sum, list) else [str(raw_sum)])
                except Exception:
                    la_summary = [ln.strip() for ln in str(raw_sum).splitlines() if ln.strip()]

        try:
            la_confidence = int(float(base_info.get("linkedin_score") or base_info.get("la_linkedin_score") or la_confidence))
        except Exception:
            la_confidence = 0

        profile_info = (linked_in_json or {}).get("profile_information") or {}

        base_info["linkedin_parsed"] = {
            "profile_information": {
                "profile_url": profile_info.get("profile_url") or base_info.get("linkedin_url") or "",
                "full_name": profile_info.get("full_name") or base_info.get("candidate_name") or "",
                "headline": profile_info.get("headline") or base_info.get("headline") or "",
                "current_company": profile_info.get("current_company") or base_info.get("current_company") or "",
                "current_position": profile_info.get("current_position") or base_info.get("current_position") or "",
                "location": profile_info.get("location") or base_info.get("address") or "",
            },
            "about": (linked_in_json or {}).get("about") or base_info.get("la_about") or "",
            "experience_timeline": la_experience,
            "education": (linked_in_json or {}).get("education") or base_info.get("education") or [],
            "skills": la_skills or (base_info.get("skills") or []),
            "certifications": (linked_in_json or {}).get("certifications") or base_info.get("la_certifications") or [],
            "projects": (linked_in_json or {}).get("projects") or base_info.get("la_projects") or [],
            "languages": (linked_in_json or {}).get("languages") or base_info.get("la_languages") or [],
            "aiAnalysis": {"summary": la_summary, "confidenceScore": la_confidence}
        }

        # Portfolio
        pa_tech = parse_json_or_csv(base_info.get("technologies_detected") or base_info.get("pa_technologies_detected"))
        pa_projects = []
        raw_pa_projects = base_info.get("projects_detected") or base_info.get("pa_projects_detected")
        if raw_pa_projects:
            try:
                pa_projects = json.loads(raw_pa_projects) if not isinstance(raw_pa_projects, (list, dict)) else raw_pa_projects
            except Exception:
                pa_projects = [ln.strip() for ln in str(raw_pa_projects).splitlines() if ln.strip()]

        raw_pa_sum = base_info.get("pa_analysis_summary") or base_info.get("analysis_summary")
        pa_summary = []
        if raw_pa_sum:
            try:
                pa_summary = json.loads(raw_pa_sum) if not isinstance(raw_pa_sum, (list, dict)) else (raw_pa_sum if isinstance(raw_pa_sum, list) else [str(raw_pa_sum)])
            except Exception:
                pa_summary = [ln.strip() for ln in str(raw_pa_sum).splitlines() if ln.strip()]

        base_info["portfolio_parsed"] = {
            "portfolio_url": base_info.get("portfolio_url") or "",
            "technologies": pa_tech,
            "projects": pa_projects,
            "analysis_summary": pa_summary,
            "portfolio_score": float(base_info.get("portfolio_score") or 0.0),
            "github_projects": int(base_info.get("github_projects") or 0)
        }
        
        # Fetch extracted data lists
        if resume_id:
            # `experiences` column stores a JSON array of {title, company, duration}
            ext_query = "SELECT education, skills, experiences FROM extracted_resume_data WHERE resume_id = %s"
            ext_data = self._run_query(ext_query, (resume_id,), fetch="one")
            
            import json
            if ext_data:
                # Parse education JSON string
                # The JSON stores: degree, institution, start_year, end_year
                try:
                    edu_raw = json.loads(ext_data.get("education") or "[]")
                    parsed_education = []
                    for e in (edu_raw if isinstance(edu_raw, list) else []):
                        start = e.get("start_year")   # e.g. "2024" or null
                        end   = e.get("end_year")     # e.g. "2025" or "Present"
                        
                        # Build a friendly year string:
                        # "2024 – Present"  /  "2024 – 2025"  /  "Present"  /  None
                        if start and end:
                            year_label = f"{start} – {end}"
                        elif end:
                            year_label = end          # could be "Present"
                        elif start:
                            year_label = start
                        else:
                            year_label = None         # no date info at all → hide label
                        
                        parsed_education.append({
                            "degree":      e.get("degree"),
                            "institution": e.get("institution"),
                            "year":        year_label,   # sent to frontend as-is
                        })
                    base_info["education"] = parsed_education
                except:
                    base_info["education"] = []
                
                # Parse skills JSON string
                try:
                    skills_raw = json.loads(ext_data.get("skills") or "[]")
                    base_info["skills"] = skills_raw if isinstance(skills_raw, list) else []
                except:
                    base_info["skills"] = []
                    
                # Parse experiences JSON column (if available). Expecting list of objects
                raw_exps = ext_data.get("experiences")
                parsed_exps = []
                if raw_exps:
                    try:
                        parsed_exps = json.loads(raw_exps) if not isinstance(raw_exps, (list, dict)) else raw_exps
                        # Normalize each entry to expected keys
                        normalized = []
                        for e in (parsed_exps if isinstance(parsed_exps, list) else []):
                            if isinstance(e, str):
                                try:
                                    e = json.loads(e)
                                except Exception:
                                    pass
                            if not isinstance(e, dict):
                                continue
                            title = e.get("title") or e.get("position") or e.get("job_title") or ""
                            company = e.get("company") or e.get("employer") or ""
                            duration = e.get("duration") or e.get("years") or ""
                            normalized.append({"title": title, "company": company, "duration": duration, "description": e.get("description", "")})
                        base_info["experience"] = normalized
                    except Exception:
                        base_info["experience"] = la_experience if la_experience else []
                else:
                    # No structured resume experience — fall back to LinkedIn parsed experience if available
                    base_info["experience"] = la_experience if la_experience else []
            else:
                base_info["education"] = []
                base_info["experience"] = []
                base_info["skills"] = []
        else:
            base_info["education"] = []
            base_info["experience"] = []
            base_info["skills"] = []
            
        return base_info
        
    def update_candidate_selection_status(self, job_id: int, candidate_id: int, status: str, recruiter_id: int) -> bool:
        """
        Updates or inserts the candidate selection status for a specific job.
        """
        query = """
            INSERT INTO candidate_selection (job_id, candidate_id, status, recruiter_id)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (job_id, candidate_id) 
            DO UPDATE SET status = EXCLUDED.status, recruiter_id = EXCLUDED.recruiter_id, decision_date = CURRENT_TIMESTAMP
        """
        try:
            self._run_query(query, (job_id, candidate_id, status, recruiter_id))
            return True
        except Exception as e:
            print(f"[ERROR] update_candidate_selection_status failed: {e}")
            return False

    def auto_reject_expired_candidates(self) -> int:
        """
        Finds all 'Pending' candidates for jobs where the application deadline has passed,
        and automatically marks their status as 'Rejected'. Returns the number of rows updated.
        """
        query = """
            UPDATE candidate_selection cs
            SET status = 'Rejected', decision_date = CURRENT_TIMESTAMP
            FROM job_descriptions jd
            WHERE cs.job_id = jd.job_id
              AND cs.status = 'Pending'
              AND jd.application_deadline < CURRENT_DATE
            RETURNING cs.selection_id;
        """
        try:
            # We use fetch="all" with the RETURNING clause to count how many rows were actually updated.
            result = self._run_query(query, fetch="all")
            return len(result) if result else 0
        except Exception as e:
            print(f"Error in auto_reject_expired_candidates: {e}")
            return 0

    def send_deadline_reminders(self) -> int:
        """
        Sends a notification reminder to recruiters for jobs expiring tomorrow.
        """
        query = """
            SELECT job_id, job_title, recruiter_id
            FROM job_descriptions
            WHERE application_deadline = CURRENT_DATE + INTERVAL '1 day'
        """
        try:
            results = self._run_query(query, fetch="all")
            if not results:
                return 0
                
            from app.features.notification.repository import NotificationRepository
            notif_repo = NotificationRepository()
            
            count = 0
            for row in results:
                title = "Job Deadline Reminder"
                message = f"Reminder: The deadline for your job '{row['job_title']}' (Job #{row['job_id']}) is tomorrow."
                notif_repo.create_notification(row['recruiter_id'], title, message)
                count += 1
                
            return count
        except Exception as e:
            print(f"Error in send_deadline_reminders: {e}")
            return 0

    def get_decided_candidates(self) -> List[Dict[str, Any]]:
        """
        Fetches all candidates who have been Shortlisted, Waitlisted, or Rejected.
        """
        query = """
            SELECT 
                c.candidate_id as id,
                c.full_name as name,
                csel.job_id,
                j.job_title as job,
                cs.overall_score as score,
                cs.recommendation,
                csel.status,
                TO_CHAR(csel.decision_date, 'Mon DD, YYYY') as decision_date
            FROM candidate_selection csel
            JOIN candidates c ON csel.candidate_id = c.candidate_id
            JOIN job_descriptions j ON csel.job_id = j.job_id
            JOIN candidate_scores cs ON (csel.candidate_id = cs.candidate_id AND csel.job_id = cs.job_id)
            WHERE csel.status IN ('Shortlisted', 'Waitlisted', 'Rejected')
            ORDER BY csel.decision_date DESC
        """
        results = self._run_query(query, fetch="all")
        return [dict(row) for row in results] if results else []

    def get_all_rankings_for_admin(self) -> List[Dict[str, Any]]:
        """
        Fetches all candidate rankings across all jobs for the admin monitoring dashboard.
        """
        query = """
            SELECT 
                r.ranking_id as id,
                r.rank_position as rank,
                c.full_name as candidate,
                j.job_title as job,
                cs.overall_score as score,
                cs.recommendation as recommendation,
                rec.full_name as recruiter
            FROM rankings r
            JOIN candidates c ON r.candidate_id = c.candidate_id
            JOIN job_descriptions j ON r.job_id = j.job_id
            LEFT JOIN LATERAL (
                SELECT overall_score, recommendation FROM candidate_scores 
                WHERE candidate_id = r.candidate_id AND job_id = r.job_id 
                ORDER BY created_at DESC LIMIT 1
            ) cs ON true
            LEFT JOIN LATERAL (
                SELECT recruiter_id FROM resumes 
                WHERE candidate_id = r.candidate_id AND job_id = r.job_id 
                ORDER BY upload_date DESC LIMIT 1
            ) res ON true
            LEFT JOIN recruiters rec ON res.recruiter_id = rec.recruiter_id
            ORDER BY cs.overall_score DESC NULLS LAST
        """
        results = self._run_query(query, fetch="all")
        
        formatted_results = []
        for row in (results or []):
            d = dict(row)
            # overall_score in db could be float like 85.5 or decimal. 
            if d.get("score") is not None:
                d["score"] = round(float(d["score"]))
            else:
                d["score"] = 0
            
            # Use 'Not Recommended' as fallback
            d["recommendation"] = d.get("recommendation") or 'Not Recommended'
            d["recruiter"] = d.get("recruiter") or 'Unknown'
            formatted_results.append(d)
            
        return formatted_results

    def get_ranking_details_for_admin(self, ranking_id: int) -> Dict[str, Any]:
        # 1. Get ranking record
        r = self._run_query("SELECT * FROM rankings WHERE ranking_id = %s", (ranking_id,), fetch="one")
        if not r:
            return None
        
        candidate_id = r["candidate_id"]
        job_id = r["job_id"]
        rank = r["rank_position"]
        
        # 2. Get candidate
        c = self._run_query("SELECT * FROM candidates WHERE candidate_id = %s", (candidate_id,), fetch="one")
        
        # 3. Get job
        j = self._run_query("SELECT job_title FROM job_descriptions WHERE job_id = %s", (job_id,), fetch="one")
        
        # 4. Get latest score
        cs = self._run_query(
            "SELECT * FROM candidate_scores WHERE candidate_id = %s AND job_id = %s ORDER BY created_at DESC LIMIT 1",
            (candidate_id, job_id), fetch="one"
        )
        
        # 5. Get selection status
        csel = self._run_query(
            "SELECT status FROM candidate_selection WHERE candidate_id = %s AND job_id = %s ORDER BY decision_date DESC LIMIT 1",
            (candidate_id, job_id), fetch="one"
        )
        status = csel["status"] if csel else "Pending"
        
        # 6. Get resume
        res = self._run_query(
            "SELECT resume_id, file_path FROM resumes WHERE candidate_id = %s AND job_id = %s ORDER BY upload_date DESC LIMIT 1",
            (candidate_id, job_id), fetch="one"
        )
        
        preview_url = None
        extracted = None
        linkedin = None
        portfolio = None
        
        if res:
            resume_id = res["resume_id"]
            if res.get("file_path"):
                path = str(res["file_path"]).replace("\\", "/").replace("\\", "/")
                if "uploads/" in path:
                    rel_path = path.split("uploads/")[-1]
                    preview_url = f"http://localhost:5000/uploads/{rel_path}"
                else:
                    preview_url = f"http://localhost:5000/{path.split('/')[-1]}"
                    
            extracted = self._run_query(
                "SELECT * FROM extracted_resume_data WHERE resume_id = %s ORDER BY created_at DESC LIMIT 1",
                (resume_id,), fetch="one"
            )
            linkedin = self._run_query(
                "SELECT * FROM linkedin_analysis WHERE resume_id = %s ORDER BY created_at DESC LIMIT 1",
                (resume_id,), fetch="one"
            )
            portfolio = self._run_query(
                "SELECT * FROM portfolio_analysis WHERE resume_id = %s ORDER BY created_at DESC LIMIT 1",
                (resume_id,), fetch="one"
            )
            
        import json
        
        def safe_json(val):
            if not val: return []
            if isinstance(val, list): return val
            if isinstance(val, dict): return [val]
            try:
                return json.loads(val)
            except:
                return []
                
        def safe_json_dict(val):
            if not val: return {}
            if isinstance(val, dict): return val
            try:
                return json.loads(val)
            except:
                return {}

        return {
            "id": ranking_id,
            "name": c["full_name"] if c else "Unknown",
            "job": j["job_title"] if j else "Unknown",
            "status": status,
            "rank": rank,
            "aiScore": round(float(cs["overall_score"])) if cs and cs.get("overall_score") else 0,
            "recommendation": cs["recommendation"] if cs and cs.get("recommendation") else "Not Recommended",
            "personal": {
                "email": c["email"] if c else "",
                "phone": c["phone"] if c else "",
                "address": c["address"] if c else ""
            },
            "education": safe_json(extracted["education"] if extracted else None),
            "experience": safe_json(extracted["experiences"] if extracted else None),
            "skills": safe_json(extracted["skills"] if extracted else None),
            "aiBreakdown": {
                "skillsMatch": round(float(cs["skill_score"])) if cs and cs.get("skill_score") else 0,
                "experienceMatch": round(float(cs["experience_score"])) if cs and cs.get("experience_score") else 0,
                "educationMatch": round(float(cs["education_score"])) if cs and cs.get("education_score") else 0,
                "semanticSimilarity": round(float(cs["semantic_score"])) if cs and cs.get("semantic_score") else 0,
            },
            "linkedin": {
                "url": "https://linkedin.com",
                "connections": "500+",
                "endorsements": round(float(linkedin["linkedin_score"])) if linkedin and linkedin.get("linkedin_score") else 0,
                "posts": 12
            },
            "portfolio": {
                "url": "https://github.com",
                "repos": safe_json_dict(portfolio["github_projects"] if portfolio else None).get("total_repos", 0),
                "stars": 0,
                "commits": "100+"
            },
            "previewUrl": preview_url
        }

    def get_all_shortlisted_for_admin(self) -> List[Dict[str, Any]]:
        """
        Fetches all candidate decisions (Shortlisted, Waitlisted, Rejected) for the admin monitoring dashboard.
        """
        query = """
            SELECT 
                r.ranking_id as id,
                c.full_name as candidate,
                j.job_title as job,
                rec.full_name as recruiter,
                cs.overall_score as score,
                csel.status as status,
                csel.decision_date as date
            FROM candidate_selection csel
            JOIN candidates c ON csel.candidate_id = c.candidate_id
            JOIN job_descriptions j ON csel.job_id = j.job_id
            JOIN recruiters rec ON csel.recruiter_id = rec.recruiter_id
            LEFT JOIN LATERAL (
                SELECT overall_score FROM candidate_scores 
                WHERE candidate_id = csel.candidate_id AND job_id = csel.job_id 
                ORDER BY created_at DESC LIMIT 1
            ) cs ON true
            LEFT JOIN LATERAL (
                SELECT ranking_id FROM rankings 
                WHERE candidate_id = csel.candidate_id AND job_id = csel.job_id 
                ORDER BY created_at DESC LIMIT 1
            ) r ON true
            ORDER BY csel.decision_date DESC NULLS LAST
        """
        results = self._run_query(query, fetch="all")
        
        formatted_results = []
        for row in (results or []):
            d = dict(row)
            if d.get("score") is not None:
                d["score"] = round(float(d["score"]))
            else:
                d["score"] = 0
                
            if d.get("date"):
                d["date"] = d["date"].strftime("%Y-%m-%d")
            else:
                d["date"] = "Unknown"
                
            formatted_results.append(d)
            
        return formatted_results
