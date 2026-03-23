import json

import allure


def attach_json(payload, name="JSON"):
    allure.attach(
        body=json.dumps(payload, indent=2, ensure_ascii=False),
        name=name,
        attachment_type=allure.attachment_type.JSON,
    )


def attach_request_response(
    method,
    url,
    params=None,
    headers=None,
    response=None,
    response_time_ms=None,
    timestamp=None,
):
    request_info = {
        "method": method,
        "url": url,
        "params": params,
        "headers": headers,
        "timestamp": timestamp,
    }
    attach_json(request_info, name="Request Headers")

    if response is not None:
        response_info = {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "response_time_ms": response_time_ms,
        }
        attach_json(response_info, name="Response Headers")
