from collections import defaultdict
from datetime import datetime

from backend.repositories.responses_repo import ResponsesRepository


class ResponsesService:
    def __init__(self, repository: ResponsesRepository | None = None):
        self.repository = repository or ResponsesRepository()

    def list_responses(
        self,
        *,
        role_ids: list[str] | None = None,
        status: str = "all",
        currency: str = "all",
        offer: str = "all",
        page: int = 1,
        per_page: int = 50,
    ) -> dict:
        items = self._load_normalized_responses()
        items = self._apply_response_filters(
            items,
            role_ids=role_ids,
            status=status,
            currency=currency,
            offer=offer,
        )
        total = len(items)
        start = (page - 1) * per_page
        end = start + per_page
        return {
            "items": items[start:end],
            "page": page,
            "per_page": per_page,
            "total": total,
        }

    def get_calendar(
        self,
        *,
        month: str | None = None,
        role_ids: list[str] | None = None,
        status: str = "all",
        currency: str = "all",
        offer: str = "all",
    ) -> dict:
        items = self._load_normalized_responses()
        items = self._apply_response_filters(
            items,
            role_ids=role_ids,
            status=status,
            currency=currency,
            offer=offer,
        )
        calendar_month = month or self._resolve_calendar_month(items)
        grouped: dict[str, list[dict]] = defaultdict(list)

        for item in items:
            interview_date = self._parse_dt(item.get("interview_date"))
            if interview_date is None:
                continue
            day_key = interview_date.strftime("%Y-%m-%d")
            if calendar_month and not day_key.startswith(calendar_month):
                continue
            grouped[day_key].append(
                {
                    "vacancy_id": item["vacancy_id"],
                    "name": item.get("name") or "",
                    "employer": item.get("employer"),
                    "interview_date": item.get("interview_date"),
                    "result": item.get("result"),
                    "is_pending_result": self._is_pending_result(item),
                }
            )

        days = []
        for day_key in sorted(grouped.keys()):
            rows = sorted(grouped[day_key], key=lambda row: row.get("interview_date") or "")
            days.append({"date": day_key, "count": len(rows), "items": rows})

        return {"month": calendar_month, "days": days}

    def get_response_details(self, vacancy_id: str) -> dict | None:
        details = self.repository.get_response_details(vacancy_id)
        if details is None:
            return None

        responses = self._load_normalized_responses()
        summary_source = None
        for item in responses:
            if str(item.get("vacancy_id") or "").strip() == str(vacancy_id).strip():
                summary_source = item
                break

        if summary_source is None:
            summary_source = {
                "vacancy_id": str(vacancy_id),
                "name": None,
                "employer": None,
                "city": None,
                "country": None,
                "salary_from": None,
                "salary_to": None,
                "currency": None,
                "resume_at": None,
                "published_at": details.get("published_at"),
                "archived": bool(details.get("archived")),
                "archived_at": details.get("archived_at"),
            }

        return {
            "vacancy_id": str(vacancy_id),
            "summary": {
                "name": summary_source.get("name"),
                "employer": summary_source.get("employer"),
                "city": summary_source.get("city"),
                "country": summary_source.get("country"),
                "salary_from": summary_source.get("salary_from"),
                "salary_to": summary_source.get("salary_to"),
                "currency": summary_source.get("currency"),
                "resume_at": summary_source.get("resume_at"),
                "published_at": summary_source.get("published_at"),
                "archived": bool(summary_source.get("archived")),
                "archived_at": summary_source.get("archived_at"),
            },
            "details": {
                "skills": details.get("skills"),
                "requirement": details.get("requirement"),
                "responsibility": details.get("responsibility"),
                "description": details.get("description"),
                "hr_name": details.get("hr_name"),
                "interview_date": details.get("interview_date"),
                "interview_stages": details.get("interview_stages"),
                "company_type": details.get("company_type"),
                "result": details.get("result"),
                "feedback": details.get("feedback"),
                "offer_salary": details.get("offer_salary"),
                "pros": details.get("pros"),
                "cons": details.get("cons"),
                "updated_at": details.get("updated_at"),
            },
        }

    def update_response_details(self, vacancy_id: str, payload: dict) -> dict:
        force_overwrite = bool(payload.pop("force_overwrite", False))
        return self.repository.update_response_details(vacancy_id, payload, force_overwrite)

    def mark_resume_sent(self, vacancy_id: str) -> dict:
        result = self.repository.mark_resume_sent(vacancy_id)
        return {
            "ok": bool(result.get("updated")),
            "vacancy_id": str(result.get("vacancy_id") or vacancy_id),
            "updated": bool(result.get("updated")),
            "resume_at": result.get("resume_at"),
        }

    def _load_normalized_responses(self) -> list[dict]:
        return [self._normalize_response_item(item) for item in self.repository.list_sent_responses()]

    def _normalize_response_item(self, item: dict) -> dict:
        offer_salary = item.get("offer_salary")
        return {
            "vacancy_id": str(item.get("id") or item.get("vacancy_id") or ""),
            "role_id": item.get("role_id"),
            "role_name": item.get("role_name"),
            "name": item.get("name") or "",
            "employer": item.get("employer"),
            "city": item.get("city"),
            "salary_from": item.get("salary_from"),
            "salary_to": item.get("salary_to"),
            "currency": item.get("currency"),
            "resume_at": item.get("resume_at"),
            "published_at": item.get("published_at"),
            "archived": bool(item.get("archived")),
            "archived_at": item.get("archived_at"),
            "interview_filled": bool(item.get("interview_filled")),
            "offer_salary": offer_salary,
            "updated_at": item.get("updated_at"),
            "interview_date": item.get("interview_date"),
            "result": item.get("result"),
            "country": item.get("country"),
        }

    def _apply_response_filters(
        self,
        items: list[dict],
        *,
        role_ids: list[str] | None,
        status: str,
        currency: str,
        offer: str,
    ) -> list[dict]:
        normalized_role_ids = {str(role_id) for role_id in (role_ids or []) if str(role_id).strip()}
        normalized_status = str(status or "all").strip().lower()
        normalized_currency = str(currency or "all").strip().upper()
        normalized_offer = str(offer or "all").strip().lower()

        def has_offer(item: dict) -> bool:
            return bool(str(item.get("offer_salary") or "").strip())

        filtered = []
        for item in items:
            if normalized_role_ids and str(item.get("role_id") or "") not in normalized_role_ids:
                continue
            if normalized_status == "open" and item.get("archived"):
                continue
            if normalized_status == "archived" and not item.get("archived"):
                continue
            if normalized_currency != "ALL" and normalized_currency != "all" and str(item.get("currency") or "").upper() != normalized_currency:
                continue
            if normalized_offer == "yes" and not has_offer(item):
                continue
            if normalized_offer == "no" and has_offer(item):
                continue
            filtered.append(item)
        return filtered

    def _resolve_calendar_month(self, items: list[dict]) -> str:
        candidates = []
        for item in items:
            dt = self._parse_dt(item.get("interview_date"))
            if dt is not None:
                candidates.append(dt)
        if not candidates:
            return datetime.now().strftime("%Y-%m")
        return max(candidates).strftime("%Y-%m")

    def _parse_dt(self, value: str | None) -> datetime | None:
        text = str(value or "").strip()
        if not text:
            return None
        normalized = text.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None

    def _is_pending_result(self, item: dict) -> bool:
        interview_date = self._parse_dt(item.get("interview_date"))
        if interview_date is None:
            return False
        if interview_date >= datetime.now(interview_date.tzinfo):
            return False
        updated_at = self._parse_dt(item.get("updated_at"))
        if updated_at is None:
            return True
        return updated_at < interview_date
