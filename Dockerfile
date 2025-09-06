FROM python:3.11-slim

# System deps
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    curl ca-certificates tini \
 && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY . .

# Use tini as init to handle signals cleanly
ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["python", "main.py"]

