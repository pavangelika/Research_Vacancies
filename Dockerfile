FROM python:3.13-slim

WORKDIR /app

ENV TZ=Asia/Yekaterinburg

# Системные зависимости для psycopg2
RUN apt-get update &&  \
    apt-get install -y tzdata && \
    apt-get install -y gcc libpq-dev &&  \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем скрипт из scripts
COPY scripts/generate_report.py .

# Копируем папки templates и static из report
COPY report/templates ./templates
COPY report/static ./static

RUN mkdir /reports

COPY . .

CMD ["python", "generate_report.py", "main.py", "-m", "contract", "smoke", "regression", "--alluredir=allure-results"]
