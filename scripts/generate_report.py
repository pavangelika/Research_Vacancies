from datetime import datetime
import os
import json
import psycopg2
import shutil
import logging
import urllib.request
from jinja2 import Environment, FileSystemLoader
from collections import defaultdict

logging.basicConfig(level=logging.INFO)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
REPORTS_DIR = os.path.join(PROJECT_ROOT, 'reports')
REPORT_TEMPLATES_DIR = os.path.join(REPORTS_DIR, 'templates')
REPORT_STATIC_DIR = os.path.join(REPORTS_DIR, 'static')

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


def load_hh_areas(cache_path):
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    url = 'https://api.hh.ru/areas'
    logging.info(f"Fetching HH areas from {url}")
    with urllib.request.urlopen(url) as resp:
        raw = resp.read().decode('utf-8')
    data = json.loads(raw)
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    with open(cache_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
    return data


def build_city_country_map(areas):
    def _norm_city(name):
        return name.strip().casefold() if isinstance(name, str) else ''

    city_to_countries = defaultdict(set)
    country_names = set()
    other_regions_cities = set()

    def walk(area, country_name):
        if not area:
            return
        name = area.get('name')
        if name:
            city_to_countries[_norm_city(name)].add(country_name)
        for child in area.get('areas') or []:
            walk(child, country_name)

    for country in areas or []:
        cname = country.get('name')
        if not cname:
            continue
        if cname == '?????? ???????':
            def add_all_as_countries(area):
                if not area:
                    return
                name = area.get('name')
                if name:
                    country_names.add(name)
                country_names.add(_norm_city(name))
                for child in area.get('areas') or []:
                    add_all_as_countries(child)

            for child in country.get('areas') or []:
                add_all_as_countries(child)
                walk(child, child.get('name') or '')
            continue
        country_names.add(cname)
        walk(country, cname)

    return city_to_countries, country_names, other_regions_cities

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
    - months: помесячная статистика по опыту (для таблиц), включая сводный месяц и итоговую строку "Всего"
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
                published_at,
                archived_at,
                CASE
                    WHEN archived = true THEN EXTRACT(EPOCH FROM (COALESCE(archived_at, NOW()) - published_at)) / 86400.0
                    ELSE NULL
                END AS age_days
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
            'avg_age': float(avg_age) if avg_age is not None else None
        })

        trends[role_key]['months'].append(month_str)

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
            total_active = sum(e['active'] for e in entries)
            total_archived = sum(e['archived'] for e in entries)
            age_vals = [e['avg_age'] for e in entries if e['avg_age'] is not None]
            avg_age_month = sum(age_vals) / len(age_vals) if age_vals else None
            trend_data['active'].append(total_active)
            trend_data['archived'].append(total_archived)
            trend_data['avg_age'].append(round(avg_age_month, 1) if avg_age_month is not None else None)
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
        # Сначала формируем список обычных месяцев
        months_list = []
        for month in sorted(role_info['months_data'].keys()):
            entries = role_info['months_data'][month]
            entries.sort(key=lambda e: experience_order.get(e['experience'], default_order))
            max_archived = max(e['archived'] for e in entries) if entries else 0
            age_vals = [e['avg_age'] for e in entries if e['avg_age'] is not None]
            max_age = max(age_vals) if age_vals else None
            for e in entries:
                e['is_max_archived'] = (e['archived'] == max_archived)
                e['is_max_age'] = (max_age is not None and e['avg_age'] == max_age)

            # Добавляем итоговую строку "Всего" для текущего месяца
            total_entry = {
                'experience': 'Всего',
                'total': sum(e['total'] for e in entries),
                'archived': sum(e['archived'] for e in entries),
                'active': sum(e['active'] for e in entries),
                'avg_age': (sum(age_vals) / len(age_vals) if age_vals else None),
                'is_max_archived': False,
                'is_max_age': False
            }
            entries.append(total_entry)

            months_list.append({
                'month': month,
                'entries': entries
            })

        # --- Добавляем сводный месяц ---
        # Агрегируем данные по всем месяцам (без учёта итоговых строк "Всего")
        agg_exp = {}
        for month_data in months_list:
            for entry in month_data['entries']:
                if entry['experience'] == 'Всего':
                    continue  # пропускаем итоговые строки
                exp = entry['experience']
                if exp not in agg_exp:
                    agg_exp[exp] = {
                        'total': 0,
                        'archived': 0,
                        'active': 0,
                        'avg_age_sum': 0,
                        'count': 0
                    }
                agg_exp[exp]['total'] += entry['total']
                agg_exp[exp]['archived'] += entry['archived']
                agg_exp[exp]['active'] += entry['active']
                if entry['avg_age'] is not None:
                    agg_exp[exp]['avg_age_sum'] += entry['avg_age']
                    agg_exp[exp]['count'] += 1

        # Формируем записи для сводного месяца
        all_entries = []
        for exp, vals in agg_exp.items():
            avg_age = vals['avg_age_sum'] / vals['count'] if vals['count'] > 0 else None
            all_entries.append({
                'experience': exp,
                'total': vals['total'],
                'archived': vals['archived'],
                'active': vals['active'],
                'avg_age': avg_age
            })

        # Сортируем по опыту
        all_entries.sort(key=lambda e: experience_order.get(e['experience'], default_order))

        # Вычисляем максимумы для сводного месяца
        if all_entries:
            max_archived = max(e['archived'] for e in all_entries)
            age_vals = [e['avg_age'] for e in all_entries if e['avg_age'] is not None]
            max_age = max(age_vals) if age_vals else None
            for e in all_entries:
                e['is_max_archived'] = (e['archived'] == max_archived)
                e['is_max_age'] = (max_age is not None and e['avg_age'] == max_age)

        # Добавляем итоговую строку "Всего" для сводного месяца
        total_all = {
            'experience': 'Всего',
            'total': sum(e['total'] for e in all_entries),
            'archived': sum(e['archived'] for e in all_entries),
            'active': sum(e['active'] for e in all_entries),
            'avg_age': None,
            'is_max_archived': False,
            'is_max_age': False
        }
        total_age_vals = [e['avg_age'] for e in all_entries if e['avg_age'] is not None]
        if total_age_vals:
            total_all['avg_age'] = sum(total_age_vals) / len(total_age_vals)
        all_entries.append(total_all)

        # Определяем количество месяцев для этой роли
        num_months = len(months_list)
        if num_months == 1:
            month_title = "За 1 месяц"
        elif 2 <= num_months <= 4:
            month_title = f"За {num_months} месяца"
        else:
            month_title = f"За {num_months} месяцев"

        # Создаём запись сводного месяца и вставляем в начало
        summary_month = {
            'month': month_title,
            'entries': all_entries
        }
        months_list.insert(0, summary_month)

        # Сохраняем обновлённый список месяцев
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

