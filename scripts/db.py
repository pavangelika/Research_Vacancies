import os
import logging
import time

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv
import requests
from datetime import datetime

logger = logging.getLogger(__name__)
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")


def create_database():
    # Подключаемся к серверу PostgreSQL (к базе данных по умолчанию)
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database="postgres"  # Подключаемся к системной БД
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

    cursor = conn.cursor()

    logger.info("Подключение к БД по умолчанию успешно")

    # Проверяем, существует ли база данных
    cursor.execute(
        "SELECT 1 FROM pg_database WHERE datname = %s",
        (DB_NAME,)
    )

    exists = cursor.fetchone()

    if not exists:
        logger.info(f"БД {DB_NAME} не существует")
        try:
            # Создаем новую базу данных
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            logger.info(f"База данных {DB_NAME} успешно создана")
        except Exception as e:
            logger.info(f"Ошибка при создании базы данных: {e}")
    else:
        logger.info(f"База данных {DB_NAME} уже существует")

    cursor.close()
    conn.close()


def init_table():
    logger.info("Проверка таблицы get_vacancies...")
    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS get_vacancies (
                id TEXT PRIMARY KEY,
                url TEXT UNIQUE,
                professional_role TEXT,
                name TEXT,
                employer TEXT,
                city TEXT,
                salary_from INTEGER,
                salary_to INTEGER,
                currency TEXT,
                experience TEXT,
                skills TEXT,      
                schedule TEXT,
                requirement TEXT,
                responsibility TEXT,          
                description TEXT,
                published_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                archived BOOLEAN DEFAULT FALSE,
                archived_at TIMESTAMP,
                hr_name TEXT,
                interview_date TIMESTAMP,
                interview_stages TEXT,
                company_type TEXT,
                result TEXT,
                feedback TEXT,
                offer_salary TEXT,
                pros TEXT,
                cons TEXT,
                has_test BOOLEAN DEFAULT FALSE,
                response_letter_required BOOLEAN DEFAULT FALSE,
                apply_alternate_url TEXT,
                send_resume BOOLEAN DEFAULT FALSE,
                resume_at TIMESTAMP
            )
            """
        )
        conn.commit()
        logger.info("✅ Таблица get_vacancies готова")


def mark_resume_sent(vacancy_id: str) -> bool:
    """
    Отмечает, что по вакансии отправлено резюме.
    Возвращает True, если запись обновлена.
    """
    if not vacancy_id:
        return False

    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE get_vacancies
            SET send_resume = TRUE,
                resume_at = NOW()
            WHERE id = %s
            """,
            (str(vacancy_id),)
        )
        updated = cur.rowcount > 0
        conn.commit()
        return updated


