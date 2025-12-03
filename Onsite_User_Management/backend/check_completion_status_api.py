#!/usr/bin/env python3
"""
Check what core_completion_get_course_completion_status API returns
and if it has any enrollment time information.
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
from app.models.lms_user import LMSUser

async def check_completion_status_api(employee_id: str, course_id: int):
    """Check what the completion status API returns."""
    try:
        print(f"\n{'='*80}")
        print(f"CHECKING core_completion_get_course_completion_status API")
        print(f"Employee: {employee_id}, Course ID: {course_id}")
        print(f"{'='*80}\n")
        
        if not settings.LMS_TOKEN:
            print("❌ LMS_TOKEN not configured")
            return
        
        # Get user ID from database
        db = SessionLocal()
        try:
            student = db.query(Student).filter(
                Student.employee_id.ilike(f'%{employee_id}%')
            ).first()
            
            if not student:
                print(f"❌ Student not found")
                return
            
            lms_user = db.query(LMSUser).filter(
                LMSUser.username == student.employee_id
            ).first()
            
            if not lms_user:
                print(f"❌ LMS user not found")
                return
            
            user_id = lms_user.lms_id
            print(f"LMS User ID: {user_id}\n")
        finally:
            db.close()
        
        # Call the API
        print("Calling core_completion_get_course_completion_status...")
        completion_data = await LMSService.fetch_course_completion_status(course_id, user_id)
        
        if not completion_data:
            print("❌ No data returned (user might not be enrolled or API error)")
            return
        
        print("✅ API Response received\n")
        
        print("="*80)
        print("FULL API RESPONSE")
        print("="*80)
        print()
        print(json.dumps(completion_data, indent=2, default=str))
        print()
        
        print("="*80)
        print("ANALYSIS")
        print("="*80)
        print()
        
        # Check for timecreated
        print("Searching for 'timecreated' fields...")
        def find_timecreated_recursive(obj, path="", results=None):
            if results is None:
                results = []
            if isinstance(obj, dict):
                for key, value in obj.items():
                    current_path = f"{path}.{key}" if path else key
                    if 'timecreated' in key.lower():
                        results.append({
                            'path': current_path,
                            'value': value,
                            'type': type(value).__name__
                        })
                    if isinstance(value, (dict, list)):
                        find_timecreated_recursive(value, current_path, results)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    find_timecreated_recursive(item, f"{path}[{i}]", results)
            return results
        
        timecreated_fields = find_timecreated_recursive(completion_data)
        
        if timecreated_fields:
            print(f"✅ FOUND {len(timecreated_fields)} timecreated field(s):")
            for field in timecreated_fields:
                print(f"   Path: {field['path']}")
                print(f"   Value: {field['value']}")
                if isinstance(field['value'], (int, float)) and field['value'] > 0:
                    try:
                        dt = datetime.fromtimestamp(field['value'])
                        print(f"   → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                    except:
                        pass
                print()
        else:
            print("❌ NO timecreated fields found")
            print()
        
        # Check for timecompleted
        print("Checking for 'timecompleted' fields...")
        completions = completion_data.get('completionstatus', {}).get('completions', [])
        if completions:
            print(f"✅ Found {len(completions)} completion record(s):")
            for i, completion in enumerate(completions, 0):
                print(f"   completions[{i}]:")
                print(f"     type: {completion.get('type')}")
                print(f"     title: {completion.get('title')}")
                print(f"     status: {completion.get('status')}")
                print(f"     complete: {completion.get('complete')}")
                timecompleted = completion.get('timecompleted')
                print(f"     timecompleted: {timecompleted}")
                if timecompleted:
                    dt = datetime.fromtimestamp(timecompleted)
                    print(f"       → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                print()
        else:
            print("❌ No completions array found")
            print()
        
        print("="*80)
        print("SUMMARY")
        print("="*80)
        print()
        print("What this API provides:")
        print("  ✅ Completion status (completed: 1 or 0)")
        print("  ✅ Completion details (completions array)")
        print("  ✅ timecompleted - When course/module was completed")
        print("  ❌ timecreated - When user was enrolled (NOT in this API)")
        print("  ❌ timestart - Enrollment start time (NOT in this API)")
        print()
        print("This API is for:")
        print("  • Checking if course is completed")
        print("  • Getting completion date (timecompleted)")
        print("  • Module-level progress details")
        print()
        print("This API is NOT for:")
        print("  • Getting enrollment/assignment time")
        print("  • Getting when user was enrolled")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_completion_status_api("BS1981", 492))

