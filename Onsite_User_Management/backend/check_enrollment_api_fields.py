#!/usr/bin/env python3
"""
Check if timestart, timecreated, timemodified fields exist in core_enrol_get_enrolled_users response.
"""

import asyncio
import sys
import os
from datetime import datetime
import json

sys.path.append(os.getcwd())

from app.services.lms.client import LMSService
from app.core.config import settings

async def check_enrollment_fields(employee_id: str, course_id: int):
    """Check what fields are actually in the enrollment API response."""
    try:
        print(f"\n{'='*80}")
        print(f"CHECKING core_enrol_get_enrolled_users API RESPONSE")
        print(f"Employee: {employee_id}, Course ID: {course_id}")
        print(f"{'='*80}\n")
        
        if not settings.LMS_TOKEN:
            print("❌ LMS_TOKEN not configured")
            return
        
        print("Calling core_enrol_get_enrolled_users...")
        enrolled_users = await LMSService.fetch_course_enrollments(course_id)
        
        # Find the specific user
        user_data = None
        for user in enrolled_users:
            if user.get('username', '').upper() == employee_id.upper():
                user_data = user
                break
        
        if not user_data:
            print(f"❌ User {employee_id} not found")
            return
        
        print(f"✅ User found\n")
        
        print("="*80)
        print("FULL API RESPONSE")
        print("="*80)
        print()
        print(json.dumps(user_data, indent=2, default=str))
        print()
        
        print("="*80)
        print("CHECKING FOR SPECIFIC FIELDS")
        print("="*80)
        print()
        
        # Check for fields mentioned in documentation
        fields_to_check = [
            'timestart',
            'timeend',
            'timecreated',
            'timemodified',
            'enrollments',
            'userid',
            'courseid',
            'status'
        ]
        
        print("Fields from documentation:")
        for field in fields_to_check:
            value = user_data.get(field)
            if value is not None:
                print(f"  ✅ {field}: {value}")
                if isinstance(value, (int, float)) and value > 0:
                    try:
                        dt = datetime.fromtimestamp(value)
                        print(f"     → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                    except:
                        pass
            else:
                print(f"  ❌ {field}: NOT PRESENT")
        
        print()
        
        # Check if there's an enrollments array
        if 'enrollments' in user_data:
            print("✅ 'enrollments' array exists:")
            enrollments = user_data.get('enrollments', [])
            if isinstance(enrollments, list) and len(enrollments) > 0:
                print(f"   Array has {len(enrollments)} item(s)")
                for i, enrol in enumerate(enrollments):
                    print(f"   enrollments[{i}]:")
                    print(f"     {json.dumps(enrol, indent=6, default=str)}")
            else:
                print(f"   Array is empty: {enrollments}")
        else:
            print("❌ 'enrollments' array does NOT exist in response")
        
        print()
        print("="*80)
        print("ALL FIELDS IN RESPONSE")
        print("="*80)
        print()
        print("Complete list of fields:")
        for key, value in user_data.items():
            value_type = type(value).__name__
            value_preview = str(value)[:100] if not isinstance(value, (dict, list)) else f"{value_type} ({len(value) if isinstance(value, (list, dict)) else 'N/A'} items)"
            print(f"  • {key}: {value_type} = {value_preview}")
        
        print()
        print("="*80)
        print("COMPARISON WITH DOCUMENTATION")
        print("="*80)
        print()
        print("Documentation says response should have:")
        print("  {")
        print("    'enrollments': [")
        print("      {")
        print("        'userid': int,")
        print("        'courseid': int,")
        print("        'status': int,")
        print("        'timestart': int,")
        print("        'timeend': int,")
        print("        'timecreated': int,")
        print("        'timemodified': int")
        print("      }")
        print("    ]")
        print("  }")
        print()
        print("Actual response has:")
        print("  • Direct user object (not wrapped in 'enrollments' array)")
        print("  • User fields: id, username, email, firstaccess, lastaccess, etc.")
        print("  • ❌ NO 'enrollments' array")
        print("  • ❌ NO 'timestart', 'timeend', 'timecreated', 'timemodified' at user level")
        print()
        print("⚠️  The actual API response structure is DIFFERENT from the documentation!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_enrollment_fields("BS1981", 596))

