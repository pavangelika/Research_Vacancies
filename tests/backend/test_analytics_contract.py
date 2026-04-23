from pathlib import Path
import sys

from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import app
from backend.api import analytics as analytics_api


client = TestClient(app)


def test_dashboard_contract(monkeypatch):
    monkeypatch.setattr(
        analytics_api.service,
        "get_dashboard_payload",
        lambda **kwargs: {
            "scope": "all",
            "role_ids": ["96", "113"],
            "period_label": "summary",
            "metrics": [
                {"key": "roles", "label": "Роли", "value": 2},
                {"key": "vacancies_total", "label": "Всего вакансий", "value": 120},
            ],
            "salary_rows": [],
            "salary_coverage": None,
            "period_stats": None,
            "response_funnel": {"responses": 4, "interview": 3, "result": 1, "offer": 0},
            "burnup_series": None,
            "skills_rows": [],
            "company_rows": [],
            "closing_rows": [],
            "top_vacancies": [],
            "salary_month_data": None,
            "employer_overview": None,
            "market_trends": {
                "currency": "RUR",
                "salary_metric": "avg",
                "recent_days": 14,
                "baseline_days": 14,
                "recent_start_label": "01.04.2026",
                "recent_end_label": "14.04.2026",
                "prev_start_label": "18.03.2026",
                "prev_end_label": "31.03.2026",
                "has_salary_for_currency": True,
                "metrics": [],
                "focus_metrics": None,
            },
        },
    )
    response = client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 200
    payload = response.json()
    assert payload["metrics"][0]["key"] == "roles"


def test_dashboard_contract_forwards_top_query_params(monkeypatch):
    captured = {}

    def fake_dashboard_payload(**kwargs):
        captured.update(kwargs)
        return {
            "scope": "single",
            "role_ids": ["96"],
            "period_label": "last_14",
            "metrics": [],
            "salary_rows": [],
            "salary_coverage": None,
            "period_stats": None,
            "response_funnel": None,
            "burnup_series": None,
            "skills_rows": [],
            "company_rows": [],
            "closing_rows": [],
            "top_vacancies": [],
            "salary_month_data": None,
            "employer_overview": None,
            "market_trends": None,
        }

    monkeypatch.setattr(analytics_api.service, "get_dashboard_payload", fake_dashboard_payload)

    response = client.get(
        "/api/v1/analytics/dashboard",
        params={
            "scope": "single",
            "role_ids": "96",
            "period": "last_14",
            "top_currency": "USD",
            "top_limit": "25",
            "vacancy_order": "low",
            "skills_order": "least",
            "company_order": "low",
            "closing_window": "lte_14",
        },
    )
    assert response.status_code == 200
    assert captured["top_currency"] == "USD"
    assert captured["top_limit"] == 25
    assert captured["vacancy_order"] == "low"
    assert captured["skills_order"] == "least"
    assert captured["company_order"] == "low"
    assert captured["closing_window"] == "lte_14"


def test_dashboard_contract_forwards_market_trends_query_params(monkeypatch):
    captured = {}

    def fake_dashboard_payload(**kwargs):
        captured.update(kwargs)
        return {
            "scope": "single",
            "role_ids": ["96"],
            "period_label": "last_14",
            "metrics": [],
            "salary_rows": [],
            "salary_coverage": None,
            "period_stats": None,
            "response_funnel": None,
            "burnup_series": None,
            "skills_rows": [],
            "company_rows": [],
            "closing_rows": [],
            "top_vacancies": [],
            "salary_month_data": None,
            "employer_overview": None,
            "market_trends": None,
        }

    monkeypatch.setattr(analytics_api.service, "get_dashboard_payload", fake_dashboard_payload)

    response = client.get(
        "/api/v1/analytics/dashboard",
        params={
            "scope": "single",
            "role_ids": "96",
            "period": "last_14",
            "market_trends_currency": "USD",
            "market_trends_salary_metric": "max",
            "market_trends_excluded_roles": ["96", "113"],
            "experience": ["Нет опыта"],
            "status": "open",
        },
    )
    assert response.status_code == 200
    assert captured["market_trends_currency"] == "USD"
    assert captured["market_trends_salary_metric"] == "max"
    assert captured["market_trends_excluded_roles"] == ["96", "113"]
    assert captured["experience"] == ["Нет опыта"]
    assert captured["status"] == "open"


def test_dashboard_contract_forwards_overview_filter_query_params(monkeypatch):
    captured = {}

    def fake_dashboard_payload(**kwargs):
        captured.update(kwargs)
        return {
            "scope": "single",
            "role_ids": ["96"],
            "period_label": "last_14",
            "metrics": [],
            "salary_rows": [],
            "salary_coverage": None,
            "period_stats": None,
            "response_funnel": None,
            "burnup_series": None,
            "skills_rows": [],
            "company_rows": [],
            "closing_rows": [],
            "top_vacancies": [],
            "salary_month_data": None,
            "employer_overview": None,
            "market_trends": None,
        }

    monkeypatch.setattr(analytics_api.service, "get_dashboard_payload", fake_dashboard_payload)

    response = client.get(
        "/api/v1/analytics/dashboard",
        params={
            "scope": "single",
            "role_ids": "96",
            "period": "last_14",
            "experience": ["Нет опыта"],
            "status": "open",
            "country": "ru",
            "currency": ["USD"],
            "employer": ["Acme"],
            "employer_exclude": ["Beta"],
            "interview": ["yes"],
            "result": ["no"],
            "offer": ["yes"],
            "skills_include": ["Python"],
            "skills_exclude": ["Java"],
            "skills_logic": "and",
            "accreditation": "true",
            "cover_letter_required": "false",
            "has_test": "true",
        },
    )
    assert response.status_code == 200
    assert captured["experience"] == ["Нет опыта"]
    assert captured["status"] == "open"
    assert captured["country"] == "ru"
    assert captured["currency"] == ["USD"]
    assert captured["employer"] == ["Acme"]
    assert captured["employer_exclude"] == ["Beta"]
    assert captured["interview"] == ["yes"]
    assert captured["result"] == ["no"]
    assert captured["offer"] == ["yes"]
    assert captured["skills_include"] == ["Python"]
    assert captured["skills_exclude"] == ["Java"]
    assert captured["skills_logic"] == "and"
    assert captured["accreditation"] == "true"
    assert captured["cover_letter_required"] == "false"
    assert captured["has_test"] == "true"


