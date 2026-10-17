# Stage: Production Image
FROM python:3.11-slim

# Set environment flags for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    EXPENSE_DB_PATH=/app/data/expenses.db \
    PORT=5000

# Set working directory
WORKDIR /app

# Install curl for Docker health check and clean apt caches
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -m -d /home/appuser -g appuser -u 1000 appuser

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .
COPY templates/ ./templates/
COPY static/ ./static/

# Prepare persistent data directory with non-root ownership
RUN mkdir -p /app/data && chown -R appuser:appuser /app && chmod -R 775 /app/data

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start production WSGI server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "2", "app:app"]
