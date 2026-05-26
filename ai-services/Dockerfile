FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV AI_SERVICE_HOST=0.0.0.0
ENV AI_SERVICE_RELOAD=false

COPY . ./
RUN pip install --no-cache-dir .

CMD ["uvicorn", "ai_services.main:app", "--host", "0.0.0.0", "--port", "10000"]