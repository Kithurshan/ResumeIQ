from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ResumeUploadResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class ResumeStatusResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None

class BulkUploadResponse(BaseModel):
    success: bool
    accepted: List[Dict[str, Any]]
    rejected: List[Dict[str, Any]]

class ResumeListResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
