import requests
import json
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


def save_professional_roles_to_json(filename='professional_roles.json', directory=None):
    url = 'https://api.hh.ru/professional_roles'
    try:
        logger.info(f"Отправка запроса к {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        data = response.json()
        logger.info("Данные успешно получены")

        BASE_DIR = Path(__file__).resolve().parent
        JSON_PATH = BASE_DIR / filename

        logger.info(f"BASE_DIR: {BASE_DIR}")
        logger.info(f"JSON_PATH: {JSON_PATH}")

        logger.info(f"Попытка сохранения в: {JSON_PATH}")

        # Сохраняем данные в файл
        with open(JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        if JSON_PATH.exists():
            logger.info(f"Данные успешно сохранены в {JSON_PATH}")
            logger.info(f"Размер файла: {JSON_PATH.stat().st_size} байт")
            return str(JSON_PATH)
        else:
            logger.error("Ошибка: файл не был создан")
            return None

    except Exception as e:
        logger.error(f"Ошибка: {e}")
        return None

