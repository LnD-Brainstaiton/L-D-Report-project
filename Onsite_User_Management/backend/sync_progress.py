#!/usr/bin/env python3
import asyncio
import sys
sys.path.insert(0, '/Users/abdullahalamaan/Documents/GitHub/L-D-Report-project/Onsite_User_Management/backend')

from app.db.base import SessionLocal
from app.models.student import Student
from app.models.lms_user import LMSUserCourse
from app.services.lms_service import LMSService
from sqlalchemy import exists
from datetime import datetime

async def sync_all_progress():
    db = SessionLocal()
    
    # Get all students who have LMS enrollments
    enrolled_students = db.query(Student).filter(
        exists().where(
            LMSUserCourse.student_id == Student.id
        )
    ).all()
    
    print(f"Syncing progress for {len(enrolled_students)} students with LMS enrollments...", flush=True)
    
    total_updated = 0
    students_updated = 0
    errors = 0
    
    for i, student in enumerate(enrolled_students):
        try:
            # Use lowercase for LMS query
            courses = await LMSService.fetch_user_courses(student.employee_id.lower(), None)
            
            student_updates = 0
            for course_data in courses:
                course_id = str(course_data.get("id", ""))
                progress = course_data.get("progress", 0) or 0
                completed = course_data.get("completed", False)
                lastaccess = course_data.get("lastaccess")
                
                enrollment = db.query(LMSUserCourse).filter(
                    LMSUserCourse.student_id == student.id,
                    LMSUserCourse.lms_course_id == course_id
                ).first()
                
                if enrollment:
                    if enrollment.progress != progress or enrollment.completed != completed:
                        enrollment.progress = float(progress)
                        enrollment.completed = bool(completed)
                        if lastaccess:
                            enrollment.lastaccess = datetime.fromtimestamp(lastaccess)
                        student_updates += 1
            
            if student_updates > 0:
                students_updated += 1
                total_updated += student_updates
                
            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{len(enrolled_students)} students...", flush=True)
                db.commit()
                
        except Exception as e:
            errors += 1
            if errors <= 10:
                print(f"  Error for {student.employee_id}: {str(e)[:80]}", flush=True)
    
    db.commit()
    
    print(f"\n=== Sync Complete ===", flush=True)
    print(f"  Students processed: {len(enrolled_students)}", flush=True)
    print(f"  Students with updates: {students_updated}", flush=True)
    print(f"  Total course updates: {total_updated}", flush=True)
    print(f"  Errors: {errors}", flush=True)
    
    db.close()

if __name__ == "__main__":
    asyncio.run(sync_all_progress())

