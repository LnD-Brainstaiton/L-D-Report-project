#!/usr/bin/env python3
"""
Check EVERYWHERE for timecreated - all APIs, all fields, nested structures.
"""

import asyncio
import sys
import os
from datetime import datetime
import json

sys.path.append(os.getcwd())

from app.services.lms.client import LMSService
from app.core.config import settings

def find_timecreated_recursive(obj, path="", results=None):
    """Recursively search for any field containing 'timecreated'."""
    if results is None:
        results = []
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            current_path = f"{path}.{key}" if path else key
            if 'timecreated' in key.lower() or 'time_created' in key.lower():
                results.append({
                    'path': current_path,
                    'value': value,
                    'type': type(value).__name__
                })
            if isinstance(value, (dict, list)):
                find_timecreated_recursive(value, current_path, results)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            current_path = f"{path}[{i}]"
            find_timecreated_recursive(item, current_path, results)
    
    return results

async def check_everywhere_for_timecreated(employee_id: str, course_id: int):
    """Check all APIs and all fields for timecreated."""
    try:
        print(f"\n{'='*80}")
        print(f"SEARCHING EVERYWHERE FOR TIMECREATED")
        print(f"Employee: {employee_id}, Course ID: {course_id}")
        print(f"{'='*80}\n")
        
        if not settings.LMS_TOKEN:
            print("❌ LMS_TOKEN not configured")
            return
        
        # 1. Check core_enrol_get_enrolled_users - FULL RESPONSE
        print("1. API: core_enrol_get_enrolled_users (FULL RESPONSE)")
        print("   " + "-"*76)
        enrolled_users = await LMSService.fetch_course_enrollments(course_id)
        
        user_data = None
        for user in enrolled_users:
            if user.get('username', '').upper() == employee_id.upper():
                user_data = user
                break
        
        if user_data:
            print(f"   ✅ User found")
            print(f"   Searching entire response for 'timecreated'...")
            timecreated_fields = find_timecreated_recursive(user_data)
            
            if timecreated_fields:
                print(f"   ✅ FOUND {len(timecreated_fields)} timecreated field(s):")
                for field in timecreated_fields:
                    print(f"      Path: {field['path']}")
                    print(f"      Value: {field['value']}")
                    if isinstance(field['value'], (int, float)) and field['value'] > 0:
                        try:
                            dt = datetime.fromtimestamp(field['value'])
                            print(f"      → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                        except:
                            pass
                    print()
            else:
                print(f"   ❌ NO timecreated fields found in entire response")
            
            print(f"   Full response structure:")
            print(json.dumps(user_data, indent=2, default=str)[:2000])  # First 2000 chars
            print()
        else:
            print(f"   ❌ User not found")
        
        print()
        
        # 2. Check core_enrol_get_users_courses - FULL RESPONSE
        print("2. API: core_enrol_get_users_courses (FULL RESPONSE)")
        print("   " + "-"*76)
        try:
            user_courses = await LMSService.fetch_user_courses(employee_id, None)
            if user_courses:
                for course in user_courses:
                    if str(course.get('id')) == str(course_id):
                        print(f"   ✅ Course found")
                        print(f"   Searching entire response for 'timecreated'...")
                        timecreated_fields = find_timecreated_recursive(course)
                        
                        if timecreated_fields:
                            print(f"   ✅ FOUND {len(timecreated_fields)} timecreated field(s):")
                            for field in timecreated_fields:
                                print(f"      Path: {field['path']}")
                                print(f"      Value: {field['value']}")
                                if isinstance(field['value'], (int, float)) and field['value'] > 0:
                                    try:
                                        dt = datetime.fromtimestamp(field['value'])
                                        print(f"      → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                                    except:
                                        pass
                                print()
                        else:
                            print(f"   ❌ NO timecreated fields found in entire response")
                        
                        print(f"   Full response structure:")
                        print(json.dumps(course, indent=2, default=str)[:2000])  # First 2000 chars
                        break
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()
        
        # 3. Check course data itself
        print("3. API: core_course_get_courses (Course metadata)")
        print("   " + "-"*76)
        try:
            courses = await LMSService.fetch_lms_courses()
            for course in courses:
                if course.get('id') == course_id:
                    print(f"   ✅ Course found")
                    print(f"   Searching for 'timecreated'...")
                    timecreated_fields = find_timecreated_recursive(course)
                    
                    if timecreated_fields:
                        print(f"   ✅ FOUND {len(timecreated_fields)} timecreated field(s):")
                        for field in timecreated_fields:
                            print(f"      Path: {field['path']}")
                            print(f"      Value: {field['value']}")
                            if isinstance(field['value'], (int, float)) and field['value'] > 0:
                                try:
                                    dt = datetime.fromtimestamp(field['value'])
                                    print(f"      → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                                except:
                                    pass
                            print()
                    else:
                        print(f"   ❌ NO timecreated fields found")
                    
                    print(f"   Course keys: {list(course.keys())}")
                    if 'timecreated' in course:
                        print(f"   course.timecreated: {course.get('timecreated')}")
                    break
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()
        print("="*80)
        print("FINAL SUMMARY")
        print("="*80)
        print()
        print("Searched in:")
        print("  1. core_enrol_get_enrolled_users - entire user response")
        print("  2. core_enrol_get_users_courses - entire course response")
        print("  3. core_course_get_courses - course metadata")
        print()
        print("Result: Check above for any timecreated fields found")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_everywhere_for_timecreated("BS1981", 492))

