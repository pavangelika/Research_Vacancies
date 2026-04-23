from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts import generate_report


def test_should_embed_role_vacancies_defaults_to_true(monkeypatch):
    monkeypatch.delenv("REPORT_EMBED_VACANCIES", raising=False)

    assert generate_report.should_embed_role_vacancies() is True


def test_should_embed_role_vacancies_can_be_disabled(monkeypatch):
    monkeypatch.setenv("REPORT_EMBED_VACANCIES", "0")

    assert generate_report.should_embed_role_vacancies() is False


def test_build_embedded_vacancy_obj_uses_preview_lengths():
    vacancy = generate_report.build_embedded_vacancy_obj(
        vac_id="1",
        name="Python Developer",
        employer="Acme",
        city="Moscow",
        country="Russia",
        salary_from=100000,
        salary_to=200000,
        currency="RUR",
        calculated_salary=150000,
        converted_salary=150000,
        published_iso="2026-04-21T10:00:00+00:00",
        archived_iso=None,
        send_resume=False,
        resume_iso=None,
        role_key="96",
        role_name="Python developer",
        experience="От 1 года до 3 лет",
        status="Открытая",
        skills="Python, FastAPI, PostgreSQL, Docker, Redis, Kafka, ClickHouse, RabbitMQ, Terraform",
        requirement="A" * 300,
        responsibility="B" * 300,
        apply_alternate_url="https://example.com/apply",
        accredited_it_employer=True,
        rating="4.8",
        trusted=True,
        employer_url="https://example.com/acme",
    )

    assert len(vacancy["skills"]) <= 80
    assert len(vacancy["requirement"]) <= 120
    assert len(vacancy["responsibility"]) <= 120
    assert vacancy["skills"]
    assert vacancy["requirement"]
    assert vacancy["responsibility"]
    assert "role_id" not in vacancy
    assert "role_name" not in vacancy
    assert "_experience" not in vacancy
    assert "_status" not in vacancy


def test_build_embedded_vacancy_obj_omits_empty_optional_fields():
    vacancy = generate_report.build_embedded_vacancy_obj(
        vac_id="2",
        name="Backend Engineer",
        employer="Acme",
        city="",
        country="",
        salary_from=None,
        salary_to=None,
        currency="",
        calculated_salary=None,
        converted_salary=None,
        published_iso="2026-04-21T10:00:00+00:00",
        archived_iso=None,
        send_resume=False,
        resume_iso=None,
        role_key="96",
        role_name="Python developer",
        experience="Нет опыта",
        status="Открытая",
        skills="",
        requirement="",
        responsibility="",
        apply_alternate_url="",
        accredited_it_employer=None,
        rating="",
        trusted=None,
        employer_url="",
    )

    assert "city" not in vacancy
    assert "country" not in vacancy
    assert "salary_from" not in vacancy
    assert "salary_to" not in vacancy
    assert "currency" not in vacancy
    assert "calculated_salary" not in vacancy
    assert "converted_salary" not in vacancy
    assert "archived_at" not in vacancy
    assert "resume_at" not in vacancy
    assert "skills" not in vacancy
    assert "requirement" not in vacancy
    assert "responsibility" not in vacancy
    assert "apply_alternate_url" not in vacancy
    assert "employer_accredited" not in vacancy
    assert "employer_rating" not in vacancy
    assert "employer_trusted" not in vacancy
    assert "employer_url" not in vacancy
    assert "send_resume" not in vacancy


def test_build_embedded_vacancy_obj_keeps_send_resume_when_true():
    vacancy = generate_report.build_embedded_vacancy_obj(
        vac_id="3",
        name="Data Engineer",
        employer="Acme",
        city="Moscow",
        country="Russia",
        salary_from=100000,
        salary_to=200000,
        currency="RUR",
        calculated_salary=150000,
        converted_salary=150000,
        published_iso="2026-04-21T10:00:00+00:00",
        archived_iso=None,
        send_resume=True,
        resume_iso="2026-04-21T12:00:00+00:00",
        role_key="96",
        role_name="Python developer",
        experience="От 1 года до 3 лет",
        status="Открытая",
        skills="Python",
        requirement="Req",
        responsibility="Resp",
        apply_alternate_url="https://example.com/apply",
        accredited_it_employer=True,
        rating="4.8",
        trusted=True,
        employer_url="https://example.com/acme",
    )

    assert vacancy["send_resume"] is True
    assert vacancy["resume_at"] == "2026-04-21T12:00:00+00:00"


def test_build_embedded_vacancy_obj_omits_duplicate_calculated_salary():
    vacancy = generate_report.build_embedded_vacancy_obj(
        vac_id="4",
        name="Data Engineer",
        employer="Acme",
        city="Moscow",
        country="Russia",
        salary_from=100000,
        salary_to=200000,
        currency="RUR",
        calculated_salary=150000,
        converted_salary=150000,
        published_iso="2026-04-21T10:00:00+00:00",
        archived_iso=None,
        send_resume=False,
        resume_iso=None,
        role_key="96",
        role_name="Python developer",
        experience="От 1 года до 3 лет",
        status="Открытая",
        skills="Python",
        requirement="Req",
        responsibility="Resp",
        apply_alternate_url="https://example.com/apply",
        accredited_it_employer=True,
        rating="4.8",
        trusted=True,
        employer_url="https://example.com/acme",
    )

    assert vacancy["converted_salary"] == 150000
    assert "calculated_salary" not in vacancy


def test_render_report_omits_role_vacancies_in_lazy_mode(monkeypatch):
    monkeypatch.setenv("REPORT_EMBED_VACANCIES", "0")

    html = generate_report.render_report(
        roles_data=[{"id": "96", "name": "Python developer", "months": []}],
        weekday_data=[],
        skills_monthly_data=[],
        salary_data=[],
        employer_analysis_data=[],
        vacancies_by_role={"96": [{"id": "1", "name": "Python Developer"}]},
    )

    assert "data-vacancies='[]'" in html
    assert 'data-vacancies-mode="lazy"' in html
