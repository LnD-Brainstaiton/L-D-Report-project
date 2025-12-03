#!/usr/bin/env python3
"""
Check if there's a "Sep 19, 7:45 PM" time field in any API response for this course.
"""

import sys
import os
from datetime import datetime

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.student import Student
from app.models.lms_user import LMSUserCourse
from app.models.lms_cache import LMSCourseCache

def format_datetime_readable(dt):
    """Format datetime in readable English format: 'Sep 19, 2025, 7:45 PM'"""
    if dt is None:
        return "Not available"
    if isinstance(dt, datetime):
        return dt.strftime("%b %d, %Y, %I:%M %p")
    return str(dt)

def check_for_time(employee_id: str, course_id: str, target_time_str: str = "Sep 19, 7:45 PM"):
    """Check all time fields for a specific time."""
    db = SessionLocal()
    try:
        print(f"\n{'='*80}")
        print(f"Checking for '{target_time_str}' in all time fields")
        print(f"Employee: {employee_id}, Course ID: {course_id}")
        print(f"{'='*80}\n")
        
        # Find student
        student = db.query(Student).filter(
            Student.employee_id.ilike(f'%{employee_id}%')
        ).first()
        
        if not student:
            print(f"❌ Student not found")
            return
        
        # Find enrollment
        enrollment = db.query(LMSUserCourse).filter(
            LMSUserCourse.student_id == student.id,
            LMSUserCourse.lms_course_id == str(course_id)
        ).first()
        
        if not enrollment:
            print(f"❌ Enrollment not found")
            return
        
        # Get course cache
        course_cache = db.query(LMSCourseCache).filter(
            LMSCourseCache.id == int(course_id)
        ).first()
        
        print("ALL TIME FIELDS (Formatted):")
        print(f"{'─'*80}")
        
        # Check all time fields
        time_fields = [
            ("enrollment_time", enrollment.enrollment_time),
            ("start_date", enrollment.start_date),
            ("end_date", enrollment.end_date),
            ("last_access", enrollment.last_access),
            ("completion_date", enrollment.completion_date),
            ("created_at", enrollment.created_at),
            ("updated_at", enrollment.updated_at),
        ]
        
        if course_cache:
            time_fields.extend([
                ("course.startdate (Unix)", datetime.fromtimestamp(course_cache.startdate) if course_cache.startdate else None),
                ("course.enddate (Unix)", datetime.fromtimestamp(course_cache.enddate) if course_cache.enddate and course_cache.enddate > 0 else None),
                ("course.timecreated (Unix)", datetime.fromtimestamp(course_cache.timecreated) if course_cache.timecreated else None),
                ("course.cached_at", course_cache.cached_at),
            ])
        
        found_match = False
        for field_name, field_value in time_fields:
            formatted = format_datetime_readable(field_value)
            match_indicator = ""
            
            # Check if it matches the target (checking for Sep 19 and 7:45 PM)
            if field_value and isinstance(field_value, datetime):
                # Check if it's Sep 19
                if field_value.month == 9 and field_value.day == 19:
                    # Check if it's around 7:45 PM (19:45 in 24-hour format)
                    if field_value.hour == 19 and field_value.minute == 45:
                        match_indicator = " ✅ MATCHES!"
                        found_match = True
                    elif field_value.hour == 19:
                        match_indicator = " ⚠️  Close (7 PM but different minute)"
                    elif field_value.minute == 45:
                        match_indicator = " ⚠️  Close (45 minutes but different hour)"
            
            print(f"  {field_name:<35} {formatted}{match_indicator}")
        
        print(f"\n{'─'*80}")
        if found_match:
            print(f"✅ FOUND: '{target_time_str}' exists in the time fields!")
        else:
            print(f"❌ NOT FOUND: '{target_time_str}' does not exist in any time field.")
            print(f"\nClosest matches on Sep 19:")
            for field_name, field_value in time_fields:
                if field_value and isinstance(field_value, datetime):
                    if field_value.month == 9 and field_value.day == 19:
                        formatted = format_datetime_readable(field_value)
                        print(f"  • {field_name}: {formatted}")
        
        # Also show what the API would return
        print(f"\n{'='*80}")
        print("API RESPONSE FIELDS (what our APIs return):")
        print(f"{'='*80}\n")
        
        print("GET /lms/courses/492/enrollments returns:")
        if enrollment.start_date:
            firstaccess_ts = int(enrollment.start_date.timestamp())
            firstaccess_dt = datetime.fromtimestamp(firstaccess_ts)
            print(f"  • firstaccess: {firstaccess_ts} -> {format_datetime_readable(firstaccess_dt)}")
        if enrollment.last_access:
            lastaccess_ts = int(enrollment.last_access.timestamp())
            lastaccess_dt = datetime.fromtimestamp(lastaccess_ts)
            print(f"  • lastaccess: {lastaccess_ts} -> {format_datetime_readable(lastaccess_dt)}")
        
        print("\nGET /lms/users/BS1981/courses returns:")
        if enrollment.start_date:
            startdate_ts = int(enrollment.start_date.timestamp())
            startdate_dt = datetime.fromtimestamp(startdate_ts)
            print(f"  • startdate: {startdate_ts} -> {format_datetime_readable(startdate_dt)}")
        if enrollment.end_date:
            enddate_ts = int(enrollment.end_date.timestamp())
            enddate_dt = datetime.fromtimestamp(enddate_ts)
            print(f"  • enddate: {enddate_ts} -> {format_datetime_readable(enddate_dt)}")
        if enrollment.last_access:
            lastaccess_ts = int(enrollment.last_access.timestamp())
            lastaccess_dt = datetime.fromtimestamp(lastaccess_ts)
            print(f"  • lastaccess: {lastaccess_ts} -> {format_datetime_readable(lastaccess_dt)}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    employee_id = "BS1981"
    course_id = "492"
    check_for_time(employee_id, course_id, "Sep 19, 7:45 PM")

