# Топ-5 самых востребованных навыков:
# SELECT
#     trim(both ' ' FROM unnest(string_to_array(skills, ','))) as skill,
#     count(*) as frequency
# FROM get_vacancies
# WHERE skills IS NOT NULL AND skills != ''
# GROUP BY skill
# ORDER BY frequency DESC
# LIMIT 5;


# Анализ зарплат по уровню опыта:
# WITH salary_data AS (
#     SELECT
#         experience,
#         (COALESCE(salary_from, salary_to) + COALESCE(salary_to, salary_from)) / 2.0 AS salary_est
#     FROM get_vacancies
#     WHERE currency = 'RUR'
#       AND (salary_from IS NOT NULL OR salary_to IS NOT NULL)
# ),
# mode_salary AS (
#     SELECT DISTINCT ON (experience)
#         experience,
#         salary_est AS mode_salary,
#         COUNT(*) AS freq
#     FROM salary_data
#     GROUP BY experience, salary_est
#     ORDER BY experience, freq DESC, salary_est
# ),
# avg_salary as  (SELECT
#      experience,
#     ROUND(avg((COALESCE(salary_from, 0) + COALESCE(salary_to, 0)) / 2)) as avg_salary
# FROM get_vacancies
# WHERE salary_from IS NOT NULL OR salary_to IS NOT NULL
# GROUP BY experience),
# max_salary as (SELECT
#     experience,
#     max((COALESCE(salary_from, 0) + COALESCE(salary_to, 0)) / 2) as max_salary
# FROM get_vacancies
# WHERE salary_from IS NOT NULL OR salary_to IS NOT NULL
# GROUP BY experience
# )
# SELECT
#     s.experience,
#     ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary_est)::numeric, 0) AS median_salary,
#     m.mode_salary, a.avg_salary, ma.max_salary
# FROM salary_data s
# LEFT JOIN mode_salary m ON s.experience = m.experience
# left join avg_salary a on s.experience = a.experience
# left join max_salary ma on s.experience = ma.experience
# GROUP BY s.experience, m.mode_salary, a.avg_salary, ma.max_salary
# ORDER BY s.experience;


# Эффективность откликов:
# SELECT
#     count(*) as total_vacancies,
#     sum(case when send_resume then 1 else 0 end) as resumes_sent,
#     sum(case when interview_date is not null then 1 else 0 end) as interviews,
#     sum(case when offer_salary is not null then 1 else 0 end) as offers
# FROM get_vacancies;

# Анализ топ навыков в зависимости от опыта
# WITH skills_expanded AS (
#     SELECT
#         experience,
#         TRIM(BOTH ' ' FROM unnest(string_to_array(skills, ','))) AS skill
#     FROM get_vacancies
#     WHERE skills IS NOT NULL AND skills != ''
# ),
# skill_counts AS (
#     SELECT
#         experience,
#         skill,
#         COUNT(*) AS freq
#     FROM skills_expanded
#     GROUP BY experience, skill
# ),
# ranked_skills AS (
#     SELECT
#         experience,
#         skill,
#         freq,
#         ROW_NUMBER() OVER (PARTITION BY experience ORDER BY freq DESC) AS rn
#     FROM skill_counts
# )
# SELECT
#     experience,
#     skill,
#     freq
# FROM ranked_skills
# WHERE rn <= 10  -- топ-10 навыков для каждого уровня опыта
# ORDER BY experience, rn;

