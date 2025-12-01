import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Load .env
load_dotenv()

from app.main import app
from app.db.base import Base, get_db

# Use real DB URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    sys.exit(1)

print(f"Connecting to DB: {SQLALCHEMY_DATABASE_URL}")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

# We don't override auth here because we want to check the DB directly first
# app.dependency_overrides[get_db] = override_get_db

def check_courses_direct():
    db = SessionLocal()
    try:
        print("Checking courses table directly...")
        result = db.execute(text("SELECT id, name, course_type FROM courses"))
        courses = result.fetchall()
        print(f"Found {len(courses)} courses in DB")
        for course in courses:
            print(f"ID: {course[0]}, Name: {course[1]}, Type: {course[2]}")
            
    except Exception as e:
        print(f"Error querying DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_courses_direct()
