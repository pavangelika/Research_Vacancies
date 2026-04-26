from pathlib import Path
import sys
import requests


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts import fetch_vacancies


class FakeResponse:
    def __init__(self, payload):
        self._payload = payload
        self.status_code = 200

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


def test_get_vacancies_does_not_send_work_format_and_uses_hh_value(monkeypatch):
    captured_params = []

    def fake_get(url, params=None, timeout=None):
        captured_params.append(dict(params or {}))
        return FakeResponse(
            {
                "items": [
                    {
                        "id": "1",
                        "url": "https://api.hh.ru/vacancies/1",
                        "name": "Python Developer",
                        "work_format": "HYBRID",
                        "employer": {"name": "Acme"},
                        "salary": {"from": 100000, "to": 200000, "currency": "RUR"},
                        "snippet": {"requirement": "req", "responsibility": "resp"},
                        "area": {"name": "Moscow"},
                        "schedule": {"id": "fullDay"},
                        "published_at": "2026-04-25T10:00:00+00:00",
                        "archived": False,
                        "has_test": False,
                        "response_letter_required": False,
                        "apply_alternate_url": "https://hh.ru/applicant/vacancy_response?vacancyId=1",
                        "professional_roles": [{"id": "96", "name": "Developer"}],
                    }
                ],
                "found": 1,
                "pages": 1,
            }
        )

    monkeypatch.setattr(fetch_vacancies, "HH_API_URL", "https://api.hh.ru/vacancies")
    monkeypatch.setattr(fetch_vacancies.requests, "get", fake_get)
    monkeypatch.setattr(
        fetch_vacancies,
        "get_vacancy_id",
        lambda vacancy_id, timeout=10: {"skills": "Python", "description": "desc", "experience": "От 1 года до 3 лет"},
    )
    monkeypatch.setattr(fetch_vacancies.time, "sleep", lambda *_args, **_kwargs: None)

    result = fetch_vacancies.get_vacancies(professional_roles="96", vacancy_delay=0)

    assert result.complete is True
    assert len(result.vacancies) == 1
    assert "work_format" not in captured_params[0]
    assert result.vacancies[0]["work_format"] == "HYBRID"