def fetch_skills_monthly_data(mapping):
    """
    Возвращает данные для анализа навыков по ролям, опыту и месяцам.
    Для каждой роли список месяцев, внутри каждого месяца список уровней опыта,
    а внутри каждого опыта – топ-15 навыков.
    В начало списка месяцев добавляется сводный месяц с агрегированными
    данными по всем месяцам, с названием вида "За N мес.".
    """
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
        WITH skill_analysis AS (
            SELECT
                id,
                professional_role,
                experience,
                date_trunc('month', published_at) AS month,
                TRIM(REGEXP_REPLACE(UNNEST(STRING_TO_ARRAY(skills, ',')), '\\s+', ' ')) AS skill
            FROM public.get_vacancies
            WHERE skills IS NOT NULL
              AND skills != ''
              AND experience IS NOT NULL
              AND experience != ''
        ),
        group_stats AS (
            SELECT
                professional_role,
                experience,
                month,
                COUNT(DISTINCT id) AS total_vacancies_in_group
            FROM skill_analysis
            GROUP BY professional_role, experience, month
        ),
        aggregated_skills AS (
            SELECT
                sa.professional_role,
                sa.experience,
                sa.month,
                sa.skill,
                COUNT(*) AS skill_count,
                gs.total_vacancies_in_group,
                ROUND(COUNT(*) * 100.0 / gs.total_vacancies_in_group, 2) AS skill_coverage_percent
            FROM skill_analysis sa
            JOIN group_stats gs
                ON sa.professional_role = gs.professional_role
                AND sa.experience = gs.experience
                AND sa.month = gs.month
            GROUP BY sa.professional_role, sa.experience, sa.month, sa.skill, gs.total_vacancies_in_group
        ),
        ranked AS (
            SELECT
                professional_role,
                experience,
                month,
                skill,
                skill_count,
                total_vacancies_in_group,
                skill_coverage_percent,
                ROW_NUMBER() OVER (
                    PARTITION BY professional_role, experience, month
                    ORDER BY skill_count DESC, skill
                ) AS rank_position
            FROM aggregated_skills
            WHERE skill_count >= 2
        )
        SELECT
            professional_role as role_id,
            experience,
            month,
            skill,
            skill_count,
            total_vacancies_in_group,
            skill_coverage_percent,
            rank_position
        FROM ranked
        WHERE rank_position <= 15
        ORDER BY
            professional_role,
            CASE experience
                WHEN 'Нет опыта' THEN 1
                WHEN 'От 1 года до 3 лет' THEN 2
                WHEN 'От 3 до 6 лет' THEN 3
                WHEN 'Более 6 лет' THEN 4
                ELSE 5
            END,
            month,
            rank_position;
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    # Организуем данные: role -> month -> experience -> список навыков
    skills_by_role = {}
    for role_id, experience, month, skill, skill_count, total_vacancies, coverage, rank in rows:
        if role_id is None:
            role_key = "NULL"
        else:
            role_key = str(role_id)
        role_name = mapping.get(role_key, f"ID {role_id} (неизвестная роль)")
        month_str = month.strftime('%Y-%m')

        if role_key not in skills_by_role:
            skills_by_role[role_key] = {
                'id': role_key,
                'name': role_name,
                'months': {}
            }

        if month_str not in skills_by_role[role_key]['months']:
            skills_by_role[role_key]['months'][month_str] = {}

        if experience not in skills_by_role[role_key]['months'][month_str]:
            skills_by_role[role_key]['months'][month_str][experience] = {
                'experience': experience,
                'total_vacancies': total_vacancies,
                'skills': []
            }

        skills_by_role[role_key]['months'][month_str][experience]['skills'].append({
            'skill': skill,
            'count': skill_count,
            'coverage': float(coverage) if coverage is not None else 0.0,
            'rank': rank
        })

    # Агрегируем данные по всем месяцам для каждой роли и опыта
    exp_order = {"Нет опыта": 1, "От 1 года до 3 лет": 2, "От 3 до 6 лет": 3, "Более 6 лет": 4}

    for role_key, role_data in skills_by_role.items():
        # Словарь для агрегатов: опыт -> общее количество вакансий и навыков
        agg_exp = {}
        for month_str, exp_dict in role_data['months'].items():
            for exp_name, exp_data in exp_dict.items():
                if exp_name not in agg_exp:
                    agg_exp[exp_name] = {
                        'total_vacancies': 0,
                        'skills': defaultdict(int)
                    }
                agg_exp[exp_name]['total_vacancies'] += exp_data['total_vacancies']
                for skill_item in exp_data['skills']:
                    agg_exp[exp_name]['skills'][skill_item['skill']] += skill_item['count']

        # Формируем список опыта для сводного месяца
        all_experiences = []
        for exp_name, exp_agg in agg_exp.items():
            total = exp_agg['total_vacancies']
            # Преобразуем навыки в список и сортируем по убыванию частоты
            skills_list = []
            for skill, count in exp_agg['skills'].items():
                coverage = round(count * 100.0 / total, 2) if total > 0 else 0
                skills_list.append({
                    'skill': skill,
                    'count': count,
                    'coverage': coverage,
                    'rank': 0  # ранг не нужен для отображения
                })
            skills_list.sort(key=lambda x: (-x['count'], x['skill']))
            skills_list = skills_list[:15]  # топ-15
            all_experiences.append({
                'experience': exp_name,
                'total_vacancies': total,
                'skills': skills_list
            })

        # Сортируем опыты по заданному порядку
        all_experiences.sort(key=lambda e: exp_order.get(e['experience'], 5))

        # Определяем количество месяцев для этой роли
        num_months = len(role_data['months'])
        # Формируем название сводного месяца
        if num_months == 1:
            month_title = "За 1 месяц"
        elif 2 <= num_months <= 4:
            month_title = f"За {num_months} месяца"
        else:
            month_title = f"За {num_months} месяцев"

        # Создаём запись для сводного месяца
        all_month_entry = {
            'month': month_title,
            'experiences': all_experiences
        }

        # Добавляем сводный месяц в начало списка
        months_list = [all_month_entry]

        # Добавляем остальные месяцы, отсортированные по дате
        for month_str in sorted(role_data['months'].keys()):
            exp_dict = role_data['months'][month_str]
            exp_list = list(exp_dict.values())
            exp_list.sort(key=lambda e: exp_order.get(e['experience'], 5))
            months_list.append({
                'month': month_str,
                'experiences': exp_list
            })

        role_data['months_list'] = months_list
        del role_data['months']

    # Преобразуем в список для шаблона и сортируем по имени роли
    result = list(skills_by_role.values())
    result.sort(key=lambda x: x['name'])

    return result

