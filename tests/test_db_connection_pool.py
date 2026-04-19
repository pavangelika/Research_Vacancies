import importlib


class _FakeCursor:
    def __init__(self, rows):
        self._rows = rows
        self.rowcount = len(rows)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, query, params=None):
        return None

    def fetchall(self):
        return list(self._rows)

    def fetchone(self):
        return self._rows[0] if self._rows else None


class _FakeInfo:
    transaction_status = 0


class _FakeConnection:
    def __init__(self, rows):
        self._rows = rows
        self.info = _FakeInfo()
        self.closed = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def cursor(self):
        return _FakeCursor(self._rows)

    def commit(self):
        return None

    def rollback(self):
        return None

    def close(self):
        self.closed = False


def test_get_sent_resume_vacancies_reuses_db_connection(monkeypatch):
    db = importlib.import_module("scripts.db")
    db = importlib.reload(db)

    monkeypatch.setattr(db, "DB_NAME", "test_db")
    monkeypatch.setattr(db, "DB_USER", "test_user")
    monkeypatch.setattr(db, "DB_PASS", "test_pass")
    monkeypatch.setattr(db, "DB_HOST", "postgres")
    monkeypatch.setattr(db, "DB_PORT", "5432")
    monkeypatch.setattr(db, "get_resolved_db_host", lambda: "postgres")
    monkeypatch.setattr(db, "_DB_POOL", None, raising=False)

    rows = [
        (
            "vac-1",
            "python",
            "Python Developer",
            "ACME",
            "Remote",
            100000,
            200000,
            "RUR",
            "Python, SQL",
            "https://example.com/apply",
            True,
            None,
            None,
            False,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        )
    ]
    connect_calls = []

    def fake_connect(*args, **kwargs):
        connect_calls.append({"args": args, "kwargs": kwargs})
        return _FakeConnection(rows)

    monkeypatch.setattr(db.psycopg2, "connect", fake_connect)

    first = db.get_sent_resume_vacancies()
    second = db.get_sent_resume_vacancies()

    assert [item["id"] for item in first] == ["vac-1"]
    assert [item["id"] for item in second] == ["vac-1"]
    assert len(connect_calls) == 1
