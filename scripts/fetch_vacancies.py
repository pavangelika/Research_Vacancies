import logging
import os
import re
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from requests.exceptions import RequestException

from scripts.db import get_existing_vacancy_details_map

load_dotenv()
logger = logging.getLogger(__name__)

HH_API_URL = os.getenv("HH_API_URL")


@dataclass
class VacancyFetchResult:
    vacancies: List[Dict]
    complete: bool


@dataclass
class RoleBatchSelection:
    selected_roles: List[str]
    next_offset: int
    total_roles: int


def clean_html(html: str) -> str:
    if not html:
        return ""

    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator=" ")
    return re.sub(r"\s+", " ", text).strip()


def _has_required_details(details: dict | None) -> bool:
    if not isinstance(details, dict):
        return False
    return bool(
        str(details.get("skills") or "").strip()
        and str(details.get("description") or "").strip()
        and str(details.get("experience") or "").strip()
    )


def build_role_batch(professional_roles: str, batch_size: int, offset: int) -> RoleBatchSelection:
    roles = [role.strip() for role in professional_roles.split(",") if role.strip()]
    total_roles = len(roles)
    if total_roles == 0:
        return RoleBatchSelection(selected_roles=[], next_offset=0, total_roles=0)

    normalized_batch_size = max(1, min(batch_size, total_roles))
    normalized_offset = offset % total_roles
    selected_roles = [roles[(normalized_offset + index) % total_roles] for index in range(normalized_batch_size)]
    next_offset = (normalized_offset + normalized_batch_size) % total_roles
    return RoleBatchSelection(
        selected_roles=selected_roles,
        next_offset=next_offset,
        total_roles=total_roles,
    )


def get_vacancy_id(
        vacancy_id: str,
        timeout: int = 10,
        max_retries: int = 3,
        backoff: float = 1.0
) -> dict:
    """
    Получает только те поля, которые реально есть в /vacancies/{id}.
    """
    url = f"{HH_API_URL}/{vacancy_id}"

    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(url, timeout=timeout)

            if resp.status_code == 404:
                logger.debug("Вакансия %s не найдена (404)", vacancy_id)
                return {
                    "skills": "",
                    "description": "",
                    "experience": None,
                }

            if resp.status_code in (403, 429):
                raise RequestException(f"{resp.status_code} Client Error")

            resp.raise_for_status()
            data = resp.json()

            skills_list = data.get("key_skills", [])
            skills = ""
            if isinstance(skills_list, list):
                skill_names = []
                for skill in skills_list:
                    if isinstance(skill, dict) and "name" in skill:
                        skill_names.append(skill["name"])
                skills = ", ".join(skill_names)

            description = data.get("description", "")
            if description:
                description = clean_html(description)

            experience_data = data.get("experience", {})
            experience = None
            if isinstance(experience_data, dict):
                experience = experience_data.get("name")

            return {
                "skills": skills,
                "description": description,
                "experience": experience,
            }

        except RequestException as e:
            wait_time = backoff * attempt
            logger.warning(
                "Ошибка при получении вакансии %s (попытка %s/%s): %s. Жду %ss",
                vacancy_id,
                attempt,
                max_retries,
                e,
                wait_time,
            )
            time.sleep(wait_time)
        except Exception as e:
            logger.warning("Неожиданная ошибка при получении вакансии %s: %s", vacancy_id, e)
            return {
                "skills": "",
                "description": "",
                "experience": None,
            }

    logger.warning("Вакансия %s недоступна после %s попыток", vacancy_id, max_retries)
    return {
        "skills": "",
        "description": "",
        "experience": None,
    }


