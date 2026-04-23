import os
from pathlib import Path

from scripts import generate_report


class AnalyticsRepository:
    def __init__(self, roles_json_path: str | None = None):
        default_roles_path = Path(__file__).resolve().parents[2] / "data" / "professional_roles.json"
        self.roles_json_path = roles_json_path or os.environ.get("ROLES_JSON_PATH") or str(default_roles_path)

    def _load_mapping(self) -> dict:
        return generate_report.load_roles_mapping(self.roles_json_path)

    def get_activity(self) -> list[dict]:
        return generate_report.fetch_data(self._load_mapping())

    def get_weekday(self) -> list[dict]:
        return generate_report.fetch_weekday_data(self._load_mapping())

    def get_skills_cost(self) -> list[dict]:
        return generate_report.fetch_skills_monthly_data(self._load_mapping())

    def get_salary_range(self) -> list[dict]:
        salary_data, _vacancies_by_role = generate_report.fetch_salary_data(self._load_mapping())
        return salary_data

    def get_employers(self) -> list[dict]:
        return generate_report.fetch_employer_analysis_data(self._load_mapping())
