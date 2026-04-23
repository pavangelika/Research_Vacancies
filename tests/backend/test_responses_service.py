from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.responses_service import ResponsesService


class StubResponsesRepository:
    def __init__(self):
        self.list_calls = 0
        self.details_calls = 0

    def list_sent_responses(self):
        self.list_calls += 1
        return [
            {
                "id": "123",
                "role_id": "96",
                "role_name": "Python developer",
                "name": "Python Developer",
                "employer": "Acme",
                "city": "Moscow",
                "country": "Russia",
                "salary_from": 180000,
                "salary_to": 250000,
                "currency": "RUR",
                "resume_at": "2026-04-19T14:25:00+00:00",
                "published_at": "2026-04-18T10:30:00+00:00",
                "archived": False,
                "archived_at": None,
                "interview_filled": True,
                "offer_salary": "250000",
                "updated_at": "2026-04-20T10:00:00+00:00",
                "interview_date": "2026-04-24T15:00:00+00:00",
                "result": "tech passed",
            }
        ]

    def get_response_details(self, vacancy_id):
        self.details_calls += 1
        return {
            "id": vacancy_id,
            "skills": "Python, FastAPI",
            "requirement": "3+ years",
            "responsibility": "Build services",
            "description": "Role description",
            "hr_name": "Anna",
            "interview_date": "2026-04-24T15:00:00+00:00",
            "interview_stages": "hr, tech",
            "company_type": "product",
            "result": None,
            "feedback": None,
            "offer_salary": None,
            "pros": None,
            "cons": None,
            "updated_at": "2026-04-20T10:00:00+00:00",
            "published_at": "2026-04-18T10:30:00+00:00",
            "archived": False,
            "archived_at": None,
        }

    def update_response_details(self, vacancy_id, payload, force_overwrite):
        return {"ok": True, "updated": True, "requires_overwrite": False, "unchanged": False}

    def mark_resume_sent(self, vacancy_id):
        return {"vacancy_id": vacancy_id, "updated": True, "resume_at": "2026-04-20T10:00:00+00:00"}


def test_list_responses_reads_source_once():
    repository = StubResponsesRepository()
    service = ResponsesService(repository=repository)

    result = service.list_responses(role_ids=["96"], page=1, per_page=50)

    assert result["total"] == 1
    assert result["items"][0]["vacancy_id"] == "123"
    assert repository.list_calls == 1


def test_get_calendar_reads_source_once():
    repository = StubResponsesRepository()
    service = ResponsesService(repository=repository)

    result = service.get_calendar(month="2026-04", role_ids=["96"])

    assert result["month"] == "2026-04"
    assert result["days"][0]["items"][0]["vacancy_id"] == "123"
    assert repository.list_calls == 1


def test_get_response_details_reads_list_once_plus_details_once():
    repository = StubResponsesRepository()
    service = ResponsesService(repository=repository)

    result = service.get_response_details("123")

    assert result["vacancy_id"] == "123"
    assert result["summary"]["name"] == "Python Developer"
    assert repository.details_calls == 1
    assert repository.list_calls == 1
