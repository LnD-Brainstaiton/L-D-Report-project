#!/usr/bin/env python3
"""
Script to check all time-related fields for a specific user across all LMS APIs.
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

def format_datetime(dt):
    """Format datetime for display."""
    if dt is None:
        return "None"
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return str(dt)

def format_timestamp(ts):
    """Format Unix timestamp for display."""
    if ts is None:
        return "None"
    try:
        if isinstance(ts, (int, float)):
            return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")
        return str(ts)
    except:
        return str(ts)

def check_user_times(employee_id: str):
    """Check all time-related fields for a specific user."""
    db = SessionLocal()
    try:
        print(f"\n{'='*80}")
        print(f"Checking ALL TIME-RELATED FIELDS for: {employee_id}")
        print(f"{'='*80}\n")
        
        # Find student by employee_id
        student = db.query(Student).filter(
            Student.employee_id.ilike(f'%{employee_id}%')
        ).first()
        
        if not student:
            print(f"❌ Student with employee_id '{employee_id}' not found in database")
            return
        
        print(f"✅ Found student:")
        print(f"   - ID: {student.id}")
        print(f"   - Name: {student.name}")
        print(f"   - Email: {student.email}")
        print(f"   - Is Active: {student.is_active}")
        print()
        
        # Get all LMS courses for this student
        enrollments = db.query(LMSUserCourse).filter(
            LMSUserCourse.student_id == student.id
        ).all()
        
        if not enrollments:
            print("⚠️  No LMS courses found for this user")
            return
        
        print(f"📚 Found {len(enrollments)} LMS course enrollment(s)\n")
        
        # Group by course to show all time fields
        for i, enrollment in enumerate(enrollments, 1):
            print(f"{'─'*80}")
            print(f"COURSE {i}: {enrollment.course_name}")
            print(f"{'─'*80}")
            print(f"   Course ID: {enrollment.lms_course_id}")
            print(f"   Short Name: {enrollment.course_shortname}")
            print()
            
            # Get course details from cache
            course_cache = db.query(LMSCourseCache).filter(
                LMSCourseCache.id == int(enrollment.lms_course_id)
            ).first()
            
            print(f"{'TIME FIELDS FROM LMSUserCourse TABLE (enrollment record):'}")
            print(f"   • enrollment_time:     {format_datetime(enrollment.enrollment_time)}")
            print(f"   • start_date:          {format_datetime(enrollment.start_date)}")
            print(f"   • end_date:            {format_datetime(enrollment.end_date)}")
            print(f"   • last_access:         {format_datetime(enrollment.last_access)}")
            print(f"   • completion_date:     {format_datetime(enrollment.completion_date)}")
            print(f"   • created_at:          {format_datetime(enrollment.created_at)}")
            print(f"   • updated_at:          {format_datetime(enrollment.updated_at)}")
            print()
            
            if course_cache:
                print(f"{'TIME FIELDS FROM LMSCourseCache TABLE (course metadata):'}")
                print(f"   • startdate (Unix):   {course_cache.startdate} -> {format_timestamp(course_cache.startdate)}")
                print(f"   • enddate (Unix):     {course_cache.enddate} -> {format_timestamp(course_cache.enddate)}")
                print(f"   • timecreated (Unix): {course_cache.timecreated} -> {format_timestamp(course_cache.timecreated)}")
                print(f"   • cached_at:          {format_datetime(course_cache.cached_at)}")
                print()
            
            # Calculate time differences
            print(f"{'TIME CALCULATIONS:'}")
            if enrollment.enrollment_time and enrollment.start_date:
                diff = (enrollment.start_date - enrollment.enrollment_time).days
                print(f"   • Days from enrollment to start: {diff} days")
            
            if enrollment.start_date and enrollment.end_date:
                diff = (enrollment.end_date - enrollment.start_date).days
                print(f"   • Course duration: {diff} days")
            
            if enrollment.last_access:
                now = datetime.now()
                diff = (now - enrollment.last_access).days
                print(f"   • Days since last access: {diff} days")
            
            print()
        
        # Now simulate what the API would return
        print(f"\n{'='*80}")
        print("SIMULATED API RESPONSES (what the APIs would return):")
        print(f"{'='*80}\n")
        
        # Simulate GET /lms/users/{username}/courses response
        print(f"{'─'*80}")
        print("API: GET /lms/users/{username}/courses")
        print(f"{'─'*80}")
        print("This endpoint returns:")
        print("  - startdate: Unix timestamp (from course cache)")
        print("  - enddate: Unix timestamp (from course cache)")
        print("  - lastaccess: Unix timestamp (from enrollment.last_access)")
        print()
        
        api_courses = []
        for enrollment in enrollments:
            course_cache = db.query(LMSCourseCache).filter(
                LMSCourseCache.id == int(enrollment.lms_course_id)
            ).first()
            
            course_data = {
                "id": enrollment.lms_course_id,
                "fullname": enrollment.course_name,
                "startdate": int(course_cache.startdate) if course_cache and course_cache.startdate else None,
                "enddate": int(course_cache.enddate) if course_cache and course_cache.enddate else None,
                "lastaccess": int(enrollment.last_access.timestamp()) if enrollment.last_access else None,
            }
            api_courses.append(course_data)
            
            print(f"Course: {enrollment.course_name}")
            print(f"  startdate: {course_data['startdate']} -> {format_timestamp(course_data['startdate'])}")
            print(f"  enddate: {course_data['enddate']} -> {format_timestamp(course_data['enddate'])}")
            print(f"  lastaccess: {course_data['lastaccess']} -> {format_timestamp(course_data['lastaccess'])}")
            print()
        
        # Simulate GET /lms/courses/{course_id}/enrollments response
        print(f"{'─'*80}")
        print("API: GET /lms/courses/{course_id}/enrollments")
        print(f"{'─'*80}")
        print("This endpoint returns (for each enrollment):")
        print("  - firstaccess: Unix timestamp (from enrollment.start_date)")
        print("  - lastaccess: Unix timestamp (from enrollment.last_access)")
        print()
        
        # Group enrollments by course
        courses_checked = set()
        for enrollment in enrollments:
            course_id = enrollment.lms_course_id
            if course_id not in courses_checked:
                courses_checked.add(course_id)
                print(f"Course ID {course_id}: {enrollment.course_name}")
                print(f"  firstaccess: {int(enrollment.start_date.timestamp()) if enrollment.start_date else None} -> {format_datetime(enrollment.start_date)}")
                print(f"  lastaccess: {int(enrollment.last_access.timestamp()) if enrollment.last_access else None} -> {format_datetime(enrollment.last_access)}")
                print()
        
        # Summary table
        print(f"\n{'='*80}")
        print("SUMMARY TABLE - All Time Fields")
        print(f"{'='*80}\n")
        print(f"{'Course Name':<50} {'Enrollment':<20} {'Start':<20} {'End':<20} {'Last Access':<20}")
        print(f"{'-'*130}")
        
        for enrollment in enrollments:
            course_name = enrollment.course_name[:47] + "..." if len(enrollment.course_name) > 50 else enrollment.course_name
            enrollment_str = format_datetime(enrollment.enrollment_time)[:18] if enrollment.enrollment_time else "None"
            start_str = format_datetime(enrollment.start_date)[:18] if enrollment.start_date else "None"
            end_str = format_datetime(enrollment.end_date)[:18] if enrollment.end_date else "None"
            last_access_str = format_datetime(enrollment.last_access)[:18] if enrollment.last_access else "None"
            
            print(f"{course_name:<50} {enrollment_str:<20} {start_str:<20} {end_str:<20} {last_access_str:<20}")
        
    except Exception as e:
        print(f"❌ Error querying database: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    employee_id = "BS1981"
    check_user_times(employee_id)