def fetch_salary_data(mapping):
    """
    Возвращает данные для анализа зарплат архивных и открытых вакансий с топ-навыками
    по профессиональным ролям, опыту и месяцам с разделением по статусу.
    Для каждой роли список месяцев, внутри каждого месяца список уровней опыта,
    а внутри каждого опыта – список записей (для статусов и валют) с полной статистикой.
    В начало списка месяцев добавляется сводный месяц с агрегированными данными по всем месяцам.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    def _display_currency(currency):
        if currency == 'RUR':
            return 'RUR'
        if currency == 'USD':
            return 'USD'
        if currency is None:
            return None
        return '%USD'

    # Основной запрос для помесячной статистики (добавлен id и vacancy_ids)
    query_monthly = """
        WITH 
        currency_rates AS (
            SELECT 'RUR' as currency, 1.0 as rate_to_usd
            UNION ALL SELECT 'USD', 1.0
            UNION ALL SELECT 'EUR', 1.08
            UNION ALL SELECT 'KZT', 0.0021
            UNION ALL SELECT 'BYR', 0.00031
            UNION ALL SELECT 'UZS', 0.000079
            UNION ALL SELECT 'AZN', 0.59
            UNION ALL SELECT 'KGS', 0.011
        ),
        base_data AS (
            SELECT 
                id,
                professional_role,
                experience,
                DATE_TRUNC('month', published_at) as month_start,
                currency,
                archived,
                skills,
                CASE 
                    WHEN salary_from IS NOT NULL AND salary_to IS NOT NULL THEN (salary_from + salary_to) / 2.0
                    WHEN salary_from IS NOT NULL THEN salary_from::numeric
                    WHEN salary_to IS NOT NULL THEN salary_to::numeric
                    ELSE NULL
                END as calculated_salary
            FROM get_vacancies
            WHERE published_at IS NOT NULL
              AND professional_role IS NOT NULL
              AND experience IS NOT NULL
        ),
        converted_data AS (
            SELECT 
                bd.id,
                bd.professional_role,
                bd.experience,
                bd.month_start,
                bd.currency,
                bd.archived,
                bd.skills,
                bd.calculated_salary,
                CASE 
                    WHEN bd.currency IN ('RUR', 'USD') THEN bd.calculated_salary
                    ELSE bd.calculated_salary * COALESCE(cr.rate_to_usd, 1.0)
                END as converted_salary,
                CASE 
                    WHEN bd.currency = 'RUR' THEN 'RUR'
                    WHEN bd.currency = 'USD' THEN 'USD'
                    ELSE '%USD'
                END as display_currency
            FROM base_data bd
            LEFT JOIN currency_rates cr ON bd.currency = cr.currency
            WHERE bd.calculated_salary IS NOT NULL
        ),
        skills_split AS (
            SELECT 
                cd.id,
                cd.professional_role,
                cd.experience,
                cd.month_start,
                cd.display_currency,
                cd.archived,
                cd.converted_salary,
                TRIM(BOTH ' ' FROM unnest(string_to_array(cd.skills, ','))) as skill
            FROM converted_data cd
            WHERE cd.skills IS NOT NULL AND cd.skills != ''
        ),
        skills_aggregated AS (
            SELECT 
                professional_role,
                experience,
                month_start,
                display_currency,
                archived,
                skill,
                COUNT(*) as skill_count,
                array_agg(DISTINCT id) as skill_vacancy_ids  -- ids вакансий для навыка
            FROM skills_split
            GROUP BY professional_role, experience, month_start, display_currency, archived, skill
        ),
        top_skills AS (
            SELECT 
                professional_role,
                experience,
                month_start,
                display_currency,
                archived,
                STRING_AGG(skill || ' (' || skill_count || ')', ', ' ORDER BY skill_count DESC, skill) as top_skills_list,
                array_agg(skill_vacancy_ids) as top_skills_vacancy_ids  -- массив массивов id для топ-10 навыков
            FROM (
                SELECT 
                    *,
                    ROW_NUMBER() OVER (
                        PARTITION BY professional_role, experience, month_start, display_currency, archived 
                        ORDER BY skill_count DESC, skill
                    ) as skill_rank
                FROM skills_aggregated
            ) ranked_skills
            WHERE skill_rank <= 10
            GROUP BY professional_role, experience, month_start, display_currency, archived
        ),
        aggregated AS (
            SELECT 
                cd.professional_role,
                cd.experience,
                cd.month_start,
                cd.display_currency,
                cd.archived,
                COUNT(*) as count_with_salary,
                AVG(cd.converted_salary) as avg_salary,
                MIN(cd.converted_salary) as min_salary,
                MAX(cd.converted_salary) as max_salary,
                array_agg(cd.converted_salary ORDER BY cd.converted_salary) as salary_values,
                array_agg(DISTINCT cd.id) as vacancy_ids  -- список id вакансий в группе
            FROM converted_data cd
            GROUP BY cd.professional_role, cd.experience, cd.month_start, cd.display_currency, cd.archived
        )
        SELECT 
            a.professional_role as role_id,
            a.experience,
            TO_CHAR(a.month_start, 'YYYY-MM') as month,
            a.display_currency,
            CASE 
                WHEN a.archived THEN 'Архивная'
                ELSE 'Открытая'
            END as vacancy_status,
            (
                SELECT COUNT(*)
                FROM base_data bd2
                WHERE bd2.professional_role = a.professional_role
                  AND bd2.experience = a.experience
                  AND bd2.month_start = a.month_start
                  AND bd2.archived = a.archived
                  AND (
                      bd2.currency IS NULL OR 
                      CASE 
                          WHEN bd2.currency = 'RUR' THEN 'RUR'
                          WHEN bd2.currency = 'USD' THEN 'USD'
                          ELSE '%USD'
                      END = a.display_currency
                  )
            ) as total_vacancies,
            a.count_with_salary as vacancies_with_salary,
            ROUND(
                (a.count_with_salary::numeric / NULLIF(
                    (
                        SELECT COUNT(*)
                        FROM base_data bd2
                        WHERE bd2.professional_role = a.professional_role
                          AND bd2.experience = a.experience
                          AND bd2.month_start = a.month_start
                          AND bd2.archived = a.archived
                          AND (
                              bd2.currency IS NULL OR 
                              CASE 
                                  WHEN bd2.currency = 'RUR' THEN 'RUR'
                                  WHEN bd2.currency = 'USD' THEN 'USD'
                                  ELSE '%USD'
                              END = a.display_currency
                          )
                    ), 0
                ) * 100)::numeric, 2
            ) as salary_percentage,
            ROUND(a.avg_salary::numeric, 2) as average_salary,
            (
                CASE 
                    WHEN array_length(a.salary_values, 1) % 2 = 1 THEN
                        a.salary_values[(array_length(a.salary_values, 1) + 1) / 2]
                    ELSE
                        (a.salary_values[array_length(a.salary_values, 1) / 2] + 
                         a.salary_values[array_length(a.salary_values, 1) / 2 + 1]) / 2
                END
            ) as median_salary,
            (
                SELECT cd.converted_salary
                FROM converted_data cd
                WHERE cd.professional_role = a.professional_role
                  AND cd.experience = a.experience
                  AND cd.month_start = a.month_start
                  AND cd.display_currency = a.display_currency
                  AND cd.archived = a.archived
                GROUP BY cd.converted_salary
                ORDER BY COUNT(*) DESC, cd.converted_salary
                LIMIT 1
            ) as mode_salary,
            ROUND(a.min_salary::numeric, 2) as min_salary,
            ROUND(a.max_salary::numeric, 2) as max_salary,
            -- Убрано salary_range
            COALESCE(ts.top_skills_list, 'Нет данных о навыках') as top_skills,
            a.vacancy_ids  -- добавляем список id вакансий
        FROM aggregated a
        LEFT JOIN top_skills ts ON 
            ts.professional_role = a.professional_role
            AND ts.experience = a.experience
            AND ts.month_start = a.month_start
            AND ts.display_currency = a.display_currency
            AND ts.archived = a.archived
        ORDER BY a.professional_role, a.experience, a.month_start, a.display_currency, a.archived;
    """
    cur.execute(query_monthly)
    rows_monthly = cur.fetchall()

    # Запрос для общих данных по всем месяцам (для сводного месяца) – аналогичные изменения
    query_total = """
        WITH 
        currency_rates AS (
            SELECT 'RUR' as currency, 1.0 as rate_to_usd
            UNION ALL SELECT 'USD', 1.0
            UNION ALL SELECT 'EUR', 1.08
            UNION ALL SELECT 'KZT', 0.0021
            UNION ALL SELECT 'BYR', 0.00031
            UNION ALL SELECT 'UZS', 0.000079
            UNION ALL SELECT 'AZN', 0.59
            UNION ALL SELECT 'KGS', 0.011
        ),
        base_data AS (
            SELECT 
                id,
                professional_role,
                experience,
                currency,
                archived,
                skills,
                CASE 
                    WHEN salary_from IS NOT NULL AND salary_to IS NOT NULL THEN (salary_from + salary_to) / 2.0
                    WHEN salary_from IS NOT NULL THEN salary_from::numeric
                    WHEN salary_to IS NOT NULL THEN salary_to::numeric
                    ELSE NULL
                END as calculated_salary
            FROM get_vacancies
            WHERE published_at IS NOT NULL
              AND professional_role IS NOT NULL
              AND experience IS NOT NULL
        ),
        converted_data AS (
            SELECT 
                bd.id,
                bd.professional_role,
                bd.experience,
                bd.currency,
                bd.archived,
                bd.skills,
                bd.calculated_salary,
                CASE 
                    WHEN bd.currency IN ('RUR', 'USD') THEN bd.calculated_salary
                    ELSE bd.calculated_salary * COALESCE(cr.rate_to_usd, 1.0)
                END as converted_salary,
                CASE 
                    WHEN bd.currency = 'RUR' THEN 'RUR'
                    WHEN bd.currency = 'USD' THEN 'USD'
                    ELSE '%USD'
                END as display_currency
            FROM base_data bd
            LEFT JOIN currency_rates cr ON bd.currency = cr.currency
            WHERE bd.calculated_salary IS NOT NULL
        ),
        skills_split AS (
            SELECT 
                cd.id,
                cd.professional_role,
                cd.experience,
                cd.display_currency,
                cd.archived,
                cd.converted_salary,
                TRIM(BOTH ' ' FROM unnest(string_to_array(cd.skills, ','))) as skill
            FROM converted_data cd
            WHERE cd.skills IS NOT NULL AND cd.skills != ''
        ),
        skills_aggregated AS (
            SELECT 
                professional_role,
                experience,
                display_currency,
                archived,
                skill,
                COUNT(*) as skill_count,
                array_agg(DISTINCT id) as skill_vacancy_ids
            FROM skills_split
            GROUP BY professional_role, experience, display_currency, archived, skill
        ),
        top_skills AS (
            SELECT 
                professional_role,
                experience,
                display_currency,
                archived,
                STRING_AGG(skill || ' (' || skill_count || ')', ', ' ORDER BY skill_count DESC, skill) as top_skills_list,
                array_agg(skill_vacancy_ids) as top_skills_vacancy_ids
            FROM (
                SELECT 
                    *,
                    ROW_NUMBER() OVER (
                        PARTITION BY professional_role, experience, display_currency, archived 
                        ORDER BY skill_count DESC, skill
                    ) as skill_rank
                FROM skills_aggregated
            ) ranked_skills
            WHERE skill_rank <= 10
            GROUP BY professional_role, experience, display_currency, archived
        ),
        aggregated AS (
            SELECT 
                cd.professional_role,
                cd.experience,
                cd.display_currency,
                cd.archived,
                COUNT(*) as count_with_salary,
                AVG(cd.converted_salary) as avg_salary,
                MIN(cd.converted_salary) as min_salary,
                MAX(cd.converted_salary) as max_salary,
                array_agg(cd.converted_salary ORDER BY cd.converted_salary) as salary_values,
                array_agg(DISTINCT cd.id) as vacancy_ids
            FROM converted_data cd
            GROUP BY cd.professional_role, cd.experience, cd.display_currency, cd.archived
        )
        SELECT 
            a.professional_role as role_id,
            a.experience,
            a.display_currency,
            CASE WHEN a.archived THEN 'Архивная' ELSE 'Открытая' END as vacancy_status,
            (
                SELECT COUNT(*)
                FROM base_data bd2
                WHERE bd2.professional_role = a.professional_role
                  AND bd2.experience = a.experience
                  AND bd2.archived = a.archived
                  AND (
                      bd2.currency IS NULL OR 
                      CASE 
                          WHEN bd2.currency = 'RUR' THEN 'RUR'
                          WHEN bd2.currency = 'USD' THEN 'USD'
                          ELSE '%USD'
                      END = a.display_currency
                  )
            ) as total_vacancies,
            a.count_with_salary as vacancies_with_salary,
            ROUND(
                (a.count_with_salary::numeric / NULLIF(
                    (
                        SELECT COUNT(*)
                        FROM base_data bd2
                        WHERE bd2.professional_role = a.professional_role
                          AND bd2.experience = a.experience
                          AND bd2.archived = a.archived
                          AND (
                              bd2.currency IS NULL OR 
                              CASE 
                                  WHEN bd2.currency = 'RUR' THEN 'RUR'
                                  WHEN bd2.currency = 'USD' THEN 'USD'
                                  ELSE '%USD'
                              END = a.display_currency
                          )
                    ), 0
                ) * 100)::numeric, 2
            ) as salary_percentage,
            ROUND(a.avg_salary::numeric, 2) as average_salary,
            (
                CASE 
                    WHEN array_length(a.salary_values, 1) % 2 = 1 THEN
                        a.salary_values[(array_length(a.salary_values, 1) + 1) / 2]
                    ELSE
                        (a.salary_values[array_length(a.salary_values, 1) / 2] + 
                         a.salary_values[array_length(a.salary_values, 1) / 2 + 1]) / 2
                END
            ) as median_salary,
            (
                SELECT cd.converted_salary
                FROM converted_data cd
                WHERE cd.professional_role = a.professional_role
                  AND cd.experience = a.experience
                  AND cd.display_currency = a.display_currency
                  AND cd.archived = a.archived
                GROUP BY cd.converted_salary
                ORDER BY COUNT(*) DESC, cd.converted_salary
                LIMIT 1
            ) as mode_salary,
            ROUND(a.min_salary::numeric, 2) as min_salary,
            ROUND(a.max_salary::numeric, 2) as max_salary,
            -- Убрано salary_range
            COALESCE(ts.top_skills_list, 'Нет данных о навыках') as top_skills,
            a.vacancy_ids
        FROM aggregated a
        LEFT JOIN top_skills ts ON 
            ts.professional_role = a.professional_role
            AND ts.experience = a.experience
            AND ts.display_currency = a.display_currency
            AND ts.archived = a.archived
        ORDER BY a.professional_role, a.experience, a.display_currency, a.archived;
    """
    cur.execute(query_total)
    rows_total = cur.fetchall()

    query_vacancies = """
        SELECT
            v.id,
            v.name,
            v.employer,
            v.city,
            v.salary_from,
            v.salary_to,
            v.currency,
            v.skills,
            v.requirement,
            v.responsibility,
            v.apply_alternate_url,
            v.professional_role,
            v.experience,
            v.archived,
            v.archived_at,
            v.published_at,
            e.accredited_it_employer,
            e.rating,
            e.trusted,
            e.employer_url
        FROM get_vacancies v
        LEFT JOIN public.employers e ON e.name = v.employer
        WHERE v.published_at IS NOT NULL
          AND v.professional_role IS NOT NULL
          AND v.experience IS NOT NULL;
    """
    cur.execute(query_vacancies)
    vacancy_rows = cur.fetchall()
    cur.close()
    conn.close()

    # Обработка помесячных данных
    salary_by_role = {}
    for row in rows_monthly:
        (role_id, experience, month, currency, status, total_vacancies,
         vacancies_with_salary, salary_percentage, avg_salary, median_salary,
         mode_salary, min_salary, max_salary, top_skills, vacancy_ids) = row

        if role_id is None:
            role_key = "NULL"
        else:
            role_key = str(role_id)
        role_name = mapping.get(role_key, f"ID {role_id} (неизвестная роль)")

        if role_key not in salary_by_role:
            salary_by_role[role_key] = {
                'id': role_key,
                'name': role_name,
                'months': {}
            }

        if month not in salary_by_role[role_key]['months']:
            salary_by_role[role_key]['months'][month] = {}

        if experience not in salary_by_role[role_key]['months'][month]:
            salary_by_role[role_key]['months'][month][experience] = {
                'experience': experience,
                'entries': []
            }

        # Преобразуем массив id в список Python
        vacancy_ids_list = list(vacancy_ids) if vacancy_ids else []

        entry = {
            'status': status,
            'currency': currency,
            'total_vacancies': total_vacancies,
            'vacancies_with_salary': vacancies_with_salary,
            'salary_percentage': float(salary_percentage) if salary_percentage else 0,
            'avg_salary': float(avg_salary) if avg_salary else 0,
            'median_salary': float(median_salary) if median_salary else 0,
            'mode_salary': float(mode_salary) if mode_salary else 0,
            'min_salary': float(min_salary) if min_salary else 0,
            'max_salary': float(max_salary) if max_salary else 0,
            'top_skills': top_skills,
            'vacancy_ids': vacancy_ids_list,  # добавляем список id
            'vacancies_with_salary_list': [],
            'vacancies_without_salary_list': []
        }
        salary_by_role[role_key]['months'][month][experience]['entries'].append(entry)

    # Обработка общих данных (для сводного месяца) – аналогично
    total_data = {}
    for row in rows_total:
        (role_id, experience, currency, status, total_vacancies,
         vacancies_with_salary, salary_percentage, avg_salary, median_salary,
         mode_salary, min_salary, max_salary, top_skills, vacancy_ids) = row

        if role_id is None:
            role_key = "NULL"
        else:
            role_key = str(role_id)

        if role_key not in total_data:
            total_data[role_key] = {}

        exp_key = (experience, currency, status)
        total_data[role_key][exp_key] = {
            'total_vacancies': total_vacancies,
            'vacancies_with_salary': vacancies_with_salary,
            'salary_percentage': float(salary_percentage) if salary_percentage else 0,
            'avg_salary': float(avg_salary) if avg_salary else 0,
            'median_salary': float(median_salary) if median_salary else 0,
            'mode_salary': float(mode_salary) if mode_salary else 0,
            'min_salary': float(min_salary) if min_salary else 0,
            'max_salary': float(max_salary) if max_salary else 0,
            'top_skills': top_skills,
            'vacancy_ids': list(vacancy_ids) if vacancy_ids else []
        }

    monthly_currency_groups = defaultdict(set)
    for role_key, role_data in salary_by_role.items():
        for month_str, exp_dict in role_data['months'].items():
            for exp_name, exp_data in exp_dict.items():
                for entry in exp_data['entries']:
                    monthly_currency_groups[(role_key, month_str, exp_name, entry['status'])].add(entry['currency'])

    total_currency_groups = defaultdict(set)
    for role_key, exp_map in total_data.items():
        for (exp, currency, status), _vals in exp_map.items():
            total_currency_groups[(role_key, exp, status)].add(currency)

    monthly_with_salary = defaultdict(list)
    monthly_without_salary = defaultdict(list)
    total_with_salary = defaultdict(list)
    total_without_salary = defaultdict(list)

    currency_rates = {
        'RUR': 1.0,
        'USD': 1.0,
        'EUR': 1.08,
        'KZT': 0.0021,
        'BYR': 0.00031,
        'UZS': 0.000079,
        'AZN': 0.59,
        'KGS': 0.011
    }

    areas_cache = os.path.join('reports', 'hh_areas.json')
    try:
        areas_data = load_hh_areas(areas_cache)
        city_country_map, country_names, other_regions_cities = build_city_country_map(areas_data)
    except Exception as e:
        logging.warning(f'Failed to load HH areas: {e}')
        city_country_map, country_names, other_regions_cities = {}, set(), set()

    vacancies_by_role = defaultdict(list)
    for row in vacancy_rows:
        (vac_id, name, employer, city, salary_from, salary_to, currency,
         skills, requirement, responsibility, apply_alternate_url, role_id,
         experience, archived, archived_at, published_at,
         accredited_it_employer, rating, trusted, employer_url) = row

        if role_id is None:
            role_key = "NULL"
            role_name = mapping.get(role_key, "Не указана")
        else:
            role_key = str(role_id)
            role_name = mapping.get(role_key, f"ID {role_id} (неизвестная роль)")
        month_str = published_at.strftime('%Y-%m')
        status = 'Архивная' if archived else 'Открытая'
        display_currency = _display_currency(currency)
        has_salary = salary_from is not None or salary_to is not None

        calculated_salary = None
        if salary_from is not None and salary_to is not None:
            calculated_salary = (salary_from + salary_to) / 2.0
        elif salary_from is not None:
            calculated_salary = salary_from
        elif salary_to is not None:
            calculated_salary = salary_to

        converted_salary = None
        if calculated_salary is not None and currency is not None:
            rate = currency_rates.get(currency, 1.0)
            converted_salary = calculated_salary if currency in ('RUR', 'USD') else calculated_salary * rate

        country = None
        if city and city_country_map:
            city_norm = city.strip().casefold()
            if city_norm in other_regions_cities:
                country = city
            else:
                countries = city_country_map.get(city_norm)
            if country is None and countries and len(countries) == 1:
                country = next(iter(countries))
            elif country is None and city_norm in country_names:
                country = city

        published_iso = published_at.isoformat() if published_at else None
        archived_iso = archived_at.isoformat() if archived_at else None
        vacancy_obj = {
            'id': vac_id,
            'name': name,
            'employer': employer,
            'city': city,
            'country': country,
            'salary_from': salary_from,
            'salary_to': salary_to,
            'currency': currency,
            'calculated_salary': calculated_salary,
            'converted_salary': converted_salary,
            'published_at': published_iso,
            'archived_at': archived_iso,
            'role_id': role_key,
            'role_name': role_name,
            'experience': experience,
            '_experience': experience,
            '_status': status,
            'skills': skills,
            'requirement': requirement,
            'responsibility': responsibility,
            'apply_alternate_url': apply_alternate_url,
            'employer_accredited': accredited_it_employer,
            'employer_rating': rating,
            'employer_trusted': trusted,
            'employer_url': employer_url
        }
        vacancies_by_role[role_key].append(vacancy_obj)

        if has_salary:
            if display_currency is None:
                continue
            monthly_with_salary[(role_key, month_str, experience, status, display_currency)].append(vacancy_obj)
            total_with_salary[(role_key, experience, status, display_currency)].append(vacancy_obj)
        else:
            if currency is None:
                month_currencies = monthly_currency_groups.get((role_key, month_str, experience, status), set())
                for curr in month_currencies:
                    monthly_without_salary[(role_key, month_str, experience, status, curr)].append(vacancy_obj)
                total_currencies = total_currency_groups.get((role_key, experience, status), set())
                for curr in total_currencies:
                    total_without_salary[(role_key, experience, status, curr)].append(vacancy_obj)
            else:
                if display_currency is None:
                    continue
                monthly_without_salary[(role_key, month_str, experience, status, display_currency)].append(vacancy_obj)
                total_without_salary[(role_key, experience, status, display_currency)].append(vacancy_obj)

    for role_key, role_data in salary_by_role.items():
        for month_str, exp_dict in role_data['months'].items():
            for exp_name, exp_data in exp_dict.items():
                for entry in exp_data['entries']:
                    entry_key = (role_key, month_str, exp_name, entry['status'], entry['currency'])
                    entry['vacancies_with_salary_list'] = monthly_with_salary.get(entry_key, [])
                    entry['vacancies_without_salary_list'] = monthly_without_salary.get(entry_key, [])

    # Формирование итоговой структуры для каждой роли (как ранее, но без salary_range)
    exp_order = {"Нет опыта": 1, "От 1 года до 3 лет": 2, "От 3 до 6 лет": 3, "Более 6 лет": 4}
    result = []

    for role_key, role_data in salary_by_role.items():
        months_list = []
        for month_str in sorted(role_data['months'].keys()):
            exp_dict = role_data['months'][month_str]
            exp_list = list(exp_dict.values())
            exp_list.sort(key=lambda e: exp_order.get(e['experience'], 5))
            months_list.append({
                'month': month_str,
                'experiences': exp_list
            })

        # Добавляем сводный месяц
        total_for_role = total_data.get(role_key, {})
        exp_dict_all = {}
        for (exp, currency, status), vals in total_for_role.items():
            if exp not in exp_dict_all:
                exp_dict_all[exp] = {
                    'experience': exp,
                    'entries': []
                }
            entry = {
                'status': status,
                'currency': currency,
                'total_vacancies': vals['total_vacancies'],
                'vacancies_with_salary': vals['vacancies_with_salary'],
                'salary_percentage': vals['salary_percentage'],
                'avg_salary': vals['avg_salary'],
                'median_salary': vals['median_salary'],
                'mode_salary': vals['mode_salary'],
                'min_salary': vals['min_salary'],
                'max_salary': vals['max_salary'],
                'top_skills': vals['top_skills'],
                'vacancy_ids': vals['vacancy_ids'],
                'vacancies_with_salary_list': [],
                'vacancies_without_salary_list': []
            }
            entry_key = (role_key, exp, status, currency)
            entry['vacancies_with_salary_list'] = total_with_salary.get(entry_key, [])
            entry['vacancies_without_salary_list'] = total_without_salary.get(entry_key, [])
            exp_dict_all[exp]['entries'].append(entry)

        # Сортируем записи внутри каждого опыта по статусу (Открытая -> Архивная)
        for exp_data in exp_dict_all.values():
            exp_data['entries'].sort(key=lambda x: (x['status'] != 'Открытая', x['status']))

        all_experiences_list = list(exp_dict_all.values())
        all_experiences_list.sort(key=lambda e: exp_order.get(e['experience'], 5))

        num_months = len(months_list)
        if num_months == 1:
            month_title = "За 1 месяц"
        elif 2 <= num_months <= 4:
            month_title = f"За {num_months} месяца"
        else:
            month_title = f"За {num_months} месяцев"

        summary_month = {
            'month': month_title,
            'experiences': all_experiences_list
        }
        months_list.insert(0, summary_month)

        role_data['months_list'] = months_list
        del role_data['months']
        result.append(role_data)

    result.sort(key=lambda x: x['name'])
    return result, vacancies_by_role

def fetch_employer_analysis_data(mapping):
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
        WITH vacancies_base AS (
            SELECT
                v.professional_role,
                v.published_at,
                v.currency,
                v.has_test,
                v.response_letter_required,
                v.salary_from,
                v.salary_to,
                COALESCE(e.accredited_it_employer, false) AS accredited_it_employer,
                NULLIF(regexp_replace(COALESCE(e.rating, ''), '[^0-9\\.]', '', 'g'), '')::numeric AS rating_num
            FROM public.get_vacancies v
            LEFT JOIN public.employers e ON v.employer = e.name
            WHERE v.published_at IS NOT NULL
              AND v.professional_role IS NOT NULL
        ),
        salary_base AS (
            SELECT
                COALESCE(NULLIF(vb.professional_role, ''), 'UNKNOWN_ROLE') AS professional_role,
                date_trunc('month', vb.published_at)::date AS month_start,
                vb.currency,
                vb.has_test,
                vb.response_letter_required,
                vb.accredited_it_employer,
                vb.rating_num,
                (COALESCE(vb.salary_from, vb.salary_to) + COALESCE(vb.salary_to, vb.salary_from)) / 2.0 AS salary_mid
            FROM vacancies_base vb
            WHERE (vb.salary_from IS NOT NULL OR vb.salary_to IS NOT NULL)
        ),
        count_rows AS (
            SELECT
                professional_role,
                month_start,
                'rating_bucket' AS factor,
                CASE
                    WHEN rating_num IS NULL THEN 'unknown'
                    WHEN rating_num < 3.5 THEN '<3.5'
                    WHEN rating_num < 4.0 THEN '3.5-3.99'
                    WHEN rating_num < 4.5 THEN '4.0-4.49'
                    ELSE '>=4.5'
                END AS factor_value,
                1 AS row_n
            FROM (
                SELECT
                    COALESCE(NULLIF(vb.professional_role, ''), 'UNKNOWN_ROLE') AS professional_role,
                    date_trunc('month', vb.published_at)::date AS month_start,
                    vb.has_test,
                    vb.response_letter_required,
                    vb.accredited_it_employer,
                    vb.rating_num
                FROM vacancies_base vb
            ) base_all
            UNION ALL
            SELECT
                professional_role,
                month_start,
                'accreditation' AS factor,
                CASE WHEN accredited_it_employer THEN 'true' ELSE 'false' END AS factor_value,
                1 AS row_n
            FROM (
                SELECT
                    COALESCE(NULLIF(vb.professional_role, ''), 'UNKNOWN_ROLE') AS professional_role,
                    date_trunc('month', vb.published_at)::date AS month_start,
                    vb.has_test,
                    vb.response_letter_required,
                    vb.accredited_it_employer,
                    vb.rating_num
                FROM vacancies_base vb
            ) base_all
            UNION ALL
            SELECT
                professional_role,
                month_start,
                'has_test' AS factor,
                CASE WHEN has_test THEN 'true' ELSE 'false' END AS factor_value,
                1 AS row_n
            FROM (
                SELECT
                    COALESCE(NULLIF(vb.professional_role, ''), 'UNKNOWN_ROLE') AS professional_role,
                    date_trunc('month', vb.published_at)::date AS month_start,
                    vb.has_test,
                    vb.response_letter_required,
                    vb.accredited_it_employer,
                    vb.rating_num
                FROM vacancies_base vb
            ) base_all
            UNION ALL
            SELECT
                professional_role,
                month_start,
                'cover_letter_required' AS factor,
                CASE WHEN response_letter_required THEN 'true' ELSE 'false' END AS factor_value,
                1 AS row_n
            FROM (
                SELECT
                    COALESCE(NULLIF(vb.professional_role, ''), 'UNKNOWN_ROLE') AS professional_role,
                    date_trunc('month', vb.published_at)::date AS month_start,
                    vb.has_test,
                    vb.response_letter_required,
                    vb.accredited_it_employer,
                    vb.rating_num
                FROM vacancies_base vb
            ) base_all
        ),
        salary_factor_rows AS (
            SELECT
                professional_role,
                month_start,
                currency,
                'rating_bucket' AS factor,
                CASE
                    WHEN rating_num IS NULL THEN 'unknown'
                    WHEN rating_num < 3.5 THEN '<3.5'
                    WHEN rating_num < 4.0 THEN '3.5-3.99'
                    WHEN rating_num < 4.5 THEN '4.0-4.49'
                    ELSE '>=4.5'
                END AS factor_value,
                salary_mid
            FROM salary_base
            UNION ALL
            SELECT
                professional_role,
                month_start,
                currency,
                'accreditation' AS factor,
                CASE WHEN accredited_it_employer THEN 'true' ELSE 'false' END AS factor_value,
                salary_mid
            FROM salary_base
            UNION ALL
            SELECT
                professional_role,
                month_start,
                currency,
                'has_test' AS factor,
                CASE WHEN has_test THEN 'true' ELSE 'false' END AS factor_value,
                salary_mid
            FROM salary_base
            UNION ALL
            SELECT
                professional_role,
                month_start,
                currency,
                'cover_letter_required' AS factor,
                CASE WHEN response_letter_required THEN 'true' ELSE 'false' END AS factor_value,
                salary_mid
            FROM salary_base
        ),
        counts_agg AS (
            SELECT
                professional_role,
                month_start,
                factor,
                factor_value,
                COUNT(*) AS group_n
            FROM count_rows
            GROUP BY professional_role, month_start, factor, factor_value
        ),
        salary_agg AS (
            SELECT
                professional_role,
                month_start,
                factor,
                factor_value,
                COUNT(*) FILTER (WHERE currency = 'RUR') AS avg_salary_rur_n,
                ROUND(AVG(salary_mid) FILTER (WHERE currency = 'RUR')::numeric, 2) AS avg_salary_rur,
                COUNT(*) FILTER (WHERE currency = 'USD') AS avg_salary_usd_n,
                ROUND(AVG(salary_mid) FILTER (WHERE currency = 'USD')::numeric, 2) AS avg_salary_usd,
                COUNT(*) FILTER (WHERE currency = 'EUR') AS avg_salary_eur_n,
                ROUND(AVG(salary_mid) FILTER (WHERE currency = 'EUR')::numeric, 2) AS avg_salary_eur,
                COUNT(*) FILTER (WHERE currency IS NOT NULL AND currency NOT IN ('RUR', 'USD', 'EUR')) AS avg_salary_other_n,
                ROUND(AVG(salary_mid) FILTER (WHERE currency IS NOT NULL AND currency NOT IN ('RUR', 'USD', 'EUR'))::numeric, 2) AS avg_salary_other
            FROM salary_factor_rows
            GROUP BY professional_role, month_start, factor, factor_value
        )
        SELECT
            c.professional_role,
            to_char(c.month_start, 'YYYY-MM') AS month,
            c.factor,
            c.factor_value,
            c.group_n,
            s.avg_salary_rur_n,
            s.avg_salary_rur,
            s.avg_salary_usd_n,
            s.avg_salary_usd,
            s.avg_salary_eur_n,
            s.avg_salary_eur,
            s.avg_salary_other_n,
            s.avg_salary_other
        FROM counts_agg c
        LEFT JOIN salary_agg s
          ON s.professional_role = c.professional_role
         AND s.month_start = c.month_start
         AND s.factor = c.factor
         AND s.factor_value = c.factor_value
        ORDER BY c.professional_role, c.month_start, c.factor, c.group_n DESC;
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    roles = {}
    for role_id, month, factor, factor_value, group_n, avg_salary_rur_n, avg_salary_rur, avg_salary_usd_n, avg_salary_usd, avg_salary_eur_n, avg_salary_eur, avg_salary_other_n, avg_salary_other in rows:
        role_key = str(role_id) if role_id is not None else 'UNKNOWN_ROLE'
        role_name = mapping.get(role_key, role_key)
        bucket = roles.setdefault(role_key, {'id': role_key, 'name': role_name, 'rows': []})
        bucket['rows'].append({
            'month': month or '',
            'factor': factor,
            'factor_value': factor_value,
            'group_n': int(group_n) if group_n is not None else 0,
            'avg_salary_rur_n': int(avg_salary_rur_n) if avg_salary_rur_n is not None else 0,
            'avg_salary_rur': float(avg_salary_rur) if avg_salary_rur is not None else None,
            'avg_salary_usd_n': int(avg_salary_usd_n) if avg_salary_usd_n is not None else 0,
            'avg_salary_usd': float(avg_salary_usd) if avg_salary_usd is not None else None,
            'avg_salary_eur_n': int(avg_salary_eur_n) if avg_salary_eur_n is not None else 0,
            'avg_salary_eur': float(avg_salary_eur) if avg_salary_eur is not None else None,
            'avg_salary_other_n': int(avg_salary_other_n) if avg_salary_other_n is not None else 0,
            'avg_salary_other': float(avg_salary_other) if avg_salary_other is not None else None
        })

    result = list(roles.values())
    result.sort(key=lambda x: x['name'])
    return result

def render_report(roles_data, weekday_data, skills_monthly_data, salary_data, employer_analysis_data, vacancies_by_role):
    env = Environment(loader=FileSystemLoader(REPORT_TEMPLATES_DIR))
    template = env.get_template('report_template.html')
    current_date = datetime.now().strftime("%d.%m.%Y")
    current_time = datetime.now().strftime("%H:%M")

    for role in roles_data:
        role_id = role['id']
        role['vacancies'] = vacancies_by_role.get(role_id, [])

    return template.render(roles=roles_data, weekday_roles=weekday_data,
                           skills_monthly_roles=skills_monthly_data,
                           salary_roles=salary_data,
                           employer_analysis_roles=employer_analysis_data,
                           current_date=current_date, current_time=current_time)


def save_report(html_content):
    os.makedirs(REPORTS_DIR, exist_ok=True)
    output_file = os.path.join(REPORTS_DIR, 'report.html')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    logging.info(f"Report saved to {output_file}")

def copy_styles():
    src = os.path.join(REPORT_STATIC_DIR, 'styles.css')
    dst = os.path.join(REPORTS_DIR, 'styles.css')
    shutil.copy2(src, dst)
    logging.info(f"Styles copied to {dst}")

def copy_js():
    js_files = [
        'report.state.js',
        'report.utils.js',
        'report.data.js',
        'report.charts.js',
        'report.render.js',
        'report.ui.js',
        'report.events.js'
    ]
    for filename in js_files:
        src = os.path.join(REPORT_STATIC_DIR, filename)
        dst = os.path.join(REPORTS_DIR, filename)
        shutil.copy2(src, dst)
        logging.info(f"JS copied to {dst}")

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

    logging.info("Fetching skills monthly data...")
    skills_monthly_data = fetch_skills_monthly_data(mapping)

    logging.info("Fetching salary data...")
    salary_data, vacancies_by_role = fetch_salary_data(mapping)

    logging.info("Fetching employer analysis data...")
    employer_analysis_data = fetch_employer_analysis_data(mapping)

    html = render_report(roles_data, weekday_data, skills_monthly_data, salary_data, employer_analysis_data, vacancies_by_role)
    save_report(html)
    copy_styles()
    copy_js()

if __name__ == '__main__':
    main()
