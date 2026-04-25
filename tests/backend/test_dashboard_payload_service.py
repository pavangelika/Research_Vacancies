from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.analytics_service import AnalyticsService
from tests.backend.test_analytics_service import StubAnalyticsRepository, StubVacanciesRepository


class StubResponsesService:
    def list_responses(self, **kwargs):
        return {
            "items": [
                {"vacancy_id": "1", "interview_date": "2026-04-22T10:00:00+00:00", "result": "", "offer_salary": ""},
                {"vacancy_id": "2", "interview_date": "", "result": "done", "offer_salary": "250000"},
            ]
        }


def test_get_dashboard_payload_returns_totals_sections():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=StubVacanciesRepository(),
        responses_service=StubResponsesService(),
    )

    result = service.get_dashboard_payload(scope="single", role_ids=["96"], period="last_7")

    assert result["metrics"]
    assert result["salary_rows"]
    assert result["salary_coverage"]["total"] == 2
    assert result["period_stats"]["total"] == 2
    assert result["response_funnel"]["responses"] == 2
    assert result["response_funnel"]["interview"] == 1
    assert result["response_funnel"]["result"] == 1
    assert result["response_funnel"]["offer"] == 1
    assert result["burnup_series"]["labels"]
    assert result["salary_month_data"]["experiences"]
    assert result["market_trends"]["metrics"]
    assert result["market_trends"]["focus_metrics"]["id"] == "96"


class CompensationAvailabilityVacanciesRepository:
    def list_vacancies(self, *, include_details=True):
        return [
            {
                "id": "1",
                "role_id": "96",
                "name": "Remote with salary",
                "employer_name": "Acme",
                "currency": "RUR",
                "salary_from": 200000,
                "salary_to": None,
                "work_format": "REMOTE",
                "experience": "Нет опыта",
                "skills_raw": "Python",
                "published_at": "2026-04-21T10:00:00+00:00",
                "archived": False,
                "archived_at": None,
            },
            {
                "id": "2",
                "role_id": "96",
                "name": "Remote without salary",
                "employer_name": "Acme",
                "currency": "RUR",
                "salary_from": None,
                "salary_to": None,
                "work_format": "REMOTE",
                "experience": "Нет опыта",
                "skills_raw": "Python",
                "published_at": "2026-04-20T10:00:00+00:00",
                "archived": False,
                "archived_at": None,
            },
            {
                "id": "3",
                "role_id": "96",
                "name": "Onsite with salary",
                "employer_name": "Acme",
                "currency": "RUR",
                "salary_from": 180000,
                "salary_to": None,
                "work_format": "ONSITE",
                "experience": "Нет опыта",
                "skills_raw": "Python",
                "published_at": "2026-04-19T10:00:00+00:00",
                "archived": False,
                "archived_at": None,
            },
            {
                "id": "4",
                "role_id": "96",
                "name": "Onsite without salary",
                "employer_name": "Acme",
                "currency": "RUR",
                "salary_from": None,
                "salary_to": None,
                "work_format": "ONSITE",
                "experience": "Нет опыта",
                "skills_raw": "Python",
                "published_at": "2026-04-18T10:00:00+00:00",
                "archived": False,
                "archived_at": None,
            },
        ]


def test_get_dashboard_payload_includes_compensation_availability_summary():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=CompensationAvailabilityVacanciesRepository(),
        responses_service=StubResponsesService(),
    )

    result = service.get_dashboard_payload(scope="single", role_ids=["96"], period="2026-04")

    assert result["compensation_availability"] == {
        "total": 4,
        "with_salary": 2,
        "without_salary": 2,
        "coverage_percent": 50.0,
        "remote": {
            "total": 2,
            "with_salary": 1,
            "without_salary": 1,
            "coverage_percent": 50.0,
            "with_salary_currencies": {
                "RUR": {"count": 1, "share": 100.0},
                "USD": {"count": 0, "share": 0.0},
                "EUR": {"count": 0, "share": 0.0},
                "OTHER": {"count": 0, "share": 0.0},
            },
        },
        "non_remote": {
            "total": 2,
            "with_salary": 1,
            "without_salary": 1,
            "coverage_percent": 50.0,
            "with_salary_currencies": {
                "RUR": {"count": 1, "share": 100.0},
                "USD": {"count": 0, "share": 0.0},
                "EUR": {"count": 0, "share": 0.0},
                "OTHER": {"count": 0, "share": 0.0},
            },
        },
    }


