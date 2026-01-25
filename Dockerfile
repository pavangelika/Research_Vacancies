FROM python:3.13-slim

WORKDIR /app

# Системные зависимости для psycopg2
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py", "-m", "contract", "smoke", "regression", "--alluredir=allure-results"]
