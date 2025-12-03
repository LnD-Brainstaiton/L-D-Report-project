#!/usr/bin/env python3
"""
Check if the enrolments array is populated for ANY users in the course.
The enrolments array should contain enrollment records with timecreated fields.
"""

import asyncio
import sys
import os
from datetime import datetime
import json

sys.path.append(os.getcwd())

from app.services.lms.client import LMSService
from app.core.config import settings

async def check_enrolments_array_for_all_users(course_id: int):
    """Check if enrolments array exists for any users."""
    try:
        print(f"\n{'='*80}")
        print(f"CHECKING ENROLLMENTS ARRAY FOR ALL USERS")
        print(f"Course ID: {course_id}")
        print(f"{'='*80}\n")
        
        if not settings.LMS_TOKEN:
            print("❌ LMS_TOKEN not configured. Cannot check API.")
            return
        
        print("Fetching ALL enrollments from LMS API...")
        enrolled_users = await LMSService.fetch_course_enrollments(course_id)
        
        print(f"Total users in course: {len(enrolled_users)}\n")
        
        # Check each user
        users_with_enrolments = []
        users_without_enrolments = []
        users_with_timecreated = []
        users_without_timecreated = []
        
        for user in enrolled_users:
            username = user.get('username', '')
            has_enrolments = 'enrolments' in user and isinstance(user.get('enrolments'), list) and len(user.get('enrolments', [])) > 0
            
            if has_enrolments:
                users_with_enrolments.append(user)
                # Check if timecreated exists in any enrollment
                for enrol in user['enrolments']:
                    if enrol.get('timecreated'):
                        users_with_timecreated.append({
                            'username': username,
                            'enrolment': enrol
                        })
                        break
            else:
                users_without_enrolments.append(username)
        
        print("="*80)
        print("SUMMARY")
        print("="*80)
        print()
        print(f"Total users: {len(enrolled_users)}")
        print(f"Users WITH enrolments array: {len(users_with_enrolments)}")
        print(f"Users WITHOUT enrolments array: {len(users_without_enrolments)}")
        print(f"Users with enrolments[].timecreated: {len(users_with_timecreated)}")
        print()
        
        if users_with_enrolments:
            print("✅ YES - Some users DO have the enrolments array!")
            print()
            print("="*80)
            print("EXAMPLES OF USERS WITH ENROLLMENTS ARRAY")
            print("="*80)
            print()
            
            # Show first 3 examples
            for i, user in enumerate(users_with_enrolments[:3], 1):
                username = user.get('username', '')
                enrolments = user.get('enrolments', [])
                print(f"User {i}: {username}")
                print(f"  Enrollments count: {len(enrolments)}")
                print(f"  First enrollment keys: {list(enrolments[0].keys()) if enrolments else 'N/A'}")
                
                for j, enrol in enumerate(enrolments[:2], 0):
                    print(f"  enrolments[{j}]:")
                    print(f"    timecreated: {enrol.get('timecreated')}")
                    if enrol.get('timecreated'):
                        dt = datetime.fromtimestamp(enrol['timecreated'])
                        print(f"      → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                    print(f"    timestart: {enrol.get('timestart')}")
                    if enrol.get('timestart'):
                        dt = datetime.fromtimestamp(enrol['timestart'])
                        print(f"      → {dt.strftime('%b %d, %Y, %I:%M %p')}")
                    print(f"    timeend: {enrol.get('timeend')}")
                    print(f"    enrolid: {enrol.get('enrolid')}")
                    print(f"    courseid: {enrol.get('courseid')}")
                print()
        else:
            print("❌ NO - NO users have the enrolments array populated!")
            print("   The enrolments array is empty/missing for ALL users in this course.")
            print()
            print("This means:")
            print("  • The LMS API is not returning enrollment details in the enrolments array")
            print("  • We're relying on fallback fields (user.timecreated, user.firstaccess, etc.)")
            print("  • The enrollment_time in our database may not be accurate")
        
        print()
        print("="*80)
        print("CHECKING SPECIFIC USER (BS1981)")
        print("="*80)
        print()
        
        bs1981_user = None
        for user in enrolled_users:
            if user.get('username', '').upper() == 'BS1981':
                bs1981_user = user
                break
        
        if bs1981_user:
            print(f"Username: {bs1981_user.get('username')}")
            print(f"Has enrolments array: {'enrolments' in bs1981_user and isinstance(bs1981_user.get('enrolments'), list)}")
            if 'enrolments' in bs1981_user:
                print(f"Enrolments array length: {len(bs1981_user.get('enrolments', []))}")
                if len(bs1981_user.get('enrolments', [])) > 0:
                    print(f"First enrollment: {json.dumps(bs1981_user['enrolments'][0], indent=4, default=str)}")
                else:
                    print("Enrolments array is empty []")
            else:
                print("Enrolments key doesn't exist in response")
        else:
            print("BS1981 not found in enrollments")
        
        print()
        print("="*80)
        print("WHAT THE ENROLLMENTS ARRAY SHOULD CONTAIN")
        print("="*80)
        print()
        print("The enrolments array should be a list of enrollment records:")
        print("  enrolments: [")
        print("    {")
        print("      'enrolid': 123,           // Enrollment ID")
        print("      'courseid': 596,          // Course ID")
        print("      'timecreated': 1727284320, // When enrollment was created (Unix timestamp)")
        print("      'timestart': 1727284320,   // When enrollment starts")
        print("      'timeend': 0,              // When enrollment ends (0 = never)")
        print("      'status': 0,               // Status")
        print("      ...")
        print("    },")
        print("    { ... },  // Multiple enrollments if user enrolled multiple times")
        print("  ]")
        print()
        print("Each enrollment record represents when the user was enrolled in the course.")
        print("The timecreated field shows when that specific enrollment was created.")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Check both courses
    print("Checking Course 492 (Cyber Security)...")
    asyncio.run(check_enrolments_array_for_all_users(492))
    print("\n\n" + "="*80 + "\n")
    print("Checking Course 596 (Anti-Corruption)...")
    asyncio.run(check_enrolments_array_for_all_users(596))

