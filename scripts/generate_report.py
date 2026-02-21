from datetime import datetime
import os
import json
import psycopg2
import shutil
import logging
from jinja2 import Environment, FileSystemLoader
from collections import defaultdict
import json as json_lib  # для сериализации данных графиков

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
    Возвращает данные для анализа активности:
    - months: помесячная статистика по опыту (для таблиц)
    - trend: данные для графика динамики (месяц -> суммарные активные, архивные, средний возраст)
    """
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
    # Для трендов собираем суммарные показатели по месяцам (без разбивки по опыту)
    trends = defaultdict(lambda: {'months': [], 'active': [], 'archived': [], 'avg_age': []})

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

        # Для тренда суммируем по месяцам (без разбивки по опыту)
        trends[role_key]['months'].append(month_str)
        # Для активных/архивных используем сумму по всем уровням опыта за этот месяц
        # Но проще пересчитать позже, когда будут все данные. Сейчас просто соберём сырые значения.
        # Позже в отдельном проходе агрегируем.

    # Второй проход: агрегация трендов
    for role_key, role_info in roles_dict.items():
        months_sorted = sorted(role_info['months_data'].keys())
        trend_data = {
            'months': months_sorted,
            'active': [],
            'archived': [],
            'avg_age': []
        }
        for month in months_sorted:
            entries = role_info['months_data'][month]
            # Суммируем active и archived
            total_active = sum(e['active'] for e in entries)
            total_archived = sum(e['archived'] for e in entries)
            # Средний возраст – средневзвешенное? Упростим: среднее по всем записям (не взвешенное)
            # Для корректности лучше в SQL считать взвешенное, но для простоты возьмём среднее из средних
            # или пересчитаем в SQL отдельно. Пока пропустим.
            # Вместо этого используем общее среднее из другого запроса, но сейчас avg_age уже есть в каждой записи.
            # Можно взять среднее из avg_age по всем записям (не совсем корректно, но приемлемо)
            avg_age_month = sum(e['avg_age'] for e in entries) / len(entries) if entries else 0
            trend_data['active'].append(total_active)
            trend_data['archived'].append(total_archived)
            trend_data['avg_age'].append(round(avg_age_month, 1))
        role_info['trend'] = trend_data

    # Порядок опыта для сортировки
    experience_order = {
        "Нет опыта": 1,
        "От 1 года до 3 лет": 2,
        "От 3 до 6 лет": 3,
        "Более 6 лет": 4
    }
    default_order = 100

    roles_list = []
    for role_key, role_info in roles_dict.items():
        months_list = []
        for month in sorted(role_info['months_data'].keys()):
            entries = role_info['months_data'][month]
            entries.sort(key=lambda e: experience_order.get(e['experience'], default_order))
            max_archived = max(e['archived'] for e in entries) if entries else 0
            max_age = max(e['avg_age'] for e in entries) if entries else 0
            for e in entries:
                e['is_max_archived'] = (e['archived'] == max_archived)
                e['is_max_age'] = (e['avg_age'] == max_age)
            months_list.append({
                'month': month,
                'entries': entries
            })
        role_info['months'] = months_list
        del role_info['months_data']
        roles_list.append(role_info)

    roles_list.sort(key=lambda x: x['name'])
    return roles_list

def fetch_weekday_data(mapping):
    """
    Возвращает данные для анализа по дням недели:
    для каждой роли список записей (день, публикации, архивации, ср. время публикации, ср. время архивации)
    """
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
        SELECT 
            professional_role as role_id,
            TRIM(TO_CHAR(published_at, 'Day')) as weekday,
            COUNT(*) as publications,
            COUNT(*) FILTER (WHERE archived_at IS NOT NULL) as archives,
            ROUND(AVG(EXTRACT(HOUR FROM published_at)), 0) || ':00' as avg_pub_hour,
            ROUND(AVG(EXTRACT(HOUR FROM archived_at)), 0) || ':00' as avg_arch_hour
        FROM public.get_vacancies 
        WHERE published_at IS NOT NULL
        GROUP BY professional_role, EXTRACT(DOW FROM published_at), TO_CHAR(published_at, 'Day')
        HAVING COUNT(*) > 0
        ORDER BY professional_role, COUNT(*) DESC;
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    weekdays_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    roles_weekdays = {}

    for role_id, weekday, publications, archives, avg_pub_hour, avg_arch_hour in rows:
        if role_id is None:
            role_key = "NULL"
            role_name = mapping.get(role_key, "Не указана")
        else:
            role_id_str = str(role_id)
            role_key = role_id_str
            role_name = mapping.get(role_id_str, f"ID {role_id} (неизвестная роль)")

        if role_key not in roles_weekdays:
            roles_weekdays[role_key] = {
                'id': role_key,
                'name': role_name,
                'weekdays': []
            }

        roles_weekdays[role_key]['weekdays'].append({
            'weekday': weekday,
            'publications': publications,
            'archives': archives,
            'avg_pub_hour': avg_pub_hour,
            'avg_arch_hour': avg_arch_hour
        })

    # Сортируем дни недели для каждой роли
    for role in roles_weekdays.values():
        role['weekdays'].sort(key=lambda x: weekdays_order.index(x['weekday']) if x['weekday'] in weekdays_order else 99)

    return list(roles_weekdays.values())

def fetch_skills_data(mapping):
    """
    Возвращает данные для анализа навыков по ролям и опыту.
    Для каждой роли список уровней опыта с топ-10 навыков.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
        WITH skill_analysis AS (
            SELECT 
                professional_role,
                experience,
                TRIM(REGEXP_REPLACE(UNNEST(STRING_TO_ARRAY(skills, ',')), '\\s+', ' ')) as skill,
                COUNT(*) OVER (PARTITION BY professional_role, experience) as vacancies_with_skills
            FROM public.get_vacancies 
            WHERE skills IS NOT NULL 
                AND skills != ''
                AND experience IS NOT NULL
                AND experience != ''
        ),
        aggregated_skills AS (
            SELECT 
                professional_role,
                experience,
                skill,
                COUNT(*) as skill_count,
                MAX(vacancies_with_skills) as total_vacancies_in_group,
                ROUND(COUNT(*) * 100.0 / MAX(vacancies_with_skills), 2) as skill_coverage_percent
            FROM skill_analysis
            GROUP BY professional_role, experience, skill
        ),
        ranked AS (
            SELECT 
                professional_role,
                experience,
                skill,
                skill_count,
                total_vacancies_in_group,
                skill_coverage_percent,
                ROW_NUMBER() OVER (
                    PARTITION BY professional_role, experience 
                    ORDER BY skill_count DESC, skill
                ) as rank_position
            FROM aggregated_skills
            WHERE skill_count >= 2
        )
        SELECT 
            professional_role as role_id,
            experience,
            skill,
            skill_count,
            total_vacancies_in_group,
            skill_coverage_percent,
            rank_position
        FROM ranked
        WHERE rank_position <= 10
        ORDER BY professional_role,
            CASE experience
                WHEN 'Нет опыта' THEN 1
                WHEN 'От 1 года до 3 лет' THEN 2
                WHEN 'От 3 до 6 лет' THEN 3
                WHEN 'Более 6 лет' THEN 4
                ELSE 5
            END,
            rank_position;
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    skills_by_role = {}
    for role_id, experience, skill, skill_count, total_vacancies, coverage, rank in rows:
        if role_id is None:
            role_key = "NULL"
        else:
            role_key = str(role_id)
        role_name = mapping.get(role_key, f"ID {role_id} (неизвестная роль)")

        if role_key not in skills_by_role:
            skills_by_role[role_key] = {
                'id': role_key,
                'name': role_name,
                'experiences': {}
            }

        if experience not in skills_by_role[role_key]['experiences']:
            skills_by_role[role_key]['experiences'][experience] = {
                'experience': experience,
                'total_vacancies': total_vacancies,
                'skills': []
            }

        # Преобразуем Decimal в float
        skills_by_role[role_key]['experiences'][experience]['skills'].append({
            'skill': skill,
            'count': skill_count,
            'coverage': float(coverage) if coverage is not None else 0.0,
            'rank': rank
        })

    # Преобразуем в удобный для шаблона формат
    result = []
    exp_order = {"Нет опыта": 1, "От 1 года до 3 лет": 2, "От 3 до 6 лет": 3, "Более 6 лет": 4}
    for role_key, role_data in skills_by_role.items():
        experiences_list = list(role_data['experiences'].values())
        experiences_list.sort(key=lambda e: exp_order.get(e['experience'], 5))
        role_data['experiences_list'] = experiences_list
        del role_data['experiences']
        result.append(role_data)

    result.sort(key=lambda x: x['name'])
    return result

