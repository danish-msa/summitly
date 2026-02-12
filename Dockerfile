FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5050

ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app/voice_assistant_clean.py

CMD ["python", "app/voice_assistant_clean.py"]