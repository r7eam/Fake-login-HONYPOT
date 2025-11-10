# alerts/Dockerfile
# Simple alert aggregator for honeypot events

FROM python:3.11-slim

# Security metadata
LABEL org.opencontainers.image.title="Honeypot Alert Service" \
      org.opencontainers.image.description="Slack alerting for brute-force patterns" \
      org.opencontainers.image.vendor="Graduate Project"

# Install minimal dependencies
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    rm -rf /root/.cache

# Copy application
COPY alert_runner.py .
RUN chmod 644 alert_runner.py

# Create non-root user (UID 1002)
RUN groupadd -g 1002 alerts && \
    useradd -r -u 1002 -g alerts -s /sbin/nologin -c "Alert Service" alerts && \
    chown -R alerts:alerts /app

# Switch to non-root user
USER alerts:alerts

# Environment variables
ENV ENRICHED_LOG=/data/honeypot_enriched.jsonl \
    ALERT_WINDOW_MINUTES=10 \
    BRUTE_FORCE_THRESHOLD=10 \
    SLACK_WEBHOOK_URL=

# Run alert service
CMD ["python", "-u", "alert_runner.py"]
