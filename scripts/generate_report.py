from datetime import datetime
import os
import json
import psycopg2
import shutil
import logging
from jinja2 import Environment, FileSystemLoader

logging.basicConfig(level=logging.INFO)

def load_roles_mapping(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    mapping = {}
    for category in data.get('categories', []):
        for role in category.get('roles', []):
            role_id = str(role.get('id'))
            role_name = role.get('name')
            if role_id and role_name:
                mapping[role_id] = role_name
    logging.info(f"Loaded {len(mapping)} role mappings from JSON")
    return mapping

def get_db_connection():
    try:
        DB_USER = os.getenv("DB_USER", "postgres")
        DB_PASS = os.getenv("DB_PASS", "password")
        DB_NAME = os.getenv("DB_NAME", "mydb")
        DB_HOST = os.getenv("DB_HOST", "postgres")
        DB_PORT = os.getenv("DB_PORT", "5432")
        database_url = os.environ.get(
            'DATABASE_URL',
            f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
        )
        conn = psycopg2.connect(database_url)
        logging.info("Database connection established")
        return conn
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
        raise

def fetch_data(mapping):
    conn = get_db_connection()
    cur = conn.cursor()

    # 1. Запрос для анализа активности (с группировкой по месяцу и опыту)
    query_activity = """
        WITH salary_normalized AS (
            SELECT
                date_trunc('month', published_at) AS month,
                archived,
                experience,
                professional_role,
                EXTRACT(DAY FROM NOW() - published_at) AS age_days
            FROM get_vacancies
            WHERE published_at IS NOT NULL
        )
        SELECT
            month,
            professional_role,
            experience,
            COUNT(*) AS vacancies_total,
            COUNT(*) FILTER (WHERE archived = true) AS vacancies_archived,
            COUNT(*) FILTER (WHERE archived = false) AS vacancies_active,
            AVG(age_days) AS avg_age_days
        FROM salary_normalized
        GROUP BY month, professional_role, experience
        ORDER BY month, professional_role, experience;
    """
    cur.execute(query_activity)
    rows_activity = cur.fetchall()

    # 2. Запрос для анализа по дням недели (без группировки по месяцам)
    query_weekday = """
        SELECT 
            professional_role as role_id,
            TRIM(TO_CHAR(published_at, 'Day')) as weekday,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE archived_at IS NOT NULL) as archived_count,
            ROUND(AVG(EXTRACT(HOUR FROM published_at)), 0) as avg_publish_hour,
            ROUND(AVG(EXTRACT(HOUR FROM archived_at)), 0) as avg_archive_hour
        FROM public.get_vacancies 
        WHERE published_at IS NOT NULL
        GROUP BY professional_role, EXTRACT(DOW FROM published_at), TO_CHAR(published_at, 'Day')
        HAVING COUNT(*) > 0
        ORDER BY professional_role, COUNT(*) DESC;
    """
    cur.execute(query_weekday)
    rows_weekday = cur.fetchall()

    cur.close()
    conn.close()

    # Словарь для хранения данных по ролям
    roles_dict = {}

    # Обработка activity данных
    for month, role_id, experience, total, archived, active, avg_age in rows_activity:
        if role_id is None:
            role_key = "NULL"
            role_name = mapping.get(role_key, "Не указана")
        else:
            role_id_str = str(role_id)
            role_key = role_id_str
            role_name = mapping.get(role_id_str, f"ID {role_id} (неизвестная роль)")

        if role_key not in roles_dict:
            roles_dict[role_key] = {
                'id': role_key,
                'name': role_name,
                'months_data': {},          # для анализа активности по месяцам
                'weekday_data': []           # для анализа по дням недели
            }

        month_str = month.strftime('%Y-%m')
        if month_str not in roles_dict[role_key]['months_data']:
            roles_dict[role_key]['months_data'][month_str] = []

        experience_display = experience if experience is not None else "Не указан"
        roles_dict[role_key]['months_data'][month_str].append({
            'experience': experience_display,
            'total': total,
            'archived': archived,
            'active': active,
            'avg_age': float(avg_age) if avg_age is not None else 0
        })

    # Обработка weekday данных
    for role_id, weekday, total, archived_count, avg_publish_hour, avg_archive_hour in rows_weekday:
        if role_id is None:
            role_key = "NULL"
        else:
            role_key = str(role_id)

        if role_key not in roles_dict:
            # Если роль не появилась в первом запросе (например, нет данных по месяцам), создаём минимальную запись
            role_name = mapping.get(role_key, f"ID {role_id} (неизвестная роль)")
            roles_dict[role_key] = {
                'id': role_key,
                'name': role_name,
                'months_data': {},
                'weekday_data': []
            }

        roles_dict[role_key]['weekday_data'].append({
            'weekday': weekday,
            'total': total,
            'archived': archived_count,
            'avg_publish_hour': int(avg_publish_hour) if avg_publish_hour is not None else None,
            'avg_archive_hour': int(avg_archive_hour) if avg_archive_hour is not None else None
        })

    # Преобразование months_data в список месяцев с записями, отсортированными по опыту
    experience_order = {
        "Нет опыта": 1,
        "От 1 года до 3 лет": 2,
        "От 3 до 6 лет": 3,
        "Более 6 лет": 4
    }
    default_order = 100

    roles_list = []
    for role_key, role_info in roles_dict.items():
        # Обработка months_data
        months_list = []
        for month_str in sorted(role_info['months_data'].keys()):
            entries = role_info['months_data'][month_str]
            entries.sort(key=lambda e: experience_order.get(e['experience'], default_order))
            max_archived = max(e['archived'] for e in entries) if entries else 0
            max_age = max(e['avg_age'] for e in entries) if entries else 0
            for e in entries:
                e['is_max_archived'] = (e['archived'] == max_archived)
                e['is_max_age'] = (e['avg_age'] == max_age)
            months_list.append({
                'month': month_str,
                'entries': entries
            })
        role_info['months'] = months_list
        # Удаляем исходный словарь, если не нужен
        del role_info['months_data']

        # Сортируем weekday_data по убыванию публикаций (как в запросе, но можно и по дню недели)
        # Здесь оставляем как есть (уже отсортировано по убыванию COUNT(*) в SQL)
        # Можно дополнительно сортировать по дню недели для красоты, но пока не будем.

        roles_list.append(role_info)

    roles_list.sort(key=lambda x: x['name'])
    return roles_list

def render_report(data):
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('report_template.html')
    logging.info(f"Template loaded from: {template.filename}")
    current_date = datetime.now().strftime("%d.%m.%Y")
    return template.render(roles=data, current_date=current_date)

def save_report(html_content):
    output_dir = '/reports'
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, 'report.html')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    logging.info(f"Report saved to {output_file}")

def copy_styles():
    src = 'static/styles.css'
    dst = os.path.join('/reports', 'styles.css')
    shutil.copy2(src, dst)
    logging.info(f"Styles copied to {dst}")

def main():
    json_path = os.environ.get('ROLES_JSON_PATH', '/app/data/professional_roles.json')
    if not os.path.exists(json_path):
        logging.error(f"Roles JSON file not found at {json_path}")
        return

    mapping = load_roles_mapping(json_path)

    logging.info("Fetching data from database...")
    data = fetch_data(mapping)
    if not data:
        logging.warning("No data found. Empty report will be generated.")
        data = []

    html = render_report(data)
    logging.info(f"Rendered HTML (first 500 chars): {html[:500]}")
    save_report(html)
    copy_styles()

if __name__ == '__main__':
    main()