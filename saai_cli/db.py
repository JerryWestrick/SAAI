from datetime import datetime, date
import psycopg2
import psycopg2.extras

DB_CONFIG = {
    "dbname": "saai",
    "user": "jerry",
    "host": "/var/run/postgresql",
}


def _serialize_row(row):
    """Convert non-JSON-serializable types to strings"""
    return {k: v.isoformat() if isinstance(v, (datetime, date)) else v for k, v in row.items()}


def get_conn():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    return conn


def query(sql, params=None):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            try:
                return [_serialize_row(dict(row)) for row in cur.fetchall()]
            except psycopg2.ProgrammingError:
                return []


def execute(sql, params=None):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            try:
                return _serialize_row(dict(cur.fetchone()))
            except (psycopg2.ProgrammingError, TypeError):
                return None
