import requests
import json
from jsonschema import validate
from pathlib import Path
import pytest
import allure

VACANCY_ID = "129700234"
URL = f"https://api.hh.ru/vacancies/{VACANCY_ID}"
PARAMS = {
    "host": "hh.ru"
}

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
SCHEMA_PATH = BASE_DIR / "schemas" / "vacancy_details.json"

@allure.feature("Contract API")
@allure.story("JSON is validated")
@allure.title("Структура JSON соответсвует контракту")
@pytest.mark.contract
def test_get_vacancy_id_contract():
    with allure.step("1. Запрос с выбранными PARAMS возвращает статус ответа 200"):
        response = requests.get(URL, params=PARAMS)

        assert response.status_code == 200
    with allure.step("2. Сравнение схемы json ответа со схемой из документации"):
        response_json = response.json()

        with open(SCHEMA_PATH, encoding="utf-8") as schema_file:
            schema = json.load(schema_file)

        validate(instance=response_json, schema=schema)
