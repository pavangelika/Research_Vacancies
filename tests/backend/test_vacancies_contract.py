from pathlib import Path
import sys

from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import app
from backend.api import vacancies as vacancies_api


client = TestClient(app)


def test_vacancies_list_contract(monkeypatch):
    monkeypatch.setattr(
        vacancies_api.service,
        "list_vacancies",
        lambda **kwargs: {
            "items": [
                {
                    "id": "123",
                    "name": "Python Developer",
                    "employer": {
                        "name": "Acme",
                        "accredited": True,
                        "trusted": True,
                        "rating": "4.8",
                        "url": "https://example.com/acme",
                    },
                    "location": {"city": "Moscow", "country": "Russia"},
                    "salary": {"from_value": 180000, "to_value": 250000, "currency": "RUR"},
                    "experience": "РћС‚ 1 РіРѕРґР° РґРѕ 3 Р»РµС‚",
                    "status": "open",
                    "skills": ["Python", "FastAPI"],
                    "requirement": "3+ years",
                    "responsibility": "Build services",
                    "published_at": "2026-04-18T10:30:00+00:00",
                    "archived_at": None,
                    "apply_alternate_url": "https://example.com/apply",
                    "send_resume": False,
                    "work_format": "REMOTE",
                }
            ],
            "page": 1,
            "per_page": 50,
            "total": 1,
        },
    )

    response = client.get("/api/v1/vacancies")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == "123"
    assert payload["items"][0]["work_format"] == "REMOTE"


def test_vacancy_details_contract(monkeypatch):
    monkeypatch.setattr(
        vacancies_api.service,
        "get_vacancy",
        lambda vacancy_id: {
            "id": vacancy_id,
            "name": "Python Developer",
            "employer": {
                "name": "Acme",
                "accredited": True,
                "trusted": True,
                "rating": "4.8",
                "url": "https://example.com/acme",
            },
            "location": {"city": "Moscow", "country": "Russia"},
            "salary": {"from_value": 180000, "to_value": 250000, "currency": "RUR"},
            "experience": "РћС‚ 1 РіРѕРґР° РґРѕ 3 Р»РµС‚",
            "status": "open",
            "skills": ["Python", "FastAPI"],
            "requirement": "3+ years",
            "responsibility": "Build services",
            "published_at": "2026-04-18T10:30:00+00:00",
            "archived_at": None,
            "apply_alternate_url": "https://example.com/apply",
            "send_resume": False,
            "work_format": "REMOTE",
        },
    )

    response = client.get("/api/v1/vacancies/123")
    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == "123"
    assert payload["employer"]["name"] == "Acme"
    assert payload["work_format"] == "REMOTE"


def test_skill_suggestions_contract(monkeypatch):
    captured = {}

    def fake_get_skill_suggestions(**kwargs):
        captured.update(kwargs)
        return {
            "items": [
                {"skill": "Python", "count": 42},
                {"skill": "FastAPI", "count": 18},
            ]
        }

    monkeypatch.setattr(
        vacancies_api.service,
        "get_skill_suggestions",
        fake_get_skill_suggestions,
    )

    response = client.get(
        "/api/v1/vacancies/skills/suggest",
        params={
            "experience": ["Р С›РЎвЂљ 1 Р С–Р С•Р Т‘Р В° Р Т‘Р С• 3 Р В»Р ВµРЎвЂљ"],
            "status": "open",
            "country": "ru",
            "currency": ["RUR"],
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"][0]["skill"] == "Python"
    assert captured["experience"] == ["Р С›РЎвЂљ 1 Р С–Р С•Р Т‘Р В° Р Т‘Р С• 3 Р В»Р ВµРЎвЂљ"]
    assert captured["status"] == "open"
    assert captured["country"] == "ru"
    assert captured["currency"] == ["RUR"]


def test_resume_action_contract(monkeypatch):
    monkeypatch.setattr(
        vacancies_api.service,
        "mark_resume_sent",
        lambda vacancy_id: {
            "ok": True,
            "vacancy_id": vacancy_id,
            "updated": True,
            "resume_at": "2026-04-20T10:00:00+00:00",
        },
    )

    response = client.post("/api/v1/vacancies/123/resume")
    assert response.status_code == 200
    payload = response.json()
    assert payload["vacancy_id"] == "123"
    assert payload["updated"] is True