def test_activity_contract(monkeypatch):
    monkeypatch.setattr(
        analytics_api.service,
        "get_activity",
        lambda **kwargs: {
            "scope": "selection",
            "role_ids": ["96"],
            "period_label": "summary",
            "months": [
                {
                    "month": "За 2 месяца",
                    "entries": [
                        {
                            "experience": "Нет опыта",
                            "total": 10,
                            "active": 7,
                            "archived": 3,
                            "avg_age_days": 12.5,
                        }
                    ],
                }
            ],
            "summary": {"total": 10, "active": 7, "archived": 3},
            "role_rows": [
                {
                    "role_id": "96",
                    "name": "Python developer",
                    "total": 10,
                    "active": 7,
                    "archived": 3,
                    "avg_age": 12.5,
                }
            ],
        },
    )
    response = client.get("/api/v1/analytics/activity")
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["total"] == 10
    assert payload["role_rows"][0]["role_id"] == "96"


def test_weekday_contract(monkeypatch):
    monkeypatch.setattr(
        analytics_api.service,
        "get_weekday",
        lambda **kwargs: {
            "scope": "all",
            "role_ids": ["96"],
            "period_label": "summary",
            "items": [
                {
                    "weekday": "Monday",
                    "publications": 4,
                    "archives": 2,
                    "avg_pub_hour": "11:00",
                    "avg_arch_hour": "15:00",
                }
            ],
            "role_rows": [
                {
                    "role_id": "96",
                    "name": "Python developer",
                    "avg_pub": 4.0,
                    "avg_arch": 2.0,
                }
            ],
        },
    )
    response = client.get("/api/v1/analytics/weekday")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"][0]["weekday"] == "Monday"
    assert payload["role_rows"][0]["role_id"] == "96"


def test_skills_cost_contract(monkeypatch):
    monkeypatch.setattr(
        analytics_api.service,
        "get_skills_cost",
        lambda **kwargs: {
            "scope": "all",
            "role_ids": ["96"],
            "period_label": "summary",
            "currency": "RUR",
            "items": [
                {
                    "skill": "Python",
                    "mention_count": 25,
                    "avg_skill_cost": None,
                    "median_skill_cost": None,
                    "roles": [{"role_id": "96", "role_name": "Python developer", "share": 100.0}],
                }
            ],
            "months": [
                {
                    "month": "last_7",
                    "experiences": [
                        {
                            "experience": "РќРµС‚ РѕРїС‹С‚Р°",
                            "total_vacancies": 2,
                            "skills": [
                                {"skill": "Python", "count": 2, "coverage": 100.0, "rank": 1}
                            ],
                        }
                    ],
                }
            ],
        },
    )
    response = client.get("/api/v1/analytics/skills-cost")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"][0]["skill"] == "Python"
    assert payload["months"][0]["experiences"][0]["skills"][0]["skill"] == "Python"


def test_salary_range_contract(monkeypatch):
    monkeypatch.setattr(
        analytics_api.service,
        "get_salary_range",
        lambda **kwargs: {
            "scope": "all",
            "role_ids": ["96"],
            "period_label": "summary",
            "items": [
                {
                    "role_id": "96",
                    "role_name": "Python developer",
                    "month": "2026-04",
                    "experience": "РќРµС‚ РѕРїС‹С‚Р°",
                    "status": "РћС‚РєСЂС‹С‚Р°СЏ",
                    "currency": "RUR",
                    "count": 8,
                    "total_vacancies": 8,
                    "avg_salary": 240000.0,
                    "median_salary": 230000.0,
                    "mode_salary": 220000.0,
                    "min_salary": 180000.0,
                    "max_salary": 300000.0,
                    "top_skills": "Python (8)",
                }
            ],
        },
    )
    response = client.get("/api/v1/analytics/salary-range")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"][0]["role_id"] == "96"


def test_employers_contract(monkeypatch):
    monkeypatch.setattr(
        analytics_api.service,
        "get_employers",
        lambda **kwargs: {
            "scope": "all",
            "role_ids": ["96"],
            "period_label": "summary",
            "items": [
                {
                    "month": "2026-04",
                    "factor": "rating_bucket",
                    "factor_value": ">=4.5",
                    "group_n": 12,
                    "salary": {"currency": "RUR", "avg": 250000.0, "count": 9},
                }
            ],
        },
    )
    response = client.get("/api/v1/analytics/employers")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"][0]["factor"] == "rating_bucket"
