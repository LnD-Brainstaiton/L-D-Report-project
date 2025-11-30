#!/usr/bin/env python3
"""
Script to check LMS enrollment API response and see what fields are available.
"""
import sys
import os
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from app.core.config import settings
    import httpx
    import asyncio
    from datetime import datetime
except ImportError as e:
    print(f"Error importing: {e}")
    print("Make sure you're in the backend directory and dependencies are installed")
    sys.exit(1)

async def check_enrollment_api():
    """Check what fields are in the LMS enrollment API response."""
    
    if not settings.LMS_TOKEN:
        print("ERROR: LMS_TOKEN not configured")
        return
    
    print("=" * 80)
    print("CHECKING LMS ENROLLMENT API RESPONSE")
    print("=" * 80)
    
    # First, get a course ID
    print("\n1. Fetching courses to get a course ID...")
    url = settings.LMS_BASE_URL
    params = {
        "wstoken": settings.LMS_TOKEN,
        "wsfunction": "core_course_get_courses",
        "moodlewsrestformat": settings.LMS_REST_FORMAT,
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, params=params)
            response.raise_for_status()
            courses = response.json()
            
            if isinstance(courses, list) and len(courses) > 0:
                course_id = courses[0].get("id")
                print(f"   Using course ID: {course_id} ({courses[0].get('fullname', 'Unknown')})")
            else:
                print("   No courses found")
                return
    except Exception as e:
        print(f"   Error fetching courses: {e}")
        return
    
    # Try to get enrollment info with more details - check if we can get enrolments array
    print(f"\n2. Fetching enrollments for course {course_id} (with enrolments array)...")
    params = {
        "wstoken": settings.LMS_TOKEN,
        "wsfunction": "core_enrol_get_enrolled_users",
        "moodlewsrestformat": settings.LMS_REST_FORMAT,
        "courseid": str(course_id),
        "options[0][name]": "limitfrom",
        "options[0][value]": "0",
        "options[1][name]": "limitnumber",
        "options[1][value]": "5",  # Just get first 5 to check structure
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, params=params)
            response.raise_for_status()
            users = response.json()
            
            if isinstance(users, list) and len(users) > 0:
                print(f"   Found {len(users)} enrolled users")
                
                # Get first user with BS username
                bs_user = None
                for user in users:
                    username = user.get("username", "")
                    if username and username.upper().startswith("BS"):
                        bs_user = user
                        break
                
                if bs_user:
                    print(f"\n3. Sample enrollment data for user: {bs_user.get('username')} ({bs_user.get('fullname', 'Unknown')})")
                    print("-" * 80)
                    print(json.dumps(bs_user, indent=2, default=str))
                    
                    # Check if there's an enrolments field (might be nested)
                    if 'enrolments' in bs_user:
                        print("\n   FOUND 'enrolments' field!")
                        print(json.dumps(bs_user['enrolments'], indent=2, default=str))
                    
                    print("\n4. Field Analysis:")
                    print("-" * 80)
                    all_fields = list(bs_user.keys())
                    print(f"   Total fields: {len(all_fields)}")
                    print(f"   All fields: {all_fields}")
                    
                    # Check for timestamp fields
                    timestamp_fields = [k for k in all_fields if 'time' in k.lower() or 'created' in k.lower() or 'start' in k.lower() or 'enrol' in k.lower()]
                    if timestamp_fields:
                        print(f"\n   Timestamp-related fields found: {timestamp_fields}")
                        for field in timestamp_fields:
                            value = bs_user.get(field)
                            if isinstance(value, (int, float)) and value > 0:
                                try:
                                    dt = datetime.fromtimestamp(value)
                                    print(f"     {field}: {value} -> {dt}")
                                except:
                                    print(f"     {field}: {value}")
                            elif isinstance(value, list):
                                print(f"     {field}: list with {len(value)} items")
                                if len(value) > 0:
                                    print(f"       First item keys: {list(value[0].keys()) if isinstance(value[0], dict) else 'not a dict'}")
                                    if isinstance(value[0], dict):
                                        # Check for timecreated in nested structure
                                        nested_time = [k for k in value[0].keys() if 'time' in k.lower() or 'created' in k.lower()]
                                        if nested_time:
                                            print(f"       Nested timestamp fields: {nested_time}")
                                            for nt in nested_time:
                                                nv = value[0].get(nt)
                                                if isinstance(nv, (int, float)) and nv > 0:
                                                    try:
                                                        dt = datetime.fromtimestamp(nv)
                                                        print(f"         {nt}: {nv} -> {dt}")
                                                    except:
                                                        print(f"         {nt}: {nv}")
                            else:
                                print(f"     {field}: {value}")
                    else:
                        print("\n   No timestamp-related fields found in top level")
                    
                    # Check enrolments array if it exists
                    if 'enrolments' in bs_user:
                        print("\n5. Enrolments array analysis:")
                        print("-" * 80)
                        enrolments = bs_user.get('enrolments', [])
                        if isinstance(enrolments, list) and len(enrolments) > 0:
                            print(f"   Found {len(enrolments)} enrollment records")
                            first_enrol = enrolments[0]
                            print(f"   First enrollment keys: {list(first_enrol.keys())}")
                            
                            enrol_timestamp_fields = [k for k in first_enrol.keys() if 'time' in k.lower() or 'created' in k.lower() or 'start' in k.lower()]
                            if enrol_timestamp_fields:
                                print(f"   Timestamp fields in enrollment: {enrol_timestamp_fields}")
                                for field in enrol_timestamp_fields:
                                    value = first_enrol.get(field)
                                    if isinstance(value, (int, float)) and value > 0:
                                        try:
                                            dt = datetime.fromtimestamp(value)
                                            print(f"     {field}: {value} -> {dt}")
                                        except:
                                            print(f"     {field}: {value}")
                        else:
                            print("   No enrolments array found or it's empty")
                else:
                    print("   No BS users found in enrollment list")
                    if len(users) > 0:
                        print(f"\n   Sample user (first one):")
                        print(json.dumps(users[0], indent=2, default=str)[:1000])
            else:
                print("   No enrolled users found")
                
    except Exception as e:
        print(f"   Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_enrollment_api())

