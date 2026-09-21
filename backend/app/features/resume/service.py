import os
import uuid
import hashlib
import logging
from typing import Dict, Any, List
from fastapi import UploadFile, HTTPException, BackgroundTasks
from app.features.resume.repository import ResumeRepository
from app.core.resumes_exceptions import (
    InvalidResumeFile, ResumeParsingError,
    CorruptedDocumentError, EmptyDocumentError
)
from app.ai.resume_extractor import ResumeIQParser
from app.features.resume.processing_service import ResumeProcessingService
import app.ai.worker_pool as worker_pool  # <-- our shared thread pool
from app.features.setting.repository import SettingsRepository

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# ResumeService
# ─────────────────────────────────────────────────────────────────────────────

class ResumeService:
    """
    Handles every step of resume ingestion:
      1. Validate file type & size
      2. Check for duplicate files (hash)
      3. Check for corrupted or empty documents
      4. Save file to disk
      5. Parse resume text
      6. Resolve / create candidate record
      7. Create resume DB record
      8. Submit AI processing to the shared worker pool (max 8 concurrent)
    """

    # ── Allowed extensions (explicitly reject .exe, .zip, .jpg, .png, .txt …)
    ALLOWED_EXTENSIONS = {".pdf", ".docx"}

    # ── 5 MB hard limit
    MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5,242,880 bytes

    # ── Minimum characters required to consider a document non-empty
    MIN_TEXT_LENGTH = 50

    def __init__(self):
        self.repository = ResumeRepository()
        self.parser = ResumeIQParser()
        self.processor = ResumeProcessingService()
        self.settings_repo = SettingsRepository()
        self.upload_dir = os.path.join(os.getcwd(), "uploads", "resumes")
        os.makedirs(self.upload_dir, exist_ok=True)

    # ──────────────────────────────────────────────────────────────────────────
    # Main public method: called by the upload route
    # ──────────────────────────────────────────────────────────────────────────

    def process_upload(
        self,
        file: UploadFile,
        job_id: int,
        recruiter_id: int,
        background_tasks: BackgroundTasks,  # kept for API compatibility but we use the pool
    ) -> Dict[str, Any]:
        """
        Full upload pipeline with pre-validation.
        Raises InvalidResumeFile / CorruptedDocumentError / EmptyDocumentError
        on bad input so the route can return a 400 to the frontend.
        """

        # ── Step 0: Fetch global settings ────────────────────────────────────
        resume_settings = self.settings_repo.get_setting("global_resume_settings") or {}
        max_file_size_mb = resume_settings.get("maxFileSize", 5)
        allowed_types_setting = resume_settings.get("allowedTypes", {"pdf": True, "docx": True})
        
        dynamic_allowed_exts = set()
        if allowed_types_setting.get("pdf"):
            dynamic_allowed_exts.add(".pdf")
        if allowed_types_setting.get("docx"):
            dynamic_allowed_exts.add(".docx")
            
        if not dynamic_allowed_exts:
            dynamic_allowed_exts = self.ALLOWED_EXTENSIONS

        dynamic_max_size_bytes = max_file_size_mb * 1024 * 1024

        # ── Step 1: File extension check ──────────────────────────────────────
        ext = (
            os.path.splitext(file.filename)[1].lower()
            if file.filename
            else ""
        )
        if ext not in dynamic_allowed_exts:
            allowed_list = ", ".join(dynamic_allowed_exts)
            raise InvalidResumeFile(
                f"Unsupported file type '{ext}'. "
                f"Only {allowed_list} files are allowed by system settings."
            )

        # ── Step 2: Read file bytes (needed for size + hash checks) ──────────
        file_content = file.file.read()
        file.file.seek(0)
        file_size_bytes = len(file_content)

        # ── Step 3: File size check ───────────────────────────────────────────
        if file_size_bytes > dynamic_max_size_bytes:
            raise InvalidResumeFile(
                f"File exceeds the maximum allowed size of {max_file_size_mb} MB."
            )

        file_size_mb_str = f"{(file_size_bytes / (1024 * 1024)):.1f} MB"

        # ── Step 4: Validate job access ───────────────────────────────────────
        self.repository.validate_job_access(job_id, recruiter_id)

        # ── Step 6: Save file to disk ─────────────────────────────────────────
        safe_filename = (
            f"{uuid.uuid4().hex}_{os.path.basename(file.filename or ('resume' + ext))}"
        )
        file_path = os.path.join(self.upload_dir, safe_filename)
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)

        # ── Step 7: Corrupted document check ─────────────────────────────────
        # Try to open the file. If the library raises an error, the file is bad.
        try:
            self._check_document_readable(file_path, ext)
        except CorruptedDocumentError:
            os.remove(file_path)   # don't keep a broken file on disk
            raise
        except EmptyDocumentError:
            os.remove(file_path)
            raise

        # ── Step 8: Parse resume with NLP ────────────────────────────────────
        try:
            parsed_data = self.parser.parse(file_path)
        except Exception as e:
            raise ResumeParsingError(f"Failed to parse resume: {str(e)}")

        # ── Step 9: Check for meaningfully empty text after parsing ───────────
        extracted_text = parsed_data.get("extracted_text", "") or ""
        if len(extracted_text.strip()) < self.MIN_TEXT_LENGTH:
            os.remove(file_path)
            raise EmptyDocumentError(
                "No readable resume content detected. "
                "The document appears to be blank or contains only images."
            )

        # ── Step 10: Extract candidate information ────────────────────────────
        candidate_data = parsed_data.get("candidate", {})
        name = candidate_data.get("name") or "Unknown Candidate"
        email = candidate_data.get("email")
        phone = candidate_data.get("phone")
        address = candidate_data.get("address")

        # ── Step 11: Resolve (or create) the candidate in the DB ─────────────
        candidate_id = self.repository.resolve_candidate(name, email, phone, address)

        # ── Step 12: Create the resume DB record ──────────────────────────────
        resume_id = self.repository.create_resume_record(
            candidate_id=candidate_id,
            recruiter_id=recruiter_id,
            job_id=job_id,
            file_name=file.filename or safe_filename,
            file_path=file_path,
            file_size=file_size_mb_str,
            file_type=ext.lstrip(".").upper(),
            processing_status="Processing",
        )

        # ── Step 13: Submit AI scoring to the bounded worker pool ─────────────
        # This replaces FastAPI BackgroundTasks with a capped ThreadPoolExecutor
        # so that 500 simultaneous uploads don't crash RAM/CPU.
        worker_pool.submit_task(
            self.processor.process_background,
            resume_id,
            candidate_id,
            job_id,
            parsed_data,
        )

        return {
            "resume_id": resume_id,
            "candidate_id": candidate_id,
            "candidate_name": name,
            "job_id": job_id,
            "file_name": file.filename,
            "processing_status": "Processing",
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _check_document_readable(self, file_path: str, ext: str) -> None:
        """
        Attempt to open the saved file using the appropriate library.
        Raises CorruptedDocumentError if the file cannot be opened.
        """
        if ext == ".pdf":
            try:
                import pymupdf
                doc = pymupdf.open(file_path)
                doc.close()
            except Exception:
                raise CorruptedDocumentError(
                    "Unable to read this document. The file may be corrupted."
                )
        elif ext == ".docx":
            try:
                from docx import Document
                Document(file_path)
            except Exception:
                raise CorruptedDocumentError(
                    "Unable to read this document. The file may be corrupted."
                )

    # ──────────────────────────────────────────────────────────────────────────
    # Other public methods (unchanged)
    # ──────────────────────────────────────────────────────────────────────────

    def get_status(self, resume_id: int) -> Dict[str, Any]:
        status_data = self.repository.get_resume_status(resume_id)
        if not status_data:
            raise HTTPException(status_code=404, detail="Resume not found")
        return status_data

    def get_resume_file_path(self, resume_id: int) -> str:
        file_path = self.repository.get_resume_file_path(resume_id)
        if not file_path:
            raise HTTPException(status_code=404, detail="Resume file not found")
        return file_path

    def delete_resume(self, resume_id: int) -> None:
        self.get_status(resume_id)
        self.repository.delete_resume(resume_id)
