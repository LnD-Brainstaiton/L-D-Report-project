"""LMS API endpoints for fetching data from Moodle."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging
from app.db.base import get_db
from app.core.auth import get_current_admin
from app.services.lms_service import LMSService
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/courses")
async def get_lms_courses(
    include_enrollment_counts: bool = Query(False, description="Include enrollment count for each course"),
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Fetch all online courses from LMS API.
    
    Returns courses with:
    - id: Course ID
    - fullname: Course full name
    - startdate: Start date (Unix timestamp)
    - enddate: End date (Unix timestamp)
    - categoryid: Category ID
    - categoryname: Category name (fetched separately)
    """
    try:
        # Fetch courses from LMS
        lms_courses = await LMSService.fetch_lms_courses()
        
        # Fetch categories to map categoryid to categoryname
        category_map = await LMSService.fetch_course_categories()
        
        # Map courses and add categoryname
        result = []
        for course in lms_courses:
            course_data = {
                "id": course.get("id"),
                "fullname": course.get("fullname", ""),
                "startdate": course.get("startdate"),
                "enddate": course.get("enddate"),
                "categoryid": course.get("categoryid"),
                "categoryname": category_map.get(course.get("categoryid"), "Unknown"),
                "shortname": course.get("shortname", ""),
                "summary": course.get("summary", ""),
                "visible": course.get("visible", 1),
            }
            
            # Optionally fetch enrollment count
            if include_enrollment_counts:
                try:
                    enrolled_users = await LMSService.fetch_course_enrollments(course.get("id"))
                    course_data["enrollment_count"] = len(enrolled_users)
                except Exception as e:
                    # If enrollment fetch fails, set count to 0
                    course_data["enrollment_count"] = 0
                    logger.warning(f"Failed to fetch enrollment count for course {course.get('id')}: {str(e)}")
            
            result.append(course_data)
        
        return {"courses": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch courses from LMS: {str(e)}")

@router.get("/courses/{course_id}/enrollments")
async def get_lms_course_enrollments(course_id: int, db: Session = Depends(get_db)):
    """
    Fetch all enrolled users for a specific online course from LMS API.
    
    Returns list of enrolled users with their details:
    - id: User ID
    - username: Username (employee_id)
    - fullname: Full name
    - email: Email address
    - department: Department
    - lastaccess: Last access timestamp
    - firstaccess: First access timestamp
    """
    try:
        enrolled_users = await LMSService.fetch_course_enrollments(course_id)
        
        # Map to a cleaner format
        result = []
        for user in enrolled_users:
            user_data = {
                "id": user.get("id"),
                "username": user.get("username", ""),
                "employee_id": user.get("username", ""),  # username is the employee_id
                "fullname": user.get("fullname", ""),
                "firstname": user.get("firstname", ""),
                "lastname": user.get("lastname", ""),
                "email": user.get("email", ""),
                "department": user.get("department", ""),
                "lastaccess": user.get("lastaccess"),
                "firstaccess": user.get("firstaccess"),
                "lastcourseaccess": user.get("lastcourseaccess"),
                "profileimageurl": user.get("profileimageurl"),
                "profileimageurlsmall": user.get("profileimageurlsmall"),
            }
            result.append(user_data)
        
        return {"enrollments": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch enrollments from LMS: {str(e)}")

@router.get("/users/{username}/courses")
async def get_lms_user_courses(username: str, db: Session = Depends(get_db)):
    """
    Fetch all courses for a specific user from LMS API by username (employee_id).
    
    Returns list of courses the user is enrolled in:
    - id: Course ID
    - fullname: Course full name
    - shortname: Course shortname
    - startdate: Start date (Unix timestamp)
    - enddate: End date (Unix timestamp)
    - progress: Progress percentage
    - completed: Completion status
    - lastaccess: Last access timestamp
    """
    try:
        courses = await LMSService.fetch_user_courses(username)
        
        # Map to a cleaner format
        result = []
        for course in courses:
            course_data = {
                "id": course.get("id"),
                "fullname": course.get("fullname", ""),
                "shortname": course.get("shortname", ""),
                "startdate": course.get("startdate"),
                "enddate": course.get("enddate"),
                "progress": course.get("progress", 0),
                "completed": course.get("completed", 0),
                "lastaccess": course.get("lastaccess"),
                "category": course.get("category"),
            }
            result.append(course_data)
        
        return {"courses": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user courses from LMS: {str(e)}")

