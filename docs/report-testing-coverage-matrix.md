# Матрица покрытия требований (baseline, Этап 1)

Дата: 10.03.2026  
Статус: черновик для детализации на Этапе 2

## Матрица `требование -> тип проверки`

| ID | Требование | Приоритет | Тип проверки | Инструмент (план) | Статус |
|---|---|---|---|---|---|
| RQ-01 | Корректные агрегации по месяцам/ролям/опыту | P0 | data + logic | pytest + pandas | planned |
| RQ-02 | Корректный расчет active/archived | P0 | logic + integration | pytest | planned |
| RQ-03 | Корректные зарплатные метрики (avg/median/mode/min/max) по каждой валюте отдельно | P0 | logic | pytest + pandas | planned |
| RQ-04 | Валидная структура `report.html` и ключевые секции | P1 | integration | pytest + BeautifulSoup/lxml | planned |
| RQ-05 | Корректные `data-*` атрибуты для клиентского JS | P1 | integration + UI smoke | pytest + Playwright | planned |
| RQ-06 | Открытие отчета и переключение вкладок/блоков | P1 | UI smoke/e2e | Playwright | planned |
| RQ-07 | Наличие и целостность экспортных артефактов (HTML/CSS/JS/plotly) | P1 | integration | pytest | planned |
| RQ-08 | Корректный fallback при отсутствии данных | P1 | logic + UI smoke | pytest + Playwright | planned |
| RQ-09 | Запись/обновление данных из формы "Мои вакансии" в БД | P0 | integration + db | pytest + psycopg2 | planned |
| RQ-10 | Корректный расчет эффективности откликов | P0 | logic + integration | pytest + pandas | planned |
| RQ-11 | Фильтрация вакансий по навыкам, валюте, стране | P1 | UI e2e + integration | Playwright + pytest | planned |
| RQ-12 | Фильтрация по атрибутам вакансии/работодателя (ИТ-аккредитация и др.) | P1 | UI e2e + integration | Playwright + pytest | planned |
| RQ-13 | Корректная сортировка результатов | P1 | UI e2e | Playwright | planned |
| RQ-14 | Корректная логика "И"/"ИЛИ" для поиска по навыкам | P1 | UI e2e + logic | Playwright + pytest | planned |
| RQ-15 | Корректный расчет зарплаты в разных валютах по исходной валюте | P0 | logic | pytest + pandas | planned |
| RQ-17 | Корректный расчет топ-навыков | P1 | logic + integration | pytest + pandas | planned |
| RQ-18 | Корректные расчеты трендов рынка | P1 | logic + integration | pytest + pandas | planned |
| RQ-19 | API контрактность `/vacancies`, `/vacancies/{id}` | P1 | contract | pytest + jsonschema | planned |
| RQ-20 | API локального сервера `/api/vacancies/*` (smoke/negative) | P0 | api + integration | pytest + requests | planned |
| RQ-21 | DB-инварианты после API/UI операций (запись, чтение, обновление) | P0 | db | pytest + psycopg2 | planned |

## Примечания

1. Детальные тест-кейсы, шаги и ожидаемые результаты оформляются на Этапе 2.
2. Приоритеты и типы проверок могут уточняться после согласования владельцем отчета.
