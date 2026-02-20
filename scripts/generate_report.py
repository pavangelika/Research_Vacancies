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
        # Исправлено: добавлен @ и параметры
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
    Получает из БД для каждой роли:
    - общее количество вакансий
    - количество открытых вакансий (archived = false)
    Возвращает список кортежей (role_id, role_name, total, open).
    """
    conn = get_db_connection()
    cur = conn.cursor()
    # Единый запрос с двумя агрегациями
    query = """
        SELECT
            professional_role,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE archived = false) as open,
            COUNT(*) FILTER (WHERE archived = true) as close
        FROM get_vacancies
        GROUP BY professional_role
        ORDER BY professional_role;
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for role_id, total, open_count, close_count in rows:
        if role_id is None:
            result.append(("NULL", "Не указана", total, open_count,close_count ))
        else:
            role_id_str = str(role_id)
            role_name = mapping.get(role_id_str, f"ID {role_id} (неизвестная роль)")
            result.append((role_id_str, role_name, total, open_count, close_count))
    return result

def render_report(data):
    """Рендерит HTML-шаблон с данными и текущей датой."""
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('report_template.html')
    logging.info(f"Template loaded from: {template.filename}")
    roles = [
        {
            'id': row[0],
            'name': row[1],
            'total': row[2],
            'open': row[3],
            'close':row[4]
        }
        for row in data
    ]
    current_date = datetime.now().strftime("%d.%m.%Y")
    return template.render(roles=roles, current_date=current_date)

def save_report(html_content):
    """Сохраняет HTML-файл отчёта."""
    output_dir = '/reports'
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, 'report.html')  # Исправлено имя
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