from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.vacancy_search_service import VacancySearchService


class StubVacanciesRepository:
    def __init__(self, items):
        self._items = items
        self.list_calls = 0
        self.include_details_calls = []

    def list_vacancies(self, *, include_details=True):
        self.list_calls += 1
        self.include_details_calls.append(include_details)
        return list(self._items)

    def get_vacancy(self, vacancy_id):
        for item in self._items:
            if str(item.get("id")) == str(vacancy_id):
                return item
        return None

    def mark_resume_sent(self, vacancy_id):
        return {"vacancy_id": vacancy_id, "updated": True, "resume_at": "2026-04-20T10:00:00+00:00"}


def make_repo_items():
    return [
        {
            "id": "1",
            "name": "Python Backend",
            "employer_name": "Acme",
            "city": "Moscow",
            "country": "Россия",
            "salary_from": 180000,
            "salary_to": 250000,
            "currency": "RUR",
            "experience": "От 1 года до 3 лет",
            "skills_raw": "Python, FastAPI, PostgreSQL",
            "requirement": "req",
            "responsibility": "resp",
            "published_at": "2026-04-20T10:00:00+00:00",
            "archived_at": None,
            "archived": False,
            "apply_alternate_url": "https://example.com/1",
            "send_resume": False,
            "role_id": "96",
            "employer_accredited": True,
            "employer_trusted": True,
            "employer_rating": "4.8",
            "employer_url": "https://example.com/acme",
            "cover_letter_required": True,
            "has_test": False,
            "work_format": "REMOTE",
        },
        {
            "id": "2",
            "name": "Python Data",
            "employer_name": "Beta",
            "city": "Berlin",
            "country": "Germany",
            "salary_from": 150000,
            "salary_to": 210000,
            "currency": "USD",
            "experience": "От 1 года до 3 лет",
            "skills_raw": "Python, Pandas",
            "requirement": "req",
            "responsibility": "resp",
            "published_at": "2026-04-19T10:00:00+00:00",
            "archived_at": None,
            "archived": False,
            "apply_alternate_url": "https://example.com/2",
            "send_resume": False,
            "role_id": "96",
            "employer_accredited": False,
            "employer_trusted": False,
            "employer_rating": "3.9",
            "employer_url": "https://example.com/beta",
            "cover_letter_required": False,
            "has_test": True,
            "work_format": "HYBRID",
        },
    ]


def test_list_vacancies_filters_by_employer_and_boolean_flags():
    service = VacancySearchService(repository=StubVacanciesRepository(make_repo_items()))

    result = service.list_vacancies(
        role_ids=["96"],
        employer=["Acme"],
        accreditation="true",
        cover_letter_required="true",
        has_test="false",
    )

    assert result["total"] == 1
    assert result["items"][0]["id"] == "1"


def test_list_vacancies_supports_employer_exclude_without_large_include_list():
    service = VacancySearchService(repository=StubVacanciesRepository(make_repo_items()))

    result = service.list_vacancies(
        role_ids=["96"],
        employer_exclude=["Beta"],
    )

    assert result["total"] == 1
    assert result["items"][0]["id"] == "1"


def test_skill_suggestions_respect_employer_and_boolean_filters():
    service = VacancySearchService(repository=StubVacanciesRepository(make_repo_items()))

    result = service.get_skill_suggestions(
        role_ids=["96"],
        employer=["Beta"],
        accreditation="false",
        cover_letter_required="false",
        has_test="true",
        limit=10,
    )

    skills = [item["skill"] for item in result["items"]]
    assert "Pandas" in skills
    assert "FastAPI" not in skills


def test_skill_suggestions_support_employer_exclude():
    service = VacancySearchService(repository=StubVacanciesRepository(make_repo_items()))

    result = service.get_skill_suggestions(
        role_ids=["96"],
        employer_exclude=["Acme"],
        limit=10,
    )

    skills = [item["skill"] for item in result["items"]]
    assert "Pandas" in skills
    assert "FastAPI" not in skills


def test_skill_suggestions_respect_core_search_filters():
    service = VacancySearchService(repository=StubVacanciesRepository(make_repo_items()))
    expected_experience = make_repo_items()[0]["experience"]

    result = service.get_skill_suggestions(
        role_ids=["96"],
        periods=["2026-04"],
        experience=[expected_experience],
        status="open",
        country="ru",
        currency=["RUR"],
        limit=10,
    )

    skills = [item["skill"] for item in result["items"]]
    assert "FastAPI" in skills
    assert "Pandas" not in skills


def test_list_vacancies_exposes_work_format_in_normalized_payload():
    service = VacancySearchService(repository=StubVacanciesRepository(make_repo_items()))

    result = service.list_vacancies(role_ids=["96"])

    assert result["total"] == 2
    assert result["items"][0]["work_format"] == "REMOTE"
    assert result["items"][1]["work_format"] == "HYBRID"
