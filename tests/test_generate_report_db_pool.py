import importlib.util
from pathlib import Path


class _FakeInfo:
    transaction_status = 0


class _FakeConnection:
    def __init__(self):
        self.info = _FakeInfo()
        self.commit_calls = 0
        self.rollback_calls = 0
        self.closed = 0

    def commit(self):
        self.commit_calls += 1

    def rollback(self):
        self.rollback_calls += 1


class _FakePool:
    def __init__(self):
        self.getconn_calls = 0
        self.putconn_calls = 0
        self.putconn_close_args = []
        self.connection = _FakeConnection()

    def getconn(self):
        self.getconn_calls += 1
        return self.connection

    def putconn(self, conn, close=False):
        assert conn is self.connection
        self.putconn_calls += 1
        self.putconn_close_args.append(close)


def _load_generate_report_module():
    path = Path("scripts/generate_report.py").resolve()
    spec = importlib.util.spec_from_file_location("test_generate_report_module", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_generate_report_reuses_single_db_pool(monkeypatch):
    module = _load_generate_report_module()

    monkeypatch.setattr(module, "_DB_POOL", None, raising=False)
    monkeypatch.setattr(module, "DB_POOL_MIN", 1, raising=False)
    monkeypatch.setattr(module, "DB_POOL_MAX", 4, raising=False)

    created_pools = []

    def fake_pool_factory(minconn, maxconn, dsn):
        pool = _FakePool()
        created_pools.append((minconn, maxconn, dsn, pool))
        return pool

    monkeypatch.setattr(module, "ThreadedConnectionPool", fake_pool_factory, raising=False)

    with module.get_db_connection() as first_conn:
        assert first_conn is created_pools[0][3].connection

    with module.get_db_connection() as second_conn:
        assert second_conn is created_pools[0][3].connection

    assert len(created_pools) == 1
    assert created_pools[0][3].getconn_calls == 2
    assert created_pools[0][3].putconn_calls == 2
    assert created_pools[0][3].putconn_close_args == [False, False]


def test_generate_report_skips_rollback_for_closed_connection(monkeypatch):
    module = _load_generate_report_module()
    pool = _FakePool()

    def fake_get_db_pool():
        return pool

    monkeypatch.setattr(module, "get_db_pool", fake_get_db_pool)

    try:
        with module.get_db_connection() as conn:
            conn.closed = 1
            raise RuntimeError("boom")
    except RuntimeError as exc:
        assert str(exc) == "boom"

    assert pool.connection.rollback_calls == 0
    assert pool.putconn_close_args == [True]