def get_sent_resume_vacancies() -> list[dict]:
    """
    Возвращает вакансии, по которым отправлено резюме (send_resume = TRUE),
    отсортированные по дате отклика.
    """
    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                id,
                professional_role,
                name,
                employer,
                city,
                salary_from,
                salary_to,
                currency,
                skills,
                apply_alternate_url,
                send_resume,
                resume_at,
                COALESCE(published_at, created_at) AS published_at,
                archived,
                archived_at,
                hr_name,
                interview_date,
                interview_stages,
                company_type,
                result,
                feedback,
                offer_salary,
                pros,
                cons
            FROM get_vacancies
            WHERE send_resume = TRUE
            ORDER BY resume_at DESC NULLS LAST, created_at DESC NULLS LAST
            """
        )
        rows = cur.fetchall()

    result = []
    for row in rows:
        interview_values = [row[15], row[16], row[17], row[18], row[19], row[20], row[21], row[22], row[23]]
        interview_filled = any(v is not None and str(v).strip() != "" for v in interview_values)
        result.append({
            "id": row[0],
            "role_id": row[1],
            "role_name": row[1],
            "name": row[2],
            "employer": row[3],
            "city": row[4],
            "salary_from": row[5],
            "salary_to": row[6],
            "currency": row[7],
            "skills": row[8],
            "apply_alternate_url": row[9],
            "send_resume": bool(row[10]),
            "resume_at": row[11].isoformat() if row[11] else None,
            "published_at": row[12].isoformat() if row[12] else None,
            "archived": bool(row[13]) if row[13] is not None else False,
            "archived_at": row[14].isoformat() if row[14] else None,
            "interview_filled": interview_filled,
            "hr_name": row[15],
            "interview_date": row[16].isoformat() if row[16] else None,
            "interview_stages": row[17],
            "company_type": row[18],
            "result": row[19],
            "feedback": row[20],
            "offer_salary": row[21],
            "pros": row[22],
            "cons": row[23],
        })
    return result


def get_vacancy_details(vacancy_id: str) -> dict | None:
    if not vacancy_id:
        return None
    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                id,
                skills,
                requirement,
                responsibility,
                description,
                published_at,
                archived,
                archived_at,
                hr_name,
                interview_date,
                interview_stages,
                company_type,
                result,
                feedback,
                offer_salary,
                pros,
                cons
            FROM get_vacancies
            WHERE id = %s
            LIMIT 1
            """,
            (str(vacancy_id),)
        )
        row = cur.fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "skills": row[1],
        "requirement": row[2],
        "responsibility": row[3],
        "description": row[4],
        "published_at": row[5].isoformat() if row[5] else None,
        "archived": bool(row[6]) if row[6] is not None else False,
        "archived_at": row[7].isoformat() if row[7] else None,
        "hr_name": row[8],
        "interview_date": row[9].isoformat() if row[9] else None,
        "interview_stages": row[10],
        "company_type": row[11],
        "result": row[12],
        "feedback": row[13],
        "offer_salary": row[14],
        "pros": row[15],
        "cons": row[16],
    }


