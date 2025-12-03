#!/usr/bin/env python3
"""
Show what core_enrol_get_enrolled_users API returns.
"""

import asyncio
import sys
import os
from datetime import datetime
import json

sys.path.append(os.getcwd())

from app.services.lms.client import LMSService
from app.core.config import settings

async def show_enrolled_users_response(course_id: int):
    """Show the full response structure of core_enrol_get_enrolled_users."""
    try:
        print(f"\n{'='*80}")
        print(f"WHAT core_enrol_get_enrolled_users RETURNS")
        print(f"Course ID: {course_id}")
        print(f"{'='*80}\n")
        
        if not settings.LMS_TOKEN:
            print("❌ LMS_TOKEN not configured")
            return
        
        print("Fetching enrollments from LMS API...")
        enrolled_users = await LMSService.fetch_course_enrollments(course_id)
        
        print(f"Total users returned: {len(enrolled_users)}\n")
        
        if len(enrolled_users) > 0:
            # Show first user as example
            first_user = enrolled_users[0]
            
            print("="*80)
            print("RESPONSE STRUCTURE")
            print("="*80)
            print()
            print("Returns: Array of user objects")
            print(f"Example (first user):")
            print()
            print(json.dumps(first_user, indent=2, default=str))
            print()
            
            print("="*80)
            print("FIELD BREAKDOWN")
            print("="*80)
            print()
            print("Each user object contains:")
            print()
            
            for key, value in first_user.items():
                value_type = type(value).__name__
                value_preview = str(value)[:100] if not isinstance(value, (dict, list)) else f"{value_type} with {len(value) if isinstance(value, (list, dict)) else 'N/A'} items"
                
                print(f"  • {key}")
                print(f"    Type: {value_type}")
                print(f"    Value: {value_preview}")
                
                # Show timestamp values in readable format
                if key in ['firstaccess', 'lastaccess', 'lastcourseaccess'] and isinstance(value, (int, float)) and value > 0:
                    try:
                        dt = datetime.fromtimestamp(value)
                        print(f"    → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                    except:
                        pass
                
                # Show nested structures
                if isinstance(value, list) and len(value) > 0:
                    print(f"    Example items:")
                    for i, item in enumerate(value[:2], 0):
                        if isinstance(item, dict):
                            print(f"      [{i}] keys: {list(item.keys())}")
                        else:
                            print(f"      [{i}]: {str(item)[:50]}")
                
                print()
            
            print("="*80)
            print("IMPORTANT FIELDS")
            print("="*80)
            print()
            print("✅ Available fields:")
            print("  • id - User ID")
            print("  • username - Username (employee ID)")
            print("  • firstname, lastname, fullname - User name")
            print("  • email - Email address")
            print("  • department - Department")
            print("  • firstaccess - When user FIRST ACCESSED the course (Unix timestamp)")
            print("  • lastaccess - When user LAST ACCESSED the course (Unix timestamp)")
            print("  • lastcourseaccess - Last course access (Unix timestamp)")
            print("  • roles - Array of user roles")
            print("  • enrolledcourses - Array of courses user is enrolled in")
            print("  • customfields - Custom field data")
            print()
            print("❌ Missing fields:")
            print("  • enrolments - Array of enrollment records (NOT in response)")
            print("  • timecreated - When user was enrolled (NOT in response)")
            print("  • timestart - Enrollment start time (NOT in response)")
            print()
            
            print("="*80)
            print("WHAT'S MISSING")
            print("="*80)
            print()
            print("The API does NOT return:")
            print("  • enrolments[] array - Should contain enrollment records")
            print("  • enrolments[].timecreated - When enrollment was created")
            print("  • enrolments[].timestart - When enrollment starts")
            print("  • user.timecreated - User-level enrollment time")
            print("  • user.timestart - User-level enrollment start")
            print()
            print("This means we CANNOT get the exact 'when assigned' time from this API.")
            print("We can only use 'firstaccess' which is when they first opened the course,")
            print("not when they were assigned.")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(show_enrolled_users_response(492))

