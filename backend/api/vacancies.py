from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from backend.schemas.vacancies import (
    ResumeActionResponseDto,
    SkillSuggestionResponseDto,
    VacancyItemDto,
    VacancyListResponseDto,
)
from backend.services.vacancy_search_service import VacancySearchService

router = APIRouter()
service = VacancySearchService()


@router.get("", response_model=VacancyListResponseDto)
def list_vacancies(
    scope: str = "all",
    role_ids: list[str] | None = Query(default=None),
    periods: list[str] | None = Query(default=None),
    experience: list[str] | None = Query(default=None),
    status: str = "all",
    country: str = "all",
    currency: list[str] | None = Query(default=None),
    employer: list[str] | None = Query(default=None),
    employer_exclude: list[str] | None = Query(default=None),
    accreditation: str = "all",
    cover_letter_required: str = "all",
    has_test: str = "all",
    skills_include: list[str] | None = Query(default=None),
    skills_exclude: list[str] | None = Query(default=None),
    skills_logic: str = "or",
    page: int = 1,
    per_page: int = 50,
    sort: str = "published_desc",
):
    return service.list_vacancies(
        scope=scope,
        role_ids=role_ids,
        periods=periods,
        experience=experience,
        status=status,
        country=country,
        currency=currency,
        employer=employer,
        employer_exclude=employer_exclude,
        accreditation=accreditation,
        cover_letter_required=cover_letter_required,
        has_test=has_test,
        skills_include=skills_include,
        skills_exclude=skills_exclude,
        skills_logic=skills_logic,
        page=page,
        per_page=per_page,
        sort=sort,
    )


@router.get("/skills/suggest", response_model=SkillSuggestionResponseDto)
def get_skill_suggestions(
    scope: str = "all",
    role_ids: list[str] | None = Query(default=None),
    periods: list[str] | None = Query(default=None),
    experience: list[str] | None = Query(default=None),
    status: str = "all",
    country: str = "all",
    currency: list[str] | None = Query(default=None),
    employer: list[str] | None = Query(default=None),
    employer_exclude: list[str] | None = Query(default=None),
    accreditation: str = "all",
    cover_letter_required: str = "all",
    has_test: str = "all",
    limit: int = 50,
):
    return service.get_skill_suggestions(
        scope=scope,
        role_ids=role_ids,
        periods=periods,
        experience=experience,
        status=status,
        country=country,
        currency=currency,
        employer=employer,
        employer_exclude=employer_exclude,
        accreditation=accreditation,
        cover_letter_required=cover_letter_required,
        has_test=has_test,
        limit=limit,
    )


@router.get("/{vacancy_id}", response_model=VacancyItemDto)
def get_vacancy(vacancy_id: str):
    item = service.get_vacancy(vacancy_id)
    if item is None:
        raise HTTPException(status_code=404, detail="not_found")
    return item


@router.post("/{vacancy_id}/resume", response_model=ResumeActionResponseDto)
def send_resume(vacancy_id: str):
    result = service.mark_resume_sent(vacancy_id)
    if not result["updated"]:
        return JSONResponse(status_code=404, content=result)
    return result
