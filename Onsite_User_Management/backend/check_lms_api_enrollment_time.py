#!/usr/bin/env python3
"""
Check the actual LMS API response to see if enrolments[0].timecreated is present.
"""

import asyncio
import sys
import os
from datetime import datetime
import json

sys.path.append(os.getcwd())

from app.services.lms.client import LMSService
from app.core.config import settings

async def check_enrollment_time_in_api(employee_id: str, course_id: int):
    """Check if enrolments[0].timecreated exists in LMS API response."""
    try:
        print(f"\n{'='*80}")
        print(f"CHECKING LMS API FOR ENROLLMENT TIME")
        print(f"Employee: {employee_id}, Course ID: {course_id}")
        print(f"{'='*80}\n")
        
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
            print(f"   ❌ enrolments array is empty or missing")
        
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
            print(f"     ❌ MISSING")
        
        print(f"   user.timestart: {user_timestart}")
        if user_timestart:
            dt = datetime.fromtimestamp(user_timestart)
            print(f"     → {dt.strftime('%b %d, %Y, %I:%M %p')}")
        else:
            print(f"     ❌ MISSING")
        
        print()
        
        # Check Priority 3: firstaccess
        print("3. First access field:")
        firstaccess = user_data.get('firstaccess')
        print(f"   user.firstaccess: {firstaccess}")
        if firstaccess:
            dt = datetime.fromtimestamp(firstaccess)
            print(f"     → {dt.strftime('%b %d, %Y, %I:%M %p')}")
        else:
            print(f"     ❌ MISSING")
        
        print()
        
        # Summary
        print("="*80)
        print("SUMMARY")
        print("="*80)
        print()
        
        if has_enrolments_array and len(user_data['enrolments']) > 0:
            first_enrol = user_data['enrolments'][0]
            if first_enrol.get('timecreated'):
                print("✅ enrolments[0].timecreated IS PRESENT in API response")
                print("✅ This is what was used for enrollment_time")
                print(f"   Value: {datetime.fromtimestamp(first_enrol['timecreated']).strftime('%b %d, %Y, %I:%M %p')}")
            elif first_enrol.get('timestart'):
                print("⚠️  enrolments[0].timecreated is MISSING")
                print("⚠️  But enrolments[0].timestart is present (fallback used)")
                print(f"   Value: {datetime.fromtimestamp(first_enrol['timestart']).strftime('%b %d, %Y, %I:%M %p')}")
            else:
                print("❌ enrolments[0].timecreated is MISSING")
                print("❌ enrolments[0].timestart is also MISSING")
                print("❌ A fallback was used (user.timecreated, user.timestart, or user.firstaccess)")
        else:
            print("❌ enrolments array is missing or empty")
            print("❌ A fallback was used (user.timecreated, user.timestart, or user.firstaccess)")
        
        print()
        print("="*80)
        print("FULL API RESPONSE (relevant fields)")
        print("="*80)
        print()
        print(json.dumps({
            'username': user_data.get('username'),
            'enrolments': user_data.get('enrolments', [])[:1] if user_data.get('enrolments') else [],
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
    asyncio.run(check_enrollment_time_in_api("BS1981", 492))

