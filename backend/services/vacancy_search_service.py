from datetime import datetime, timedelta

from backend.repositories.vacancies_repo import VacanciesRepository


class VacancySearchService:
    def __init__(self, repository: VacanciesRepository | None = None):
        self.repository = repository or VacanciesRepository()

    def list_vacancies(
        self,
        *,
        scope: str = "all",
        role_ids: list[str] | None = None,
        periods: list[str] | None = None,
        experience: list[str] | None = None,
        status: str = "all",
        country: str = "all",
        currency: list[str] | None = None,
        employer: list[str] | None = None,
        employer_exclude: list[str] | None = None,
        accreditation: str = "all",
        cover_letter_required: str = "all",
        has_test: str = "all",
        skills_include: list[str] | None = None,
        skills_exclude: list[str] | None = None,
        skills_logic: str = "or",
        page: int = 1,
        per_page: int = 50,
        sort: str = "published_desc",
    ) -> dict:
        items = self._load_normalized_items(include_details=True)
        items = self._filter_and_page_items(
            items,
            role_ids=role_ids,
            periods=periods,
            experience=experience,
            status=status,
            country=country,
            currency=currency,
            employer=employer,
            employer_exclude=employer_exclude,
            accreditation=accreditation,
            cover_letter_required=cover_letter_required,
            has_test=has_test,
            skills_include=skills_include,
            skills_exclude=skills_exclude,
            skills_logic=skills_logic,
            page=page,
            per_page=per_page,
            sort=sort,
        )
        return items

    def get_vacancy(self, vacancy_id: str) -> dict | None:
        item = self.repository.get_vacancy(vacancy_id)
        if item is None:
            return None
        return self._normalize_item(item)

    def get_skill_suggestions(
        self,
        *,
        scope: str = "all",
        role_ids: list[str] | None = None,
        periods: list[str] | None = None,
        experience: list[str] | None = None,
        status: str = "all",
        country: str = "all",
        currency: list[str] | None = None,
        employer: list[str] | None = None,
        employer_exclude: list[str] | None = None,
        accreditation: str = "all",
        cover_letter_required: str = "all",
        has_test: str = "all",
        limit: int = 50,
    ) -> dict:
        items = self._load_normalized_items(include_details=False)
        items = self._apply_filters(
            items,
            role_ids=role_ids,
            periods=periods,
            experience=experience,
            status=status,
            country=country,
            currency=currency,
            employer=employer,
            employer_exclude=employer_exclude,
            accreditation=accreditation,
            cover_letter_required=cover_letter_required,
            has_test=has_test,
            skills_include=None,
            skills_exclude=None,
            skills_logic="or",
        )
        counts: dict[str, int] = {}
        labels: dict[str, str] = {}
        for item in items:
            for skill in item["skills"]:
                key = self._normalize_skill(skill)
                if not key:
                    continue
                counts[key] = counts.get(key, 0) + 1
                labels.setdefault(key, skill)
        suggestions = [{"skill": labels[key], "count": counts[key]} for key in counts]
        suggestions.sort(key=lambda row: (-row["count"], row["skill"].lower()))
        return {"items": suggestions[:limit]}

    def _load_normalized_items(self, *, include_details: bool) -> list[dict]:
        return [self._normalize_item(item) for item in self.repository.list_vacancies(include_details=include_details)]

    def _filter_and_page_items(
        self,
        items: list[dict],
        *,
        scope: str = "all",
        role_ids: list[str] | None,
        periods: list[str] | None,
        experience: list[str] | None,
        status: str,
        country: str,
        currency: list[str] | None,
        employer: list[str] | None,
        employer_exclude: list[str] | None,
        accreditation: str,
        cover_letter_required: str,
        has_test: str,
        skills_include: list[str] | None,
        skills_exclude: list[str] | None,
        skills_logic: str,
        page: int,
        per_page: int,
        sort: str,
    ) -> dict:
        filtered_items = self._apply_filters(
            items,
            role_ids=role_ids,
            periods=periods,
            experience=experience,
            status=status,
            country=country,
            currency=currency,
            employer=employer,
            employer_exclude=employer_exclude,
            accreditation=accreditation,
            cover_letter_required=cover_letter_required,
            has_test=has_test,
            skills_include=skills_include,
            skills_exclude=skills_exclude,
            skills_logic=skills_logic,
        )
        filtered_items = self._sort_items(filtered_items, sort)
        total = len(filtered_items)
        start = (page - 1) * per_page
        end = start + per_page
        return {"items": filtered_items[start:end], "page": page, "per_page": per_page, "total": total}

    def mark_resume_sent(self, vacancy_id: str) -> dict:
        result = self.repository.mark_resume_sent(vacancy_id)
        return {
            "ok": bool(result.get("updated")),
            "vacancy_id": str(result.get("vacancy_id") or vacancy_id),
            "updated": bool(result.get("updated")),
            "resume_at": result.get("resume_at"),
        }

    def _normalize_item(self, item: dict) -> dict:
        skills = [part.strip() for part in str(item.get("skills_raw") or "").split(",") if part.strip()]
        return {
            "id": str(item.get("id") or ""),
            "name": item.get("name") or "",
            "employer": {
                "name": item.get("employer_name") or "",
                "accredited": item.get("employer_accredited"),
                "trusted": item.get("employer_trusted"),
                "rating": item.get("employer_rating"),
                "url": item.get("employer_url"),
            },
            "location": {
                "city": item.get("city"),
                "country": item.get("country"),
            },
            "salary": {
                "from_value": item.get("salary_from"),
                "to_value": item.get("salary_to"),
                "currency": item.get("currency"),
            },
            "experience": item.get("experience"),
            "status": "archived" if item.get("archived") else "open",
            "skills": skills,
            "requirement": item.get("requirement"),
            "responsibility": item.get("responsibility"),
            "published_at": item.get("published_at"),
            "archived_at": item.get("archived_at"),
            "apply_alternate_url": item.get("apply_alternate_url"),
            "send_resume": bool(item.get("send_resume")),
            "role_id": item.get("role_id"),
            "cover_letter_required": bool(item.get("cover_letter_required")),
            "has_test": bool(item.get("has_test")),
        }

    def _apply_filters(
        self,
        items: list[dict],
        *,
        role_ids: list[str] | None,
        periods: list[str] | None,
        experience: list[str] | None,
        status: str,
        country: str,
        currency: list[str] | None,
        employer: list[str] | None,
        employer_exclude: list[str] | None,
        accreditation: str,
        cover_letter_required: str,
        has_test: str,
        skills_include: list[str] | None,
        skills_exclude: list[str] | None,
        skills_logic: str,
    ) -> list[dict]:
        role_id_set = {str(role_id) for role_id in (role_ids or []) if str(role_id).strip()}
        experience_set = {str(item).strip() for item in (experience or []) if str(item).strip()}
        currency_set = {str(item).strip().upper() for item in (currency or []) if str(item).strip()}
        employer_set = {str(item).strip().casefold() for item in (employer or []) if str(item).strip()}
        employer_exclude_set = {str(item).strip().casefold() for item in (employer_exclude or []) if str(item).strip()}
        include_set = {self._normalize_skill(item) for item in (skills_include or []) if self._normalize_skill(item)}
        exclude_set = {self._normalize_skill(item) for item in (skills_exclude or []) if self._normalize_skill(item)}
        normalized_status = str(status or "all").strip().lower()
        normalized_country = str(country or "all").strip().lower()
        normalized_logic = str(skills_logic or "or").strip().lower()
        normalized_accreditation = self._normalize_boolean_filter(accreditation)
        normalized_cover_letter_required = self._normalize_boolean_filter(cover_letter_required)
        normalized_has_test = self._normalize_boolean_filter(has_test)

        result = []
        for item in items:
            if role_id_set and str(item.get("role_id") or "") not in role_id_set:
                continue
            if experience_set and str(item.get("experience") or "").strip() not in experience_set:
                continue
            if normalized_status in {"open", "archived"} and item["status"] != normalized_status:
                continue
            if currency_set and str(item["salary"].get("currency") or "").upper() not in currency_set:
                continue
            if not self._matches_periods(item, periods or []):
                continue
            if normalized_country == "ru" and str(item["location"].get("country") or "").strip() != "Россия":
                continue
            if normalized_country == "not_ru" and str(item["location"].get("country") or "").strip() == "Россия":
                continue

            employer_name = str(item["employer"].get("name") or "").strip().casefold()
            if employer_set and employer_name not in employer_set:
                continue
            if employer_exclude_set and employer_name in employer_exclude_set:
                continue
            if normalized_accreditation is not None and bool(item["employer"].get("accredited")) is not normalized_accreditation:
                continue
            if normalized_cover_letter_required is not None and bool(item.get("cover_letter_required")) is not normalized_cover_letter_required:
                continue
            if normalized_has_test is not None and bool(item.get("has_test")) is not normalized_has_test:
                continue
            skill_set = {self._normalize_skill(skill) for skill in item["skills"] if self._normalize_skill(skill)}
            if exclude_set and any(skill in skill_set for skill in exclude_set):
                continue
            if include_set:
                if normalized_logic == "and" and not include_set.issubset(skill_set):
                    continue
                if normalized_logic != "and" and include_set.isdisjoint(skill_set):
                    continue
            result.append(item)
        return result

    def _sort_items(self, items: list[dict], sort: str) -> list[dict]:
        sort_key = str(sort or "published_desc").strip().lower()
        if sort_key == "salary_desc":
            return sorted(items, key=self._salary_sort_value, reverse=True)
        if sort_key == "salary_asc":
            return sorted(items, key=self._salary_sort_value)
        if sort_key == "published_asc":
            return sorted(items, key=lambda item: item.get("published_at") or "")
        return sorted(items, key=lambda item: item.get("published_at") or "", reverse=True)

    def _salary_sort_value(self, item: dict) -> float:
        salary = item.get("salary") or {}
        left = salary.get("from_value")
        right = salary.get("to_value")
        values = [value for value in [left, right] if value is not None]
        if not values:
            return -1
        return float(sum(values) / len(values))

    def _matches_periods(self, item: dict, periods: list[str]) -> bool:
        selected = [str(period).strip() for period in periods if str(period).strip()]
        if not selected:
            return True
        published_dt = self._parse_dt(item.get("published_at"))
        if published_dt is None:
            return False
        max_dt = datetime.now(published_dt.tzinfo)
        month_key = published_dt.strftime("%Y-%m")

        for period in selected:
            if period in {"summary", "all", "За период"}:
                return True
            if period == "today" and published_dt.date() == max_dt.date():
                return True
            if period == "last_3" and published_dt >= max_dt - timedelta(days=3):
                return True
            if period == "last_7" and published_dt >= max_dt - timedelta(days=7):
                return True
            if period == "last_14" and published_dt >= max_dt - timedelta(days=14):
                return True
            if month_key == period:
                return True
        return False

    def _parse_dt(self, value: str | None) -> datetime | None:
        text = str(value or "").strip()
        if not text:
            return None
        normalized = text.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None

    def _normalize_skill(self, value: str) -> str:
        return str(value or "").strip().casefold()

    def _normalize_boolean_filter(self, value: str | None) -> bool | None:
        text = str(value or "").strip().lower()
        if text in {"true", "1", "yes"}:
            return True
        if text in {"false", "0", "no"}:
            return False
        return None
