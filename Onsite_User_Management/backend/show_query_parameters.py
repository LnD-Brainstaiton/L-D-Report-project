#!/usr/bin/env python3
"""
Show the exact parameters and queries used to find course enrollment data.
"""

import sys
import os
from datetime import datetime

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.student import Student
from app.models.lms_user import LMSUserCourse
from sqlalchemy import text

def show_query_parameters(employee_id: str, course_id: str):
    """Show exact parameters and queries used."""
    db = SessionLocal()
    try:
        print(f"\n{'='*80}")
        print("EXACT PARAMETERS AND QUERIES USED")
        print(f"{'='*80}\n")
        
        # 1. Parameters used
        print("📋 INPUT PARAMETERS:")
        print(f"   • employee_id: '{employee_id}'")
        print(f"   • course_id: '{course_id}'")
        print()
        
        # 2. Step 1: Find student
        print("=" * 80)
        print("STEP 1: Find Student by Employee ID")
        print("=" * 80)
        print("\nSQL Query (equivalent):")
        print(f"   SELECT * FROM students WHERE employee_id ILIKE '%{employee_id}%';")
        print("\nSQLAlchemy ORM Query:")
        print(f"   student = db.query(Student).filter(")
        print(f"       Student.employee_id.ilike('%{employee_id}%')")
        print(f"   ).first()")
        print()
        
        student = db.query(Student).filter(
            Student.employee_id.ilike(f'%{employee_id}%')
        ).first()
        
        if not student:
            print(f"❌ Student not found")
            return
        
        print(f"✅ Result:")
        print(f"   • student.id = {student.id}")
        print(f"   • student.employee_id = '{student.employee_id}'")
        print(f"   • student.name = '{student.name}'")
        print()
        
        # 3. Step 2: Find enrollment
        print("=" * 80)
        print("STEP 2: Find Course Enrollment")
        print("=" * 80)
        print("\nSQL Query (equivalent):")
        print(f"   SELECT * FROM lms_user_courses")
        print(f"   WHERE student_id = {student.id}")
        print(f"     AND lms_course_id = '{course_id}';")
        print("\nSQLAlchemy ORM Query:")
        print(f"   enrollment = db.query(LMSUserCourse).filter(")
        print(f"       LMSUserCourse.student_id == {student.id},")
        print(f"       LMSUserCourse.lms_course_id == '{course_id}'")
        print(f"   ).first()")
        print()
        
        enrollment = db.query(LMSUserCourse).filter(
            LMSUserCourse.student_id == student.id,
            LMSUserCourse.lms_course_id == str(course_id)
        ).first()
        
        if not enrollment:
            print(f"❌ Enrollment not found")
            return
        
        print(f"✅ Result:")
        print(f"   • enrollment.id = {enrollment.id}")
        print(f"   • enrollment.course_name = '{enrollment.course_name}'")
        print()
        
        # 4. API Endpoint Parameters
        print("=" * 80)
        print("API ENDPOINT PARAMETERS")
        print("=" * 80)
        print("\n1. GET /api/v1/lms/users/{username}/courses")
        print(f"   • URL: GET /api/v1/lms/users/{employee_id}/courses")
        print(f"   • Path Parameter: username = '{employee_id}'")
        print(f"   • Authentication: Bearer token required")
        print()
        print("   Internal Query:")
        print(f"     student = db.query(Student).filter(")
        print(f"         Student.employee_id == '{employee_id}'")
        print(f"     ).first()")
        print(f"     ")
        print(f"     enrollments = db.query(LMSUserCourse).filter(")
        print(f"         LMSUserCourse.student_id == {student.id}")
        print(f"     ).all()")
        print()
        
        print("\n2. GET /api/v1/lms/courses/{course_id}/enrollments")
        print(f"   • URL: GET /api/v1/lms/courses/{course_id}/enrollments")
        print(f"   • Path Parameter: course_id = {course_id}")
        print(f"   • Authentication: Bearer token required")
        print()
        print("   Internal Query:")
        print(f"     enrollments = db.query(LMSUserCourse).filter(")
        print(f"         LMSUserCourse.lms_course_id == '{course_id}'")
        print(f"     ).all()")
        print()
        
        # 5. Exact WHERE clause conditions
        print("=" * 80)
        print("EXACT WHERE CLAUSE CONDITIONS")
        print("=" * 80)
        print("\nFor Student Lookup:")
        print(f"   WHERE students.employee_id ILIKE '%{employee_id}%'")
        print(f"   (Case-insensitive partial match)")
        print()
        print("For Enrollment Lookup:")
        print(f"   WHERE lms_user_courses.student_id = {student.id}")
        print(f"     AND lms_user_courses.lms_course_id = '{course_id}'")
        print()
        
        # 6. Show the actual data retrieved
        print("=" * 80)
        print("DATA RETRIEVED")
        print("=" * 80)
        print(f"\nStudent Record:")
        print(f"   • ID: {student.id}")
        print(f"   • Employee ID: {student.employee_id}")
        print(f"   • Name: {student.name}")
        print(f"   • Email: {student.email}")
        print()
        print(f"Enrollment Record:")
        print(f"   • Enrollment ID: {enrollment.id}")
        print(f"   • Course ID: {enrollment.lms_course_id}")
        print(f"   • Course Name: {enrollment.course_name}")
        print(f"   • Student ID: {enrollment.student_id}")
        print(f"   • Employee ID: {enrollment.employee_id}")
        print()
        print(f"Time Fields:")
        print(f"   • enrollment_time: {enrollment.enrollment_time}")
        print(f"   • start_date: {enrollment.start_date}")
        print(f"   • end_date: {enrollment.end_date}")
        print(f"   • last_access: {enrollment.last_access}")
        print(f"   • completion_date: {enrollment.completion_date}")
        print()
        
        # 7. Raw SQL query
        print("=" * 80)
        print("RAW SQL QUERY (if executed directly)")
        print("=" * 80)
        print("\nTo get all time fields for this enrollment:")
        print(f"""
SELECT 
    lms_user_courses.id,
    lms_user_courses.student_id,
    lms_user_courses.employee_id,
    lms_user_courses.lms_course_id,
    lms_user_courses.course_name,
    lms_user_courses.enrollment_time,
    lms_user_courses.start_date,
    lms_user_courses.end_date,
    lms_user_courses.last_access,
    lms_user_courses.completion_date,
    lms_user_courses.created_at,
    lms_user_courses.updated_at
FROM lms_user_courses
INNER JOIN students ON lms_user_courses.student_id = students.id
WHERE students.employee_id ILIKE '%{employee_id}%'
  AND lms_user_courses.lms_course_id = '{course_id}';
""")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    employee_id = "BS1981"
    course_id = "492"  # Cyber Security and Physical Protection
    show_query_parameters(employee_id, course_id)

