from pathlib import Path
import sys

from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import app
from backend.api import responses as responses_api


client = TestClient(app)


def test_list_responses_contract(monkeypatch):
    monkeypatch.setattr(
        responses_api.service,
        "list_responses",
        lambda **kwargs: {
            "items": [
                {
                    "vacancy_id": "123",
                    "role_id": "96",
                    "role_name": "Python developer",
                    "name": "Python Developer",
                    "employer": "Acme",
                    "city": "Moscow",
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
                    "country": "Russia",
                }
            ],
            "page": 1,
            "per_page": 50,
            "total": 1,
        },
    )

    response = client.get("/api/v1/responses")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["vacancy_id"] == "123"
    assert payload["items"][0]["interview_date"] == "2026-04-24T15:00:00+00:00"
    assert payload["items"][0]["result"] == "tech passed"
    assert payload["items"][0]["country"] == "Russia"


def test_responses_calendar_contract(monkeypatch):
    monkeypatch.setattr(
        responses_api.service,
        "get_calendar",
        lambda **kwargs: {
            "month": "2026-04",
            "days": [
                {
                    "date": "2026-04-24",
                    "count": 1,
                    "items": [
                        {
                            "vacancy_id": "123",
                            "name": "Python Developer",
                            "employer": "Acme",
                            "interview_date": "2026-04-24T15:00:00+00:00",
                            "result": None,
                            "is_pending_result": True,
                        }
                    ],
                }
            ],
        },
    )

    response = client.get("/api/v1/responses/calendar?month=2026-04")
    assert response.status_code == 200
    payload = response.json()
    assert payload["month"] == "2026-04"
    assert payload["days"][0]["date"] == "2026-04-24"


def test_response_details_contract(monkeypatch):
    monkeypatch.setattr(
        responses_api.service,
        "get_response_details",
        lambda vacancy_id: {
            "vacancy_id": vacancy_id,
            "summary": {
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
            },
            "details": {
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
            },
        },
    )

    response = client.get("/api/v1/responses/123")
    assert response.status_code == 200
    payload = response.json()
    assert payload["vacancy_id"] == "123"
    assert payload["summary"]["name"] == "Python Developer"


def test_update_response_details_contract(monkeypatch):
    monkeypatch.setattr(
        responses_api.service,
        "update_response_details",
        lambda vacancy_id, payload: {
            "ok": True,
            "updated": True,
            "requires_overwrite": False,
            "unchanged": False,
            "updated_at": "2026-04-20T10:00:00+00:00",
        },
    )

    response = client.put("/api/v1/responses/123", json={"hr_name": "Anna", "force_overwrite": False})
    assert response.status_code == 200
    payload = response.json()
    assert payload["ok"] is True
    assert payload["updated"] is True


def test_mark_resume_sent_contract(monkeypatch):
    monkeypatch.setattr(
        responses_api.service,
        "mark_resume_sent",
        lambda vacancy_id: {
            "ok": True,
            "vacancy_id": vacancy_id,
            "updated": True,
            "resume_at": "2026-04-20T10:00:00+00:00",
        },
    )

    response = client.patch("/api/v1/responses/123/resume")
    assert response.status_code == 200
    payload = response.json()
    assert payload["vacancy_id"] == "123"
    assert payload["updated"] is True
