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


def get_vacancy_details(vacancy_id: str, timeout: int = 10, max_retries: int = 3, backoff: float = 1.0) -> dict:
    """
    Получает детали вакансии с HH API с повторными попытками и таймаутами.
    """
    url = f"{HH_API_URL}/{vacancy_id}"
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(url, timeout=timeout)
            if resp.status_code == 404:
                return {"skills": "", "description": "", "requirement": None, "responsibility": None, "experience": None}
            if resp.status_code == 403 or resp.status_code == 429:
                # Защита HH (капча / лимит запросов)
                raise RequestException(f"{resp.status_code} Client Error")
            resp.raise_for_status()
            data = resp.json()

            skills = ", ".join([s["name"] for s in data.get("key_skills", [])])
            raw_description = data.get("description")
            description = clean_html(raw_description)
            requirement = data.get("snippet", {}).get("requirement")
            responsibility = data.get("snippet", {}).get("responsibility")
            experience = data.get("experience", {}).get("name")

            return {
                "skills": skills,
                "description": description,
                "requirement": requirement,
                "responsibility": responsibility,
                "experience": experience,
            }

        except RequestException as e:
            wait_time = backoff * attempt
            logger.warning(f"Ошибка при получении вакансии {vacancy_id} (попытка {attempt}/{max_retries}): {e}. Жду {wait_time}s")
            time.sleep(wait_time)

    logger.warning(f"Вакансия {vacancy_id} недоступна после {max_retries} попыток, считаем архивированной")
    return {"skills": "", "description": "", "requirement": None, "responsibility": None, "experience": None}


def get_vacancies(
        professional_roles: str = os.getenv("PROFESSIONAL_ROLES", "34,124"),
        host: str = "hh.ru",
        per_page: int = 100,
        period: int = 2,
        order_by: str = "salary_desc",
        work_format: str = "REMOTE",
        timeout: int = 10,
) -> List[Dict]:
    """
    Собирает вакансии с HH API по указанным профессиональным ролям.
    Возвращает список словарей вакансий с подробными данными.
    """
    roles = [role.strip() for role in professional_roles.split(",")]
    all_vacancies: List[Dict] = []

    for role in roles:
        page = 0
        total_for_role = 0
        role_name = f"id={role}"  # по умолчанию имя роли = id
        logger.info(f"🔹 Старт")

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
                logger.error(f"Ошибка запроса страницы {page} для роли {role}: {e}")
                break

            items = data.get("items", [])
            total_found = data.get("found", 0)

            # Получаем имя роли из первой вакансии на странице
            if items and page == 0:
                first_item_roles = items[0].get("professional_roles", [])
                role_name = next((r["name"] for r in first_item_roles if str(r["id"]) == role), role_name)
                logger.info(f"🔹 Начинаем сбор вакансий для роли {role}... Имя роли: {role_name}")

            count = 0

            for item in items:
                try:
                    details = get_vacancy_details(item["id"], timeout=timeout)
                    vacancy_record = {
                        "id": item["id"],
                        "url": item["url"],
                        "professional_role":role,
                        "name": item.get("name"),
                        "employer": item.get("employer", {}).get("name"),
                        "city": item.get("area", {}).get("name"),
                        "salary_from": item.get("salary", {}).get("from") if item.get("salary") else None,
                        "salary_to": item.get("salary", {}).get("to") if item.get("salary") else None,
                        "currency": item.get("salary", {}).get("currency") if item.get("salary") else None,
                        "requirement": details["requirement"],
                        "responsibility": details["responsibility"],
                        "skills": details["skills"],
                        "experience": details["experience"],
                        "description": details["description"],
                        "published_at": item.get("published_at"),
                        "created_at": datetime.utcnow().isoformat(),
                        "archived": False,
                        "archived_at": None,
                        "recovery": False,
                        "recovery_at": None
                    }
                    count += 1
                    logger.info(
                        f"{count}/{total_found} "
                        f"{vacancy_record['name']} - "
                        f"{vacancy_record['employer']} - "
                        f"{vacancy_record['city']} - "
                        f"{vacancy_record['experience']} - "
                        f"{vacancy_record['salary_from']}-{vacancy_record['salary_to']} "
                        f"{vacancy_record['currency']}"
                    )

                    all_vacancies.append(vacancy_record)
                except Exception as e:
                    logger.warning(f"Ошибка при получении деталей вакансии {item.get('id')}: {e}")

            total_for_role += len(items)

            total_pages = data.get("pages", 0)
            page += 1
            if page >= total_pages:
                break

            time.sleep(0.3)  # чтобы не перегружать API

        logger.info(f"✅ Собрано вакансий для '{role_name}' ({role}): {total_for_role}")

    logger.info(f"Общее количество вакансий: {len(all_vacancies)}")
    return all_vacancies