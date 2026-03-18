FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY backend /app/backend
COPY docs/闲管家省市区.sql /app/docs/闲管家省市区.sql

RUN mkdir -p /app/config /app/data /app/logs

EXPOSE 8001

CMD ["python", "backend/main.py"]
