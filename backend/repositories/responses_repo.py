from scripts import db


class ResponsesRepository:
    def list_sent_responses(self) -> list[dict]:
        return db.get_sent_resume_vacancies()

    def get_response_details(self, vacancy_id: str) -> dict | None:
        return db.get_vacancy_details(vacancy_id)

    def mark_resume_sent(self, vacancy_id: str) -> dict:
        return db.mark_resume_sent(vacancy_id)

    def update_response_details(
        self,
        vacancy_id: str,
        fields: dict | None,
        force_overwrite: bool = False,
    ) -> dict:
        return db.save_vacancy_details(vacancy_id, fields, force_overwrite)
