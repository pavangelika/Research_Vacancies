import requests
import json
from jsonschema import validate

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

def test_get_vacancies_contract():
    response = requests.get(URL, params=PARAMS)

    assert response.status_code == 200

    response_json = response.json()

    with open("../schemas/vacancies.json") as schema_file:
        schema = json.load(schema_file)

    validate(instance=response_json, schema=schema)

