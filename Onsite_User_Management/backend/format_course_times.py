#!/usr/bin/env python3
"""
Format time fields for a specific course in readable English format.
"""

import sys
import os
from datetime import datetime

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.student import Student
from app.models.lms_user import LMSUserCourse

def format_datetime_readable(dt):
    """Format datetime in readable English format: 'Sep 19, 2025, 7:45 PM'"""
    if dt is None:
        return "Not available"
    if isinstance(dt, datetime):
        # Format: "Sep 19, 2025, 7:45 PM"
        return dt.strftime("%b %d, %Y, %I:%M %p")
    return str(dt)

def format_course_times(employee_id: str, course_id: str):
    """Format all time fields for a specific course."""
    db = SessionLocal()
    try:
        # Find student
        student = db.query(Student).filter(
            Student.employee_id.ilike(f'%{employee_id}%')
        ).first()
        
        if not student:
            print(f"❌ Student with employee_id '{employee_id}' not found")
            return
        
        # Find the specific course enrollment
        enrollment = db.query(LMSUserCourse).filter(
            LMSUserCourse.student_id == student.id,
            LMSUserCourse.lms_course_id == str(course_id)
        ).first()
        
        if not enrollment:
            print(f"❌ Course ID {course_id} not found for {employee_id}")
            return
        
        print(f"\n{'='*80}")
        print(f"Course: {enrollment.course_name}")
        print(f"Employee: {student.name} ({employee_id})")
        print(f"{'='*80}\n")
        
        print("TIME FIELDS (Readable Format):")
        print(f"  📅 Enrollment Date:     {format_datetime_readable(enrollment.enrollment_time)}")
        print(f"  🚀 Course Start Date:    {format_datetime_readable(enrollment.start_date)}")
        print(f"  🏁 Course End Date:      {format_datetime_readable(enrollment.end_date)}")
        print(f"  ✅ Completion Date:      {format_datetime_readable(enrollment.completion_date)}")
        print(f"  👁️  Last Access:          {format_datetime_readable(enrollment.last_access)}")
        print(f"  📝 Record Created:       {format_datetime_readable(enrollment.created_at)}")
        print(f"  🔄 Record Updated:       {format_datetime_readable(enrollment.updated_at)}")
        
        print(f"\n{'─'*80}")
        print("SUMMARY (as shown in UI):")
        print(f"{'─'*80}")
        print(f"  Enrollment Date:  {format_datetime_readable(enrollment.enrollment_time)}")
        print(f"  Completed On:     {format_datetime_readable(enrollment.completion_date)}")
        print(f"  Last Access:      {format_datetime_readable(enrollment.last_access)}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    employee_id = "BS1981"
    course_id = "492"  # Cyber Security and Physical Protection
    format_course_times(employee_id, course_id)

