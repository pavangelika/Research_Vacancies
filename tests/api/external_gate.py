import os


def should_run_external_api_tests():
    return os.getenv("RUN_EXTERNAL_API_TESTS", "").strip() == "1"
