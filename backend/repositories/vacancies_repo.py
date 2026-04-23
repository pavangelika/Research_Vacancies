from scripts.db import get_db_connection, mark_resume_sent


class VacanciesRepository:
    def list_vacancies(self, *, include_details: bool = True) -> list[dict]:
        detail_columns = """
                v.requirement,
                v.responsibility,
        """ if include_details else """
                NULL::TEXT AS requirement,
                NULL::TEXT AS responsibility,
        """
        apply_url_column = "v.apply_alternate_url" if include_details else "NULL::TEXT AS apply_alternate_url"
        query = f"""
            SELECT
                v.id,
                v.name,
                v.employer,
                v.city,
                v.salary_from,
                v.salary_to,
                v.currency,
                v.experience,
                v.skills,
                {detail_columns}
                v.published_at,
                v.archived_at,
                v.archived,
                v.response_letter_required,
                v.has_test,
                {apply_url_column},
                v.send_resume,
                v.professional_role,
                COALESCE(e.accredited_it_employer, false),
                COALESCE(e.trusted, false),
                e.rating,
                e.employer_url
            FROM get_vacancies v
            LEFT JOIN employers e ON e.name = v.employer
        """
        with get_db_connection() as conn, conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

        items = []
        for row in rows:
            items.append(
                {
                    "id": str(row[0]),
                    "name": row[1] or "",
                    "employer_name": row[2] or "",
                    "city": row[3],
                    "salary_from": row[4],
                    "salary_to": row[5],
                    "currency": row[6],
                    "experience": row[7],
                    "skills_raw": row[8] or "",
                    "requirement": row[9],
                    "responsibility": row[10],
                    "published_at": row[11].isoformat() if row[11] else None,
                    "archived_at": row[12].isoformat() if row[12] else None,
                    "archived": bool(row[13]) if row[13] is not None else False,
                    "cover_letter_required": bool(row[14]) if row[14] is not None else False,
                    "has_test": bool(row[15]) if row[15] is not None else False,
                    "apply_alternate_url": row[16],
                    "send_resume": bool(row[17]) if row[17] is not None else False,
                    "role_id": str(row[18]) if row[18] is not None else None,
                    "employer_accredited": bool(row[19]) if row[19] is not None else None,
                    "employer_trusted": bool(row[20]) if row[20] is not None else None,
                    "employer_rating": str(row[21]) if row[21] is not None else None,
                    "employer_url": row[22],
                }
            )
        return items

    def get_vacancy(self, vacancy_id: str) -> dict | None:
        vacancy_id = str(vacancy_id or "").strip()
        if not vacancy_id:
            return None
        for item in self.list_vacancies():
            if item["id"] == vacancy_id:
                return item
        return None

    def mark_resume_sent(self, vacancy_id: str) -> dict:
        return mark_resume_sent(vacancy_id)
