import os
import logging
import time
import socket

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


def get_resolved_db_host() -> str:
    host = (DB_HOST or "").strip() or "localhost"
    try:
        socket.gethostbyname(host)
        return host
    except OSError:
        logger.warning("DB_HOST=%s РЅРµРґРѕСЃС‚СѓРїРµРЅ, РёСЃРїРѕР»СЊР·СѓРµРј localhost", host)
        return "127.0.0.1"


def create_database():
    # РџРѕРґРєР»СЋС‡Р°РµРјСЃСЏ Рє СЃРµСЂРІРµСЂСѓ PostgreSQL (Рє Р±Р°Р·Рµ РґР°РЅРЅС‹С… РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ)
    conn = psycopg2.connect(
        host=get_resolved_db_host(),
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database="postgres"  # РџРѕРґРєР»СЋС‡Р°РµРјСЃСЏ Рє СЃРёСЃС‚РµРјРЅРѕР№ Р‘Р”
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

    cursor = conn.cursor()

    logger.info("РџРѕРґРєР»СЋС‡РµРЅРёРµ Рє Р‘Р” РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ СѓСЃРїРµС€РЅРѕ")

    # РџСЂРѕРІРµСЂСЏРµРј, СЃСѓС‰РµСЃС‚РІСѓРµС‚ Р»Рё Р±Р°Р·Р° РґР°РЅРЅС‹С…
    cursor.execute(
        "SELECT 1 FROM pg_database WHERE datname = %s",
        (DB_NAME,)
    )

    exists = cursor.fetchone()

    if not exists:
        logger.info(f"Р‘Р” {DB_NAME} РЅРµ СЃСѓС‰РµСЃС‚РІСѓРµС‚")
        try:
            # РЎРѕР·РґР°РµРј РЅРѕРІСѓСЋ Р±Р°Р·Сѓ РґР°РЅРЅС‹С…
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            logger.info(f"Р‘Р°Р·Р° РґР°РЅРЅС‹С… {DB_NAME} СѓСЃРїРµС€РЅРѕ СЃРѕР·РґР°РЅР°")
        except Exception as e:
            logger.info(f"РћС€РёР±РєР° РїСЂРё СЃРѕР·РґР°РЅРёРё Р±Р°Р·С‹ РґР°РЅРЅС‹С…: {e}")
    else:
        logger.info(f"Р‘Р°Р·Р° РґР°РЅРЅС‹С… {DB_NAME} СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚")

    cursor.close()
    conn.close()


def init_table():
    logger.info("РџСЂРѕРІРµСЂРєР° С‚Р°Р±Р»РёС†С‹ get_vacancies...")
    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=get_resolved_db_host(),
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
                resume_at TIMESTAMP,
                updated_at TIMESTAMP
            )
            """
        )
        ensure_get_vacancies_tracking_columns(cur)
        conn.commit()
        logger.info("вњ… РўР°Р±Р»РёС†Р° get_vacancies РіРѕС‚РѕРІР°")


def ensure_get_vacancies_tracking_columns(cur) -> None:
    cur.execute(
        """
        ALTER TABLE get_vacancies
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
        """
    )


def mark_resume_sent(vacancy_id: str) -> dict:
    """
    РћС‚РјРµС‡Р°РµС‚, С‡С‚Рѕ РїРѕ РІР°РєР°РЅСЃРёРё РѕС‚РїСЂР°РІР»РµРЅРѕ СЂРµР·СЋРјРµ.
    Р’РѕР·РІСЂР°С‰Р°РµС‚ True, РµСЃР»Рё Р·Р°РїРёСЃСЊ РѕР±РЅРѕРІР»РµРЅР°.
    """
    if not vacancy_id:
        return {"updated": False, "vacancy_id": str(vacancy_id or "").strip(), "resume_at": None, "updated_at": None}

    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=get_resolved_db_host(),
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE get_vacancies
            SET send_resume = TRUE,
                resume_at = NOW(),
                updated_at = NOW()
            WHERE id = %s
            RETURNING resume_at, updated_at
            """,
            (str(vacancy_id),)
        )
        updated_row = cur.fetchone()
        updated = cur.rowcount > 0
        conn.commit()
        if not updated:
            logger.warning("Failed to mark send_resume: vacancy_id=%s not found in DB", vacancy_id)
            return {"updated": False, "vacancy_id": str(vacancy_id), "resume_at": None, "updated_at": None}
        return {
            "updated": True,
            "vacancy_id": str(vacancy_id),
            "resume_at": updated_row[0].isoformat() if updated_row and updated_row[0] else None,
            "updated_at": updated_row[1].isoformat() if updated_row and updated_row[1] else None,
        }


