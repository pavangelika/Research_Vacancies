import importlib


class _FakeCursor:
    def __init__(self, rows):
        self._rows = rows
        self.rowcount = len(rows)
        self.executed = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, query, params=None):
        self.executed.append((" ".join(query.split()), params))
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
        self.cursor_obj = _FakeCursor(rows)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def cursor(self):
        return self.cursor_obj

    def commit(self):
        return None

    def rollback(self):
        return None

    def close(self):
        self.closed = False


class _PoolConnection:
    def __init__(self):
        self.info = _FakeInfo()
        self.closed = 0
        self.commit_calls = 0
        self.rollback_calls = 0

    def commit(self):
        self.commit_calls += 1

    def rollback(self):
        self.rollback_calls += 1


class _FakePool:
    def __init__(self):
        self.connection = _PoolConnection()
        self.putconn_close_args = []

    def getconn(self):
        return self.connection

    def putconn(self, conn, close=False):
        assert conn is self.connection
        self.putconn_close_args.append(close)


class _UpdateCursor:
    def __init__(self, rows):
        self._rows = rows
        self.executed = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, query, params=None):
        self.executed.append((" ".join(query.split()), params))

    def fetchall(self):
        return list(self._rows)


class _UpdateConnection:
    def __init__(self, rows):
        self.rows = rows
        self.closed = 0
        self.commit_calls = 0
        self.rollback_calls = 0
        self.cursor_obj = _UpdateCursor(rows)

    def cursor(self):
        return self.cursor_obj

    def commit(self):
        self.commit_calls += 1

    def rollback(self):
        self.rollback_calls += 1


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
        conn = _FakeConnection(rows)
        connect_calls.append({"args": args, "kwargs": kwargs, "connection": conn})
        return conn

    monkeypatch.setattr(db.psycopg2, "connect", fake_connect)

    first = db.get_sent_resume_vacancies()
    second = db.get_sent_resume_vacancies()

    assert [item["id"] for item in first] == ["vac-1"]
    assert [item["id"] for item in second] == ["vac-1"]
    assert len(connect_calls) == 1
    assert all("ALTER TABLE get_vacancies" not in query for query, _ in connect_calls[0]["connection"].cursor_obj.executed)


def test_get_sent_resume_vacancies_does_not_run_runtime_ddl(monkeypatch):
    db = importlib.import_module("scripts.db")
    db = importlib.reload(db)

    rows = []
    fake_connection = _FakeConnection(rows)

    def fake_connect(*args, **kwargs):
        return fake_connection

    monkeypatch.setattr(db.psycopg2, "connect", fake_connect)

    db.get_sent_resume_vacancies()

    assert all("ALTER TABLE get_vacancies" not in query for query, _ in fake_connection.cursor_obj.executed)


def test_get_db_connection_closes_closed_connections(monkeypatch):
    db = importlib.import_module("scripts.db")
    db = importlib.reload(db)

    pool = _FakePool()
    monkeypatch.setattr(db, "get_db_pool", lambda: pool)

    try:
        with db.get_db_connection() as conn:
            conn.closed = 1
            raise RuntimeError("boom")
    except RuntimeError as exc:
        assert str(exc) == "boom"

    assert pool.connection.rollback_calls == 0
    assert pool.putconn_close_args == [True]


def test_update_archived_status_releases_initial_connection_before_http(monkeypatch):
    db = importlib.import_module("scripts.db")
    db = importlib.reload(db)

    current_ids = ["current-id"]
    select_conn = _UpdateConnection([("missing-id",)])
    delete_conn = _UpdateConnection([])
    connections = [select_conn, delete_conn]
    active_connections = []

    class _ConnectionManager:
        def __init__(self, conn):
            self.conn = conn

        def __enter__(self):
            active_connections.append(self.conn)
            return self.conn

        def __exit__(self, exc_type, exc, tb):
            active_connections.remove(self.conn)
            return False

    def fake_get_db_connection():
        assert connections, "unexpected extra DB connection request"
        return _ConnectionManager(connections.pop(0))

    class _Response:
        status_code = 404

    def fake_requests_get(url, timeout):
        assert active_connections == [], "DB connection leaked into HTTP request"
        return _Response()

    monkeypatch.setattr(db, "get_db_connection", fake_get_db_connection)
    monkeypatch.setattr(db, "load_dotenv", lambda: None)
    monkeypatch.setattr(db.os, "getenv", lambda key, default=None: "https://example.test/vacancies" if key == "HH_API_URL" else default)
    monkeypatch.setattr(db.requests, "get", fake_requests_get)

    db.update_archived_status(current_ids, request_delay=0, max_retries=1)

    assert select_conn.commit_calls == 0
    assert delete_conn.commit_calls == 0
    assert any("SELECT id FROM get_vacancies WHERE archived = FALSE AND id NOT IN" in query for query, _ in select_conn.cursor_obj.executed)
    assert any("DELETE FROM get_vacancies WHERE id = %s;" in query for query, _ in delete_conn.cursor_obj.executed)


def test_save_vacancies_uses_upsert_for_existing_rows(monkeypatch):
    db = importlib.import_module("scripts.db")
    db = importlib.reload(db)

    save_conn = _UpdateConnection([])

    class _ConnectionManager:
        def __init__(self, conn):
            self.conn = conn

        def __enter__(self):
            return self.conn

        def __exit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr(db, "get_db_connection", lambda: _ConnectionManager(save_conn))

    db.save_vacancies(
        [
            {
                "id": "vac-1",
                "url": "https://api.hh.ru/vacancies/1",
                "professional_role": "96",
                "name": "Python Developer",
                "employer": "Acme",
                "city": "Moscow",
                "work_format": "REMOTE",
                "salary_from": 100000,
                "salary_to": 200000,
                "currency": "RUR",
                "requirement": "Python",
                "responsibility": "APIs",
                "skills": "Python, SQL",
                "schedule": "remote",
                "experience": "1-3 years",
                "description": "Build services",
                "published_at": "2026-04-25T10:00:00+00:00",
                "created_at": "2026-04-26T10:00:00+00:00",
                "has_test": False,
                "response_letter_required": False,
                "apply_alternate_url": "https://hh.ru/applicant/vacancy_response?vacancyId=1",
            }
        ]
    )

    assert any("ON CONFLICT (id) DO UPDATE SET" in query for query, _ in save_conn.cursor_obj.executed)
