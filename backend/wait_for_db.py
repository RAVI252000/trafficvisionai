import socket
import time
import sys
import os
from urllib.parse import urlparse

def main():
    db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@db:5432/trafficvision")
    
    # Parse host and port
    try:
        result = urlparse(db_url)
        host = result.hostname or "db"
        port = result.port or 5432
    except Exception as e:
        print(f"Error parsing DATABASE_URL: {e}. Falling back to db:5432")
        host = "db"
        port = 5432

    print(f"Waiting for PostgreSQL database connection at {host}:{port}...")
    start_time = time.time()
    while True:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1.0)
                s.connect((host, port))
                print("Database is ready!")
                sys.exit(0)
        except (socket.timeout, socket.error):
            if time.time() - start_time > 60:
                print("Database connection timed out after 60 seconds.")
                sys.exit(1)
            time.sleep(1)

if __name__ == "__main__":
    main()
