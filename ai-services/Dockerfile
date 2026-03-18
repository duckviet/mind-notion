FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV AI_SERVICE_HOST=0.0.0.0
ENV AI_SERVICE_RELOAD=false

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]