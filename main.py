from scripts.db import create_database, init_table, save_vacancies
from scripts.fetch_vacancies import get_vacancies
from scripts.logger import setup_logger
import logging

setup_logger()
logger = logging.getLogger(__name__)

def main():
    logger.info("Запуск приложения Research Vacancies...")
    create_database()
    init_table()

    vacancies = get_vacancies()
    save_vacancies(vacancies)

if __name__ == "__main__":
    main()


