import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend directory to path
backend_dir = os.path.join(os.getcwd(), 'backend')
sys.path.append(backend_dir)

# Load .env from backend directory
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)

from app.db.base import Base, get_db
from app.models.course import Course
from app.core.config import settings

# Ensure DATABASE_URL is set
if not os.getenv("DATABASE_URL"):
    print("Error: DATABASE_URL not found in environment variables.")
    sys.exit(1)

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_course():
    db = SessionLocal()
    try:
        courses = db.query(Course).filter(Course.name.ilike('%english%')).all()
        print(f"Found {len(courses)} courses matching 'english':")
        for course in courses:
            print(f"ID: {course.id}")
            print(f"Name: {course.name}")
            print(f"Batch Code: {course.batch_code}")
            print(f"Status: {course.status}")
            print(f"Start Date: {course.start_date}")
            print(f"End Date: {course.end_date}")
            print(f"Course Type: {course.course_type}")
            print("-" * 20)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_course()
