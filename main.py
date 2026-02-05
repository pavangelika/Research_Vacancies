from scripts.db import create_database, init_table, save_vacancies, update_archived_status, init_employers, \
    update_employers
from scripts.fetch_vacancies import get_vacancies
from scripts.logger import setup_logger
import logging

from scripts.professional_roles import save_professional_roles_to_json

setup_logger()
logger = logging.getLogger(__name__)

def main():
    logger.info("Запуск приложения Research Vacancies...")

    # 0 Список professional_roles
    # save_professional_roles_to_json()

    # 1️ Создаём БД и таблицу
    create_database()
    init_table()

    # 2️ Получаем вакансии с HH
    vacancies = get_vacancies()

    # 3️ Сохраняем вакансии: новые добавляются, старые обновляются
    save_vacancies(vacancies)

    # 4 Проверяем вакансии, которых нет в свежем списке и ставим archived
    current_ids = [v["id"] for v in vacancies]
    update_archived_status(current_ids)

    # 5 Добавляем уникальные компании в список компаний
    init_employers()
    update_employers(vacancies)




    logger.info("✅ Конец")

if __name__ == "__main__":
    main()


