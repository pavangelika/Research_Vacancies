from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from backend.schemas.responses import (
    ResponseCalendarResponseDto,
    ResponseDetailsDto,
    ResponseListResponseDto,
    UpdateResponseDetailsRequestDto,
    UpdateResponseDetailsResultDto,
)
from backend.schemas.vacancies import ResumeActionResponseDto
from backend.services.responses_service import ResponsesService

router = APIRouter()
service = ResponsesService()


@router.get("", response_model=ResponseListResponseDto)
def list_responses(
    role_ids: list[str] | None = Query(default=None),
    status: str = "all",
    currency: str = "all",
    offer: str = "all",
    page: int = 1,
    per_page: int = 50,
):
    return service.list_responses(
        role_ids=role_ids,
        status=status,
        currency=currency,
        offer=offer,
        page=page,
        per_page=per_page,
    )


@router.get("/calendar", response_model=ResponseCalendarResponseDto)
def get_responses_calendar(
    month: str | None = None,
    role_ids: list[str] | None = Query(default=None),
    status: str = "all",
    currency: str = "all",
    offer: str = "all",
):
    return service.get_calendar(
        month=month,
        role_ids=role_ids,
        status=status,
        currency=currency,
        offer=offer,
    )


@router.get("/{vacancy_id}", response_model=ResponseDetailsDto)
def get_response_details(vacancy_id: str):
    payload = service.get_response_details(vacancy_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="not_found")
    return payload


@router.put("/{vacancy_id}", response_model=UpdateResponseDetailsResultDto)
def update_response_details(vacancy_id: str, payload: UpdateResponseDetailsRequestDto):
    result = service.update_response_details(vacancy_id, payload.model_dump())
    if result.get("error") == "vacancy_id_required":
        raise HTTPException(status_code=400, detail="vacancy_id_required")
    if result.get("error") == "not_found":
        raise HTTPException(status_code=404, detail="not_found")
    return result


@router.patch("/{vacancy_id}/resume", response_model=ResumeActionResponseDto)
def mark_resume_sent(vacancy_id: str):
    result = service.mark_resume_sent(vacancy_id)
    if not result["updated"]:
        return JSONResponse(status_code=404, content=result)
    return result
