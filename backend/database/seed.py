import sys
import os

# Add parent directory to sys.path so we can import from database, core, etc.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database.database import SessionLocal
from models.user import User, UserRole
from core.security import get_password_hash

def seed_users(db: Session):
    # Check if admin already exists
    admin = db.query(User).filter(User.email == "admin@trafficvision.ai").first()
    if not admin:
        admin = User(
            full_name="Admin User",
            email="admin@trafficvision.ai",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        print("Admin user created.")
    else:
        print("Admin user already exists.")

    # Check if operator already exists
    operator = db.query(User).filter(User.email == "operator@trafficvision.ai").first()
    if not operator:
        operator = User(
            full_name="Traffic Operator",
            email="operator@trafficvision.ai",
            password_hash=get_password_hash("Operator@123"),
            role=UserRole.TRAFFIC_OPERATOR,
            is_active=True
        )
        db.add(operator)
        print("Traffic Operator user created.")
    else:
        print("Traffic Operator user already exists.")

    db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_users(db)
    finally:
        db.close()