def get_sent_resume_vacancies() -> list[dict]:
    """
    Р’РѕР·РІСЂР°С‰Р°РµС‚ РІР°РєР°РЅСЃРёРё, РїРѕ РєРѕС‚РѕСЂС‹Рј РѕС‚РїСЂР°РІР»РµРЅРѕ СЂРµР·СЋРјРµ (send_resume = TRUE),
    РѕС‚СЃРѕСЂС‚РёСЂРѕРІР°РЅРЅС‹Рµ РїРѕ РґР°С‚Рµ РѕС‚РєР»РёРєР°.
    """
    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=get_resolved_db_host(),
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:
        ensure_get_vacancies_tracking_columns(cur)
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
                cons,
                updated_at
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
            "updated_at": row[24].isoformat() if row[24] else None,
        })
    return result


def get_vacancy_details(vacancy_id: str) -> dict | None:
    if not vacancy_id:
        return None
    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=get_resolved_db_host(),
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:
        ensure_get_vacancies_tracking_columns(cur)
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
                cons,
                updated_at
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
        "updated_at": row[17].isoformat() if row[17] else None,
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
        host=get_resolved_db_host(),
        port=DB_PORT,
    ) as conn, conn.cursor() as cur:
        ensure_get_vacancies_tracking_columns(cur)
        cur.execute(
            """
            SELECT hr_name, interview_date, interview_stages, company_type, result, feedback, offer_salary, pros, cons, updated_at
            FROM get_vacancies
            WHERE id = %s
            LIMIT 1
            """,
            (str(vacancy_id),)
        )
        existing = cur.fetchone()
        if not existing:
            return {"ok": False, "updated": False, "error": "not_found"}

        current = dict(zip(editable_cols, existing[:len(editable_cols)]))
        current_updated_at = existing[len(editable_cols)]
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
        if not has_changes:
            return {
                "ok": True,
                "updated": False,
                "unchanged": True,
                "requires_overwrite": False,
                "updated_at": current_updated_at.isoformat() if current_updated_at else None,
            }

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
                cons = %s,
                updated_at = NOW()
            WHERE id = %s
            RETURNING updated_at
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
        updated_row = cur.fetchone()
        conn.commit()
        return {
            "ok": True,
            "updated": cur.rowcount > 0,
            "requires_overwrite": False,
            "updated_at": updated_row[0].isoformat() if updated_row and updated_row[0] else None,
        }


def save_vacancies(vacancies: list[dict]):
    logger.info("РЎРѕС…СЂР°РЅРµРЅРёРµ РІР°РєР°РЅСЃРёР№ РІ Р‘Р”...")

    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=get_resolved_db_host(),
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
                logger.warning(f"РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ РІР°РєР°РЅСЃРёРё {v.get('id')}: {e}")

        conn.commit()

    logger.info("вњ… РЎРѕС…СЂР°РЅРµРЅРёРµ РІР°РєР°РЅСЃРёР№ Р·Р°РІРµСЂС€РµРЅРѕ")