def test_get_vacancies_deduplicates_ids_and_fetches_details_only_when_needed(monkeypatch):
    detail_calls = []

    def fake_get(url, params=None, timeout=None):
        return FakeResponse(
            {
                "items": [
                    {
                        "id": "1",
                        "url": "https://api.hh.ru/vacancies/1",
                        "name": "Python Developer",
                        "work_format": "REMOTE",
                        "employer": {"name": "Acme"},
                        "salary": {"from": 100000, "to": 200000, "currency": "RUR"},
                        "snippet": {"requirement": "req", "responsibility": "resp"},
                        "area": {"name": "Moscow"},
                        "schedule": {"id": "fullDay"},
                        "published_at": "2026-04-25T10:00:00+00:00",
                        "archived": False,
                        "has_test": False,
                        "response_letter_required": False,
                        "apply_alternate_url": "https://hh.ru/applicant/vacancy_response?vacancyId=1",
                        "professional_roles": [{"id": "96", "name": "Developer"}],
                    },
                    {
                        "id": "1",
                        "url": "https://api.hh.ru/vacancies/1",
                        "name": "Python Developer Duplicate",
                        "work_format": "REMOTE",
                        "employer": {"name": "Acme"},
                        "salary": {"from": 100000, "to": 200000, "currency": "RUR"},
                        "snippet": {"requirement": "req", "responsibility": "resp"},
                        "area": {"name": "Moscow"},
                        "schedule": {"id": "fullDay"},
                        "published_at": "2026-04-25T10:00:00+00:00",
                        "archived": False,
                        "has_test": False,
                        "response_letter_required": False,
                        "apply_alternate_url": "https://hh.ru/applicant/vacancy_response?vacancyId=1",
                        "professional_roles": [{"id": "96", "name": "Developer"}],
                    },
                    {
                        "id": "2",
                        "url": "https://api.hh.ru/vacancies/2",
                        "name": "Existing Complete",
                        "work_format": "HYBRID",
                        "employer": {"name": "Beta"},
                        "salary": {"from": 110000, "to": 210000, "currency": "RUR"},
                        "snippet": {"requirement": "req2", "responsibility": "resp2"},
                        "area": {"name": "SPB"},
                        "schedule": {"id": "remote"},
                        "published_at": "2026-04-25T11:00:00+00:00",
                        "archived": False,
                        "has_test": False,
                        "response_letter_required": False,
                        "apply_alternate_url": "https://hh.ru/applicant/vacancy_response?vacancyId=2",
                        "professional_roles": [{"id": "96", "name": "Developer"}],
                    },
                    {
                        "id": "3",
                        "url": "https://api.hh.ru/vacancies/3",
                        "name": "Existing Incomplete",
                        "work_format": "OFFICE",
                        "employer": {"name": "Gamma"},
                        "salary": {"from": 120000, "to": 220000, "currency": "RUR"},
                        "snippet": {"requirement": "req3", "responsibility": "resp3"},
                        "area": {"name": "Kazan"},
                        "schedule": {"id": "fullDay"},
                        "published_at": "2026-04-25T12:00:00+00:00",
                        "archived": False,
                        "has_test": False,
                        "response_letter_required": False,
                        "apply_alternate_url": "https://hh.ru/applicant/vacancy_response?vacancyId=3",
                        "professional_roles": [{"id": "96", "name": "Developer"}],
                    },
                ],
                "found": 4,
                "pages": 1,
            }
        )

    def fake_get_vacancy_id(vacancy_id, timeout=10):
        detail_calls.append(vacancy_id)
        return {
            "skills": f"skills-{vacancy_id}",
            "description": f"desc-{vacancy_id}",
            "experience": f"exp-{vacancy_id}",
        }

    monkeypatch.setattr(fetch_vacancies, "HH_API_URL", "https://api.hh.ru/vacancies")
    monkeypatch.setattr(fetch_vacancies.requests, "get", fake_get)
    monkeypatch.setattr(fetch_vacancies, "get_vacancy_id", fake_get_vacancy_id)
    monkeypatch.setattr(
        fetch_vacancies,
        "get_existing_vacancy_details_map",
        lambda ids: {
            "2": {"skills": "cached-skills", "description": "cached-desc", "experience": "cached-exp"},
            "3": {"skills": "", "description": "cached-desc", "experience": None},
        },
    )
    monkeypatch.setattr(fetch_vacancies.time, "sleep", lambda *_args, **_kwargs: None)

    result = fetch_vacancies.get_vacancies(professional_roles="96", vacancy_delay=0)

    assert result.complete is True
    assert [item["id"] for item in result.vacancies] == ["1", "2", "3"]
    assert detail_calls == ["1", "3"]
    assert result.vacancies[1]["skills"] == "cached-skills"
    assert result.vacancies[2]["skills"] == "skills-3"


def test_build_role_batch_wraps_and_limits_batch_size():
    batch = fetch_vacancies.build_role_batch("10,12,25,34,36", batch_size=3, offset=4)

    assert batch.selected_roles == ["36", "10", "12"]
    assert batch.next_offset == 2
    assert batch.total_roles == 5


def test_get_vacancies_aborts_batch_after_consecutive_search_failures(monkeypatch):
    class ForbiddenResponse:
        status_code = 403

        def raise_for_status(self):
            raise requests.HTTPError("403 Client Error: Forbidden")

    calls = []

    def fake_get(url, params=None, timeout=None):
        calls.append(dict(params or {}))
        return ForbiddenResponse()

    monkeypatch.setattr(fetch_vacancies.requests, "get", fake_get)
    monkeypatch.setattr(fetch_vacancies.time, "sleep", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(fetch_vacancies, "get_existing_vacancy_details_map", lambda ids: {})

    result = fetch_vacancies.get_vacancies(
        professional_roles="10,12,25,34",
        vacancy_delay=0,
        role_search_delay=0,
        search_failure_streak_limit=2,
    )

    assert result.complete is False
    assert result.vacancies == []
    assert [call["professional_role"] for call in calls] == ["10", "12"]


def test_get_vacancies_waits_between_role_searches(monkeypatch):
    sleep_calls = []

    def fake_sleep(seconds):
        sleep_calls.append(seconds)

    def fake_get(url, params=None, timeout=None):
        return FakeResponse({"items": [], "found": 0, "pages": 1})

    monkeypatch.setattr(fetch_vacancies.requests, "get", fake_get)
    monkeypatch.setattr(fetch_vacancies.time, "sleep", fake_sleep)
    monkeypatch.setattr(fetch_vacancies, "get_existing_vacancy_details_map", lambda ids: {})

    result = fetch_vacancies.get_vacancies(
        professional_roles="10,12,25",
        vacancy_delay=0,
        role_search_delay=2.5,
        search_failure_streak_limit=3,
    )

    assert result.complete is True
    assert sleep_calls.count(2.5) == 2
