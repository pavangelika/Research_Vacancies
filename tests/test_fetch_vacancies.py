from pathlib import Path
import sys


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

    items = fetch_vacancies.get_vacancies(professional_roles="96", vacancy_delay=0)

    assert len(items) == 1
    assert "work_format" not in captured_params[0]
    assert items[0]["work_format"] == "HYBRID"
