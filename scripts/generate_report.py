from datetime import datetime
import os
import json
import psycopg2
import shutil
import logging
from jinja2 import Environment, FileSystemLoader

logging.basicConfig(level=logging.INFO)

def load_roles_mapping(json_path):
    """Загружает JSON и возвращает словарь {id: name}."""
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
    """Устанавливает соединение с PostgreSQL."""
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
    """
    Выполняет запрос с помесячной статистикой по ролям.
    Возвращает список словарей:
        {
            'id': role_id,
            'name': role_name,
            'monthly': [
                {'month': '2025-01', 'total': 10, 'archived': 2, 'active': 8},
                ...
            ]
        }
    """
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
        WITH salary_normalized AS (
            SELECT
                date_trunc('month', published_at) AS month,
                archived,
                professional_role        
            FROM get_vacancies
            WHERE published_at IS NOT NULL
        )
        SELECT
            month,
            professional_role,
            COUNT(*) AS vacancies_total,
            COUNT(*) FILTER (WHERE archived = true) AS vacancies_archived,
            COUNT(*) FILTER (WHERE archived = false) AS vacancies_active
        FROM salary_normalized
        GROUP BY month, professional_role
        ORDER BY month, professional_role;
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    roles_dict = {}
    for month, role_id, total, archived, active in rows:
        # Определяем ключ и имя роли
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
                'monthly': []
            }

        # Форматируем месяц как строку (ГГГГ-ММ)
        month_str = month.strftime('%Y-%m')
        roles_dict[role_key]['monthly'].append({
            'month': month_str,
            'total': total,
            'archived': archived,
            'active': active
        })

    # Преобразуем в список и сортируем по имени роли
    roles_list = list(roles_dict.values())
    roles_list.sort(key=lambda x: x['name'])
    return roles_list

def render_report(roles_data):
    """Рендерит HTML-шаблон с данными и текущей датой."""
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('report_template.html')
    logging.info(f"Template loaded from: {template.filename}")
    current_date = datetime.now().strftime("%d.%m.%Y")
    return template.render(roles=roles_data, current_date=current_date)

def save_report(html_content):
    """Сохраняет HTML-файл отчёта."""
    output_dir = '/reports'
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, 'report.html')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    logging.info(f"Report saved to {output_file}")

def copy_styles():
    """Копирует файл стилей в папку с отчётом."""
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