"""
Script to debug LMS course data for a specific user and course.
Checks what data is available from various API endpoints.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from app.services.lms.client import LMSService
from app.db.base import SessionLocal
from app.models.student import Student
from app.models.lms_user import LMSUser, LMSUserCourse
from datetime import datetime
import json


async def debug_user_course_data(employee_id: str, course_id: int):
    """Debug all API data for a specific user and course."""
    
    print(f"\n{'='*80}")
    print(f"Debugging LMS data for Employee: {employee_id}, Course ID: {course_id}")
    print(f"{'='*80}\n")
    
    # 3. Fetch course enrollment info using core_enrol_get_enrolled_users
    print(f"\n\n3. Fetching enrollment data using core_enrol_get_enrolled_users (course {course_id})...")
    enrolled_users = await LMSService.fetch_course_enrollments(course_id)
    
    # Find this user in enrollments
    user_enrollment = None
    for enrolled_user in enrolled_users:
        if enrolled_user.get('username') == employee_id.lower():
            user_enrollment = enrolled_user
            break
    
    if user_enrollment:
        print(f"\nFound user in course enrollments:")
        print(f"User keys: {list(user_enrollment.keys())}")
        print(f"firstaccess: {user_enrollment.get('firstaccess')}")
        print(f"lastaccess: {user_enrollment.get('lastaccess')}")
        print(f"lastcourseaccess: {user_enrollment.get('lastcourseaccess')}")
        # print(json.dumps(user_enrollment, indent=2))
        
        # Check for enrolledcourses
        print(f"\nenrolledcourses: {user_enrollment.get('enrolledcourses')}")
    else:
        print(f"WARNING: User {employee_id} not found in course {course_id} enrollments")

if __name__ == "__main__":
    # Debug for BS1981 and course 596
    asyncio.run(debug_user_course_data("BS1981", 492))
