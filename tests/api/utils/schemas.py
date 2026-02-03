import jsonschema
from datetime import datetime, timedelta

# JSON Schema для ответа /vacancies
VACANCIES_SCHEMA = {
    "type": "object",
    "required": ["items", "found", "pages", "per_page", "page"],
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["accept_incomplete_resumes", "alternate_url", "apply_alternate_url", "area",
                             "department", "employer", "has_test", "id", "name", "professional_roles",
                             "published_at", "relations", "response_letter_required", "salary_range",
                             "type", "url", "snippet"],
                "properties": {
                    "accept_incomplete_resumes":{"type":"boolean"},
                    "alternate_url":{"type":"string"},
                    "apply_alternate_url":{"type":"string"},
                    "area":{
                        "type":["object"],
                        "required":["id", "name", "url"],
                        "properties":{
                            "id":{"type":"string"},
                            "name":{"type":"string"},
                            "url":{"type":"string"},
                        }
                    },
                    "department":{
                        "type":["object", "null"],
                        "properties":{
                            "id":{"type":"string"},
                            "name":{"type":"string"}
                        }
                    },
                    "employer":{
                        "type":["object"],
                        "required":["name", "trusted"],
                        "properties":{
                            "accredited_it_employer":{"type":"boolean"},
                            "alternate_url":{"type":["string", "null"]},
                            "country_id":{"type":"integer"},
                            "employer_rating": {
                                "type": ["object", "null"],
                                "required":["reviews_count", "total_rating"],
                                "properties": {
                                    "reviews_count":{"type":["string", "integer", "number", "null"]},
                                    "total_rating":{"type":"string"},
                                }
                            },
                            "id":{"type":["string", "null"]},
                            "is_identified_by_esia":{"type":"boolean"},
                            "logo_urls":{"type":["null", "object"]},
                            "name":{"type":"string"},
                            "trusted":{"type":"boolean"},
                            "url":{"type":["string", "null"]},
                            "vacancies_url":{"type":["string", "null"]},
                        }
                    },
                    "has_test":{"type":"boolean"},
                    "id":{"type":"string"},
                    "name":{"type":"string"},
                    "professional_roles":{
                        "type":["array", "object"],
                        "properties": {
                            "id": {"type": "string"},
                            "name": {"type": "string"}
                        }
                    },
                    "published_at":{"type":"string"},
                    "relations":{"type":["null", "array", "string"]},
                    "response_letter_required":{"type":"boolean"},
                    "salary_range": {
                        "type": ["object", "null"],
                        "required":["currency", "gross", "mode"],
                        "properties": {
                            "currency": {"type":"string"},
                            "gross": {"type":"boolean"},
                            "mode": {"type":"object"},
                            "from": {"type": ["number", "null"]},
                            "to": {"type": ["number", "null"]}
                        }
                    },
                    "type":{
                        "type": ["object"],
                        "required":["id"],
                        "properties": {
                            "id": {"type":"string"},
                            "name": {"type":"string"}
                        }
                    },
                    "url":{"type":"string"},
                    "snippet":{
                        "type": ["object"],
                        "properties": {
                            "requirement": {"type":["string", "null"]},
                            "responsibility": {"type":["string", "null"]}
                        }
                   }

                }
            }
        },
        "found": {"type": "integer"},
        "page": {"type": "integer"},
        "pages": {"type": "integer"},
        "per_page": {"type": "integer"}
    }
}

# JSON Schema для ответа /vacancies/{id}
VACANCY_DETAIL_SCHEMA = {
    "type": "object",
    "required": ["accept_handicapped", "accept_incomplete_resumes", "allow_messages",
                 "alternate_url", "apply_alternate_url", "approved", "archived", "area",
                 "description", "driver_license_types", "experience", "has_test", "id",
                 "initial_created_at", "key_skills", "name", "professional_roles",
                 "published_at", "response_letter_required"],
    "properties": {
        "accept_handicapped": {"type": "boolean"},
        "accept_incomplete_resumes": {"type": "boolean"},
        "allow_messages": {"type": "boolean"},
        "alternate_url": {"type": "string"},
        "apply_alternate_url": {"type": "string"},
        "approved": {"type": "boolean"},
        "archived": {"type": "boolean"},
        "area": {
            "type": ["object"],
            "required": ["id", "name", "url"],
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "url": {"type": "string"},
            }
        },
        "description": {"type": "string"},
        "driver_license_types": {
            "type": ["array", "object"],
            "properties": {
                "id": {"type": "string"}
            }
        },
        "experience": {
            "type": ["object", "null"],
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"}
            }
        },
        "has_test": {"type": "boolean"},
        "id": {"type": "string"},
        "initial_created_at": {"type": "string"},
        "key_skills": {
            "type": ["array", "object"],
            "properties": {
                "name": {"type": "string"}
            }
        },
        "name": {"type": "string"},
        "professional_role": {
            "type": ["array", "object"],
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"}
            }
        },
        "published_at": {"type": "string"},
        "response_letter_required": {"type": "boolean"}
    }
}


def validate_vacancies_response(response_json):
    """Валидация ответа ручки /vacancies по JSON Schema"""
    jsonschema.validate(instance=response_json, schema=VACANCIES_SCHEMA)


def validate_vacancy_detail_response(response_json):
    """Валидация ответа ручки /vacancies/{id} по JSON Schema"""
    jsonschema.validate(instance=response_json, schema=VACANCY_DETAIL_SCHEMA)



