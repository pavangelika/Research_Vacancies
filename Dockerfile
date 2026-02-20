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

COPY scripts/generate_report.py .
COPY reports/templates ./templates
COPY reports/static ./static

RUN mkdir /reports

COPY . .

CMD ["python", "generate_report.py", "main.py", "-m", "contract", "smoke", "regression", "--alluredir=allure-results"]
