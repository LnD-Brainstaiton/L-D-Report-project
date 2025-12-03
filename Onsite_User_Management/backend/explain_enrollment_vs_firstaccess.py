#!/usr/bin/env python3
"""
Explain the difference between enrollment_time and firstaccess.
"""

import sys
import os
from datetime import datetime

sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.student import Student
from app.models.lms_user import LMSUserCourse

def explain_difference(employee_id: str, course_id: str):
    """Explain enrollment_time vs firstaccess."""
    db = SessionLocal()
    try:
        print(f"\n{'='*80}")
        print("ENROLLMENT_TIME vs FIRSTACCESS EXPLANATION")
        print(f"{'='*80}\n")
        
        student = db.query(Student).filter(
            Student.employee_id.ilike(f'%{employee_id}%')
        ).first()
        
        if not student:
            print("❌ Student not found")
            return
        
        enrollment = db.query(LMSUserCourse).filter(
            LMSUserCourse.student_id == student.id,
            LMSUserCourse.lms_course_id == str(course_id)
        ).first()
        
        if not enrollment:
            print("❌ Enrollment not found")
            return
        
        print("1. ENROLLMENT_TIME (enrollment_time in database)")
        print("   " + "─"*76)
        print("   ✅ This comes FROM the LMS API response")
        print("   📍 Source: enrolments[0].timecreated from core_enrol_get_enrolled_users API")
        print("   📍 Fallback 1: enrolments[0].timestart")
        print("   📍 Fallback 2: user.timecreated")
        print("   📍 Fallback 3: user.timestart")
        print("   📍 Fallback 4: user.firstaccess (only if others missing)")
        print()
        print(f"   Value: {enrollment.enrollment_time}")
        print(f"   Formatted: {enrollment.enrollment_time.strftime('%b %d, %Y, %I:%M %p') if enrollment.enrollment_time else 'None'}")
        print()
        print("   Meaning: When the user was actually ENROLLED in the course")
        print("   (This is when the enrollment record was created in LMS)")
        print()
        
        print("2. FIRSTACCESS (firstaccess in our API response)")
        print("   " + "─"*76)
        print("   ⚠️  This is NOT the same as enrollment_time!")
        print("   📍 Source: enrollment.start_date (which comes from course.startdate)")
        print()
        print(f"   Value: {enrollment.start_date}")
        print(f"   Formatted: {enrollment.start_date.strftime('%b %d, %Y, %I:%M %p') if enrollment.start_date else 'None'}")
        print()
        print("   Meaning: When the COURSE starts (not when user was enrolled)")
        print("   (This is the course start date, not enrollment date)")
        print()
        
        print("3. COMPARISON")
        print("   " + "─"*76)
        if enrollment.enrollment_time and enrollment.start_date:
            diff = (enrollment.start_date - enrollment.enrollment_time).days
            print(f"   enrollment_time: {enrollment.enrollment_time.strftime('%b %d, %Y, %I:%M %p')}")
            print(f"   start_date (firstaccess): {enrollment.start_date.strftime('%b %d, %Y, %I:%M %p')}")
            print(f"   Difference: {abs(diff)} days")
            if diff < 0:
                print(f"   ⚠️  User enrolled {abs(diff)} days AFTER course started!")
            elif diff > 0:
                print(f"   ✅ User enrolled {diff} days BEFORE course started")
            else:
                print(f"   ✅ User enrolled on the same day course started")
        print()
        
        print("4. WHAT OUR API RETURNS")
        print("   " + "─"*76)
        print("   GET /lms/courses/492/enrollments returns:")
        print(f"   • firstaccess: {int(enrollment.start_date.timestamp()) if enrollment.start_date else None}")
        print(f"     └─ This is from enrollment.start_date (COURSE START DATE)")
        print(f"     └─ NOT from enrollment.enrollment_time (ENROLLMENT DATE)")
        print()
        print("   ⚠️  ISSUE: The field name 'firstaccess' is misleading!")
        print("   It should probably be called 'course_start_date' or 'startdate'")
        print("   because it's not the first access time, it's the course start date.")
        print()
        
        print("5. WHAT THE LMS API ACTUALLY RETURNS")
        print("   " + "─"*76)
        print("   From core_enrol_get_enrolled_users API:")
        print("   • enrolments[0].timecreated → This is the REAL enrollment time")
        print("   • user.firstaccess → This is when user FIRST ACCESSED the course")
        print("   • (These are different! User can be enrolled but not access yet)")
        print()
        print("   From core_course_get_courses API:")
        print("   • course.startdate → This is when the course starts")
        print()
        
        print("6. SUMMARY")
        print("   " + "─"*76)
        print("   enrollment_time:")
        print("     ✅ From LMS API (enrolments[].timecreated)")
        print("     ✅ When user was enrolled")
        print("     ❌ NOT returned in our API (we should add it!)")
        print()
        print("   firstaccess (in our API):")
        print("     ⚠️  From course.startdate (NOT from LMS API firstaccess)")
        print("     ⚠️  Course start date, NOT enrollment date")
        print("     ⚠️  NOT the same as enrollment_time")
        print("     ⚠️  Misleading field name!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    explain_difference("BS1981", "492")

