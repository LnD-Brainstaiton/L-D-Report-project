#!/usr/bin/env python3
"""
Check if enrolments[0].timecreated was available in the LMS API response
or if a fallback was used.
"""

import sys
import os
from datetime import datetime

sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.student import Student
from app.models.lms_user import LMSUserCourse
from app.models.lms_cache import LMSCourseCache

def check_enrollment_source(employee_id: str, course_id: str):
    """Check which field was used for enrollment_time."""
    db = SessionLocal()
    try:
        print(f"\n{'='*80}")
        print("CHECKING ENROLLMENT TIME SOURCE")
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
        
        course_cache = db.query(LMSCourseCache).filter(
            LMSCourseCache.id == int(course_id)
        ).first()
        
        print(f"Current enrollment_time value:")
        print(f"  {enrollment.enrollment_time}")
        print(f"  Formatted: {enrollment.enrollment_time.strftime('%b %d, %Y, %I:%M %p') if enrollment.enrollment_time else 'None'}")
        print()
        
        print("="*80)
        print("ANALYSIS: Which field was likely used?")
        print("="*80)
        print()
        
        # Check if enrollment_time matches course.timecreated
        if course_cache and course_cache.timecreated:
            course_timecreated = datetime.fromtimestamp(course_cache.timecreated)
            print(f"1. Course timecreated: {course_timecreated.strftime('%b %d, %Y, %I:%M %p')}")
            if enrollment.enrollment_time and abs((enrollment.enrollment_time - course_timecreated).total_seconds()) < 60:
                print("   ⚠️  MATCHES! This suggests fallback was used (course creation time)")
            else:
                print("   ❌ Does NOT match enrollment_time")
        print()
        
        # Check if enrollment_time matches start_date
        if enrollment.start_date:
            print(f"2. Course start_date: {enrollment.start_date.strftime('%b %d, %Y, %I:%M %p')}")
            if enrollment.enrollment_time and abs((enrollment.enrollment_time - enrollment.start_date).total_seconds()) < 60:
                print("   ⚠️  MATCHES! This suggests fallback was used (course start date)")
            else:
                print("   ❌ Does NOT match enrollment_time")
        print()
        
        # Check if enrollment_time is close to created_at
        if enrollment.created_at:
            print(f"3. Record created_at: {enrollment.created_at.strftime('%b %d, %Y, %I:%M %p')}")
            if enrollment.enrollment_time and abs((enrollment.enrollment_time - enrollment.created_at.replace(tzinfo=None)).total_seconds()) < 3600:
                print("   ⚠️  Close to created_at! This might be a default/fallback value")
            else:
                print("   ❌ Not close to created_at")
        print()
        
        print("="*80)
        print("CONCLUSION")
        print("="*80)
        print()
        print("To determine if enrolments[0].timecreated was missing, we need to:")
        print("1. Check the actual LMS API response")
        print("2. Or check if enrollment_time matches any fallback values")
        print()
        
        # Check the actual API response by making a test call
        print("="*80)
        print("RECOMMENDATION: Check LMS API directly")
        print("="*80)
        print()
        print("The enrollment_time value suggests:")
        if enrollment.enrollment_time:
            # Check if it's a reasonable enrollment time (not matching course dates)
            is_reasonable = True
            if course_cache and course_cache.timecreated:
                course_timecreated = datetime.fromtimestamp(course_cache.timecreated)
                if abs((enrollment.enrollment_time - course_timecreated).total_seconds()) < 60:
                    is_reasonable = False
                    print("   ⚠️  enrollment_time matches course.timecreated")
                    print("   ⚠️  This suggests enrolments[0].timecreated was MISSING")
                    print("   ⚠️  A fallback was likely used")
            elif enrollment.start_date:
                if abs((enrollment.enrollment_time - enrollment.start_date).total_seconds()) < 60:
                    is_reasonable = False
                    print("   ⚠️  enrollment_time matches course.start_date")
                    print("   ⚠️  This suggests enrolments[0].timecreated was MISSING")
                    print("   ⚠️  A fallback was likely used")
            
            if is_reasonable:
                print("   ✅ enrollment_time is unique and doesn't match course dates")
                print("   ✅ This suggests enrolments[0].timecreated WAS available")
                print("   ✅ The value likely came from the LMS API")
        else:
            print("   ❌ enrollment_time is None - definitely missing from API")
        
        print()
        print("="*80)
        print("WHAT TO CHECK IN LMS API")
        print("="*80)
        print()
        print("Call: core_enrol_get_enrolled_users")
        print(f"  courseid: {course_id}")
        print(f"  username: {employee_id}")
        print()
        print("Check the response for:")
        print("  • enrolments[0].timecreated")
        print("  • enrolments[0].timestart")
        print("  • timecreated (user level)")
        print("  • timestart (user level)")
        print("  • firstaccess")
        print()
        print("If enrolments[0].timecreated is missing/null, then a fallback was used.")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_enrollment_source("BS1981", "492")

