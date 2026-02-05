import os
import requests
from typing import List, Dict
from dotenv import load_dotenv
import logging
from requests.exceptions import RequestException
import time
from datetime import datetime
from bs4 import BeautifulSoup
import re

load_dotenv()
logger = logging.getLogger(__name__)

HH_API_URL = os.getenv("HH_API_URL")

def clean_html(html: str) -> str:
    if not html:
        return ""

    soup = BeautifulSoup(html, "html.parser")

    # Получаем чистый текст
    text = soup.get_text(separator=" ")

    # Убираем лишние пробелы и переносы
    text = re.sub(r"\s+", " ", text).strip()

    return text


def get_vacancy_id(
    vacancy_id: str,
    timeout: int = 10,
    max_retries: int = 3,
    backoff: float = 1.0
) -> dict:
    """
    Получает ТОЛЬКО те поля, которые реально есть в /get_vacancies/{id}
    """
    url = f"{HH_API_URL}/{vacancy_id}"

    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(url, timeout=timeout)

            if resp.status_code == 404:
                return {
                    "skills": "",
                    "description": "",
                    "experience": None,
                }

            if resp.status_code in (403, 429):
                raise RequestException(f"{resp.status_code} Client Error")

            resp.raise_for_status()
            data = resp.json()

            skills = ", ".join(
                s["name"] for s in data.get("key_skills", [])
            )

            description = clean_html(data.get("description"))
            experience = data.get("experience", {}).get("name")

            return {
                "skills": skills,
                "description": description,
                "experience": experience,
            }

        except RequestException as e:
            wait_time = backoff * attempt
            logger.warning(
                f"Ошибка при получении вакансии {vacancy_id} "
                f"(попытка {attempt}/{max_retries}): {e}. "
                f"Жду {wait_time}s"
            )
            time.sleep(wait_time)

    logger.warning(
        f"Вакансия {vacancy_id} недоступна после {max_retries} попыток"
    )

    return {
        "skills": "",
        "description": "",
        "experience": None,
    }

