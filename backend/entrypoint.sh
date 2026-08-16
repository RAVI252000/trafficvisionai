#!/bin/sh

# Wait for the PostgreSQL container to accept connections
python wait_for_db.py

# Run migrations
echo "Running Alembic migrations..."
alembic upgrade head

# Seed roles
echo "Seeding database..."
PYTHONPATH=. python -m database.seed

# Start FastAPI
echo "Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
