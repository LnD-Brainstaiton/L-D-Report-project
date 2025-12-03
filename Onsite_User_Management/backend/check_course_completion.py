#!/usr/bin/env python3
"""
Script to check LMS course completion API response and see if timecompleted is available.
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

async def check_completion_api():
    """Check what fields are in the LMS completion API response."""
    
    if not settings.LMS_TOKEN:
        print("ERROR: LMS_TOKEN not configured")
        return
    
    print("=" * 80)
    print("CHECKING LMS COURSE COMPLETION API RESPONSE")
    print("=" * 80)
    
    url = settings.LMS_BASE_URL
    
    # 2. Find specific user
    target_username = "bs1981"
    print(f"\n1. Finding user '{target_username}'...")
    params = {
        "wstoken": settings.LMS_TOKEN,
        "wsfunction": "core_user_get_users_by_field",
        "moodlewsrestformat": settings.LMS_REST_FORMAT,
        "field": "username",
        "values[0]": target_username,
    }
    
    target_user_id = None
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, params=params)
            response.raise_for_status()
            users = response.json()
            
            if isinstance(users, list) and len(users) > 0:
                target_user_id = users[0].get("id")
                print(f"   Found User: {target_user_id} ({users[0].get('fullname')})")
            else:
                print(f"   User {target_username} not found")
                return
    except Exception as e:
        print(f"   Error fetching user: {e}")
        return

    # 3. Get user's courses
    print(f"\n2. Fetching courses for user {target_user_id}...")
    params = {
        "wstoken": settings.LMS_TOKEN,
        "wsfunction": "core_enrol_get_users_courses",
        "moodlewsrestformat": settings.LMS_REST_FORMAT,
        "userid": str(target_user_id),
    }
    
    target_course_id = None
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, params=params)
            response.raise_for_status()
            courses = response.json()
            
            if isinstance(courses, list):
                print(f"   User is enrolled in {len(courses)} courses.")
                for course in courses:
                    fullname = course.get("fullname", "")
                    course_id = course.get("id")
                    print(f"   - ID: {course_id}, Name: {fullname}")
                    
                    if "Cyber Security" in fullname and "Physical Protection" in fullname:
                        target_course_id = course_id
                        print(f"   >>> MATCH FOUND: {target_course_id}")
            else:
                print(f"   No courses found or error: {courses}")
                return

    except Exception as e:
        print(f"   Error fetching user courses: {e}")
        return

    if not target_course_id:
        print("\nCould not find the target course in user's enrollments.")
        return

    # 4. Get completion status
    print(f"\n3. Fetching completion status for user {target_user_id} in course {target_course_id}...")
    params = {
        "wstoken": settings.LMS_TOKEN,
        "wsfunction": "core_completion_get_course_completion_status",
        "moodlewsrestformat": settings.LMS_REST_FORMAT,
        "courseid": str(target_course_id),
        "userid": str(target_user_id),
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, params=params)
            response.raise_for_status()
            completion_data = response.json()
            
            print("-" * 80)
            # Print top-level fields
            if "completionstatus" in completion_data:
                status = completion_data["completionstatus"]
                status_copy = status.copy()
                if "completions" in status_copy:
                    status_copy["completions"] = f"<List of {len(status['completions'])} items>"
                print(json.dumps(status_copy, indent=2))
                
                # Check for timecompleted in completions
                completions = status.get("completions", [])
                times = [c.get("timecompleted") for c in completions if c.get("timecompleted")]
                if times:
                    print(f"\nFound {len(times)} timecompleted values in completions.")
                    max_time = max(times)
                    print(f"Max timecompleted: {max_time} -> {datetime.fromtimestamp(max_time)}")
            else:
                print(json.dumps(completion_data, indent=2))
            print("-" * 80)

    except Exception as e:
        print(f"   Error fetching completion status: {e}")

if __name__ == "__main__":
    asyncio.run(check_completion_api())
