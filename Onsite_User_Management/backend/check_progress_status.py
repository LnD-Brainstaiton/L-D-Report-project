"""Quick script to check progress sync status by querying the database"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from app.db.base import SessionLocal
from app.models.lms_user import LMSUserCourse
from sqlalchemy import func

db = SessionLocal()
try:
    # Count total LMS courses
    total = db.query(LMSUserCourse).count()
    
    # Count courses with completion_date set
    with_completion_date = db.query(LMSUserCourse).filter(
        LMSUserCourse.completion_date.isnot(None)
    ).count()
    
    # Count completed courses (progress >= 100)
    completed = db.query(LMSUserCourse).filter(
        LMSUserCourse.completed == True
    ).count()
    
    print(f"\n{'='*60}")
    print("Progress Sync Status Check")
    print(f"{'='*60}")
    print(f"Total LMS course enrollments: {total}")
    print(f"Completed courses: {completed}")
    print(f"Courses with completion_date: {with_completion_date}")
    print(f"Completed but missing completion_date: {completed - with_completion_date}")
    print(f"{'='*60}\n")
    
finally:
    db.close()
