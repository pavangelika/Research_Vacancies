from tests.api.external_gate import should_run_external_api_tests


def test_should_run_external_api_tests_defaults_to_disabled(monkeypatch):
    monkeypatch.delenv("RUN_EXTERNAL_API_TESTS", raising=False)

    assert should_run_external_api_tests() is False


def test_should_run_external_api_tests_accepts_explicit_enable(monkeypatch):
    monkeypatch.setenv("RUN_EXTERNAL_API_TESTS", "1")

    assert should_run_external_api_tests() is True


def test_should_run_external_api_tests_rejects_other_truthy_values(monkeypatch):
    monkeypatch.setenv("RUN_EXTERNAL_API_TESTS", "true")

    assert should_run_external_api_tests() is False
