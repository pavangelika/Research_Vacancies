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
                logger.debug(f"Вакансия {vacancy_id} не найдена (404)")
                return {
                    "skills": "",
                    "description": "",
                    "experience": None,
                }

            if resp.status_code in (403, 429):
                raise RequestException(f"{resp.status_code} Client Error")

            resp.raise_for_status()
            data = resp.json()

            # Безопасное извлечение skills
            skills_list = data.get("key_skills", [])
            skills = ""
            if isinstance(skills_list, list):
                skill_names = []
                for skill in skills_list:
                    if isinstance(skill, dict) and "name" in skill:
                        skill_names.append(skill["name"])
                skills = ", ".join(skill_names)

            # Безопасное извлечение description
            description = data.get("description", "")
            if description:
                description = clean_html(description)

            # Безопасное извлечение experience
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
                f"Ошибка при получении вакансии {vacancy_id} "
                f"(попытка {attempt}/{max_retries}): {e}. "
                f"Жду {wait_time}s"
            )
            time.sleep(wait_time)
        except Exception as e:
            logger.warning(
                f"Неожиданная ошибка при получении вакансии {vacancy_id}: {e}"
            )
            # Возвращаем пустой словарь при любых других ошибках
            return {
                "skills": "",
                "description": "",
                "experience": None,
            }

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
        professional_roles: str = os.getenv("PROFESSIONAL_ROLES", "10, 12, 25, 34, 36, 40, 73, "
                                                                  "96, 104, 107, 112, 113, 114, 116, 121, 124, "
                                                                  "125, 126, 140, 148, 150, 155, 156, 157, "
                                                                  "160, 163, 164, 165"),
        host: str = "hh.ru",
        per_page: int = 100,
        period: int = 1,
        order_by: str = "salary_desc",
        timeout: int = 10,
        vacancy_delay: float = 1.2
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

                    # Инициализируем переменные заранее
                    employer_name = employer_id = employer_url = accredited_it_employer = trusted = rating = None
                    salary_from = salary_to = currency = None
                    requirement = responsibility = None
                    city = None
                    schedule_id = None

                    logger.debug(f"Обработка вакансии {vacancy_id}")

                    # Получаем детали вакансии с задержкой
                    details = get_vacancy_id(vacancy_id, timeout=timeout)

                    if not details or not isinstance(details, dict):
                        logger.warning(f"Некорректные данные для вакансии {vacancy_id}: {details}")
                        details = {"skills": "", "description": "", "experience": None}

                    # Добавляем задержку между запросами деталей вакансий
                    if vacancy_delay > 0:
                        time.sleep(vacancy_delay)

                    # Безопасное извлечение employer данных
                    employer = item.get("employer")
                    if employer and isinstance(employer, dict):
                        employer_name = employer.get("name")
                        employer_id = employer.get("id")
                        employer_url = employer.get("alternate_url")
                        accredited_it_employer = employer.get("accredited_it_employer")
                        trusted = employer.get("trusted")

                        # Извлекаем рейтинг
                        employer_rating = employer.get("employer_rating")
                        if employer_rating and isinstance(employer_rating, dict):
                            rating = employer_rating.get("total_rating")

                    # Безопасное извлечение salary данных
                    salary = item.get("salary")
                    if salary and isinstance(salary, dict):
                        salary_from = salary.get("from")
                        salary_to = salary.get("to")
                        currency = salary.get("currency")

                    # Безопасное извлечение snippet данных
                    snippet = item.get("snippet")
                    if snippet and isinstance(snippet, dict):
                        requirement = snippet.get("requirement")
                        responsibility = snippet.get("responsibility")

                    # Безопасное извлечение area данных
                    area = item.get("area")
                    if area and isinstance(area, dict):
                        city = area.get("name")

                    # Безопасное извлечение schedule данных
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
                        'schedule': schedule_id,
                        "experience": details.get("experience"),
                        "description": details.get("description", ""),
                        "published_at": item.get("published_at"),
                        "created_at": datetime.utcnow().isoformat(),
                        "archived": item.get("archived", False),
                        "archived_at": None,
                        "has_test": item.get("has_test", False),
                        "response_letter_required": item.get("response_letter_required", False),
                        "apply_alternate_url": item.get("apply_alternate_url", "")
                    }

                    count += 1

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
                    # Собираем информацию для лога безопасно
                    try:
                        log_parts = [f"Ошибка при обработке вакансии {e}"]

                        if 'vacancy_id' in locals():
                            log_parts.append(f"id: {vacancy_id}")

                        if 'item' in locals() and item:
                            log_parts.append(f"url: {item.get('url', 'N/A')}")

                        # Добавляем остальные поля
                        fields_to_log = [
                            ('employer_name', 'employer'),
                            ('employer_id', 'employer_id'),
                            ('accredited_it_employer', 'accredited_it_employer'),
                            ('employer_url', 'employer_url'),
                            ('rating', 'rating'),
                            ('trusted', 'trusted'),
                            ('city', 'city'),
                            ('salary_from', 'salary_from'),
                            ('salary_to', 'salary_to'),
                            ('currency', 'currency'),
                            ('schedule_id', 'schedule')
                        ]

                        for var_name, log_name in fields_to_log:
                            if var_name in locals():
                                value = locals()[var_name]
                                if value is not None:
                                    log_parts.append(f"{log_name}: {value}")
                                else:
                                    log_parts.append(f"{log_name}: None")

                        if 'details' in locals() and details and isinstance(details, dict):
                            log_parts.append(f"skills: {details.get('skills', '')}")
                            log_parts.append(f"experience: {details.get('experience', '')}")

                        if 'item' in locals() and item:
                            log_parts.append(f"has_test: {item.get('has_test', 'N/A')}")
                            log_parts.append(f"response_letter_required: {item.get('response_letter_required', 'N/A')}")
                            log_parts.append(f"apply_alternate_url: {item.get('apply_alternate_url', 'N/A')}")

                        logger.warning(", ".join(log_parts))

                    except Exception as log_error:
                        logger.error(f"Ошибка при формировании лога: {log_error}, исходная ошибка: {e}")

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
