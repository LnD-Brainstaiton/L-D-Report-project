#!/usr/bin/env python3
"""
Check if enrolments array exists but is empty, and check for timecreated in other API responses.
"""

import asyncio
import sys
import os
from datetime import datetime
import json

sys.path.append(os.getcwd())

from app.services.lms.client import LMSService
from app.core.config import settings

async def check_all_timecreated_sources(employee_id: str, course_id: int):
    """Check all possible sources of timecreated."""
    try:
        print(f"\n{'='*80}")
        print(f"CHECKING ALL TIMECREATED FIELDS")
        print(f"Employee: {employee_id}, Course ID: {course_id}")
        print(f"{'='*80}\n")
        
        if not settings.LMS_TOKEN:
            print("❌ LMS_TOKEN not configured")
            return
        
        # 1. Check core_enrol_get_enrolled_users
        print("1. API: core_enrol_get_enrolled_users")
        print("   " + "-"*76)
        enrolled_users = await LMSService.fetch_course_enrollments(course_id)
        
        user_data = None
        for user in enrolled_users:
            if user.get('username', '').upper() == employee_id.upper():
                user_data = user
                break
        
        if user_data:
            print(f"   ✅ User found")
            print(f"   Has 'enrolments' key: {'enrolments' in user_data}")
            
            if 'enrolments' in user_data:
                enrolments = user_data.get('enrolments', [])
                print(f"   enrolments type: {type(enrolments)}")
                print(f"   enrolments value: {enrolments}")
                print(f"   enrolments length: {len(enrolments)}")
                
                if isinstance(enrolments, list):
                    if len(enrolments) == 0:
                        print(f"   ⚠️  enrolments array EXISTS but is EMPTY []")
                    else:
                        print(f"   ✅ enrolments array has {len(enrolments)} items")
                        for i, enrol in enumerate(enrolments):
                            print(f"      enrolments[{i}].timecreated: {enrol.get('timecreated')}")
                else:
                    print(f"   ⚠️  enrolments is not a list: {type(enrolments)}")
            else:
                print(f"   ❌ 'enrolments' key does NOT exist in response")
            
            print(f"   user.timecreated: {user_data.get('timecreated')}")
            print(f"   user.timestart: {user_data.get('timestart')}")
            print(f"   user.firstaccess: {user_data.get('firstaccess')}")
        else:
            print(f"   ❌ User not found")
        
        print()
        
        # 2. Check core_enrol_get_users_courses (user's courses)
        print("2. API: core_enrol_get_users_courses")
        print("   " + "-"*76)
        try:
            user_courses = await LMSService.fetch_user_courses(employee_id, None)
            if user_courses:
                for course in user_courses:
                    if str(course.get('id')) == str(course_id):
                        print(f"   ✅ Course found in user's courses")
                        print(f"   Course keys: {list(course.keys())}")
                        print(f"   timecreated: {course.get('timecreated')}")
                        print(f"   timestart: {course.get('timestart')}")
                        print(f"   timeend: {course.get('timeend')}")
                        print(f"   enrolledusercount: {course.get('enrolledusercount')}")
                        break
                else:
                    print(f"   ⚠️  Course {course_id} not found in user's courses list")
            else:
                print(f"   ⚠️  No courses returned")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()
        
        # 3. Check if there's a different enrollment API
        print("3. Checking for other enrollment-related fields")
        print("   " + "-"*76)
        if user_data:
            print(f"   All keys in user response: {list(user_data.keys())}")
            print()
            print(f"   Fields that might contain time information:")
            for key in user_data.keys():
                if 'time' in key.lower() or 'date' in key.lower() or 'created' in key.lower() or 'start' in key.lower():
                    value = user_data.get(key)
                    if value:
                        if isinstance(value, (int, float)) and value > 0:
                            try:
                                dt = datetime.fromtimestamp(value)
                                print(f"     {key}: {value} → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                            except:
                                print(f"     {key}: {value}")
                        else:
                            print(f"     {key}: {value}")
        
        print()
        print("="*80)
        print("SUMMARY")
        print("="*80)
        print()
        
        if user_data and 'enrolments' in user_data:
            enrolments = user_data.get('enrolments', [])
            if isinstance(enrolments, list) and len(enrolments) == 0:
                print("✅ enrolments array EXISTS but is EMPTY []")
                print("   The field is there, just no data in it")
            elif isinstance(enrolments, list) and len(enrolments) > 0:
                print("✅ enrolments array EXISTS and has data")
            else:
                print("❌ enrolments array issue")
        else:
            print("❌ enrolments array does NOT exist in response")
        
        print()
        print("Other timecreated fields found:")
        if user_data:
            if user_data.get('timecreated'):
                print(f"  ✅ user.timecreated: {user_data.get('timecreated')}")
            else:
                print(f"  ❌ user.timecreated: missing/null")
        
        # Check user courses API
        try:
            user_courses = await LMSService.fetch_user_courses(employee_id, None)
            if user_courses:
                for course in user_courses:
                    if str(course.get('id')) == str(course_id):
                        if course.get('timecreated'):
                            print(f"  ✅ course.timecreated (from user courses API): {course.get('timecreated')}")
                        else:
                            print(f"  ❌ course.timecreated: missing")
                        break
        except:
            pass
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_all_timecreated_sources("BS1981", 492))
    print("\n\n" + "="*80 + "\n")
    asyncio.run(check_all_timecreated_sources("BS1981", 596))