def save_vacancy_details(vacancy_id: str, fields: dict | None, force_overwrite: bool = False) -> dict:
    if not vacancy_id:
        return {"ok": False, "updated": False, "error": "vacancy_id_required"}
    incoming = fields or {}
    editable_cols = [
        "hr_name",
        "interview_date",
        "interview_stages",
        "company_type",
        "result",
        "feedback",
        "offer_salary",
        "pros",
        "cons",
    ]
    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT hr_name, interview_date, interview_stages, company_type, result, feedback, offer_salary, pros, cons
            FROM get_vacancies
            WHERE id = %s
            LIMIT 1
            """,
            (str(vacancy_id),)
        )
        existing = cur.fetchone()
        if not existing:
            return {"ok": False, "updated": False, "error": "not_found"}

        current = dict(zip(editable_cols, existing))
        normalized = {}
        for key in editable_cols:
            value = incoming.get(key, None)
            if value is None:
                normalized[key] = None
                continue
            text = str(value).strip()
            normalized[key] = text if text else None

        def to_cmp(value):
            if value is None:
                return ""
            if isinstance(value, datetime):
                return value.isoformat(timespec="minutes")
            return str(value).strip()

        existing_non_empty = any(to_cmp(current.get(key)) for key in editable_cols)
        has_changes = any(to_cmp(current.get(key)) != to_cmp(normalized.get(key)) for key in editable_cols)

        if has_changes and existing_non_empty and not force_overwrite:
            return {"ok": True, "updated": False, "requires_overwrite": True}

        cur.execute(
            """
            UPDATE get_vacancies
            SET
                hr_name = %s,
                interview_date = %s,
                interview_stages = %s,
                company_type = %s,
                result = %s,
                feedback = %s,
                offer_salary = %s,
                pros = %s,
                cons = %s
            WHERE id = %s
            """,
            (
                normalized["hr_name"],
                normalized["interview_date"],
                normalized["interview_stages"],
                normalized["company_type"],
                normalized["result"],
                normalized["feedback"],
                normalized["offer_salary"],
                normalized["pros"],
                normalized["cons"],
                str(vacancy_id),
            )
        )
        conn.commit()
        return {"ok": True, "updated": cur.rowcount > 0, "requires_overwrite": False}


def save_vacancies(vacancies: list[dict]):
    logger.info("Сохранение вакансий в БД...")

    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:

        for v in vacancies:
            try:
                cur.execute(
                    """
                    INSERT INTO get_vacancies (
                        id, url, professional_role, name, employer, city,
                        salary_from, salary_to, currency,
                        requirement, responsibility, skills, schedule,
                        experience, description, published_at, created_at, 
                        has_test, response_letter_required, apply_alternate_url
                    )
                    VALUES (
                        %(id)s, %(url)s, %(professional_role)s, %(name)s, %(employer)s, %(city)s,
                        %(salary_from)s, %(salary_to)s, %(currency)s,
                        %(requirement)s, %(responsibility)s, %(skills)s, %(schedule)s,
                        %(experience)s, %(description)s, %(published_at)s, %(created_at)s,
                        %(has_test)s, %(response_letter_required)s, %(apply_alternate_url)s
                    )
                    ON CONFLICT (id) DO NOTHING;
                    """,
                    v
                )
            except Exception as e:
                logger.warning(f"Ошибка сохранения вакансии {v.get('id')}: {e}")

        conn.commit()

    logger.info("✅ Сохранение вакансий завершено")


def update_archived_status(
        current_vacancy_ids: list[str],
        timeout: int = 30,
        request_delay: float = 0.2,
        max_retries: int = 3,
        backoff_factor: float = 2.0
):
    """
    Проверяет все вакансии в базе:
    - если id нет в current_vacancy_ids, проверяет через API HH
    - 404 → удаляем запись из базы

    Параметры:
        request_delay: задержка между запросами в секундах (по умолчанию 0.2)
        max_retries: максимальное количество повторных попыток при ошибках
        backoff_factor: множитель для экспоненциальной задержки при повторах
    """

    load_dotenv()
    HH_API_URL = os.getenv("HH_API_URL")

    logger.info("Проверка статуса вакансий на архивирование/удаление...")

    with psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
    ) as conn, conn.cursor() as cur:

        # Получаем все вакансии, которых нет в текущем списке
        cur.execute(
            """
            SELECT id
            FROM get_vacancies
            WHERE id NOT IN %s
            """,
            (tuple(current_vacancy_ids) if current_vacancy_ids else ('',),)
        )
        missing_vacancies = cur.fetchall()

        total_missing = len(missing_vacancies)
        logger.info(f"Найдено {total_missing} вакансий для проверки")

        for index, (vac_id,) in enumerate(missing_vacancies, 1):
            api_url = f"{HH_API_URL}/{vac_id}"

            # Добавляем прогресс-лог
            if index % 10 == 0:
                logger.info(f"Прогресс: проверено {index}/{total_missing} вакансий")

            for attempt in range(1, max_retries + 1):
                try:
                    resp = requests.get(api_url, timeout=timeout)

                    if resp.status_code == 404:
                        # Вакансия удалена с HH → удаляем из базы
                        cur.execute("DELETE FROM get_vacancies WHERE id = %s;", (vac_id,))
                        conn.commit()
                        logger.info(f"Вакансия {vac_id} удалена из базы (404)")
                        break  # Успешно обработали, выходим из цикла попыток

                    elif resp.status_code in (403, 429):
                        if attempt < max_retries:
                            # Экспоненциальная задержка при ошибках 403/429
                            wait_time = backoff_factor ** attempt
                            logger.warning(
                                f"Вакансия {vac_id}: статус {resp.status_code} "
                                f"(попытка {attempt}/{max_retries}). "
                                f"Жду {wait_time:.1f} секунд"
                            )
                            time.sleep(wait_time)
                        else:
                            logger.warning(
                                f"Вакансия {vac_id} недоступна (403/429) после {max_retries} попыток, "
                            )
                            break

                    else:
                        resp.raise_for_status()
                        data = resp.json()
                        if data.get("archived"):
                            cur.execute(
                                """
                                UPDATE get_vacancies
                                SET archived    = TRUE,
                                    archived_at = %s
                                WHERE id = %s
                                """,
                                (datetime.utcnow(), vac_id)
                            )
                            conn.commit()
                            logger.info(f"Вакансия {vac_id} архивирована по API")
                        else:
                            # Если вакансия не архивирована, но мы её не получили в текущем сборе,
                            # возможно, она просто не попадает под текущие фильтры
                            # Оставляем её в базе без изменений
                            logger.debug(f"Вакансия {vac_id} не архивирована")
                        break  # Успешно обработали, выходим из цикла попыток

                except requests.exceptions.Timeout:
                    logger.warning(f"Таймаут при проверке вакансии {vac_id} (попытка {attempt}/{max_retries})")
                    if attempt < max_retries:
                        time.sleep(backoff_factor ** attempt)
                    continue

                except requests.exceptions.RequestException as e:
                    logger.warning(f"Ошибка сети при проверке вакансии {vac_id}: {e} (попытка {attempt}/{max_retries})")
                    if attempt < max_retries:
                        time.sleep(backoff_factor ** attempt)
                    continue

                except Exception as e:
                    logger.error(f"Неожиданная ошибка при проверке вакансии {vac_id}: {e}")
                    break  # Выходим из цикла попыток при непредвиденных ошибках

            # Добавляем задержку между запросами разных вакансий
            if request_delay > 0 and index < total_missing:
                time.sleep(request_delay)

        logger.info(f"Проверка статуса вакансий завершена. Обработано {total_missing} вакансий")


def init_employers():
    logger.info("Инициализация таблицы employers...")

    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:

        cur.execute("""
            CREATE TABLE IF NOT EXISTS employers (
                employer_id TEXT,
                name TEXT PRIMARY KEY,
                inn TEXT,
                accredited_it_employer Boolean DEFAULT FALSE,
                rating TEXT,
                trusted boolean DEFAULT FALSE,
                employer_url TEXT,
                type TEXT,
                checked_at TEXT,
                registration_at TEXT
            );
        """)

        # Если не хотим уникальность по name, используем другой подход
        cur.execute("""
            INSERT INTO employers (name)
            SELECT DISTINCT employer
            FROM get_vacancies
            WHERE employer IS NOT NULL
            AND employer NOT IN (SELECT name FROM employers WHERE name IS NOT NULL);
        """)

        conn.commit()

    logger.info("✅ Таблица employers создана и заполнена")


def update_employers(vacancies: list[dict]):
    """
    Обновляет таблицу employers данными из полученных вакансий с использованием UPSERT.
    """
    logger.info("Обновление таблицы employers (UPSERT)...")

    if not vacancies:
        logger.info("Нет вакансий для обновления работодателей")
        return

    with psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
    ) as conn, conn.cursor() as cur:

        updated_count = 0

        for vacancy in vacancies:
            try:
                # Проверяем наличие обязательных полей
                employer_name = vacancy.get('employer')
                employer_id = vacancy.get('employer_id')

                if not employer_name:
                    continue

                # Используем UPSERT (ON CONFLICT)
                cur.execute(
                    """
                    INSERT INTO employers
                    (name, employer_id, accredited_it_employer, employer_url,
                     rating, trusted, type, checked_at, registration_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) 
                    ON CONFLICT (name) DO UPDATE SET
                        employer_id = EXCLUDED.employer_id,
                        accredited_it_employer = EXCLUDED.accredited_it_employer,
                        employer_url = EXCLUDED.employer_url,
                        rating = EXCLUDED.rating,
                        trusted = EXCLUDED.trusted,
                        type = EXCLUDED.type,
                        checked_at = EXCLUDED.checked_at,
                        registration_at = EXCLUDED.registration_at
                    """,
                    (
                        employer_name,
                        employer_id,
                        vacancy.get('accredited_it_employer'),
                        vacancy.get('employer_url'),
                        vacancy.get('rating'),
                        vacancy.get('trusted'),
                        None,  # type
                        datetime.utcnow().isoformat(),  # checked_at
                        None  # registration_at
                    )
                )
                updated_count += 1

            except Exception as e:
                logger.warning(f"Ошибка при обновлении работодателя {vacancy.get('employer')}: {e}")

        conn.commit()

        logger.info(f"✅ Таблица employers обновлена: обработано {updated_count} записей")
