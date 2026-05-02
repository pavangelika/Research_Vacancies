from scripts.db import get_db_connection

with get_db_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("""
            SELECT COUNT(*)
            FROM get_vacancies
            WHERE professional_role=%s
              AND published_at >= %s AND published_at < %s
              AND archived_at >= %s AND archived_at < %s
        """, ('156','2026-04-01','2026-05-01','2026-04-01','2026-05-01'))
        c = cur.fetchone()[0]
        cur.execute("""
            SELECT COUNT(*)
            FROM get_vacancies
            WHERE professional_role=%s
              AND published_at >= %s AND published_at < %s
              AND (archived_at IS NULL OR archived_at > %s)
        """, ('156','2026-04-01','2026-05-01','2026-04-30 23:59:59'))
        active = cur.fetchone()[0]
print('april_published_and_archived', c)
print('april_published_and_active', active)