class TopModeVacanciesRepository:
    def list_vacancies(self, *, include_details=True):
        return [
            {
                "id": "1",
                "role_id": "96",
                "name": "Vacancy High",
                "employer_name": "Zeta",
                "employer_accredited": True,
                "currency": "USD",
                "country": "Россия",
                "salary_from": 3000,
                "salary_to": 3000,
                "published_at": "2026-04-20T10:00:00+00:00",
                "archived": False,
                "archived_at": None,
                "skills_raw": "Python, SQL",
                "cover_letter_required": True,
                "has_test": False,
                "experience": "Нет опыта",
            },
            {
                "id": "2",
                "role_id": "96",
                "name": "Vacancy Low",
                "employer_name": "Alpha",
                "employer_accredited": False,
                "currency": "USD",
                "country": "Казахстан",
                "salary_from": 1000,
                "salary_to": 1000,
                "published_at": "2026-04-19T10:00:00+00:00",
                "archived": False,
                "archived_at": None,
                "skills_raw": "Python",
                "cover_letter_required": False,
                "has_test": True,
                "experience": "От 1 года до 3 лет",
            },
            {
                "id": "3",
                "role_id": "96",
                "name": "Closed Fast",
                "employer_name": "Alpha",
                "currency": "USD",
                "country": "Казахстан",
                "salary_from": 1200,
                "salary_to": 1200,
                "published_at": "2026-04-21T10:00:00+00:00",
                "archived": True,
                "archived_at": "2026-04-22T10:00:00+00:00",
                "skills_raw": "",
                "cover_letter_required": False,
                "has_test": True,
                "experience": "От 1 года до 3 лет",
            },
        ]


def test_get_dashboard_payload_applies_non_default_top_settings():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=TopModeVacanciesRepository(),
        responses_service=StubResponsesService(),
    )

    result = service.get_dashboard_payload(
        scope="single",
        role_ids=["96"],
        period="last_7",
        top_currency="USD",
        top_limit=20,
        vacancy_order="low",
        skills_order="least",
        company_order="low",
        closing_window="lte_14",
    )

    assert result["top_vacancies"][0]["id"] == "2"
    assert result["skills_rows"][0]["skill"] == "SQL"
    assert result["company_rows"][0]["employer"] == "Alpha"
    assert result["closing_rows"][0]["employer"] == "Alpha"


def test_get_dashboard_payload_applies_non_default_market_trends_settings():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=TopModeVacanciesRepository(),
        responses_service=StubResponsesService(),
    )

    result = service.get_dashboard_payload(
        scope="single",
        role_ids=["96"],
        period="last_7",
        market_trends_currency="USD",
        market_trends_salary_metric="max",
        market_trends_excluded_roles=["96"],
    )

    assert result["market_trends"]["currency"] == "USD"
    assert result["market_trends"]["salary_metric"] == "max"
    assert result["market_trends"]["focus_metrics"] is None


def test_get_dashboard_payload_applies_market_trends_experience_and_status_filters():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=TopModeVacanciesRepository(),
        responses_service=StubResponsesService(),
    )

    result = service.get_dashboard_payload(
        scope="single",
        role_ids=["96"],
        period="last_7",
        market_trends_currency="USD",
        market_trends_salary_metric="max",
        experience=["Нет опыта"],
        status="open",
    )

    assert result["market_trends"]["currency"] == "USD"
    assert result["market_trends"]["focus_metrics"]["recentCount"] == 1
    assert len(result["market_trends"]["metrics"]) == 1


def test_get_dashboard_payload_applies_overview_filters():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=TopModeVacanciesRepository(),
        responses_service=StubResponsesService(),
    )

    result = service.get_dashboard_payload(
        scope="single",
        role_ids=["96"],
        period="last_7",
        experience=["Нет опыта"],
        status="open",
        country="ru",
        currency=["USD"],
        employer=["Zeta"],
        employer_exclude=["Alpha"],
        accreditation="true",
        cover_letter_required="true",
        has_test="false",
        top_currency="USD",
    )

    assert result["period_stats"]["total"] == 1
    assert result["top_vacancies"][0]["id"] == "1"
    assert result["salary_coverage"]["total"] == 1


def test_get_dashboard_payload_applies_response_filters():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=TopModeVacanciesRepository(),
        responses_service=StubResponsesService(),
    )

    result = service.get_dashboard_payload(
        scope="single",
        role_ids=["96"],
        period="last_7",
        interview=["yes"],
        top_currency="USD",
    )

    assert result["period_stats"]["total"] == 1
    assert result["top_vacancies"][0]["id"] == "1"


def test_get_dashboard_payload_applies_skills_filters():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=TopModeVacanciesRepository(),
        responses_service=StubResponsesService(),
    )

    result = service.get_dashboard_payload(
        scope="single",
        role_ids=["96"],
        period="last_7",
        skills_include=["SQL"],
        skills_logic="and",
        top_currency="USD",
    )

    assert result["period_stats"]["total"] == 1
    assert result["top_vacancies"][0]["id"] == "1"
