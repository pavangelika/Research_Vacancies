import logging
import os
from datetime import datetime, timedelta, timezone

from scripts.db import (
    clear_hh_search_cooldown,
    create_database,
    get_hh_search_cooldown_failure_count,
    get_hh_search_cooldown_until,
    get_role_batch_offset,
    init_employers,
    init_table,
    save_vacancies,
    set_hh_search_cooldown_state,
    set_role_batch_offset,
    update_archived_status,
    update_employers,
)
from scripts.fetch_vacancies import VacancyFetchResult, build_role_batch, get_vacancies
from scripts.logger import setup_logger

from scripts.professional_roles import save_professional_roles_to_json

setup_logger()
logger = logging.getLogger(__name__)


def _get_hh_cooldown_schedule_seconds() -> list[int]:
    raw_value = os.getenv("HH_BLOCK_COOLDOWN_SCHEDULE_SECONDS", "").strip()
    if raw_value:
        values = []
        for chunk in raw_value.split(","):
            chunk = chunk.strip()
            if not chunk:
                continue
            try:
                value = int(chunk)
            except ValueError:
                continue
            if value > 0:
                values.append(value)
        if values:
            return values

    fallback = max(1, int(os.getenv("HH_BLOCK_COOLDOWN_SECONDS", "21600")))
    return [fallback]


def main():
    logger.info("Запуск приложения Research Vacancies...")

    # Список professional_roles
    # save_professional_roles_to_json()

    # 1. Создаём БД и таблицу
    create_database()
    init_table()

    now_utc = datetime.now(timezone.utc)
    cooldown_until = get_hh_search_cooldown_until()
    if cooldown_until and cooldown_until > now_utc:
        logger.warning("Пропускаем fetch HH: действует cooldown до %s", cooldown_until.isoformat())
        return

    # 2. Получаем вакансии с HH
    professional_roles = os.getenv(
        "PROFESSIONAL_ROLES",
        "10, 12, 25, 34, 36, 40, 73, 96, 104, 107, 112, 113, 114, 116, 121, 124, "
        "125, 126, 140, 148, 150, 155, 156, 157, 160, 163, 164, 165",
    )
    role_batch_size = max(1, int(os.getenv("ROLE_BATCH_SIZE", "10")))
    role_offset = get_role_batch_offset()
    role_batch = build_role_batch(professional_roles, batch_size=role_batch_size, offset=role_offset)
    selected_roles = ", ".join(role_batch.selected_roles)
    logger.info(
        "Запускаем батч ролей %s/%s: %s",
        min(role_batch_size, role_batch.total_roles) if role_batch.total_roles else 0,
        role_batch.total_roles,
        selected_roles or "пусто",
    )
    fetch_result = get_vacancies(professional_roles=selected_roles)
    if isinstance(fetch_result, VacancyFetchResult):
        vacancies = fetch_result.vacancies
        fetch_complete = fetch_result.complete
    else:
        vacancies = fetch_result
        fetch_complete = True

    if fetch_complete:
        clear_hh_search_cooldown()
    else:
        failure_count = get_hh_search_cooldown_failure_count() + 1
        cooldown_schedule = _get_hh_cooldown_schedule_seconds()
        cooldown_index = min(failure_count - 1, len(cooldown_schedule) - 1)
        cooldown_seconds = cooldown_schedule[cooldown_index]
        set_hh_search_cooldown_state(
            now_utc + timedelta(seconds=cooldown_seconds),
            failure_count,
        )

    # 3. Сохраняем вакансии: новые добавляются, старые обновляются
    save_vacancies(vacancies)

    # 4. Проверяем вакансии, которых нет в свежем списке, и ставим archived
    current_ids = [v["id"] for v in vacancies]
    if fetch_complete and current_ids:
        update_archived_status(current_ids)
    elif not fetch_complete:
        logger.warning("Пропускаем archive-check: сбор вакансий завершился с ошибками")
    else:
        logger.warning("Пропускаем archive-check: пустой список текущих вакансий")

    # 5. Добавляем уникальные компании в список компаний
    if fetch_complete and role_batch.total_roles:
        set_role_batch_offset(role_batch.next_offset)

    init_employers()
    update_employers(vacancies)

    logger.info("✅ Конец")


if __name__ == "__main__":
    main()
