FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for database and builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Copy ML model artifacts and datasets to the container root path
COPY ai_models/ /ai_models/

# Make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Expose FastAPI backend port
EXPOSE 8000

# Set container entrypoint
ENTRYPOINT ["/bin/sh", "entrypoint.sh"]
