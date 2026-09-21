from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.features.matching.service import MatchingService


router = APIRouter(
    prefix="/matching",
    tags=["AI Candidate Matching"],
)


matching_service = MatchingService()


@router.post(
    "/calculate",
    summary="Calculate AI candidate-job match",
)
def calculate_match(
    job: Dict[str, Any],
    candidate: Dict[str, Any],
):

    try:

        result = matching_service.calculate_match(
            job=job,
            candidate=candidate,
        )

        return {
            "success": True,
            "data": result,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Matching failed: {str(error)}",
        )