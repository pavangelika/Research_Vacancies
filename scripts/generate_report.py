from datetime import datetime
import os
import json
import psycopg2
import shutil
import logging
from collections import defaultdict
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

def fetch_monthly_data(mapping):
    """Собирает данные для вкладки 'Анализ активности вакансий' (помесячная статистика с возрастом)."""
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
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
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    roles_dict = {}
    for month, role_id, experience, total, archived, active, avg_age in rows:
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
                'months_data': defaultdict(list)
            }

        month_str = month.strftime('%Y-%m')
        experience_display = experience if experience is not None else "Не указан"
        roles_dict[role_key]['months_data'][month_str].append({
            'experience': experience_display,
            'total': total,
            'archived': archived,
            'active': active,
            'avg_age': float(avg_age) if avg_age is not None else 0
        })

    # Порядок опыта для сортировки
    experience_order = {
        "Нет опыта": 1,
        "От 1 года до 3 лет": 2,
        "От 3 до 6 лет": 3,
        "Более 6 лет": 4
    }
    default_order = 100

    monthly_result = []
    for role_key, role_info in roles_dict.items():
        months_list = []
        for month in sorted(role_info['months_data'].keys()):
            entries = role_info['months_data'][month]
            entries.sort(key=lambda e: experience_order.get(e['experience'], default_order))
            max_archived = max(e['archived'] for e in entries) if entries else 0
            for e in entries:
                e['is_max_archived'] = (e['archived'] == max_archived)
            months_list.append({
                'month': month,
                'entries': entries
            })
        role_info['months'] = months_list
        del role_info['months_data']
        monthly_result.append(role_info)

    monthly_result.sort(key=lambda x: x['name'])
    return monthly_result

def fetch_weekday_data(mapping):
    """Собирает данные для вкладки 'Анализ по дням недели'."""
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
        SELECT 
          professional_role as role_id,
          TRIM(TO_CHAR(published_at, 'Day')) as day_name,
          EXTRACT(DOW FROM published_at) as day_num,
          COUNT(*) as total_published,
          COUNT(*) FILTER (WHERE archived_at IS NOT NULL) as total_archived,
          ROUND(AVG(EXTRACT(HOUR FROM published_at)), 0) || ':00' as avg_pub_hour,
          ROUND(AVG(EXTRACT(HOUR FROM archived_at)), 0) || ':00' as avg_arch_hour
        FROM public.get_vacancies 
        WHERE published_at IS NOT NULL
        GROUP BY professional_role, day_name, day_num
        HAVING COUNT(*) > 0
        ORDER BY professional_role, day_num;
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    roles_dict = {}
    for role_id, day_name, day_num, total_pub, total_arch, avg_pub, avg_arch in rows:
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
                'weekdays': []
            }

        roles_dict[role_key]['weekdays'].append({
            'day': day_name,
            'day_num': day_num,
            'published': total_pub,
            'archived': total_arch,
            'avg_pub_time': avg_pub,
            'avg_arch_time': avg_arch
        })

    # Сортируем дни недели
    for role_info in roles_dict.values():
        role_info['weekdays'].sort(key=lambda x: x['day_num'])

    result = list(roles_dict.values())
    result.sort(key=lambda x: x['name'])
    return result

def render_report(monthly_data, weekday_data):
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('report_template.html')
    logging.info(f"Template loaded from: {template.filename}")
    current_date = datetime.now().strftime("%d.%m.%Y")
    return template.render(monthly_roles=monthly_data, weekday_roles=weekday_data, current_date=current_date)

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

    logging.info("Fetching monthly data...")
    monthly_data = fetch_monthly_data(mapping)

    logging.info("Fetching weekday data...")
    weekday_data = fetch_weekday_data(mapping)

    if not monthly_data and not weekday_data:
        logging.warning("No data found. Empty report will be generated.")
        monthly_data = []
        weekday_data = []

    html = render_report(monthly_data, weekday_data)
    logging.info(f"Rendered HTML (first 500 chars): {html[:500]}")
    save_report(html)
    copy_styles()

if __name__ == '__main__':
    main()