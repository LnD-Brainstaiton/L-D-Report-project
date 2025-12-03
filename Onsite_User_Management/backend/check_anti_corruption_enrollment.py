#!/usr/bin/env python3
"""
Check enrollment time fields for Anti-Corruption and Anti-Bribery Policy course.
"""

import asyncio
import sys
import os
from datetime import datetime
import json

sys.path.append(os.getcwd())

from app.services.lms.client import LMSService
from app.core.config import settings
from app.db.base import SessionLocal
from app.models.student import Student
from app.models.lms_user import LMSUserCourse

async def check_anti_corruption_course(employee_id: str):
    """Check Anti-Corruption course enrollment data."""
    try:
        # First find the course ID
        db = SessionLocal()
        try:
            student = db.query(Student).filter(
                Student.employee_id.ilike(f'%{employee_id}%')
            ).first()
            
            if not student:
                print(f"❌ Student {employee_id} not found")
                return
            
            # Find Anti-Corruption course
            enrollment = db.query(LMSUserCourse).filter(
                LMSUserCourse.student_id == student.id,
                LMSUserCourse.course_name.ilike('%Anti-Corruption%')
            ).first()
            
            if not enrollment:
                print(f"❌ Anti-Corruption course not found for {employee_id}")
                return
            
            course_id = int(enrollment.lms_course_id)
            print(f"\n{'='*80}")
            print(f"CHECKING ANTI-CORRUPTION COURSE")
            print(f"Employee: {employee_id}")
            print(f"Course: {enrollment.course_name}")
            print(f"Course ID: {course_id}")
            print(f"{'='*80}\n")
            
            print("Database enrollment_time:")
            print(f"  {enrollment.enrollment_time}")
            if enrollment.enrollment_time:
                print(f"  Formatted: {enrollment.enrollment_time.strftime('%b %d, %Y, %I:%M %p')}")
            print()
            
        finally:
            db.close()
        
        if not settings.LMS_TOKEN:
            print("❌ LMS_TOKEN not configured. Cannot check API.")
            return
        
        print("Fetching enrollments from LMS API...")
        enrolled_users = await LMSService.fetch_course_enrollments(course_id)
        
        # Find the specific user
        user_data = None
        for user in enrolled_users:
            username = user.get('username', '').upper()
            if username == employee_id.upper():
                user_data = user
                break
        
        if not user_data:
            print(f"❌ User {employee_id} not found in course {course_id} enrollments")
            return
        
        print(f"✅ Found user in API response\n")
        
        print("="*80)
        print("CHECKING FOR ENROLLMENT TIME FIELDS")
        print("="*80)
        print()
        
        # Check Priority 1: enrolments array
        has_enrolments_array = 'enrolments' in user_data and isinstance(user_data.get('enrolments'), list)
        print(f"1. enrolments array exists: {has_enrolments_array}")
        
        if has_enrolments_array and len(user_data['enrolments']) > 0:
            first_enrol = user_data['enrolments'][0]
            print(f"   First enrollment object keys: {list(first_enrol.keys())}")
            
            timecreated = first_enrol.get('timecreated')
            timestart = first_enrol.get('timestart')
            
            print(f"   enrolments[0].timecreated: {timecreated}")
            if timecreated:
                dt = datetime.fromtimestamp(timecreated)
                print(f"     → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                print(f"   ✅ PRESENT - This is what was used!")
            else:
                print(f"   ❌ MISSING")
            
            print(f"   enrolments[0].timestart: {timestart}")
            if timestart:
                dt = datetime.fromtimestamp(timestart)
                print(f"     → {dt.strftime('%b %d, %Y, %I:%M %p')}")
            else:
                print(f"   ❌ MISSING")
        else:
            print(f"   ❌ enrolments array is empty or missing")
            if has_enrolments_array:
                print(f"   Array length: {len(user_data.get('enrolments', []))}")
        
        print()
        
        # Check Priority 2: User-level fields
        print("2. User-level enrollment fields:")
        user_timecreated = user_data.get('timecreated')
        user_timestart = user_data.get('timestart')
        
        print(f"   user.timecreated: {user_timecreated}")
        if user_timecreated:
            dt = datetime.fromtimestamp(user_timecreated)
            print(f"     → {dt.strftime('%b %d, %Y, %I:%M %p')}")
        else:
            print(f"     ❌ MISSING (null)")
        
        print(f"   user.timestart: {user_timestart}")
        if user_timestart:
            dt = datetime.fromtimestamp(user_timestart)
            print(f"     → {dt.strftime('%b %d, %Y, %I:%M %p')}")
        else:
            print(f"     ❌ MISSING (null)")
        
        print()
        
        # Check Priority 3: firstaccess
        print("3. First access field:")
        firstaccess = user_data.get('firstaccess')
        print(f"   user.firstaccess: {firstaccess}")
        if firstaccess:
            dt = datetime.fromtimestamp(firstaccess)
            print(f"     → {dt.strftime('%b %d, %Y, %I:%M %p')}")
            print(f"   ✅ PRESENT")
        else:
            print(f"     ❌ MISSING")
        
        print()
        
        # Summary
        print("="*80)
        print("SUMMARY")
        print("="*80)
        print()
        
        print("API Response Fields:")
        print(f"  • enrolments array: {'empty or missing' if not (has_enrolments_array and len(user_data.get('enrolments', [])) > 0) else 'present'}")
        print(f"  • enrolments[0].timecreated: {'not present' if not (has_enrolments_array and len(user_data.get('enrolments', [])) > 0 and user_data['enrolments'][0].get('timecreated')) else 'present'}")
        print(f"  • enrolments[0].timestart: {'not present' if not (has_enrolments_array and len(user_data.get('enrolments', [])) > 0 and user_data['enrolments'][0].get('timestart')) else 'present'}")
        print(f"  • user.timecreated: {'missing (null)' if not user_timecreated else 'present'}")
        print(f"  • user.timestart: {'missing (null)' if not user_timestart else 'missing (null)'}")
        print(f"  • user.firstaccess: {'present' if firstaccess else 'missing'}", end="")
        if firstaccess:
            dt = datetime.fromtimestamp(firstaccess)
            print(f" — {dt.strftime('%b %d, %Y, %I:%M %p')}")
        else:
            print()
        
        print()
        print("="*80)
        print("FULL API RESPONSE (relevant fields)")
        print("="*80)
        print()
        print(json.dumps({
            'username': user_data.get('username'),
            'enrolments': user_data.get('enrolments', []),
            'enrolments_count': len(user_data.get('enrolments', [])),
            'timecreated': user_data.get('timecreated'),
            'timestart': user_data.get('timestart'),
            'firstaccess': user_data.get('firstaccess'),
            'lastaccess': user_data.get('lastaccess'),
        }, indent=2, default=str))
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_anti_corruption_course("BS1981"))

