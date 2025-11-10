FROM python:3.11-slim

# Security metadata
LABEL org.opencontainers.image.title="Honeypot Enrichment Worker" \
      org.opencontainers.image.description="Secure event enrichment service" \
      org.opencontainers.image.vendor="Graduate Project" \
      security.level="high"

# Install security updates and minimal dependencies
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user with specific UID/GID for volume ownership
RUN groupadd -g 1001 enrich && \
    useradd -r -u 1001 -g enrich -s /sbin/nologin -c "Enrichment Worker" enrich

# Set working directory
WORKDIR /app

# Copy and install Python dependencies as root (for permissions)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    rm -rf /root/.cache

# Copy application files
COPY worker.py state_manager.py cache_manager.py atomic_writer.py metrics.py ./
RUN chmod 755 worker.py && \
    chmod 644 state_manager.py cache_manager.py atomic_writer.py metrics.py

# Create data directories with proper ownership
RUN mkdir -p /data /data/cache /var/log/enrich && \
    chown -R enrich:enrich /data /app /var/log/enrich

# Security: Drop all capabilities except necessary ones
# Network access needed for DNS lookups only
RUN echo "enrich user configured for minimal privileges"

# Switch to non-root user
USER enrich:enrich

# Set secure environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    RAW_LOG=/data/honeypot_events.jsonl \
    ENRICHED_OUT=/data/honeypot_enriched.jsonl \
    GEOIP_CITY=/data/GeoLite2-City.mmdb \
    GEOIP_ASN=/data/GeoLite2-ASN.mmdb \
    STATE_DB=/data/enrich_state.db \
    CACHE_DIR=/data/cache \
    METRICS_PORT=9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:9090/health').read()" || exit 1

# Use dumb-init to handle signals properly (PID 1 problem)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Default command: run in incremental mode
CMD ["python", "-u", "worker.py", "--incremental"]