#    professional_roles: str = os.getenv("PROFESSIONAL_ROLES", "34,124"),
def get_vacancies(
        professional_roles: str = os.getenv("PROFESSIONAL_ROLES", "124"),
        host: str = "hh.ru",
        per_page: int = 100,
        period: int = 60,
        order_by: str = "salary_desc",
        work_format: str = "REMOTE",
        timeout: int = 10,
        vacancy_delay: float = 0.2
) -> List[Dict]:
    """
    Собирает вакансии с HH API.
    snippet (requirement / responsibility) берётся из поиска.
    """
    roles = [role.strip() for role in professional_roles.split(",")]
    all_vacancies: List[Dict] = []

    for role in roles:
        page = 0
        total_for_role = 0
        role_name = f"id={role}"

        logger.info(f"🔹 Старт сбора для роли {role}")

        while True:
            params = {
                "host": host,
                "per_page": per_page,
                "page": page,
                "period": period,
                "order_by": order_by,
                "professional_role": role,
                "work_format": work_format,
            }

            try:
                resp = requests.get(HH_API_URL, params=params, timeout=timeout)
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                logger.error(
                    f"Ошибка запроса страницы {page} для роли {role}: {e}"
                )
                break

            items = data.get("items", [])
            total_found = data.get("found", 0)

            if items and page == 0:
                first_item_roles = items[0].get("professional_roles", [])
                if isinstance(first_item_roles, list):
                    role_name = next(
                        (r.get("name") for r in first_item_roles if str(r.get("id")) == role),
                        role_name,
                    )
                logger.info(
                    f"🔹 Начинаем сбор вакансий для роли "
                    f"{role_name} ({role})"
                )

            count = 0

            for item in items:
                try:
                    vacancy_id = item.get("id")

                    # Получаем детали вакансии с задержкой
                    details = get_vacancy_id(vacancy_id, timeout=timeout)

                    # Добавляем задержку между запросами деталей вакансий
                    if vacancy_delay > 0:
                        time.sleep(vacancy_delay)

                    # Безопасное извлечение employer данных
                    employer = item.get("employer", {})
                    if isinstance(employer, dict):
                        employer_name = employer.get("name")
                        employer_id = employer.get("id")
                        employer_url = employer.get("alternate_url")
                        # ИСПРАВЛЕНО: эти поля находятся внутри employer
                        accredited_it_employer = employer.get("accredited_it_employer")
                        trusted = employer.get("trusted")
                        rating = employer.get("employer_rating", {}).get("total_rating")
                    else:
                        employer_name = employer_id = employer_url = accredited_it_employer = trusted = rating = None

                    # Безопасное извлечение salary данных
                    salary = item.get("salary", {})
                    if isinstance(salary, dict):
                        salary_from = salary.get("from")
                        salary_to = salary.get("to")
                        currency = salary.get("currency")
                    else:
                        salary_from = salary_to = currency = None

                    # Безопасное извлечение snippet данных
                    snippet = item.get("snippet", {})
                    if isinstance(snippet, dict):
                        requirement = snippet.get("requirement")
                        responsibility = snippet.get("responsibility")
                    else:
                        requirement = responsibility = None

                    # Безопасное извлечение area данных
                    area = item.get("area", {})
                    if isinstance(area, dict):
                        city = area.get("name")
                    else:
                        city = None

                    # Безопасное извлечение schedule данных
                    schedule = item.get("schedule", {})
                    if isinstance(schedule, dict):
                        schedule_id = schedule.get("id")
                    else:
                        schedule_id = None

                    # Безопасное извлечение work_format данных
                    # ВАЖНО: переименовываем переменную, чтобы не было конфликта с параметром функции
                    work_format_data = item.get("employment", {})  # ИСПРАВЛЕНО: work_format может быть в employment
                    if isinstance(work_format_data, dict):
                        work_format_id = work_format_data.get("id")
                    else:
                        # Пробуем получить из альтернативных источников
                        work_format_data2 = item.get("work_format", {})
                        if isinstance(work_format_data2, dict):
                            work_format_id = work_format_data2.get("id")
                        else:
                            work_format_id = None

                    vacancy_record = {
                        "id": vacancy_id,
                        "url": item.get("url"),
                        "professional_role": role,
                        "name": item.get("name"),
                        "employer": employer_name,
                        "employer_id": employer_id,
                        # ИСПРАВЛЕНО: используем правильные переменные
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
                        'schedule': schedule_id,
                        'work_format': work_format_id,
                        "experience": details.get("experience"),
                        "description": details.get("description", ""),
                        "published_at": item.get("published_at"),
                        "created_at": datetime.utcnow().isoformat(),
                        "archived": item.get("archived"),
                        "archived_at": None,
                        "has_test": item.get("has_test"),
                        "response_letter_required": item.get("response_letter_required"),
                        "apply_alternate_url": item.get("apply_alternate_url")
                    }

                    count += 1

                    # Добавляем отладочную информацию о полях, которые нас интересуют
                    logger.debug(
                        f"Вакансия {count}/{total_found}: "
                        f"employer: {employer_name}, "
                        f"accredited: {accredited_it_employer}, "
                        f"trusted: {trusted}, "
                        f"rating: {rating}"
                    )

                    logger.info(
                        f"{count}/{total_found} "
                        f"{vacancy_record['name']} - "
                        f"{vacancy_record['employer']} - "
                        f"{vacancy_record['city']} - "
                        f"{vacancy_record['experience']} - "
                        f"{vacancy_record['salary_from']}-"
                        f"{vacancy_record['salary_to']} "
                        f"{vacancy_record['currency']}"
                    )

                    all_vacancies.append(vacancy_record)

                except Exception as e:
                    logger.warning(
                        f"Ошибка при обработке вакансии "
                        f"{item.get('id')}: {e}"
                    )

            total_for_role += len(items)
            total_pages = data.get("pages", 0)
            page += 1

            if page >= total_pages:
                break

            # Задержка между страницами пагинации
            time.sleep(0.3)

        logger.info(
            f"✅ Собрано вакансий для '{role_name}' ({role}): "
            f"{total_for_role}"
        )

    logger.info(f"Общее количество вакансий: {len(all_vacancies)}")
    return all_vacancies