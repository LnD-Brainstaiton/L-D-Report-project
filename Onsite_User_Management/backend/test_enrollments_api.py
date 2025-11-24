#!/usr/bin/env python3
"""
Test script to check enrollments API response for a course.
Usage: python test_enrollments_api.py [course_id]
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.base import SessionLocal
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.models.student import Student
from app.schemas.enrollment import EnrollmentResponse
from app.models.enrollment import ApprovalStatus, CompletionStatus, EligibilityStatus
import json

def test_enrollments_api(course_id=None):
    db = SessionLocal()
    try:
        # If no course_id provided, find a course with enrollments
        if not course_id:
            course_with_enrollments = db.query(Course).join(Enrollment).first()
            if course_with_enrollments:
                course_id = course_with_enrollments.id
                print(f"Found course with enrollments: ID={course_id}, Name={course_with_enrollments.name}")
            else:
                # Get any course
                any_course = db.query(Course).first()
                if any_course:
                    course_id = any_course.id
                    print(f"Using course: ID={course_id}, Name={any_course.name} (may have no enrollments)")
                else:
                    print("No courses found in database")
                    return
        
        # Query enrollments for this course
        query = db.query(Enrollment).filter(Enrollment.course_id == course_id)
        enrollments = query.all()
        
        print(f"\n{'='*60}")
        print(f"Enrollments for Course ID: {course_id}")
        print(f"Total enrollments: {len(enrollments)}")
        print(f"{'='*60}\n")
        
        if not enrollments:
            print("No enrollments found for this course.")
            print("\nExpected API response structure:")
            print("[]")
            return
        
        # Build response similar to API endpoint
        result = []
        for enrollment in enrollments:
            enrollment_dict = EnrollmentResponse.from_orm(enrollment).dict()
            
            # Add student information (as done in API)
            enrollment_dict['student_name'] = enrollment.student.name
            enrollment_dict['student_email'] = enrollment.student.email
            enrollment_dict['student_department'] = enrollment.student.department
            enrollment_dict['student_employee_id'] = enrollment.student.employee_id
            enrollment_dict['student_designation'] = enrollment.student.designation
            enrollment_dict['student_experience_years'] = enrollment.student.experience_years
            
            # Add course information
            enrollment_dict['course_name'] = enrollment.course_name or (enrollment.course.name if enrollment.course else None)
            enrollment_dict['batch_code'] = enrollment.batch_code or (enrollment.course.batch_code if enrollment.course else None)
            enrollment_dict['course_description'] = enrollment.course.description if enrollment.course else None
            
            # Convert dates to ISO format strings
            if enrollment.created_at:
                enrollment_dict['created_at'] = enrollment.created_at.isoformat()
            if enrollment.updated_at:
                enrollment_dict['updated_at'] = enrollment.updated_at.isoformat()
            if enrollment.completion_date:
                enrollment_dict['completion_date'] = enrollment.completion_date.isoformat()
            
            result.append(enrollment_dict)
        
        # Print formatted JSON response
        print("API Response (JSON):")
        print(json.dumps(result, indent=2, default=str))
        
        # Print summary
        print(f"\n{'='*60}")
        print("Summary:")
        print(f"{'='*60}")
        for i, enrollment in enumerate(result, 1):
            print(f"\nEnrollment {i}:")
            print(f"  ID: {enrollment.get('id')}")
            print(f"  Student: {enrollment.get('student_name')} ({enrollment.get('student_employee_id')})")
            print(f"  Email: {enrollment.get('student_email')}")
            print(f"  Department: {enrollment.get('student_department')}")
            print(f"  Approval Status: {enrollment.get('approval_status')}")
            print(f"  Completion Status: {enrollment.get('completion_status')}")
            print(f"  Eligibility Status: {enrollment.get('eligibility_status')}")
            if enrollment.get('attendance_percentage') is not None:
                print(f"  Attendance: {enrollment.get('attendance_percentage')}%")
            if enrollment.get('score') is not None:
                print(f"  Score: {enrollment.get('score')}")
        
    finally:
        db.close()

if __name__ == "__main__":
    course_id = None
    if len(sys.argv) > 1:
        try:
            course_id = int(sys.argv[1])
        except ValueError:
            print(f"Invalid course_id: {sys.argv[1]}")
            sys.exit(1)
    
    test_enrollments_api(course_id)