def update_archived_status(
        current_vacancy_ids: list[str],
        timeout: int = 30,
        request_delay: float = 0.2,
        max_retries: int = 3,
        backoff_factor: float = 2.0
):
    """
    РџСЂРѕРІРµСЂСЏРµС‚ РІСЃРµ РІР°РєР°РЅСЃРёРё РІ Р±Р°Р·Рµ:
    - РµСЃР»Рё id РЅРµС‚ РІ current_vacancy_ids, РїСЂРѕРІРµСЂСЏРµС‚ С‡РµСЂРµР· API HH
    - 404 в†’ СѓРґР°Р»СЏРµРј Р·Р°РїРёСЃСЊ РёР· Р±Р°Р·С‹

    РџР°СЂР°РјРµС‚СЂС‹:
        request_delay: Р·Р°РґРµСЂР¶РєР° РјРµР¶РґСѓ Р·Р°РїСЂРѕСЃР°РјРё РІ СЃРµРєСѓРЅРґР°С… (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ 0.2)
        max_retries: РјР°РєСЃРёРјР°Р»СЊРЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ РїРѕРІС‚РѕСЂРЅС‹С… РїРѕРїС‹С‚РѕРє РїСЂРё РѕС€РёР±РєР°С…
        backoff_factor: РјРЅРѕР¶РёС‚РµР»СЊ РґР»СЏ СЌРєСЃРїРѕРЅРµРЅС†РёР°Р»СЊРЅРѕР№ Р·Р°РґРµСЂР¶РєРё РїСЂРё РїРѕРІС‚РѕСЂР°С…
    """

    load_dotenv()
    HH_API_URL = os.getenv("HH_API_URL")

    logger.info("РџСЂРѕРІРµСЂРєР° СЃС‚Р°С‚СѓСЃР° РІР°РєР°РЅСЃРёР№ РЅР° Р°СЂС…РёРІРёСЂРѕРІР°РЅРёРµ/СѓРґР°Р»РµРЅРёРµ...")

    with psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=get_resolved_db_host(),
            port=DB_PORT,
    ) as conn, conn.cursor() as cur:

        # РџРѕР»СѓС‡Р°РµРј РІСЃРµ РІР°РєР°РЅСЃРёРё, РєРѕС‚РѕСЂС‹С… РЅРµС‚ РІ С‚РµРєСѓС‰РµРј СЃРїРёСЃРєРµ
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
        logger.info(f"РќР°Р№РґРµРЅРѕ {total_missing} РІР°РєР°РЅСЃРёР№ РґР»СЏ РїСЂРѕРІРµСЂРєРё")

        for index, (vac_id,) in enumerate(missing_vacancies, 1):
            api_url = f"{HH_API_URL}/{vac_id}"

            # Р”РѕР±Р°РІР»СЏРµРј РїСЂРѕРіСЂРµСЃСЃ-Р»РѕРі
            if index % 10 == 0:
                logger.info(f"РџСЂРѕРіСЂРµСЃСЃ: РїСЂРѕРІРµСЂРµРЅРѕ {index}/{total_missing} РІР°РєР°РЅСЃРёР№")

            for attempt in range(1, max_retries + 1):
                try:
                    resp = requests.get(api_url, timeout=timeout)

                    if resp.status_code == 404:
                        # Р’Р°РєР°РЅСЃРёСЏ СѓРґР°Р»РµРЅР° СЃ HH в†’ СѓРґР°Р»СЏРµРј РёР· Р±Р°Р·С‹
                        cur.execute("DELETE FROM get_vacancies WHERE id = %s;", (vac_id,))
                        conn.commit()
                        logger.info(f"Р’Р°РєР°РЅСЃРёСЏ {vac_id} СѓРґР°Р»РµРЅР° РёР· Р±Р°Р·С‹ (404)")
                        break  # РЈСЃРїРµС€РЅРѕ РѕР±СЂР°Р±РѕС‚Р°Р»Рё, РІС‹С…РѕРґРёРј РёР· С†РёРєР»Р° РїРѕРїС‹С‚РѕРє

                    elif resp.status_code in (403, 429):
                        if attempt < max_retries:
                            # Р­РєСЃРїРѕРЅРµРЅС†РёР°Р»СЊРЅР°СЏ Р·Р°РґРµСЂР¶РєР° РїСЂРё РѕС€РёР±РєР°С… 403/429
                            wait_time = backoff_factor ** attempt
                            logger.warning(
                                f"Р’Р°РєР°РЅСЃРёСЏ {vac_id}: СЃС‚Р°С‚СѓСЃ {resp.status_code} "
                                f"(РїРѕРїС‹С‚РєР° {attempt}/{max_retries}). "
                                f"Р–РґСѓ {wait_time:.1f} СЃРµРєСѓРЅРґ"
                            )
                            time.sleep(wait_time)
                        else:
                            logger.warning(
                                f"Р’Р°РєР°РЅСЃРёСЏ {vac_id} РЅРµРґРѕСЃС‚СѓРїРЅР° (403/429) РїРѕСЃР»Рµ {max_retries} РїРѕРїС‹С‚РѕРє, "
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
                            logger.info(f"Р’Р°РєР°РЅСЃРёСЏ {vac_id} Р°СЂС…РёРІРёСЂРѕРІР°РЅР° РїРѕ API")
                        else:
                            # Р•СЃР»Рё РІР°РєР°РЅСЃРёСЏ РЅРµ Р°СЂС…РёРІРёСЂРѕРІР°РЅР°, РЅРѕ РјС‹ РµС‘ РЅРµ РїРѕР»СѓС‡РёР»Рё РІ С‚РµРєСѓС‰РµРј СЃР±РѕСЂРµ,
                            # РІРѕР·РјРѕР¶РЅРѕ, РѕРЅР° РїСЂРѕСЃС‚Рѕ РЅРµ РїРѕРїР°РґР°РµС‚ РїРѕРґ С‚РµРєСѓС‰РёРµ С„РёР»СЊС‚СЂС‹
                            # РћСЃС‚Р°РІР»СЏРµРј РµС‘ РІ Р±Р°Р·Рµ Р±РµР· РёР·РјРµРЅРµРЅРёР№
                            logger.debug(f"Р’Р°РєР°РЅСЃРёСЏ {vac_id} РЅРµ Р°СЂС…РёРІРёСЂРѕРІР°РЅР°")
                        break  # РЈСЃРїРµС€РЅРѕ РѕР±СЂР°Р±РѕС‚Р°Р»Рё, РІС‹С…РѕРґРёРј РёР· С†РёРєР»Р° РїРѕРїС‹С‚РѕРє

                except requests.exceptions.Timeout:
                    logger.warning(f"РўР°Р№РјР°СѓС‚ РїСЂРё РїСЂРѕРІРµСЂРєРµ РІР°РєР°РЅСЃРёРё {vac_id} (РїРѕРїС‹С‚РєР° {attempt}/{max_retries})")
                    if attempt < max_retries:
                        time.sleep(backoff_factor ** attempt)
                    continue

                except requests.exceptions.RequestException as e:
                    logger.warning(f"РћС€РёР±РєР° СЃРµС‚Рё РїСЂРё РїСЂРѕРІРµСЂРєРµ РІР°РєР°РЅСЃРёРё {vac_id}: {e} (РїРѕРїС‹С‚РєР° {attempt}/{max_retries})")
                    if attempt < max_retries:
                        time.sleep(backoff_factor ** attempt)
                    continue

                except Exception as e:
                    logger.error(f"РќРµРѕР¶РёРґР°РЅРЅР°СЏ РѕС€РёР±РєР° РїСЂРё РїСЂРѕРІРµСЂРєРµ РІР°РєР°РЅСЃРёРё {vac_id}: {e}")
                    break  # Р’С‹С…РѕРґРёРј РёР· С†РёРєР»Р° РїРѕРїС‹С‚РѕРє РїСЂРё РЅРµРїСЂРµРґРІРёРґРµРЅРЅС‹С… РѕС€РёР±РєР°С…

            # Р”РѕР±Р°РІР»СЏРµРј Р·Р°РґРµСЂР¶РєСѓ РјРµР¶РґСѓ Р·Р°РїСЂРѕСЃР°РјРё СЂР°Р·РЅС‹С… РІР°РєР°РЅСЃРёР№
            if request_delay > 0 and index < total_missing:
                time.sleep(request_delay)

        logger.info(f"РџСЂРѕРІРµСЂРєР° СЃС‚Р°С‚СѓСЃР° РІР°РєР°РЅСЃРёР№ Р·Р°РІРµСЂС€РµРЅР°. РћР±СЂР°Р±РѕС‚Р°РЅРѕ {total_missing} РІР°РєР°РЅСЃРёР№")


def init_employers():
    logger.info("РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ С‚Р°Р±Р»РёС†С‹ employers...")

    with psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=get_resolved_db_host(),
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

        # Р•СЃР»Рё РЅРµ С…РѕС‚РёРј СѓРЅРёРєР°Р»СЊРЅРѕСЃС‚СЊ РїРѕ name, РёСЃРїРѕР»СЊР·СѓРµРј РґСЂСѓРіРѕР№ РїРѕРґС…РѕРґ
        cur.execute("""
            INSERT INTO employers (name)
            SELECT DISTINCT employer
            FROM get_vacancies
            WHERE employer IS NOT NULL
            AND employer NOT IN (SELECT name FROM employers WHERE name IS NOT NULL);
        """)

        conn.commit()

    logger.info("вњ… РўР°Р±Р»РёС†Р° employers СЃРѕР·РґР°РЅР° Рё Р·Р°РїРѕР»РЅРµРЅР°")


def update_employers(vacancies: list[dict]):
    """
    РћР±РЅРѕРІР»СЏРµС‚ С‚Р°Р±Р»РёС†Сѓ employers РґР°РЅРЅС‹РјРё РёР· РїРѕР»СѓС‡РµРЅРЅС‹С… РІР°РєР°РЅСЃРёР№ СЃ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµРј UPSERT.
    """
    logger.info("РћР±РЅРѕРІР»РµРЅРёРµ С‚Р°Р±Р»РёС†С‹ employers (UPSERT)...")

    if not vacancies:
        logger.info("РќРµС‚ РІР°РєР°РЅСЃРёР№ РґР»СЏ РѕР±РЅРѕРІР»РµРЅРёСЏ СЂР°Р±РѕС‚РѕРґР°С‚РµР»РµР№")
        return

    with psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=get_resolved_db_host(),
            port=DB_PORT,
    ) as conn, conn.cursor() as cur:

        updated_count = 0

        for vacancy in vacancies:
            try:
                # РџСЂРѕРІРµСЂСЏРµРј РЅР°Р»РёС‡РёРµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹С… РїРѕР»РµР№
                employer_name = vacancy.get('employer')
                employer_id = vacancy.get('employer_id')

                if not employer_name:
                    continue

                # РСЃРїРѕР»СЊР·СѓРµРј UPSERT (ON CONFLICT)
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
                logger.warning(f"РћС€РёР±РєР° РїСЂРё РѕР±РЅРѕРІР»РµРЅРёРё СЂР°Р±РѕС‚РѕРґР°С‚РµР»СЏ {vacancy.get('employer')}: {e}")

        conn.commit()

        logger.info(f"вњ… РўР°Р±Р»РёС†Р° employers РѕР±РЅРѕРІР»РµРЅР°: РѕР±СЂР°Р±РѕС‚Р°РЅРѕ {updated_count} Р·Р°РїРёСЃРµР№")
