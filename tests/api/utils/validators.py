from datetime import datetime, timedelta


def validate_salary_sorting(items, order="desc"):
    """Валидация сортировки по зарплате"""
    salaries = []
    for item in items:
        salary = item.get('salary')
        if salary and salary.get('from'):
            salaries.append(salary['from'])
        elif salary and salary.get('to'):
            salaries.append(salary['to'])
        else:
            salaries.append(0)  # Вакансии без зарплаты в конце

    if order == "desc":
        assert salaries == sorted(salaries, reverse=True), "Сортировка по убыванию зарплаты не работает"
    else:
        assert salaries == sorted(salaries), "Сортировка по возрастанию зарплаты не работает"


def validate_date_range(items, days=1):
    """Валидация временного диапазона"""
    now = datetime.now()
    for item in items:
        published_at = datetime.fromisoformat(item['published_at'].replace('Z', '+00:00'))
        time_diff = now - published_at
        assert time_diff.days <= days, f"Вакансия опубликована более {days} дней назад"
