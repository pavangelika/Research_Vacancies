from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.analytics_service import AnalyticsService


class StubAnalyticsRepository:
    def get_activity(self):
        return [
            {
                "id": "96",
                "name": "Python developer",
                "months": [
                    {
                        "month": "Р—Р° 1 РјРµСЃСЏС†",
                        "entries": [
                            {"experience": "РќРµС‚ РѕРїС‹С‚Р°", "total": 2, "active": 1, "archived": 1, "avg_age": 5.0}
                        ],
                    }
                ],
            },
            {
                "id": "113",
                "name": "Data Engineer",
                "months": [
                    {
                        "month": "Р—Р° 1 РјРµСЃСЏС†",
                        "entries": [
                            {"experience": "РћС‚ 1 РіРѕРґР° РґРѕ 3 Р»РµС‚", "total": 1, "active": 1, "archived": 0, "avg_age": None}
                        ],
                    }
                ],
            },
        ]

    def get_weekday(self):
        return [
            {"id": "96", "name": "Python developer", "weekdays": []},
            {"id": "113", "name": "Data Engineer", "weekdays": []},
        ]

    def get_skills_cost(self):
        return [
            {
                "id": "96",
                "name": "Python developer",
                "months_list": [
                    {
                        "month": "2026-04",
                        "experiences": [
                            {
                                "experience": "Р В РЎСљР В Р’ВµР РЋРІР‚С™ Р В РЎвЂўР В РЎвЂ”Р РЋРІР‚в„–Р РЋРІР‚С™Р В Р’В°",
                                "total_vacancies": 2,
                                "skills": [
                                    {"skill": "Python", "count": 2, "coverage": 100.0, "rank": 1},
                                    {"skill": "FastAPI", "count": 1, "coverage": 50.0, "rank": 2},
                                ],
                            }
                        ],
                    }
                ],
            }
        ]

    def get_salary_range(self):
        return [
            {
                "id": "96",
                "name": "Python developer",
                "months_list": [
                    {
                        "month": "2026-04",
                        "experiences": [
                            {
                                "experience": "Р СњР ВµРЎвЂљ Р С•Р С—РЎвЂ№РЎвЂљР В°",
                                "entries": [
                                    {
                                        "status": "РћС‚РєСЂС‹С‚Р°СЏ",
                                        "currency": "RUR",
                                        "total_vacancies": 2,
                                        "avg_salary": 240000.0,
                                        "median_salary": 230000.0,
                                        "mode_salary": 220000.0,
                                        "min_salary": 180000.0,
                                        "max_salary": 300000.0,
                                        "top_skills": "Python (2)",
                                    }
                                ],
                            }
                        ],
                    }
                ],
            }
        ]

    def get_employers(self):
        return []


class StubVacanciesRepository:
    def __init__(self):
        self.list_calls = 0
        self.include_details_calls = []

    def list_vacancies(self, *, include_details=True):
        self.list_calls += 1
        self.include_details_calls.append(include_details)
        return [
            {
                "id": "1",
                "role_id": "96",
                "name": "Python backend",
                "employer_name": "Acme",
                "currency": "RUR",
                "experience": "РќРµС‚ РѕРїС‹С‚Р°",
                "skills_raw": "Python",
                "published_at": "2026-04-21T10:00:00+00:00",
                "archived": False,
                "archived_at": None,
            },
            {
                "id": "2",
                "role_id": "96",
                "name": "Python backend archived",
                "employer_name": "Acme",
                "currency": "RUR",
                "experience": "РќРµС‚ РѕРїС‹С‚Р°",
                "skills_raw": "Python",
                "published_at": "2026-04-20T10:00:00+00:00",
                "archived": True,
                "archived_at": "2026-04-22T10:00:00+00:00",
            },
            {
                "id": "3",
                "role_id": "113",
                "name": "Data engineer",
                "employer_name": "Beta",
                "currency": "RUR",
                "experience": "РћС‚ 1 РіРѕРґР° РґРѕ 3 Р»РµС‚",
                "skills_raw": "SQL",
                "published_at": "2026-04-19T09:00:00+00:00",
                "archived": False,
                "archived_at": None,
            },
        ]


def test_get_activity_includes_role_rows_for_summary_ui():
    vacancies_repository = StubVacanciesRepository()
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=vacancies_repository,
    )

    result = service.get_activity(scope="selection", role_ids=["96", "113"], period="last_7")

    rows = result["role_rows"]
    assert len(rows) == 2
    assert rows[0]["role_id"] == "96"
    assert rows[0]["active"] == 1
    assert rows[0]["archived"] == 1
    assert rows[0]["total"] == 2
    assert rows[1]["role_id"] == "113"
    assert rows[1]["total"] == 1
    assert vacancies_repository.list_calls == 1
    assert vacancies_repository.include_details_calls == [False]


def test_get_activity_builds_month_entries_for_quick_periods_from_vacancies():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=StubVacanciesRepository(),
    )

    result = service.get_activity(scope="single", role_ids=["96"], period="last_7")

    assert result["months"]
    assert result["months"][0]["month"] == "last_7"
    entries = result["months"][0]["entries"]
    assert len(entries) == 1
    assert entries[0]["total"] == 2
    assert entries[0]["active"] == 1
    assert entries[0]["archived"] == 1


def test_get_weekday_includes_role_rows_for_summary_ui():
    vacancies_repository = StubVacanciesRepository()
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=vacancies_repository,
    )

    result = service.get_weekday(scope="selection", role_ids=["96", "113"], period="last_7")

    rows = {row["role_id"]: row for row in result["role_rows"]}
    assert len(rows) == 2
    assert rows["96"]["avg_pub"] > 0
    assert rows["96"]["avg_arch"] >= 0
    assert rows["113"]["avg_pub"] > 0
    assert vacancies_repository.list_calls == 1
    assert vacancies_repository.include_details_calls == [False]


def test_get_weekday_builds_items_for_quick_periods_from_vacancies():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=StubVacanciesRepository(),
    )

    result = service.get_weekday(scope="single", role_ids=["96"], period="last_7")

    assert result["items"]
    assert sum(item["publications"] for item in result["items"]) == 2
    assert sum(item["archives"] for item in result["items"]) == 1


def test_get_skills_cost_builds_month_payload_for_quick_periods_from_vacancies():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=StubVacanciesRepository(),
    )

    result = service.get_skills_cost(scope="single", role_ids=["96"], period="last_7")

    assert result["months"]
    month = result["months"][0]
    assert month["month"] == "last_7"
    assert len(month["experiences"]) == 1
    assert month["experiences"][0]["total_vacancies"] == 2
    assert month["experiences"][0]["skills"][0]["skill"] == "Python"
    assert month["experiences"][0]["skills"][0]["count"] == 2


def test_get_salary_range_keeps_enriched_entry_fields_for_single_role_salary_ui():
    service = AnalyticsService(
        repository=StubAnalyticsRepository(),
        vacancies_repository=StubVacanciesRepository(),
    )

    result = service.get_salary_range(scope="single", role_ids=["96"], period="2026-04")

    assert len(result["items"]) == 1
    item = result["items"][0]
    assert item["month"] == "2026-04"
    assert item["experience"]
    assert item["status"] == "РћС‚РєСЂС‹С‚Р°СЏ"
    assert item["total_vacancies"] == 2
    assert item["top_skills"] == "Python (2)"