def get_vacancies(
        professional_roles: str = os.getenv(
            "PROFESSIONAL_ROLES",
            "10, 12, 25, 34, 36, 40, 73, 96, 104, 107, 112, 113, 114, 116, 121, 124, "
            "125, 126, 140, 148, 150, 155, 156, 157, 160, 163, 164, 165",
        ),
        host: str = "hh.ru",
        per_page: int = 100,
        period: int = 1,
        order_by: str = "salary_desc",
        timeout: int = 10,
        vacancy_delay: float = 1.2,
        role_search_delay: float = float(os.getenv("ROLE_SEARCH_DELAY_SECONDS", "2")),
        search_failure_streak_limit: int = int(os.getenv("ROLE_SEARCH_FAILURE_STREAK_LIMIT", "3"))
) -> VacancyFetchResult:
    """
    Собирает вакансии с HH API.
    snippet (requirement / responsibility) берётся из поиска.
    """
    roles = [role.strip() for role in professional_roles.split(",") if role.strip()]
    search_items: List[tuple[str, dict]] = []
    seen_vacancy_ids: set[str] = set()
    all_vacancies: List[Dict] = []
    fetch_complete = True
    successful_search_requests = 0
    consecutive_search_failures = 0

    for role_index, role in enumerate(roles):
        page = 0
        total_for_role = 0
        role_name = f"id={role}"

        logger.info("🔹 Старт сбора для роли %s", role)

        while True:
            params = {
                "host": host,
                "per_page": per_page,
                "page": page,
                "period": period,
                "order_by": order_by,
                "professional_role": role,
            }

            try:
                resp = requests.get(HH_API_URL, params=params, timeout=timeout)
                resp.raise_for_status()
                data = resp.json()
                successful_search_requests += 1
                consecutive_search_failures = 0
            except Exception as e:
                fetch_complete = False
                consecutive_search_failures += 1
                logger.error("Ошибка запроса страницы %s для роли %s: %s", page, role, e)
                break

            items = data.get("items", [])
            if items and page == 0:
                first_item_roles = items[0].get("professional_roles", [])
                if isinstance(first_item_roles, list):
                    role_name = next(
                        (r.get("name") for r in first_item_roles if str(r.get("id")) == role),
                        role_name,
                    )
                logger.info("🔹 Начинаем сбор вакансий для роли %s (%s)", role_name, role)

            for item in items:
                vacancy_id = item.get("id")
                if not vacancy_id or vacancy_id in seen_vacancy_ids:
                    continue
                seen_vacancy_ids.add(vacancy_id)
                search_items.append((role, item))

            total_for_role += len(items)
            total_pages = data.get("pages", 0)
            page += 1
            if page >= total_pages:
                break
            time.sleep(0.3)

        logger.info("Собрано вакансий для '%s' (%s): %s", role_name, role, total_for_role)

        if consecutive_search_failures >= max(1, search_failure_streak_limit):
            logger.warning(
                "Прерываем батч после %s подряд ошибок search HH",
                consecutive_search_failures,
            )
            break

        if role_search_delay > 0 and role_index < len(roles) - 1:
            time.sleep(role_search_delay)

    existing_details_map = get_existing_vacancy_details_map(
        [item.get("id") for _, item in search_items if item.get("id")]
    )

    for role, item in search_items:
        vacancy_id = item.get("id")
        try:
            employer_name = employer_id = employer_url = accredited_it_employer = trusted = rating = None
            salary_from = salary_to = currency = None
            requirement = responsibility = None
            city = None
            schedule_id = None

            existing_details = existing_details_map.get(vacancy_id)
            details = existing_details if _has_required_details(existing_details) else get_vacancy_id(vacancy_id, timeout=timeout)
            if not details or not isinstance(details, dict):
                details = {"skills": "", "description": "", "experience": None}
            if vacancy_delay > 0 and details is not existing_details:
                time.sleep(vacancy_delay)

            employer = item.get("employer")
            if employer and isinstance(employer, dict):
                employer_name = employer.get("name")
                employer_id = employer.get("id")
                employer_url = employer.get("alternate_url")
                accredited_it_employer = employer.get("accredited_it_employer")
                trusted = employer.get("trusted")
                employer_rating = employer.get("employer_rating")
                if employer_rating and isinstance(employer_rating, dict):
                    rating = employer_rating.get("total_rating")

            salary = item.get("salary")
            if salary and isinstance(salary, dict):
                salary_from = salary.get("from")
                salary_to = salary.get("to")
                currency = salary.get("currency")

            snippet = item.get("snippet")
            if snippet and isinstance(snippet, dict):
                requirement = snippet.get("requirement")
                responsibility = snippet.get("responsibility")

            area = item.get("area")
            if area and isinstance(area, dict):
                city = area.get("name")

            schedule = item.get("schedule")
            if schedule and isinstance(schedule, dict):
                schedule_id = schedule.get("id")

            vacancy_record = {
                "id": vacancy_id,
                "url": item.get("url", ""),
                "professional_role": role,
                "work_format": item.get("work_format"),
                "name": item.get("name", ""),
                "employer": employer_name,
                "employer_id": employer_id,
                "accredited_it_employer": accredited_it_employer,
                "employer_url": employer_url,
                "rating": rating,
                "trusted": trusted,
                "city": city,
                "salary_from": salary_from,
                "salary_to": salary_to,
                "currency": currency,
                "requirement": requirement,
                "responsibility": responsibility,
                "skills": details.get("skills", ""),
                "schedule": schedule_id,
                "experience": details.get("experience"),
                "description": details.get("description", ""),
                "published_at": item.get("published_at"),
                "created_at": datetime.utcnow().isoformat(),
                "archived": item.get("archived", False),
                "archived_at": None,
                "has_test": item.get("has_test", False),
                "response_letter_required": item.get("response_letter_required", False),
                "apply_alternate_url": item.get("apply_alternate_url", ""),
            }

            logger.info(
                "%s/%s %s - %s - %s - %s - %s-%s %s",
                len(all_vacancies) + 1,
                len(search_items),
                vacancy_record["name"],
                vacancy_record["employer"],
                vacancy_record["city"],
                vacancy_record["experience"],
                vacancy_record["salary_from"],
                vacancy_record["salary_to"],
                vacancy_record["currency"],
            )

            all_vacancies.append(vacancy_record)
        except Exception as e:
            logger.warning("Ошибка при обработке вакансии %s: %s", vacancy_id, e)

    logger.info("Общее количество вакансий: %s", len(all_vacancies))
    return VacancyFetchResult(vacancies=all_vacancies, complete=fetch_complete and successful_search_requests > 0)