def render_report(roles_data, weekday_data, skills_data):
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('report_template.html')
    current_date = datetime.now().strftime("%d.%m.%Y")

    report_data = {
        'roles': {}
    }
    for role in roles_data:
        role_id = role['id']
        report_data['roles'][role_id] = {
            'trend': role['trend'],
            'weekdays': None,
            'skills': None
        }
    for wrole in weekday_data:
        role_id = wrole['id']
        if role_id in report_data['roles']:
            report_data['roles'][role_id]['weekdays'] = wrole['weekdays']
        else:
            report_data['roles'][role_id] = {
                'trend': None,
                'weekdays': wrole['weekdays'],
                'skills': None
            }
    for srole in skills_data:
        role_id = srole['id']
        if role_id in report_data['roles']:
            report_data['roles'][role_id]['skills'] = srole['experiences_list']
        else:
            report_data['roles'][role_id] = {
                'trend': None,
                'weekdays': None,
                'skills': srole['experiences_list']
            }

    report_data_json = json_lib.dumps(report_data, ensure_ascii=False)
    return template.render(roles=roles_data, weekday_roles=weekday_data, skills_roles=skills_data,
                           current_date=current_date, report_data_json=report_data_json)

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

    logging.info("Fetching activity data...")
    roles_data = fetch_data(mapping)

    logging.info("Fetching weekday data...")
    weekday_data = fetch_weekday_data(mapping)

    logging.info("Fetching skills data...")
    skills_data = fetch_skills_data(mapping)

    if not roles_data:
        logging.warning("No activity data found.")
        roles_data = []
    if not weekday_data:
        logging.warning("No weekday data found.")
        weekday_data = []
    if not skills_data:
        logging.warning("No skills data found.")
        skills_data = []

    html = render_report(roles_data, weekday_data, skills_data)
    save_report(html)
    copy_styles()

if __name__ == '__main__':
    main()