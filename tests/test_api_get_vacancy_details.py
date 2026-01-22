import requests
import json
from jsonschema import validate

VACANCY_ID = "129700234"
URL = f"https://api.hh.ru/vacancies/{VACANCY_ID}"
PARAMS = {
    "host": "hh.ru"
}

def test_get_vacancy_details_contract():
    response = requests.get(URL, params=PARAMS)

    assert response.status_code == 200

    response_json = response.json()

    with open("../schemas/vacancy_details.json") as schema_file:
        schema = json.load(schema_file)

    validate(instance=response_json, schema=schema)
