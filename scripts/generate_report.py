from datetime import datetime
import os
import json
import psycopg2
import shutil
import logging
from jinja2 import Environment, FileSystemLoader

logging.basicConfig(level=logging.INFO)

def load_roles_mapping(json_path):
    """Загружает JSON с категориями и ролями, возвращает словарь {id: name}."""
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    mapping = {}
    for category in data.get('categories', []):
        for role in category.get('roles', []):
            role_id = str(role.get('id'))  # приводим к строке для надёжности
            role_name = role.get('name')
            if role_id and role_name:
                mapping[role_id] = role_name
    logging.info(f"Loaded {len(mapping)} role mappings from JSON")
    return mapping

def get_db_connection():
    try:
        DB_USER = os.getenv("DB_USER")
        DB_PASS = os.getenv("DB_PASS")
        DB_NAME = os.getenv("DB_NAME")
        database_url = os.environ.get('DATABASE_URL', f'postgresql://{DB_USER}:{DB_PASS}postgres:5432/{DB_NAME}')
        return psycopg2.connect(database_url)
        logging.info("Database connection established")
    except Exception as e:
        logging.error(e)

def fetch_data(mapping):
    conn = get_db_connection()
    cur = conn.cursor()
    # Предполагаем, что в таблице vacancies поле professional_role хранит ID роли (целое число или строка)
    query = """
            SELECT professional_role, COUNT(*) as vacancy_count
            FROM get_vacancies
            GROUP BY professional_role
            ORDER BY professional_role;
        """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    # Преобразуем: если ID есть в маппинге — подставляем имя, иначе оставляем ID как строку
    result = []
    for role_id, count in rows:
        if role_id is None:
            # Обработка NULL значений (если есть)
            result.append(("NULL", "Не указана", count))
        else:
            role_id_str = str(role_id)
            role_name = mapping.get(role_id_str, f"ID {role_id} (неизвестная роль)")
            result.append((role_id_str, role_name, count))
    return result

def render_report(data):
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('report_template.html')
    logging.info(f"Template loaded from: {template.filename}")  # посмотрим, откуда именно загружен шаблон
    roles = [{'id': row[0], 'name': row[1], 'count': row[2]} for row in data]
    current_date = datetime.now().strftime("%d.%m.%Y")
    return template.render(roles=roles, current_date=current_date)

def save_report(html_content):
    output_dir = '/reports'
    os.makedirs(output_dir, exist_ok=True)
    with open(os.path.join(output_dir, 'reports.html'), 'w', encoding='utf-8') as f:
        f.write(html_content)
    logging.info(f"Report saved to {output_dir}/reports.html")

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
        logging.warning("No data found. Empty reports will be generated.")
        data = []

    html = render_report(data)
    logging.info(f"Rendered HTML (first 500 chars): {html[:500]}")
    save_report(html)
    copy_styles()

if __name__ == '__main__':
    main()