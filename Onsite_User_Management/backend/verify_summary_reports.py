import sys
import os
import pandas as pd
import io
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.base import SessionLocal, Base, engine
from app.api.lms import generate_overall_lms_report
from app.api.courses import generate_overall_courses_report
from app.models.lms_cache import LMSCourseCache
from app.models.lms_user import LMSUserCourse
from app.models.student import Student
from app.models.course import Course, CourseStatus
from app.models.enrollment import Enrollment, ApprovalStatus, CompletionStatus
from app.core.auth import get_current_admin

# Create tables
Base.metadata.create_all(bind=engine)

# Mock get_current_admin
def mock_get_current_admin():
    return {"id": 1, "username": "admin", "role": "admin"}

def setup_test_data(db: Session):
    # 1. Setup Online Course Data
    # Create LMS Course
    lms_course = LMSCourseCache(
        id=999,
        fullname="Test Online Course",
        shortname="TOC-001",
        categoryname="Online Category",
        startdate=int(datetime.now().timestamp()),
        enddate=int((datetime.now() + timedelta(days=30)).timestamp()),
        is_mandatory=1
    )
    db.merge(lms_course)
    
    # Create Student
    student = Student(
        employee_id="BS001",
        name="Test Student",
        email="test@example.com",
        department="Engineering",
        designation="Developer",
        is_active=True
    )
    existing_student = db.query(Student).filter(Student.employee_id == "BS001").first()
    if existing_student:
        student = existing_student
    else:
        db.add(student)
    db.commit()
    
    # Create LMS Enrollment
    lms_enrollment = LMSUserCourse(
        student_id=student.id,
        employee_id=student.employee_id,
        lms_course_id="999",
        course_name="Test Online Course",
        category_name="Online Category",
        progress=50,
        completed=False,
        is_mandatory=1,
        enrollment_time=datetime.now()
    )
    db.merge(lms_enrollment)
    
    # 2. Setup Onsite Course Data
    onsite_course = Course(
        name="Test Onsite Course",
        batch_code="BATCH-001",
        course_type="onsite",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        status=CourseStatus.ONGOING
    )
    db.add(onsite_course)
    db.commit()
    
    onsite_enrollment = Enrollment(
        student_id=student.id,
        course_id=onsite_course.id,
        approval_status=ApprovalStatus.APPROVED,
        completion_status=CompletionStatus.IN_PROGRESS
    )
    db.add(onsite_enrollment)
    db.commit()
    
    return lms_course, onsite_course

import asyncio

async def read_stream(response):
    content = b""
    async for chunk in response.body_iterator:
        content += chunk
    return content

def verify_online_report(db: Session):
    print("\nVerifying Online Overall Report...")
    response = generate_overall_lms_report(start_date=None, end_date=None, db=db)
    
    # Read Excel content
    content_bytes = asyncio.run(read_stream(response))
    content = io.BytesIO(content_bytes)
    df = pd.read_excel(content)
    
    print("Columns found:", df.columns.tolist())
    
    required_columns = ['Course Name', 'Total Enrolled', 'Completed', 'In Progress', 'Not Started']
    missing = [col for col in required_columns if col not in df.columns]
    
    if missing:
        print(f"FAILED: Missing columns: {missing}")
    else:
        print("SUCCESS: All required columns present.")
        print("First row data:", df.iloc[0].to_dict())

def verify_onsite_report(db: Session):
    print("\nVerifying Onsite Overall Report...")
    response = generate_overall_courses_report(course_type="onsite", start_date=None, end_date=None, db=db)
    
    # Read Excel content
    content_bytes = asyncio.run(read_stream(response))
    content = io.BytesIO(content_bytes)
    df = pd.read_excel(content)
    
    print("Columns found:", df.columns.tolist())
    
    required_columns = ['Course Name', 'Total Enrolled', 'Completed', 'Failed', 'Withdrawn']
    missing = [col for col in required_columns if col not in df.columns]
    
    if missing:
        print(f"FAILED: Missing columns: {missing}")
    else:
        print("SUCCESS: All required columns present.")
        print("First row data:", df.iloc[0].to_dict())

if __name__ == "__main__":
    db = SessionLocal()
    try:
        setup_test_data(db)
        verify_online_report(db)
        verify_onsite_report(db)
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
