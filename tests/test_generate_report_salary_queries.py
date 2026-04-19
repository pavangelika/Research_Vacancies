import importlib.util
from pathlib import Path


class _FakeCursor:
    def __init__(self, results):
        self._results = list(results)
        self.executed = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, query):
        self.executed.append(query)

    def fetchall(self):
        if not self._results:
            return []
        return self._results.pop(0)


class _FakeConnection:
    def __init__(self, results):
        self._cursor = _FakeCursor(results)

    def cursor(self):
        return self._cursor


class _FakeConnectionManager:
    def __init__(self, results, tracker):
        self._connection = _FakeConnection(results)
        self._tracker = tracker

    def __enter__(self):
        self._tracker.append(self._connection)
        return self._connection

    def __exit__(self, exc_type, exc, tb):
        return False


def _load_generate_report_module():
    path = Path("scripts/generate_report.py").resolve()
    spec = importlib.util.spec_from_file_location("test_generate_report_salary_module", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_fetch_salary_data_runs_all_queries_via_connection_manager(monkeypatch):
    module = _load_generate_report_module()
    connections = []
    results = [[], [], []]

    def fake_get_db_connection():
        return _FakeConnectionManager(results, connections)

    monkeypatch.setattr(module, "get_db_connection", fake_get_db_connection)

    salary_data, vacancies_by_role = module.fetch_salary_data({})

    assert salary_data == []
    assert vacancies_by_role == {}
    assert len(connections) == 3
    assert all(len(conn._cursor.executed) == 1 for conn in connections)
