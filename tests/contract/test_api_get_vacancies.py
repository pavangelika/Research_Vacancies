import requests
import pytest
from pathlib import Path
import json
from jsonschema import validate
import allure

URL = "https://api.hh.ru/vacancies"
PARAMS = {
    "host": "hh.ru",
    "per_page": 100,
    "page": 0,
    "period": 2,
    "order_by": "salary_desc",
    "professional_role": 34,
    "work_format": "REMOTE"
}

BASE_DIR = Path(__file__).resolve().parent.parent
SCHEMA_PATH = BASE_DIR / "schemas" / "vacancies.json"

@allure.feature("Contract API")
@allure.story("Contract: JSON is validated")
@pytest.mark.contract
def test_get_vacancies_contract():
    response = requests.get(URL, params=PARAMS)

    assert response.status_code == 200

    response_json = response.json()

    with open(SCHEMA_PATH, encoding="utf-8") as schema_file:
        schema = json.load(schema_file)

    validate(instance=response_json, schema=schema)

