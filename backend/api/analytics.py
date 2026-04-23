from fastapi import APIRouter, Query

from backend.schemas.analytics import (
    ActivityResponseDto,
    DashboardResponseDto,
    EmployerAnalysisResponseDto,
    SalaryRangeResponseDto,
    SkillsCostResponseDto,
    WeekdayResponseDto,
)
from backend.services.analytics_service import AnalyticsService

router = APIRouter()
service = AnalyticsService()


@router.get("/dashboard", response_model=DashboardResponseDto)
def get_dashboard(
    scope: str = "all",
    role_ids: list[str] | None = Query(default=None),
    period: str = "summary",
    experience: list[str] | None = Query(default=None),
    status: str = "all",
    country: str = "all",
    currency: list[str] | None = Query(default=None),
    employer: list[str] | None = Query(default=None),
    employer_exclude: list[str] | None = Query(default=None),
    interview: list[str] | None = Query(default=None),
    result: list[str] | None = Query(default=None),
    offer: list[str] | None = Query(default=None),
    skills_include: list[str] | None = Query(default=None),
    skills_exclude: list[str] | None = Query(default=None),
    skills_logic: str = "or",
    accreditation: str = "all",
    cover_letter_required: str = "all",
    has_test: str = "all",
    top_currency: str = "RUR",
    top_limit: int = 15,
    vacancy_order: str = "high",
    skills_order: str = "most",
    company_order: str = "high",
    closing_window: str = "lte_7",
    market_trends_currency: str = "RUR",
    market_trends_salary_metric: str = "avg",
    market_trends_excluded_roles: list[str] | None = Query(default=None),
):
    return service.get_dashboard_payload(
        scope=scope,
        role_ids=role_ids,
        period=period,
        experience=experience,
        status=status,
        country=country,
        currency=currency,
        employer=employer,
        employer_exclude=employer_exclude,
        interview=interview,
        result=result,
        offer=offer,
        skills_include=skills_include,
        skills_exclude=skills_exclude,
        skills_logic=skills_logic,
        accreditation=accreditation,
        cover_letter_required=cover_letter_required,
        has_test=has_test,
        top_currency=top_currency,
        top_limit=top_limit,
        vacancy_order=vacancy_order,
        skills_order=skills_order,
        company_order=company_order,
        closing_window=closing_window,
        market_trends_currency=market_trends_currency,
        market_trends_salary_metric=market_trends_salary_metric,
        market_trends_excluded_roles=market_trends_excluded_roles,
    )


@router.get("/activity", response_model=ActivityResponseDto)
def get_activity(
    scope: str = "all",
    role_ids: list[str] | None = Query(default=None),
    period: str = "summary",
):
    return service.get_activity(scope=scope, role_ids=role_ids, period=period)


@router.get("/weekday", response_model=WeekdayResponseDto)
def get_weekday(
    scope: str = "all",
    role_ids: list[str] | None = Query(default=None),
    period: str = "summary",
):
    return service.get_weekday(scope=scope, role_ids=role_ids, period=period)


@router.get("/skills-cost", response_model=SkillsCostResponseDto)
def get_skills_cost(
    scope: str = "all",
    role_ids: list[str] | None = Query(default=None),
    period: str = "summary",
    currency: str = "RUR",
):
    return service.get_skills_cost(scope=scope, role_ids=role_ids, period=period, currency=currency)


@router.get("/salary-range", response_model=SalaryRangeResponseDto)
def get_salary_range(
    scope: str = "all",
    role_ids: list[str] | None = Query(default=None),
    period: str = "summary",
):
    return service.get_salary_range(scope=scope, role_ids=role_ids, period=period)


@router.get("/employers", response_model=EmployerAnalysisResponseDto)
def get_employers(
    scope: str = "all",
    role_ids: list[str] | None = Query(default=None),
    period: str = "summary",
):
    return service.get_employers(scope=scope, role_ids=role_ids, period=period)
