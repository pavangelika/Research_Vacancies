from collections import defaultdict
from datetime import datetime, timedelta

from backend.repositories.analytics_repo import AnalyticsRepository
from backend.repositories.vacancies_repo import VacanciesRepository
from backend.services.responses_service import ResponsesService


class AnalyticsService:
    def __init__(
        self,
        repository: AnalyticsRepository | None = None,
        vacancies_repository: VacanciesRepository | None = None,
        responses_service: ResponsesService | None = None,
    ):
        self.repository = repository or AnalyticsRepository()
        self.vacancies_repository = vacancies_repository or VacanciesRepository()
        self.responses_service = responses_service or ResponsesService()

    def get_dashboard(self, *, scope: str = "all", role_ids: list[str] | None = None, period: str = "summary") -> dict:
        activity = self.get_activity(scope=scope, role_ids=role_ids, period=period)
        salary = self.get_salary_range(scope=scope, role_ids=role_ids, period=period)
        metrics = [
            {"key": "roles", "label": "Роли", "value": len(activity["role_ids"]) if activity["role_ids"] else 0},
            {"key": "vacancies_total", "label": "Всего вакансий", "value": activity["summary"]["total"]},
            {"key": "vacancies_active", "label": "Активные вакансии", "value": activity["summary"]["active"]},
            {"key": "salary_rows", "label": "Зарплатные срезы", "value": len(salary["items"])},
        ]
        return {
            "scope": scope,
            "role_ids": activity["role_ids"],
            "period_label": activity["period_label"],
            "metrics": metrics,
        }

    def get_activity(self, *, scope: str = "all", role_ids: list[str] | None = None, period: str = "summary") -> dict:
        rows = self._filter_roles(self.repository.get_activity(), role_ids)
        aggregated = defaultdict(lambda: defaultdict(lambda: {"total": 0, "active": 0, "archived": 0, "age_sum": 0.0, "age_count": 0}))
        selected_role_ids = [row["id"] for row in rows]
        filtered_vacancies = self._get_filtered_vacancies(role_ids=role_ids, period=period)
        role_rows = self._build_activity_role_rows(rows, vacancies=filtered_vacancies)
        quick_period_entries = self._build_activity_period_entries(vacancies=filtered_vacancies, period=period)

        for role in rows:
            for month in role.get("months", []):
                month_name = month.get("month") or ""
                if period != "summary" and month_name != period:
                    continue
                if period == "summary" and not month_name.startswith("За "):
                    continue
                if period != "summary" and month_name.startswith("За "):
                    continue
                for entry in month.get("entries", []):
                    exp = entry.get("experience")
                    if exp == "Всего":
                        continue
                    bucket = aggregated[month_name][exp]
                    bucket["total"] += int(entry.get("total") or 0)
                    bucket["active"] += int(entry.get("active") or 0)
                    bucket["archived"] += int(entry.get("archived") or 0)
                    if entry.get("avg_age") is not None:
                        bucket["age_sum"] += float(entry.get("avg_age")) * int(entry.get("total") or 0)
                        bucket["age_count"] += int(entry.get("total") or 0)

        months = []
        total_summary = {"total": 0, "active": 0, "archived": 0}
        for month_name in sorted(aggregated.keys()):
            month_entries = []
            for exp, vals in aggregated[month_name].items():
                avg_age = None
                if vals["age_count"]:
                    avg_age = round(vals["age_sum"] / vals["age_count"], 2)
                month_entries.append(
                    {
                        "experience": exp,
                        "total": vals["total"],
                        "active": vals["active"],
                        "archived": vals["archived"],
                        "avg_age_days": avg_age,
                    }
                )
                total_summary["total"] += vals["total"]
                total_summary["active"] += vals["active"]
                total_summary["archived"] += vals["archived"]
            month_entries.sort(key=lambda item: item["experience"])
            months.append({"month": month_name, "entries": month_entries})

        if not months and quick_period_entries:
            months.append({"month": period, "entries": quick_period_entries})
            for entry in quick_period_entries:
                total_summary["total"] += int(entry.get("total") or 0)
                total_summary["active"] += int(entry.get("active") or 0)
                total_summary["archived"] += int(entry.get("archived") or 0)

        return {
            "scope": scope,
            "role_ids": selected_role_ids,
            "period_label": period,
            "months": months,
            "summary": total_summary,
            "role_rows": role_rows,
        }

    def get_weekday(self, *, scope: str = "all", role_ids: list[str] | None = None, period: str = "summary") -> dict:
        rows = self._filter_roles(self.repository.get_weekday(), role_ids)
        grouped = defaultdict(lambda: {"publications": 0, "archives": 0, "pub_hours": [], "arch_hours": []})
        selected_role_ids = [row["id"] for row in rows]
        filtered_vacancies = self._get_filtered_vacancies(role_ids=role_ids, period=period)
        role_rows = self._build_weekday_role_rows(rows, vacancies=filtered_vacancies)

        for role in rows:
            for item in role.get("weekdays", []):
                weekday = item.get("weekday") or ""
                bucket = grouped[weekday]
                bucket["publications"] += int(item.get("publications") or 0)
                bucket["archives"] += int(item.get("archives") or 0)
                if item.get("avg_pub_hour"):
                    bucket["pub_hours"].append(item.get("avg_pub_hour"))
                if item.get("avg_arch_hour"):
                    bucket["arch_hours"].append(item.get("avg_arch_hour"))

        items = []
        for weekday, vals in grouped.items():
            items.append(
                {
                    "weekday": weekday,
                    "publications": vals["publications"],
                    "archives": vals["archives"],
                    "avg_pub_hour": vals["pub_hours"][0] if vals["pub_hours"] else "—",
                    "avg_arch_hour": vals["arch_hours"][0] if vals["arch_hours"] else "—",
                }
            )
        if not items:
            items = self._build_weekday_items(vacancies=filtered_vacancies, period=period)
        items.sort(key=lambda item: item["weekday"])
        return {
            "scope": scope,
            "role_ids": selected_role_ids,
            "period_label": period,
            "items": items,
            "role_rows": role_rows,
        }

    def get_skills_cost(
        self,
        *,
        scope: str = "all",
        role_ids: list[str] | None = None,
        period: str = "summary",
        currency: str = "RUR",
    ) -> dict:
        rows = self._filter_roles(self.repository.get_skills_cost(), role_ids)
        selected_role_ids = [row["id"] for row in rows]
        skills = defaultdict(lambda: {"count": 0, "roles": defaultdict(int)})
        month_items = self._build_skills_months(rows=rows, role_ids=role_ids, period=period)

        for role in rows:
            role_id = role["id"]
            role_name = role.get("name") or role_id
            role_months = role.get("months_list", [])
            for month in role_months:
                month_name = month.get("month") or ""
                if period != "summary" and month_name != period:
                    continue
                if period == "summary" and not month_name.startswith("За "):
                    continue
                if period != "summary" and month_name.startswith("За "):
                    continue
                for exp in month.get("experiences", []):
                    for skill in exp.get("skills", []):
                        name = skill.get("skill") or ""
                        count = int(skill.get("count") or 0)
                        skills[name]["count"] += count
                        skills[name]["roles"][(role_id, role_name)] += count

        items = []
        for skill_name, vals in skills.items():
            total = vals["count"] or 1
            role_rows = []
            for (role_id, role_name), count in vals["roles"].items():
                role_rows.append(
                    {
                        "role_id": role_id,
                        "role_name": role_name,
                        "share": round((count * 100.0) / total, 2),
                    }
                )
            role_rows.sort(key=lambda row: (-row["share"], row["role_name"]))
            items.append(
                {
                    "skill": skill_name,
                    "mention_count": vals["count"],
                    "avg_skill_cost": None,
                    "median_skill_cost": None,
                    "roles": role_rows,
                }
            )
        items.sort(key=lambda row: (-row["mention_count"], row["skill"].lower()))
        return {
            "scope": scope,
            "role_ids": selected_role_ids,
            "period_label": period,
            "currency": currency,
            "items": items[:50],
            "months": month_items,
        }

    def get_salary_range(self, *, scope: str = "all", role_ids: list[str] | None = None, period: str = "summary") -> dict:
        rows = self._filter_roles(self.repository.get_salary_range(), role_ids)
        selected_role_ids = [row["id"] for row in rows]
        items = []

        for role in rows:
            role_id = role["id"]
            role_name = role.get("name") or role_id
            for month in role.get("months_list", []):
                month_name = month.get("month") or ""
                if period != "summary" and month_name != period:
                    continue
                if period == "summary" and not month_name.startswith("За "):
                    continue
                if period != "summary" and month_name.startswith("За "):
                    continue
                for exp in month.get("experiences", []):
                    for entry in exp.get("entries", []):
                        items.append(
                            {
                                "role_id": role_id,
                                "role_name": role_name,
                                "month": month_name,
                                "experience": exp.get("experience") or "",
                                "status": entry.get("status") or "",
                                "currency": entry.get("currency") or "",
                                "count": int(entry.get("total_vacancies") or 0),
                                "total_vacancies": int(entry.get("total_vacancies") or 0),
                                "avg_salary": entry.get("avg_salary"),
                                "median_salary": entry.get("median_salary"),
                                "mode_salary": entry.get("mode_salary"),
                                "min_salary": entry.get("min_salary"),
                                "max_salary": entry.get("max_salary"),
                                "top_skills": entry.get("top_skills") or "",
                            }
                        )
        return {"scope": scope, "role_ids": selected_role_ids, "period_label": period, "items": items}

    def get_employers(self, *, scope: str = "all", role_ids: list[str] | None = None, period: str = "summary") -> dict:
        rows = self._filter_roles(self.repository.get_employers(), role_ids)
        selected_role_ids = [row["id"] for row in rows]
        items = []
        for role in rows:
            for row in role.get("rows", []):
                items.append(
                    {
                        "month": row.get("month") or "",
                        "factor": row.get("factor") or "",
                        "factor_value": row.get("factor_value") or "",
                        "group_n": int(row.get("group_n") or 0),
                        "salary": {
                            "currency": "RUR",
                            "avg": row.get("avg_salary_rur"),
                            "count": int(row.get("avg_salary_rur_n") or 0),
                        },
                    }
                )
        return {"scope": scope, "role_ids": selected_role_ids, "period_label": period, "items": items}

    def get_dashboard_payload(
        self,
        *,
        scope: str = "all",
        role_ids: list[str] | None = None,
        period: str = "summary",
        experience: list[str] | None = None,
        status: str = "all",
        country: str = "all",
        currency: list[str] | None = None,
        employer: list[str] | None = None,
        employer_exclude: list[str] | None = None,
        interview: list[str] | None = None,
        result: list[str] | None = None,
        offer: list[str] | None = None,
        skills_include: list[str] | None = None,
        skills_exclude: list[str] | None = None,
        skills_logic: str = "or",
        accreditation: str = "all",
        cover_letter_required: str = "all",
        has_test: str = "all",
        top_currency: str = "RUR",
        top_limit: int = 15,
        vacancy_order: str = "high",
        skills_order: str = "most",
        company_order: str = "high",
        closing_window: str = "lte_7",
        market_trends_currency: str = "RUR",
        market_trends_salary_metric: str = "avg",
        market_trends_excluded_roles: list[str] | None = None,
    ) -> dict:
        filtered_vacancies = self._get_filtered_vacancies(
            role_ids=role_ids,
            period=period,
            experience=experience,
            status=status,
            country=country,
            currency=currency,
            employer=employer,
            employer_exclude=employer_exclude,
            interview=interview,
            result=result,
            offer=offer,
            skills_include=skills_include,
            skills_exclude=skills_exclude,
            skills_logic=skills_logic,
            accreditation=accreditation,
            cover_letter_required=cover_letter_required,
            has_test=has_test,
        )
        kpi_vacancies = self._get_filtered_vacancies(
            role_ids=role_ids,
            period="summary",
            experience=experience,
            status=status,
            country=country,
            currency=currency,
            employer=employer,
            employer_exclude=employer_exclude,
            interview=interview,
            result=result,
            offer=offer,
            skills_include=skills_include,
            skills_exclude=skills_exclude,
            skills_logic=skills_logic,
            accreditation=accreditation,
            cover_letter_required=cover_letter_required,
            has_test=has_test,
        )
        activity = self.get_activity(scope=scope, role_ids=role_ids, period=period)
        salary_rows = self._compute_dashboard_salary_rows(filtered_vacancies)
        top_currency = self._normalize_dashboard_top_currency(
            top_currency or next((row["currency"] for row in salary_rows if int(row.get("withSalary") or 0) > 0), "RUR")
        )
        top_limit = self._normalize_dashboard_top_limit(top_limit)
        vacancy_order = self._normalize_dashboard_top_order(vacancy_order, {"high", "low"}, "high")
        skills_order = self._normalize_dashboard_top_order(skills_order, {"most", "least"}, "most")
        company_order = self._normalize_dashboard_top_order(company_order, {"high", "low"}, "high")
        closing_window = self._normalize_dashboard_top_order(closing_window, {"lte_7", "lte_14", "lte_30", "gt_30", "gt_60"}, "lte_7")
        market_trends_currency = self._normalize_dashboard_top_currency(market_trends_currency)
        market_trends_salary_metric = self._normalize_dashboard_top_order(market_trends_salary_metric, {"min", "max", "avg", "median", "mode"}, "avg")
        return {
            "scope": scope,
            "role_ids": activity["role_ids"],
            "period_label": activity["period_label"],
            "metrics": [
                {"key": "roles", "label": "Роли", "value": len(activity["role_ids"]) if activity["role_ids"] else 0},
                {"key": "vacancies_total", "label": "Всего вакансий", "value": activity["summary"]["total"]},
                {"key": "vacancies_active", "label": "Активные вакансии", "value": activity["summary"]["active"]},
            ],
            "salary_rows": salary_rows,
            "salary_coverage": self._compute_dashboard_salary_coverage(filtered_vacancies),
            "compensation_availability": self._compute_dashboard_compensation_availability(filtered_vacancies),
            "period_stats": self._compute_dashboard_period_stats(filtered_vacancies),
            "response_funnel": self._build_dashboard_response_funnel(role_ids=activity["role_ids"]),
            "burnup_series": self._compute_dashboard_burnup_series(filtered_vacancies if period != "summary" else kpi_vacancies),
            "skills_rows": self._compute_dashboard_skills_rows(filtered_vacancies, top_currency, skills_order, top_limit),
            "company_rows": self._compute_dashboard_company_rows(filtered_vacancies, top_currency, company_order, top_limit),
            "closing_rows": self._compute_dashboard_closing_rows(filtered_vacancies, closing_window, top_limit),
            "top_vacancies": self._compute_dashboard_top_vacancies(filtered_vacancies, top_currency, vacancy_order, top_limit),
            "salary_month_data": self._build_dashboard_salary_month_data(filtered_vacancies, activity["period_label"] or period),
            "employer_overview": self._build_dashboard_employer_overview(filtered_vacancies, top_currency, "avg"),
            "market_trends": self._build_dashboard_market_trends(
                role_ids=role_ids,
                period=period,
                currency=market_trends_currency,
                metric=market_trends_salary_metric,
                experience=experience,
                status=status,
                excluded_role_ids=market_trends_excluded_roles,
            ),
        }

    def _normalize_dashboard_top_currency(self, value: str | None) -> str:
        current = str(value or "").strip().upper()
        if current == "RUB":
            return "RUR"
        if current == "EURO":
            return "EUR"
        return current if current in {"RUR", "USD", "EUR"} else "RUR"

    def _normalize_dashboard_top_limit(self, value: int | None) -> int:
        try:
            current = int(value)
        except (TypeError, ValueError):
            current = 15
        if current < 15:
            return 15
        if current > 200:
            return 200
        return current

    def _normalize_dashboard_top_order(self, value: str | None, allowed: set[str], fallback: str) -> str:
        current = str(value or "").strip().lower()
        return current if current in allowed else fallback

    def _filter_roles(self, rows: list[dict], role_ids: list[str] | None) -> list[dict]:
        role_id_set = {str(role_id) for role_id in (role_ids or []) if str(role_id).strip()}
        if not role_id_set:
            return rows
        return [row for row in rows if str(row.get("id") or "") in role_id_set]

    def _build_activity_role_rows(self, rows: list[dict], *, vacancies: list[dict]) -> list[dict]:
        role_name_by_id = {
            str(row.get("id") or ""): str(row.get("name") or row.get("id") or "").strip()
            for row in rows
            if str(row.get("id") or "").strip()
        }
        grouped = defaultdict(lambda: {"total": 0, "active": 0, "archived": 0, "age_sum": 0.0, "age_count": 0})

        for vacancy in vacancies:
            role_id = str(vacancy.get("role_id") or "").strip()
            if not role_id:
                continue
            bucket = grouped[role_id]
            bucket["total"] += 1
            archived = bool(vacancy.get("archived"))
            if archived:
                bucket["archived"] += 1
            else:
                bucket["active"] += 1
            age_days = self._compute_age_days(
                vacancy.get("_published_dt") or vacancy.get("published_at"),
                vacancy.get("_archived_dt") or vacancy.get("archived_at"),
            )
            if age_days is not None:
                bucket["age_sum"] += age_days
                bucket["age_count"] += 1

        items = []
        for role_id, vals in grouped.items():
            avg_age = round(vals["age_sum"] / vals["age_count"], 2) if vals["age_count"] else None
            items.append(
                {
                    "role_id": role_id,
                    "name": role_name_by_id.get(role_id) or role_id,
                    "total": vals["total"],
                    "active": vals["active"],
                    "archived": vals["archived"],
                    "avg_age": avg_age,
                }
            )
        items.sort(
            key=lambda item: (
                -self._safe_ratio(item["archived"], item["active"]),
                -int(item["active"] or 0),
                str(item["name"] or ""),
            )
        )
        return items

    def _build_activity_period_entries(self, *, vacancies: list[dict], period: str) -> list[dict]:
        current = str(period or "summary").strip().lower()
        if current not in {"today", "last_3", "last_7", "last_14"}:
            return []
        grouped = defaultdict(lambda: {"total": 0, "active": 0, "archived": 0, "age_sum": 0.0, "age_count": 0})

        for vacancy in vacancies:
            experience = str(vacancy.get("experience") or "").strip() or "Не указан"
            bucket = grouped[experience]
            bucket["total"] += 1
            archived = bool(vacancy.get("archived"))
            if archived:
                bucket["archived"] += 1
            else:
                bucket["active"] += 1
            age_days = self._compute_age_days(
                vacancy.get("_published_dt") or vacancy.get("published_at"),
                vacancy.get("_archived_dt") or vacancy.get("archived_at"),
            )
            if age_days is not None:
                bucket["age_sum"] += age_days
                bucket["age_count"] += 1

        items = []
        for experience, vals in sorted(grouped.items(), key=lambda item: item[0]):
            avg_age = round(vals["age_sum"] / vals["age_count"], 2) if vals["age_count"] else None
            items.append(
                {
                    "experience": experience,
                    "total": vals["total"],
                    "active": vals["active"],
                    "archived": vals["archived"],
                    "avg_age_days": avg_age,
                }
            )
        return items

    def _build_weekday_role_rows(self, rows: list[dict], *, vacancies: list[dict]) -> list[dict]:
        role_name_by_id = {
            str(row.get("id") or ""): str(row.get("name") or row.get("id") or "").strip()
            for row in rows
            if str(row.get("id") or "").strip()
        }
        grouped = defaultdict(lambda: {"publications": 0, "archives": 0, "days": set()})

        for vacancy in vacancies:
            role_id = str(vacancy.get("role_id") or "").strip()
            published_dt = vacancy.get("_published_dt") or self._parse_dt(vacancy.get("published_at"))
            if not role_id or published_dt is None:
                continue
            bucket = grouped[role_id]
            bucket["publications"] += 1
            if vacancy.get("archived"):
                bucket["archives"] += 1
            bucket["days"].add(published_dt.date().isoformat())

        items = []
        for role_id, vals in grouped.items():
            day_count = len(vals["days"]) or 1
            items.append(
                {
                    "role_id": role_id,
                    "name": role_name_by_id.get(role_id) or role_id,
                    "avg_pub": round(vals["publications"] / day_count, 2),
                    "avg_arch": round(vals["archives"] / day_count, 2),
                }
            )
        items.sort(key=lambda item: (-float(item["avg_pub"] or 0), str(item["name"] or "")))
        return items

    def _build_weekday_items(self, *, vacancies: list[dict], period: str) -> list[dict]:
        current = str(period or "summary").strip().lower()
        if current not in {"today", "last_3", "last_7", "last_14"}:
            return []
        grouped = defaultdict(lambda: {"publications": 0, "archives": 0, "pub_hours": [], "arch_hours": []})

        for vacancy in vacancies:
            published_dt = vacancy.get("_published_dt") or self._parse_dt(vacancy.get("published_at"))
            if published_dt is None:
                continue
            weekday = published_dt.strftime("%A")
            bucket = grouped[weekday]
            bucket["publications"] += 1
            bucket["pub_hours"].append(published_dt.hour)
            archived_dt = vacancy.get("_archived_dt") or self._parse_dt(vacancy.get("archived_at"))
            if archived_dt is not None:
                bucket["archives"] += 1
                bucket["arch_hours"].append(archived_dt.hour)

        items = []
        for weekday, vals in grouped.items():
            pub_avg = round(sum(vals["pub_hours"]) / len(vals["pub_hours"])) if vals["pub_hours"] else None
            arch_avg = round(sum(vals["arch_hours"]) / len(vals["arch_hours"])) if vals["arch_hours"] else None
            items.append(
                {
                    "weekday": weekday,
                    "publications": vals["publications"],
                    "archives": vals["archives"],
                    "avg_pub_hour": f"{pub_avg:02d}:00" if pub_avg is not None else "—",
                    "avg_arch_hour": f"{arch_avg:02d}:00" if arch_avg is not None else "—",
                }
            )
        return items

    def _build_skills_months(self, *, rows: list[dict], role_ids: list[str] | None, period: str) -> list[dict]:
        current = str(period or "summary").strip().lower()
        if current in {"today", "last_3", "last_7", "last_14"}:
            return [self._build_skills_month_from_vacancies(role_ids=role_ids, period=period)]

        month_buckets: dict[str, dict[str, dict]] = defaultdict(dict)
        for role in rows:
            for month in role.get("months_list", []):
                month_name = str(month.get("month") or "").strip()
                if period != "summary" and month_name != period:
                    continue
                if period == "summary" and not month_name.startswith("Р—Р° "):
                    continue
                if period != "summary" and month_name.startswith("Р—Р° "):
                    continue
                for exp in month.get("experiences", []):
                    experience = str(exp.get("experience") or "").strip() or "РќРµ СѓРєР°Р·Р°РЅ"
                    bucket = month_buckets[month_name].get(experience)
                    if bucket is None:
                        bucket = {
                            "experience": experience,
                            "total_vacancies": 0,
                            "skills": defaultdict(int),
                        }
                        month_buckets[month_name][experience] = bucket
                    bucket["total_vacancies"] += int(exp.get("total_vacancies") or 0)
                    for skill in exp.get("skills", []):
                        skill_name = str(skill.get("skill") or "").strip()
                        if not skill_name:
                            continue
                        bucket["skills"][skill_name] += int(skill.get("count") or 0)

        items = []
        for month_name, exp_buckets in sorted(month_buckets.items(), key=lambda item: item[0], reverse=True):
            items.append(
                {
                    "month": month_name,
                    "experiences": self._finalize_skills_experiences(exp_buckets),
                }
            )
        return items

    def _build_skills_month_from_vacancies(self, *, role_ids: list[str] | None, period: str) -> dict:
        vacancies = self._get_filtered_vacancies(role_ids=role_ids, period=period)
        grouped: dict[str, dict] = {}
        for vacancy in vacancies:
            raw_skills = str(vacancy.get("skills_raw") or "").strip()
            if not raw_skills:
                continue
            experience = str(vacancy.get("experience") or "").strip() or "РќРµ СѓРєР°Р·Р°РЅ"
            bucket = grouped.get(experience)
            if bucket is None:
                bucket = {
                    "experience": experience,
                    "total_vacancies": 0,
                    "skills": defaultdict(int),
                }
                grouped[experience] = bucket
            bucket["total_vacancies"] += 1
            for raw_skill in raw_skills.split(","):
                skill_name = str(raw_skill or "").strip()
                if not skill_name:
                    continue
                bucket["skills"][skill_name] += 1

        return {
            "month": period,
            "experiences": self._finalize_skills_experiences(grouped),
        }

    def _finalize_skills_experiences(self, grouped: dict[str, dict]) -> list[dict]:
        items = []
        for experience, bucket in sorted(grouped.items(), key=lambda item: item[0]):
            total_vacancies = int(bucket.get("total_vacancies") or 0)
            skills = []
            for skill_name, count in bucket.get("skills", {}).items():
                coverage = round((count * 100.0) / total_vacancies, 2) if total_vacancies else 0.0
                skills.append(
                    {
                        "skill": skill_name,
                        "count": int(count or 0),
                        "coverage": coverage,
                        "rank": 0,
                    }
                )
            skills.sort(key=lambda item: (-item["count"], item["skill"].lower()))
            skills = skills[:30]
            for idx, skill in enumerate(skills, start=1):
                skill["rank"] = idx
            items.append(
                {
                    "experience": experience,
                    "total_vacancies": total_vacancies,
                    "skills": skills,
                }
            )
        return items

    def _get_filtered_vacancies(
        self,
        *,
        role_ids: list[str] | None,
        period: str,
        experience: list[str] | None = None,
        status: str = "all",
        country: str = "all",
        currency: list[str] | None = None,
        employer: list[str] | None = None,
        employer_exclude: list[str] | None = None,
        interview: list[str] | None = None,
        result: list[str] | None = None,
        offer: list[str] | None = None,
        skills_include: list[str] | None = None,
        skills_exclude: list[str] | None = None,
        skills_logic: str = "or",
        accreditation: str = "all",
        cover_letter_required: str = "all",
        has_test: str = "all",
    ) -> list[dict]:
        role_id_set = {str(role_id) for role_id in (role_ids or []) if str(role_id).strip()}
        experience_set = {str(item).strip() for item in (experience or []) if str(item).strip()}
        currency_set = {self._normalize_totals_currency(item) for item in (currency or []) if str(item).strip()}
        employer_set = {str(item).strip().casefold() for item in (employer or []) if str(item).strip()}
        employer_exclude_set = {str(item).strip().casefold() for item in (employer_exclude or []) if str(item).strip()}
        normalized_status = str(status or "all").strip().lower()
        normalized_country = str(country or "all").strip().lower()
        normalized_interview = self._normalize_response_state_filter(interview)
        normalized_result = self._normalize_response_state_filter(result)
        normalized_offer = self._normalize_response_state_filter(offer)
        normalized_skill_logic = str(skills_logic or "or").strip().lower()
        include_skill_set = {self._normalize_skill_name(value) for value in (skills_include or []) if self._normalize_skill_name(value)}
        exclude_skill_set = {self._normalize_skill_name(value) for value in (skills_exclude or []) if self._normalize_skill_name(value)}
        normalized_accreditation = self._normalize_boolean_filter(accreditation)
        normalized_cover_letter_required = self._normalize_boolean_filter(cover_letter_required)
        normalized_has_test = self._normalize_boolean_filter(has_test)
        response_state_map = self._build_response_state_map(role_ids=role_ids) if any(
            value is not None for value in (normalized_interview, normalized_result, normalized_offer)
        ) else {}
        vacancies = self.vacancies_repository.list_vacancies(include_details=False)
        filtered = []
        latest_dt = None
        parsed_rows = []
        for vacancy in vacancies:
            role_id = str(vacancy.get("role_id") or "").strip()
            if role_id_set and role_id not in role_id_set:
                continue
            if experience_set and str(vacancy.get("experience") or "").strip() not in experience_set:
                continue
            vacancy_status = "archived" if vacancy.get("archived") else "open"
            if normalized_status in {"open", "archived"} and vacancy_status != normalized_status:
                continue
            vacancy_country = str(vacancy.get("country") or "").strip()
            if normalized_country == "ru" and vacancy_country != "Россия":
                continue
            if normalized_country == "not_ru" and vacancy_country == "Россия":
                continue
            vacancy_currency = self._normalize_totals_currency(vacancy.get("currency"))
            if currency_set and vacancy_currency not in currency_set:
                continue
            employer_name = str(vacancy.get("employer_name") or "").strip().casefold()
            if employer_set and employer_name not in employer_set:
                continue
            if employer_exclude_set and employer_name in employer_exclude_set:
                continue
            if response_state_map:
                response_state = response_state_map.get(str(vacancy.get("id") or "").strip(), {})
                if normalized_interview is not None and bool(response_state.get("interview")) is not normalized_interview:
                    continue
                if normalized_result is not None and bool(response_state.get("result")) is not normalized_result:
                    continue
                if normalized_offer is not None and bool(response_state.get("offer")) is not normalized_offer:
                    continue
            vacancy_skill_set = {
                self._normalize_skill_name(value)
                for value in str(vacancy.get("skills_raw") or "").split(",")
                if self._normalize_skill_name(value)
            }
            if exclude_skill_set and any(skill in vacancy_skill_set for skill in exclude_skill_set):
                continue
            if include_skill_set:
                if normalized_skill_logic == "and":
                    if not include_skill_set.issubset(vacancy_skill_set):
                        continue
                elif include_skill_set.isdisjoint(vacancy_skill_set):
                    continue
            if normalized_accreditation is not None and bool(vacancy.get("employer_accredited")) is not normalized_accreditation:
                continue
            if normalized_cover_letter_required is not None and bool(vacancy.get("cover_letter_required")) is not normalized_cover_letter_required:
                continue
            if normalized_has_test is not None and bool(vacancy.get("has_test")) is not normalized_has_test:
                continue
            published_dt = self._parse_dt(vacancy.get("published_at"))
            archived_dt = self._parse_dt(vacancy.get("archived_at"))
            parsed_rows.append((vacancy, published_dt, archived_dt))
            if published_dt is not None and (latest_dt is None or published_dt > latest_dt):
                latest_dt = published_dt

        for vacancy, published_dt, archived_dt in parsed_rows:
            if self._matches_period(period, published_dt, latest_dt):
                prepared = dict(vacancy)
                prepared["_published_dt"] = published_dt
                prepared["_archived_dt"] = archived_dt
                filtered.append(prepared)
        return filtered

    def _matches_period(self, period: str, published_dt: datetime | None, latest_dt: datetime | None) -> bool:
        current = str(period or "summary").strip().lower()
        if current in {"summary", "all"}:
            return True
        if published_dt is None:
            return False
        if current == "today":
            return latest_dt is not None and published_dt.date() == latest_dt.date()
        if current == "last_3":
            return latest_dt is not None and published_dt >= latest_dt - timedelta(days=3)
        if current == "last_7":
            return latest_dt is not None and published_dt >= latest_dt - timedelta(days=7)
        if current == "last_14":
            return latest_dt is not None and published_dt >= latest_dt - timedelta(days=14)
        return published_dt.strftime("%Y-%m") == current

    def _compute_age_days(self, published_at: str | None, archived_at: str | None) -> float | None:
        published_dt = self._parse_dt(published_at)
        archived_dt = self._parse_dt(archived_at)
        if published_dt is None or archived_dt is None:
            return None
        diff = archived_dt - published_dt
        if diff.total_seconds() < 0:
            return None
        return diff.total_seconds() / 86400.0

    def _safe_ratio(self, left: int, right: int) -> float:
        if not right:
            return 0.0
        return float(left) / float(right)

    def _compute_dashboard_salary_rows(self, vacancies: list[dict]) -> list[dict]:
        buckets = {code: {"currency": code, "total": 0, "withSalary": 0, "values": []} for code in ("RUR", "USD", "EUR")}
        for vacancy in vacancies:
            curr = self._normalize_totals_currency(vacancy.get("currency"))
            if curr not in buckets:
                continue
            buckets[curr]["total"] += 1
            salary = self._compute_salary_value(vacancy)
            if salary is not None:
                buckets[curr]["withSalary"] += 1
                buckets[curr]["values"].append(float(salary))
        rows = []
        for curr in ("RUR", "USD", "EUR"):
            values = list(buckets[curr]["values"])
            rows.append({
                "currency": curr,
                "total": buckets[curr]["total"],
                "withSalary": buckets[curr]["withSalary"],
                "coverage": (buckets[curr]["withSalary"] * 100.0 / buckets[curr]["total"]) if buckets[curr]["total"] else 0.0,
                "avg": (sum(values) / len(values)) if values else None,
                "median": self._compute_median(values),
                "mode": self._compute_mode(values),
                "min": min(values) if values else None,
                "max": max(values) if values else None,
            })
        return rows

    def _compute_dashboard_salary_coverage(self, vacancies: list[dict]) -> dict:
        stats = {
            "total": len(vacancies),
            "withSalary": 0,
            "withoutSalary": 0,
            "withSalaryShare": 0.0,
            "withoutSalaryShare": 0.0,
            "currencies": {key: {"count": 0, "share": 0.0} for key in ("RUR", "USD", "EUR", "other")},
        }
        for vacancy in vacancies:
            curr = self._normalize_totals_currency(vacancy.get("currency"))
            salary = self._compute_salary_value(vacancy)
            if salary is None:
                stats["withoutSalary"] += 1
                continue
            stats["withSalary"] += 1
            key = curr if curr in {"RUR", "USD", "EUR"} else "other"
            stats["currencies"][key]["count"] += 1
        if stats["total"]:
            stats["withSalaryShare"] = round((stats["withSalary"] * 10000.0) / stats["total"]) / 100.0
            stats["withoutSalaryShare"] = round((stats["withoutSalary"] * 10000.0) / stats["total"]) / 100.0
        if stats["withSalary"]:
            for key in stats["currencies"]:
                stats["currencies"][key]["share"] = round((stats["currencies"][key]["count"] * 10000.0) / stats["withSalary"]) / 100.0
        return stats

    def _compute_dashboard_compensation_availability(self, vacancies: list[dict]) -> dict:
        def has_salary(vacancy: dict) -> bool:
            return vacancy.get("salary_from") is not None or vacancy.get("salary_to") is not None

        def is_remote(vacancy: dict) -> bool:
            return str(vacancy.get("work_format") or "").strip().upper() == "REMOTE"

        def normalize_currency(vacancy: dict) -> str:
            current = str(vacancy.get("currency") or "").strip().upper()
            if current in {"RUR", "USD", "EUR"}:
                return current
            return "OTHER"

        def summarize(items: list[dict]) -> dict:
            total = len(items)
            with_salary_items = [item for item in items if has_salary(item)]
            with_salary = len(with_salary_items)
            without_salary = total - with_salary
            currencies = {
                "RUR": {"count": 0, "share": 0.0},
                "USD": {"count": 0, "share": 0.0},
                "EUR": {"count": 0, "share": 0.0},
                "OTHER": {"count": 0, "share": 0.0},
            }
            for item in with_salary_items:
                currencies[normalize_currency(item)]["count"] += 1
            if with_salary:
                for currency_key in currencies:
                    currencies[currency_key]["share"] = round((currencies[currency_key]["count"] * 10000.0) / with_salary) / 100.0
            return {
                "total": total,
                "with_salary": with_salary,
                "without_salary": without_salary,
                "coverage_percent": round((with_salary * 10000.0) / total) / 100.0 if total else 0.0,
                "with_salary_currencies": currencies,
            }

        remote_items = [vacancy for vacancy in vacancies if is_remote(vacancy)]
        non_remote_items = [vacancy for vacancy in vacancies if not is_remote(vacancy)]
        summary = summarize(vacancies)
        summary.pop("with_salary_currencies", None)
        summary["remote"] = summarize(remote_items)
        summary["non_remote"] = summarize(non_remote_items)
        return summary

    def _compute_dashboard_period_stats(self, vacancies: list[dict]) -> dict:
        total = len(vacancies)
        active = 0
        archived = 0
        age_values = []
        for vacancy in vacancies:
            if vacancy.get("archived") or vacancy.get("archived_at"):
                archived += 1
            else:
                active += 1
            age = self._compute_age_days(vacancy.get("_published_dt") or vacancy.get("published_at"), vacancy.get("_archived_dt") or vacancy.get("archived_at"))
            if age is not None:
                age_values.append(float(age))
        return {"total": total, "active": active, "archived": archived, "avgLifetimeDays": round(sum(age_values) / len(age_values), 1) if age_values else None}

    def _compute_dashboard_burnup_series(self, vacancies: list[dict]) -> dict:
        rows = list(vacancies or [])
        if not rows:
            return {"labels": [], "newPublished": [], "archived": [], "publishedAndArchived": [], "active": []}
        latest = max((vacancy.get("_published_dt") or self._parse_dt(vacancy.get("published_at")) for vacancy in rows if (vacancy.get("_published_dt") or self._parse_dt(vacancy.get("published_at"))) is not None), default=None)
        if latest is None:
            return {"labels": [], "newPublished": [], "archived": [], "publishedAndArchived": [], "active": []}
        labels, new_published, archived_vals, both_vals, active_vals = [], [], [], [], []
        start = latest - timedelta(days=13)
        for idx in range(14):
            day_start = datetime(start.year, start.month, start.day, tzinfo=start.tzinfo) + timedelta(days=idx)
            day_end = day_start + timedelta(days=1)
            total_new = total_archived = total_both = total_active = 0
            for vacancy in rows:
                published = vacancy.get("_published_dt") or self._parse_dt(vacancy.get("published_at"))
                archived_dt = vacancy.get("_archived_dt") or self._parse_dt(vacancy.get("archived_at"))
                is_archived = bool(vacancy.get("archived") or archived_dt)
                new_flag = published is not None and day_start <= published < day_end
                arch_flag = archived_dt is not None and day_start <= archived_dt < day_end
                active_flag = published is not None and published < day_end and (not is_archived or archived_dt is None or archived_dt >= day_end)
                if new_flag:
                    total_new += 1
                if arch_flag:
                    total_archived += 1
                if new_flag and arch_flag:
                    total_both += 1
                if active_flag:
                    total_active += 1
            labels.append(day_start.strftime("%d.%m"))
            new_published.append(total_new)
            archived_vals.append(total_archived)
            both_vals.append(total_both)
            active_vals.append(total_active)
        return {"labels": labels, "newPublished": new_published, "archived": archived_vals, "publishedAndArchived": both_vals, "active": active_vals}

    def _compute_dashboard_skills_rows(self, vacancies: list[dict], currency: str, order: str = "most", limit: int = 50) -> list[dict]:
        rows = {}
        for vacancy in vacancies:
            if self._normalize_totals_currency(vacancy.get("currency")) != currency:
                continue
            skills_raw = str(vacancy.get("skills_raw") or "").strip()
            if not skills_raw:
                continue
            salary = self._compute_salary_value(vacancy)
            for raw_skill in skills_raw.split(","):
                skill = str(raw_skill or "").strip()
                if not skill:
                    continue
                bucket = rows.setdefault(skill.casefold(), {"skill": skill, "mentions": 0, "values": []})
                bucket["mentions"] += 1
                if salary is not None:
                    bucket["values"].append(float(salary))
        result = []
        for row in rows.values():
            values = row["values"]
            result.append({"skill": row["skill"], "mentions": row["mentions"], "avg": (sum(values) / len(values)) if values else None, "median": self._compute_median(values), "mode": self._compute_mode(values), "min": min(values) if values else None, "max": max(values) if values else None})
        if order == "least":
            result.sort(key=lambda item: (item["mentions"], item["skill"].lower()))
        else:
            result.sort(key=lambda item: (-item["mentions"], item["skill"].lower()))
        return result[:limit]

    def _compute_dashboard_company_rows(self, vacancies: list[dict], currency: str, order: str = "high", limit: int = 50) -> list[dict]:
        rows = {}
        for vacancy in vacancies:
            employer = str(vacancy.get("employer_name") or "").strip()
            if not employer or self._normalize_totals_currency(vacancy.get("currency")) != currency:
                continue
            bucket = rows.setdefault(employer, {"employer": employer, "total": 0, "values": [], "accredited": "", "rating": "", "trusted": "", "url": ""})
            bucket["total"] += 1
            if not bucket["accredited"] and vacancy.get("employer_accredited") is not None:
                bucket["accredited"] = str(vacancy.get("employer_accredited"))
            if not bucket["rating"] and vacancy.get("employer_rating") is not None:
                bucket["rating"] = str(vacancy.get("employer_rating"))
            if not bucket["trusted"] and vacancy.get("employer_trusted") is not None:
                bucket["trusted"] = str(vacancy.get("employer_trusted"))
            if not bucket["url"] and vacancy.get("employer_url"):
                bucket["url"] = str(vacancy.get("employer_url"))
            salary = self._compute_salary_value(vacancy)
            if salary is not None:
                bucket["values"].append(float(salary))
        result = []
        for row in rows.values():
            values = row["values"]
            if not values:
                continue
            result.append({"employer": row["employer"], "total": row["total"], "accredited": row["accredited"], "rating": row["rating"], "trusted": row["trusted"], "url": row["url"], "avg": sum(values) / len(values), "median": self._compute_median(values), "mode": self._compute_mode(values), "min": min(values), "max": max(values)})
        if order == "low":
            result.sort(key=lambda item: (float(item["avg"] or 0), -int(item["total"] or 0), item["employer"].lower()))
        else:
            result.sort(key=lambda item: (-float(item["avg"] or 0), -int(item["total"] or 0), item["employer"].lower()))
        return result[:limit]

    def _compute_dashboard_closing_rows(self, vacancies: list[dict], window_key: str, limit: int = 50) -> list[dict]:
        rows = {}
        for vacancy in vacancies:
            employer = str(vacancy.get("employer_name") or "").strip()
            if not employer:
                continue
            age = self._compute_dashboard_vacancy_age(vacancy)
            if age is None or not self._match_dashboard_closing_window(age, window_key):
                continue
            bucket = rows.setdefault(employer, {"employer": employer, "total": 0, "values": [], "accredited": "", "rating": "", "trusted": "", "url": ""})
            bucket["total"] += 1
            bucket["values"].append(float(age))
            if not bucket["accredited"] and vacancy.get("employer_accredited") is not None:
                bucket["accredited"] = str(vacancy.get("employer_accredited"))
            if not bucket["rating"] and vacancy.get("employer_rating") is not None:
                bucket["rating"] = str(vacancy.get("employer_rating"))
            if not bucket["trusted"] and vacancy.get("employer_trusted") is not None:
                bucket["trusted"] = str(vacancy.get("employer_trusted"))
            if not bucket["url"] and vacancy.get("employer_url"):
                bucket["url"] = str(vacancy.get("employer_url"))
        result = []
        for row in rows.values():
            values = row["values"]
            result.append({"employer": row["employer"], "total": row["total"], "accredited": row["accredited"], "rating": row["rating"], "trusted": row["trusted"], "url": row["url"], "avg": sum(values) / len(values), "median": self._compute_median(values), "mode": self._compute_mode(values), "min": min(values), "max": max(values)})
        result.sort(key=lambda item: (-int(item["total"] or 0), float(item["avg"] or 0), item["employer"].lower()))
        return result[:limit]

    def _compute_dashboard_top_vacancies(self, vacancies: list[dict], currency: str, order: str = "high", limit: int = 15) -> list[dict]:
        result = []
        for vacancy in vacancies:
            if bool(vacancy.get("archived") or vacancy.get("archived_at")) or self._normalize_totals_currency(vacancy.get("currency")) != currency:
                continue
            salary = self._compute_salary_value(vacancy)
            if salary is None:
                continue
            result.append({"id": str(vacancy.get("id") or ""), "name": str(vacancy.get("name") or "").strip(), "employer": str(vacancy.get("employer_name") or "").strip(), "employerAccredited": str(vacancy.get("employer_accredited") or "").strip(), "employerRating": str(vacancy.get("employer_rating") or "").strip(), "employerTrusted": str(vacancy.get("employer_trusted") or "").strip(), "employerUrl": str(vacancy.get("employer_url") or "").strip(), "salary": float(salary), "currency": currency, "responded": bool(vacancy.get("send_resume"))})
        if order == "low":
            result.sort(key=lambda item: (float(item["salary"]), -int("".join(ch for ch in item["id"] if ch.isdigit()) or "0")))
        else:
            result.sort(key=lambda item: (-float(item["salary"]), -int("".join(ch for ch in item["id"] if ch.isdigit()) or "0")))
        return result[:limit]

    def _build_dashboard_salary_month_data(self, vacancies: list[dict], label: str) -> dict:
        grouped = defaultdict(lambda: defaultdict(lambda: {"with": [], "without": []}))
        for vacancy in vacancies:
            experience = str(vacancy.get("experience") or "").strip() or "Не указан"
            status = "Архивная" if vacancy.get("archived") or vacancy.get("archived_at") else "Открытая"
            currency = self._normalize_salary_bucket(vacancy.get("currency"))
            has_salary = vacancy.get("salary_from") is not None or vacancy.get("salary_to") is not None
            bucket = grouped[experience][(status, currency)]
            if has_salary:
                bucket["with"].append(vacancy)
            else:
                bucket["without"].append(vacancy)
        experiences = []
        for experience, currency_buckets in sorted(grouped.items(), key=lambda item: item[0]):
            entries = []
            for (status, currency), bucket in currency_buckets.items():
                values = [float(value) for value in (self._compute_salary_value(vacancy) for vacancy in bucket["with"]) if value is not None]
                total = len(bucket["with"]) + len(bucket["without"])
                entries.append({"status": status, "currency": currency, "total_vacancies": total, "vacancies_with_salary": len(bucket["with"]), "vacancies_without_salary": len(bucket["without"]), "coverage": (len(bucket["with"]) * 100.0 / total) if total else 0.0, "avg_salary": (sum(values) / len(values)) if values else None, "median_salary": self._compute_median(values), "mode_salary": self._compute_mode(values), "min_salary": min(values) if values else None, "max_salary": max(values) if values else None})
            experiences.append({"experience": experience, "entries": entries})
        return {"month": label, "experiences": experiences}

    def _build_dashboard_employer_overview(self, vacancies: list[dict], currency: str, metric: str) -> dict:
        filtered = [vacancy for vacancy in vacancies if self._normalize_totals_currency(vacancy.get("currency")) == currency and self._compute_salary_value(vacancy) is not None]
        categories = [
            ("ИТ-аккредитация: Нет", lambda vacancy: not bool(vacancy.get("employer_accredited"))),
            ("ИТ-аккредитация: Да", lambda vacancy: bool(vacancy.get("employer_accredited"))),
            ("Тестовое задание: Нет", lambda vacancy: not bool(vacancy.get("has_test"))),
            ("Тестовое задание: Да", lambda vacancy: bool(vacancy.get("has_test"))),
            ("Сопроводительное письмо: Нет", lambda vacancy: not bool(vacancy.get("cover_letter_required"))),
            ("Сопроводительное письмо: Да", lambda vacancy: bool(vacancy.get("cover_letter_required"))),
        ]
        labels, values = [], []
        for label, matcher in categories:
            selected = [float(self._compute_salary_value(vacancy)) for vacancy in filtered if matcher(vacancy)]
            labels.append(label)
            values.append(self._compute_metric_value(selected, metric))
        return {"currency": currency, "metric": metric, "labels": labels, "values": values}

    def _build_dashboard_market_trends(
        self,
        *,
        role_ids: list[str] | None,
        period: str,
        currency: str,
        metric: str,
        experience: list[str] | None = None,
        status: str = "all",
        excluded_role_ids: list[str] | None = None,
    ) -> dict:
        all_vacancies = self._get_filtered_vacancies(role_ids=None, period="summary", experience=experience, status=status)
        period_vacancies = self._get_filtered_vacancies(role_ids=None, period=period, experience=experience, status=status)
        excluded = {str(role_id or "").strip() for role_id in (excluded_role_ids or []) if str(role_id or "").strip()}
        if excluded:
            all_vacancies = [
                vacancy for vacancy in all_vacancies
                if str(vacancy.get("role_id") or "").strip() not in excluded
            ]
            period_vacancies = [
                vacancy for vacancy in period_vacancies
                if str(vacancy.get("role_id") or "").strip() not in excluded
            ]
        if not period_vacancies:
            return {
                "currency": currency,
                "salary_metric": metric,
                "recent_days": 7,
                "baseline_days": 7,
                "recent_start_label": "",
                "recent_end_label": "",
                "prev_start_label": "",
                "prev_end_label": "",
                "has_salary_for_currency": False,
                "metrics": [],
                "focus_metrics": None,
            }
        anchor_dt = max((vacancy.get("_published_dt") for vacancy in period_vacancies if vacancy.get("_published_dt") is not None), default=None)
        if anchor_dt is None:
            return {
                "currency": currency,
                "salary_metric": metric,
                "recent_days": 7,
                "baseline_days": 7,
                "recent_start_label": "",
                "recent_end_label": "",
                "prev_start_label": "",
                "prev_end_label": "",
                "has_salary_for_currency": False,
                "metrics": [],
                "focus_metrics": None,
            }
        recent_days = self._resolve_market_trends_window_days(period, period_vacancies)
        baseline_days = recent_days
        day_span = timedelta(days=1)
        recent_start = anchor_dt - timedelta(days=max(recent_days - 1, 0))
        prev_end = recent_start - day_span
        prev_start = prev_end - timedelta(days=max(baseline_days - 1, 0))
        role_names = self._build_role_name_map()
        metrics = self._compute_market_trends_metrics(
            vacancies=all_vacancies,
            role_name_map=role_names,
            currency=currency,
            recent_start=recent_start,
            recent_end=anchor_dt,
            prev_start=prev_start,
            prev_end=prev_end,
            split_by_experience=True,
        )
        focus_role_id = str((role_ids or [""])[0] or "").strip()
        focus_metrics = self._compute_market_trends_metrics(
            vacancies=all_vacancies,
            role_name_map=role_names,
            currency=currency,
            recent_start=recent_start,
            recent_end=anchor_dt,
            prev_start=prev_start,
            prev_end=prev_end,
            split_by_experience=False,
            role_ids=[focus_role_id] if focus_role_id else None,
        )
        has_salary = any(
            any(item.get(stat_key) is not None for stat_key in ("min", "max", "avg", "median", "mode"))
            for row in metrics
            for item in (row.get("recentSalary") or {}, row.get("prevSalary") or {})
        )
        return {
            "currency": currency,
            "salary_metric": metric,
            "recent_days": recent_days,
            "baseline_days": baseline_days,
            "recent_start_label": self._format_market_trends_date(recent_start),
            "recent_end_label": self._format_market_trends_date(anchor_dt),
            "prev_start_label": self._format_market_trends_date(prev_start),
            "prev_end_label": self._format_market_trends_date(prev_end),
            "has_salary_for_currency": has_salary,
            "metrics": metrics,
            "focus_metrics": focus_metrics[0] if focus_metrics else None,
        }

    def _resolve_market_trends_window_days(self, period: str, vacancies: list[dict]) -> int:
        current = str(period or "").strip().lower()
        if current.startswith("last_"):
            try:
                value = int(current.split("_", 1)[1])
            except (TypeError, ValueError):
                value = 7
            return max(value, 7)
        if current == "today":
            return 7
        if len(current) == 7 and current[4:5] == "-":
            try:
                year = int(current[:4])
                month = int(current[5:7])
                month_start = datetime(year, month, 1)
                if month == 12:
                    next_month = datetime(year + 1, 1, 1)
                else:
                    next_month = datetime(year, month + 1, 1)
                return max((next_month - month_start).days, 1)
            except (TypeError, ValueError):
                return 7
        published = [vacancy.get("_published_dt") for vacancy in (vacancies or []) if vacancy.get("_published_dt") is not None]
        if not published:
            return 7
        return max((max(published) - min(published)).days + 1, 1)

    def _build_role_name_map(self) -> dict[str, str]:
        rows = self.repository.get_activity()
        result = {}
        for row in rows:
            role_id = str(row.get("id") or "").strip()
            role_name = str(row.get("name") or role_id or "").strip()
            if role_id and role_name:
                result[role_id] = role_name
        return result

    def _build_dashboard_response_funnel(self, *, role_ids: list[str] | None) -> dict:
        payload = self.responses_service.list_responses(
            role_ids=role_ids,
            status="all",
            currency="all",
            offer="all",
            page=1,
            per_page=1000,
        )
        items = payload.get("items") or []
        interview = 0
        result = 0
        offer = 0
        for item in items:
            interview_date = str(item.get("interview_date") or "").strip()
            result_value = str(item.get("result") or "").strip()
            offer_value = str(item.get("offer_salary") or "").strip()
            if interview_date:
                interview += 1
            if result_value:
                result += 1
            if offer_value:
                offer += 1
        return {
            "responses": len(items),
            "interview": interview,
            "result": result,
            "offer": offer,
        }

    def _compute_market_trends_metrics(
        self,
        *,
        vacancies: list[dict],
        role_name_map: dict[str, str],
        currency: str,
        recent_start: datetime,
        recent_end: datetime,
        prev_start: datetime,
        prev_end: datetime,
        split_by_experience: bool,
        role_ids: list[str] | None = None,
    ) -> list[dict]:
        allowed_roles = {str(role_id) for role_id in (role_ids or []) if str(role_id).strip()}
        grouped = defaultdict(list)
        for vacancy in vacancies:
            role_id = str(vacancy.get("role_id") or "").strip()
            if not role_id:
                continue
            if allowed_roles and role_id not in allowed_roles:
                continue
            experience = str(vacancy.get("experience") or "").strip() or "Не указан"
            key = (role_id, experience) if split_by_experience else (role_id, "")
            grouped[key].append(vacancy)
        result = []
        for (role_id, experience), items in grouped.items():
            recent = []
            prev = []
            for vacancy in items:
                published_dt = vacancy.get("_published_dt") or self._parse_dt(vacancy.get("published_at"))
                if published_dt is None:
                    continue
                if recent_start <= published_dt <= recent_end:
                    recent.append(vacancy)
                elif prev_start <= published_dt <= prev_end:
                    prev.append(vacancy)
            recent_salary = self._compute_market_trends_salary_stats(recent, currency)
            prev_salary = self._compute_market_trends_salary_stats(prev, currency)
            has_salary = any(recent_salary.get(key) is not None for key in ("min", "max", "avg", "median", "mode")) or any(
                prev_salary.get(key) is not None for key in ("min", "max", "avg", "median", "mode")
            )
            if not recent and not prev and not has_salary:
                continue
            demand_delta = len(recent) - len(prev)
            demand_pct = (demand_delta * 100.0 / len(prev)) if prev else (100.0 if recent else 0.0)
            result.append(
                {
                    "id": role_id,
                    "name": role_name_map.get(role_id, role_id),
                    "roleAxisId": role_id,
                    "experience": experience if split_by_experience else None,
                    "recentCount": len(recent),
                    "prevCount": len(prev),
                    "demandDelta": demand_delta,
                    "demandPct": demand_pct,
                    "recentSalary": recent_salary,
                    "prevSalary": prev_salary,
                }
            )
        result.sort(key=lambda item: (item["name"].lower(), str(item.get("experience") or "").lower(), item["id"]))
        return result

    def _compute_market_trends_salary_stats(self, vacancies: list[dict], currency: str) -> dict:
        values = []
        for vacancy in vacancies:
            if self._normalize_totals_currency(vacancy.get("currency")) != currency:
                continue
            salary = self._compute_salary_value(vacancy)
            if salary is not None:
                values.append(float(salary))
        if not values:
            return {"min": None, "max": None, "avg": None, "median": None, "mode": None}
        return {
            "min": min(values),
            "max": max(values),
            "avg": sum(values) / len(values),
            "median": self._compute_median(values),
            "mode": self._compute_mode(values),
        }

    def _format_market_trends_date(self, value: datetime | None) -> str:
        if value is None:
            return ""
        return value.strftime("%d.%m.%Y")

    def _normalize_totals_currency(self, value: str | None) -> str:
        current = str(value or "").strip().upper()
        if current == "RUB":
            return "RUR"
        if current == "EURO":
            return "EUR"
        if current in {"RUR", "USD", "EUR"}:
            return current
        return "OTHER"

    def _normalize_boolean_filter(self, value: str | None) -> bool | None:
        current = str(value or "").strip().lower()
        if current in {"true", "1", "yes"}:
            return True
        if current in {"false", "0", "no"}:
            return False
        return None

    def _normalize_response_state_filter(self, values: list[str] | None) -> bool | None:
        normalized = {
            str(value or "").strip().lower()
            for value in (values or [])
            if str(value or "").strip()
        }
        if normalized == {"yes"}:
            return True
        if normalized == {"no"}:
            return False
        return None

    def _normalize_skill_name(self, value: str | None) -> str:
        return str(value or "").strip().casefold()

    def _build_response_state_map(self, *, role_ids: list[str] | None) -> dict[str, dict]:
        payload = self.responses_service.list_responses(
            role_ids=role_ids,
            status="all",
            currency="all",
            offer="all",
            page=1,
            per_page=1000,
        )
        result: dict[str, dict] = {}
        for item in payload.get("items") or []:
            vacancy_id = str(item.get("vacancy_id") or item.get("id") or "").strip()
            if not vacancy_id:
                continue
            bucket = result.get(vacancy_id)
            if bucket is None:
                bucket = {"interview": False, "result": False, "offer": False}
                result[vacancy_id] = bucket
            if str(item.get("interview_date") or "").strip():
                bucket["interview"] = True
            if str(item.get("result") or "").strip():
                bucket["result"] = True
            if str(item.get("offer_salary") or "").strip():
                bucket["offer"] = True
        return result

    def _normalize_salary_bucket(self, value: str | None) -> str:
        current = self._normalize_totals_currency(value)
        if current == "OTHER":
            return "Другая"
        if current:
            return current
        return "Не заполнена"

    def _compute_salary_value(self, vacancy: dict) -> float | None:
        values = [float(value) for value in (vacancy.get("salary_from"), vacancy.get("salary_to")) if value is not None]
        if not values:
            return None
        if len(values) == 2:
            return sum(values) / 2.0
        return values[0]

    def _compute_median(self, values: list[float]) -> float | None:
        if not values:
            return None
        ordered = sorted(float(value) for value in values)
        middle = len(ordered) // 2
        if len(ordered) % 2:
            return ordered[middle]
        return (ordered[middle - 1] + ordered[middle]) / 2.0

    def _compute_mode(self, values: list[float]) -> float | None:
        if not values:
            return None
        counts = defaultdict(int)
        for value in values:
            counts[float(value)] += 1
        best_value = min(counts.keys())
        best_count = counts[best_value]
        for value, count in counts.items():
            if count > best_count or (count == best_count and value < best_value):
                best_value = value
                best_count = count
        return best_value

    def _compute_metric_value(self, values: list[float], metric: str) -> float | None:
        if not values:
            return None
        current = str(metric or "avg").strip().lower()
        if current == "min":
            return min(values)
        if current == "max":
            return max(values)
        if current == "median":
            return self._compute_median(values)
        if current == "mode":
            return self._compute_mode(values)
        return sum(values) / len(values)

    def _compute_dashboard_vacancy_age(self, vacancy: dict) -> float | None:
        published = vacancy.get("_published_dt") or self._parse_dt(vacancy.get("published_at"))
        archived = vacancy.get("_archived_dt") or self._parse_dt(vacancy.get("archived_at"))
        if published is None:
            return None
        if archived is None:
            if vacancy.get("archived"):
                archived = datetime.now(published.tzinfo)
            else:
                return None
        diff = archived - published
        if diff.total_seconds() < 0:
            return None
        return diff.total_seconds() / 86400.0

    def _match_dashboard_closing_window(self, age_days: float, window_key: str) -> bool:
        if window_key == "lte_14":
            return age_days <= 14
        if window_key == "lte_30":
            return age_days <= 30
        if window_key == "gt_30":
            return age_days > 30
        if window_key == "gt_60":
            return age_days > 60
        return age_days <= 7

    def _parse_dt(self, value: str | datetime | None) -> datetime | None:
        if isinstance(value, datetime):
            return value
        text = str(value or "").strip()
        if not text:
            return None
        normalized = text.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None
