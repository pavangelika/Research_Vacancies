import os
import logging
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv
import time

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
    logger.info("Проверка таблицы vacancies...")
    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS vacancies (
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
                requirement TEXT,
                responsibility TEXT,          
                description TEXT,
                published_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                archived BOOLEAN DEFAULT FALSE,
                archived_at TIMESTAMP,
                recovery BOOLEAN DEFAULT FALSE,
                recovery_at TIMESTAMP,
                hr_name TEXT,
                interview_date TIMESTAMP,
                interview_stages TEXT,
                company_type TEXT,
                result TEXT,
                feedback TEXT,
                offer_salary TEXT,
                pros TEXT,
                cons TEXT,
                overall_impression TEXT
            );
            """
        )
        conn.commit()
        logger.info("✅ Таблица vacancies готова")

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
                    INSERT INTO vacancies (
                        id, url, professional_role, name, employer, city,
                        salary_from, salary_to, currency,
                        requirement, responsibility, skills,
                        experience, description, published_at, created_at
                    )
                    VALUES (
                        %(id)s, %(url)s, %(professional_role)s, %(name)s, %(employer)s, %(city)s,
                        %(salary_from)s, %(salary_to)s, %(currency)s,
                        %(requirement)s, %(responsibility)s, %(skills)s,
                        %(experience)s, %(description)s, %(published_at)s, %(created_at)s
                    )
                    ON CONFLICT (id) DO NOTHING;
                    """,
                    v
                )
            except Exception as e:
                logger.warning(f"Ошибка сохранения вакансии {v.get('id')}: {e}")

        conn.commit()

    logger.info("✅ Сохранение завершено")


def update_archived_status(current_vacancy_ids: list[str], timeout: int = 10):
    """
    Проверяет все вакансии в базе:
    - если id нет в current_vacancy_ids, проверяет через API HH
    - 404 → удаляем запись из базы
    - 403 → ставим archived=True и archived_at=NOW()
    """
    import requests
    from datetime import datetime
    from dotenv import load_dotenv
    import os

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
            SELECT id FROM vacancies
            WHERE id NOT IN %s
            """,
            (tuple(current_vacancy_ids) if current_vacancy_ids else ('',),)
        )
        missing_vacancies = cur.fetchall()

        for (vac_id,) in missing_vacancies:
            api_url = f"{HH_API_URL}/{vac_id}"
            try:
                resp = requests.get(api_url, timeout=timeout)

                if resp.status_code == 404:
                    # Вакансия удалена с HH → удаляем из базы
                    cur.execute("DELETE FROM vacancies WHERE id = %s;", (vac_id,))
                    logger.info(f"Вакансия {vac_id} удалена из базы (404)")

                elif resp.status_code == 403 or resp.status_code == 429:
                    # Вакансия недоступна (капча / лимит) → архивируем
                    cur.execute(
                        """
                        UPDATE vacancies
                        SET archived = TRUE,
                            archived_at = %s
                        WHERE id = %s
                        """,
                        (datetime.utcnow(), vac_id)
                    )
                    logger.warning(f"Вакансия {vac_id} недоступна (403/429), помечена как архивированная")

                else:
                    resp.raise_for_status()
                    data = resp.json()
                    if data.get("archived"):
                        cur.execute(
                            """
                            UPDATE vacancies
                            SET archived = TRUE,
                                archived_at = %s
                            WHERE id = %s
                            """,
                            (datetime.utcnow(), vac_id)
                        )
                        logger.info(f"Вакансия {vac_id} архивирована по API")

            except Exception as e:
                logger.warning(f"Не удалось проверить вакансию {vac_id}: {e}")

        conn.commit()
    logger.info("✅ Проверка архивации/удаления завершена")