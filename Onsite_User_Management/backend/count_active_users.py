import sys
import os

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.student import Student

def count_active_users():
    db = SessionLocal()
    try:
        count = db.query(Student).filter(Student.is_active == True).count()
        print(f"Active employees count: {count}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    count_active_users()
