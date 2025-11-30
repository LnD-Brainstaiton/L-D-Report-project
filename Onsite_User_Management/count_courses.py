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

def count_courses():
    db = SessionLocal()
    try:
        total_onsite = db.query(Course).filter(Course.course_type == 'onsite').count()
        print(f"Total 'onsite' courses: {total_onsite}")
        
        # Check if 'english' is in the top 100 by start_date desc
        courses = db.query(Course).filter(Course.course_type == 'onsite').order_by(Course.start_date.desc()).limit(100).all()
        english_found = False
        for c in courses:
            if 'english' in c.name.lower():
                english_found = True
                print(f"Found 'english' in top 100: ID={c.id}, Date={c.start_date}")
                break
        
        if not english_found:
            print("'english' course NOT found in top 100!")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    count_courses()
