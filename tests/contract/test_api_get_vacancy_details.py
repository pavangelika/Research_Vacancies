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

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SCHEMA_PATH = BASE_DIR / "schemas" / "vacancy_details.json"

@allure.feature("Contract API")
@allure.story("Contract: JSON is validated")
@pytest.mark.contract
def test_get_vacancy_details_contract():
    response = requests.get(URL, params=PARAMS)

    assert response.status_code == 200

    response_json = response.json()

    with open(SCHEMA_PATH, encoding="utf-8") as schema_file:
        schema = json.load(schema_file)

    validate(instance=response_json, schema=schema)
